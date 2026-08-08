/**
 * The quality gate.
 *
 * Every programmatic URL on this site passes through `decide()` before it
 * exists. The gate answers three separate questions — they are NOT the same
 * question and conflating them is how programmatic estates rot:
 *
 *   generate  — does a route exist at all? `false` means Next never emits it
 *               and the path 404s. Nothing is served, so nothing can be thin.
 *   index     — may a search engine index it? `false` emits
 *               `noindex, follow`: links are still crawled and equity still
 *               flows to the fleet, the page just cannot rank.
 *   sitemap   — should we actively ask Google to crawl it? Strictly narrower
 *               than `index`. A sitemap is a request for crawl budget, and
 *               spending it on a page we are lukewarm about is what makes a
 *               whole estate look low quality.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHY A SCORE AND NOT A FLAG
 *
 * A boolean "is this page good" collapses under its own edge cases. A score
 * over named, independently-checkable signals means the decision is auditable:
 * `/admin/seo` renders `reasons` verbatim, so when someone asks why
 * `/use-cases/moving-house` is not in the index the answer is a sentence, not
 * an archaeology exercise.
 *
 * The weights below are not arbitrary and are not tuned to hit a page count.
 * Each one maps to a way a programmatic page actually fails:
 *
 *   inventory (30)   — the classic failure: a page for a product you do not
 *                      stock. Weighted highest because it is the one that gets
 *                      pages removed rather than merely outranked.
 *   uniqueness (25)  — the second failure: ten pages that differ by one noun.
 *                      Counts modules whose CONTENT differs between siblings,
 *                      not modules that merely exist.
 *   data (20)        — how much of the entity's structured record is actually
 *                      filled in. Drives the "add the drive time and the page
 *                      appears" behaviour.
 *   intent (15)      — commercial value of the query class, and the honesty
 *                      check: a page for an intent the 28-day minimum cannot
 *                      serve scores zero here and cannot reach the threshold.
 *   links (5)        — an orphan page is a page Google discovers late and
 *                      trusts little.
 *   conversion (5)   — a landing page with no phone number and no form is not
 *                      a landing page.
 *
 * THRESHOLDS
 *
 *   ≥ 70  index + sitemap. We are actively asking to rank for this.
 *   ≥ 45  index, NOT in sitemap. Legitimate, useful, but we are not spending
 *         crawl budget arguing for it; internal links carry it.
 *   ≥ 25  generate, noindex+follow. Useful if a human lands on it, but it
 *         would dilute the estate if indexed. `/use-cases/moving-house` lives
 *         here.
 *   < 25  do not generate. 404.
 *
 * A hard failure (no entity, no inventory, no conversion path) short-circuits
 * to "do not generate" regardless of score. Scores cannot buy their way past
 * a missing prerequisite.
 */

export const QUALITY_WEIGHTS = {
  inventory: 30,
  uniqueness: 25,
  data: 20,
  intent: 15,
  links: 5,
  conversion: 5,
} as const;

export const QUALITY_THRESHOLDS = {
  /** Index and request crawl. */
  sitemap: 70,
  /** Index, discovered through internal links only. */
  index: 45,
  /** Serve to humans, keep out of the index. */
  generate: 25,
} as const;

export type QualityInput = {
  /** Does the entity exist and is it the right shape? Hard prerequisite. */
  entityValid: boolean;
  /** Vans actually backing this page. */
  matchedVans: number;
  /** Minimum the family declares as viable. */
  minVans: number;
  /**
   * Modules on this page whose CONTENT differs from its sibling pages —
   * a per-suburb drive time counts, a shared "what's included" list does not.
   */
  differentiatingModules: number;
  /** Structured fields present on the entity, and how many it could have. */
  dataFieldsPresent: number;
  dataFieldsPossible: number;
  /**
   * 0–1. How commercially valuable the intent is AND whether the business can
   * actually serve it. A query the 28-day minimum rules out scores 0.
   */
  intentValue: number;
  /** Contextual internal links out of this page. */
  outboundLinks: number;
  /** Enquiry form and a phone number both present. Hard prerequisite. */
  hasConversionPath: boolean;
  /**
   * Set when this page's intent is already owned by another URL. Forces a
   * cross-canonical instead of letting two URLs fight. See `registry.ts`.
   */
  duplicateIntentOf?: string;
  /**
   * "The business cannot actually serve the query this page targets."
   *
   * A hard block, not a scoring input, and deliberately separate from the
   * score: a page for an unservable query is usually a GOOD page by every
   * mechanical measure — real vans, real specs, real links — and would sail
   * past the threshold on merit. Merit is not the question. The 28-day minimum
   * hire is, and no amount of page quality changes it.
   *
   * The page is still generated and still served: someone who lands on it
   * deserves a straight answer and a route to the fleet. It is simply never
   * indexed. Set to the reason, which is surfaced in /admin/seo.
   */
  serveButDoNotIndex?: string;
};

export type PageDecision = {
  generate: boolean;
  index: boolean;
  sitemap: boolean;
  /** Self-referencing unless consolidated onto another page's intent. */
  canonicalPath: string;
  score: number;
  /** Human-readable audit trail, rendered verbatim in /admin/seo. */
  reasons: string[];
};

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

export function decide(path: string, input: QualityInput): PageDecision {
  const reasons: string[] = [];

  // ── Hard prerequisites — no score can override these ──────────────────────
  if (!input.entityValid) {
    return {
      generate: false,
      index: false,
      sitemap: false,
      canonicalPath: path,
      score: 0,
      reasons: ["Entity does not exist or failed validation — route not generated (404)."],
    };
  }

  if (input.matchedVans < input.minVans) {
    return {
      generate: false,
      index: false,
      sitemap: false,
      canonicalPath: path,
      score: 0,
      reasons: [
        `Only ${input.matchedVans} matching van(s); this page family requires ${input.minVans}. ` +
          "A page for a vehicle we do not have is the definition of a thin page — route not generated (404).",
      ],
    };
  }

  if (!input.hasConversionPath) {
    return {
      generate: false,
      index: false,
      sitemap: false,
      canonicalPath: path,
      score: 0,
      reasons: ["No enquiry form or phone number available — a landing page with no conversion path is not worth serving."],
    };
  }

  // ── Score ─────────────────────────────────────────────────────────────────
  // Inventory saturates at 3× the family minimum: the tenth matching van does
  // not make the page meaningfully better than the sixth.
  const inventoryRatio = clamp01(input.matchedVans / Math.max(1, input.minVans * 3));
  const inventory = QUALITY_WEIGHTS.inventory * inventoryRatio;

  // Four genuinely differentiating modules is a substantive page. More is
  // fine, but it stops earning credit.
  const uniqueness = QUALITY_WEIGHTS.uniqueness * clamp01(input.differentiatingModules / 4);

  const data =
    QUALITY_WEIGHTS.data *
    clamp01(input.dataFieldsPresent / Math.max(1, input.dataFieldsPossible));

  const intent = QUALITY_WEIGHTS.intent * clamp01(input.intentValue);

  // Six contextual links is a well-connected page; a link dump is not better.
  const links = QUALITY_WEIGHTS.links * clamp01(input.outboundLinks / 6);

  const conversion = QUALITY_WEIGHTS.conversion;

  const score = Math.round(inventory + uniqueness + data + intent + links + conversion);

  reasons.push(
    `Inventory ${inventory.toFixed(0)}/${QUALITY_WEIGHTS.inventory} (${input.matchedVans} vans, min ${input.minVans})`,
    `Uniqueness ${uniqueness.toFixed(0)}/${QUALITY_WEIGHTS.uniqueness} (${input.differentiatingModules} differentiating modules)`,
    `Data completeness ${data.toFixed(0)}/${QUALITY_WEIGHTS.data} (${input.dataFieldsPresent}/${input.dataFieldsPossible} fields)`,
    `Intent value ${intent.toFixed(0)}/${QUALITY_WEIGHTS.intent}`,
    `Internal links ${links.toFixed(0)}/${QUALITY_WEIGHTS.links} (${input.outboundLinks} contextual)`,
    `Conversion path ${conversion}/${QUALITY_WEIGHTS.conversion}`,
  );

  // ── Cannibalisation: one intent, one URL ──────────────────────────────────
  // Generate and serve it, but hand the ranking signals to the owner. This is
  // a canonical rather than a noindex on purpose: a cross-canonical
  // consolidates link equity onto the winner, a noindex throws it away.
  if (input.duplicateIntentOf) {
    reasons.push(
      `Intent already owned by ${input.duplicateIntentOf} — canonicalised there so the two URLs do not compete.`,
    );
    return {
      generate: true,
      index: false,
      sitemap: false,
      canonicalPath: input.duplicateIntentOf,
      score,
      reasons,
    };
  }

  // ── Servability: checked AFTER scoring so the audit trail shows what the
  // page would have scored, and BEFORE the thresholds so it cannot be
  // outvoted by a high score. ──────────────────────────────────────────────
  if (input.serveButDoNotIndex) {
    reasons.push(
      `Scored ${score}, but held out of the index: ${input.serveButDoNotIndex} ` +
        "Served as noindex,follow — a good page for a query we cannot fulfil still costs us the click.",
    );
    return { generate: true, index: false, sitemap: false, canonicalPath: path, score, reasons };
  }

  if (score >= QUALITY_THRESHOLDS.sitemap) {
    reasons.push(`Score ${score} ≥ ${QUALITY_THRESHOLDS.sitemap} — indexable and submitted in the sitemap.`);
    return { generate: true, index: true, sitemap: true, canonicalPath: path, score, reasons };
  }

  if (score >= QUALITY_THRESHOLDS.index) {
    reasons.push(
      `Score ${score} is between ${QUALITY_THRESHOLDS.index} and ${QUALITY_THRESHOLDS.sitemap} — indexable, but not worth crawl budget in the sitemap. Discovery is via internal links.`,
    );
    return { generate: true, index: true, sitemap: false, canonicalPath: path, score, reasons };
  }

  if (score >= QUALITY_THRESHOLDS.generate) {
    reasons.push(
      `Score ${score} is between ${QUALITY_THRESHOLDS.generate} and ${QUALITY_THRESHOLDS.index} — served to humans as noindex,follow. Useful to a visitor, too thin to index.`,
    );
    return { generate: true, index: false, sitemap: false, canonicalPath: path, score, reasons };
  }

  reasons.push(`Score ${score} < ${QUALITY_THRESHOLDS.generate} — route not generated (404).`);
  return { generate: false, index: false, sitemap: false, canonicalPath: path, score, reasons };
}

/**
 * Commercial value of an intent class, 0–1.
 *
 * `transactional` and `local` are the money queries — someone typing "van hire
 * bankstown" has a credit card out. `commercial-investigation` is a step back
 * from the purchase. `use-case` is scored by the caller instead, because its
 * value depends entirely on whether the 28-day minimum can serve the job.
 */
export const INTENT_VALUE = {
  transactional: 1,
  local: 0.95,
  vehicle: 0.85,
  duration: 0.9,
  "use-case": 0.6,
  "commercial-investigation": 0.5,
} as const;

/**
 * Term-fit multiplier applied to use-case intent value.
 *
 * `poor` is a hard zero, not a discount. Fifteen points of intent value is
 * exactly enough to drag a well-built page over the index threshold, and a
 * well-built page for a job we cannot do is the worst possible outcome — it
 * ranks, it converts nobody, and it teaches Google our pages disappoint.
 */
export const TERM_FIT_MULTIPLIER = {
  strong: 1,
  fair: 0.7,
  poor: 0,
} as const;

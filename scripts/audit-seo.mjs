#!/usr/bin/env node
/**
 * Deterministic SEO / accessibility audit over the rendered HTML.
 *
 * This is NOT Lighthouse and does not pretend to be. Lighthouse needs a Chrome
 * binary and a throttled run; where that is available, run it and use its
 * numbers. What this does is check the subset of Lighthouse's SEO and
 * Accessibility audits that can be decided from the served markup alone —
 * deterministically, in CI, with no browser.
 *
 * It cannot judge: colour contrast, tap-target size, layout shift, or anything
 * requiring a render. Those still need a real device pass.
 *
 *   node scripts/audit-seo.mjs http://localhost:3100
 */

const BASE = process.argv[2] ?? "http://localhost:3100";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const ROUTES = [
  "/",
  "/vans",
  "/local-van-hire",
  "/delivery-van-for-rent",
  "/business-van-rental",
  "/service-area",
  "/about-us",
  "/faq",
  "/contact-us",
  "/privacy-policy",
  "/terms-of-hire",
];

const strip = (h) =>
  h
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ");

const findings = [];
const seenTitles = new Map();
const seenDescriptions = new Map();

function check(route, ok, id, detail) {
  if (!ok) findings.push({ route, id, detail });
}

async function auditRoute(route) {
  const res = await fetch(BASE + route, { headers: { "User-Agent": UA } });
  const html = await res.text();
  const body = strip(html);

  check(route, res.ok, "http-200", `returned ${res.status}`);

  // ── SEO ──────────────────────────────────────────────────────────────────
  const title = html.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.trim();
  check(route, !!title, "title-present", "no <title>");
  if (title) {
    check(route, title.length <= 70, "title-length", `${title.length} chars`);
    const prev = seenTitles.get(title);
    check(route, !prev, "title-unique", `duplicates ${prev}`);
    seenTitles.set(title, route);
  }

  const desc = html.match(/<meta name="description" content="([^"]*)"/)?.[1];
  const isPlaceholder = /"robots" content="[^"]*noindex/.test(html);
  check(route, !!desc || isPlaceholder, "description-present", "no meta description");
  if (desc) {
    check(route, desc.length >= 50 && desc.length <= 165, "description-length", `${desc.length} chars`);
    const prev = seenDescriptions.get(desc);
    check(route, !prev, "description-unique", `duplicates ${prev}`);
    seenDescriptions.set(desc, route);
  }

  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  check(route, !!canonical, "canonical-present", "no canonical");
  if (canonical) {
    const path = new URL(canonical).pathname.replace(/\/$/, "") || "/";
    check(route, path === route, "canonical-self", `points at ${path}`);
  }

  check(route, /<html[^>]+lang="/.test(html), "html-lang", "no lang on <html>");
  check(route, /name="viewport"/.test(html), "viewport", "no viewport meta");

  // ── Structure / accessibility ────────────────────────────────────────────
  const h1s = [...body.matchAll(/<h1[\s>]/gi)].length;
  check(route, h1s === 1, "single-h1", `found ${h1s}`);

  const headings = [...body.matchAll(/<h([1-6])[\s>]/gi)].map((m) => +m[1]);
  let skipped = null;
  for (let i = 1; i < headings.length; i++) {
    if (headings[i] > headings[i - 1] + 1) {
      skipped = `h${headings[i - 1]} → h${headings[i]}`;
      break;
    }
  }
  check(route, !skipped, "heading-order", skipped ?? "");

  const imgs = [...body.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0]);
  const noAlt = imgs.filter((t) => !/\balt=/.test(t));
  check(route, noAlt.length === 0, "img-alt", `${noAlt.length} <img> without alt`);

  check(route, /<main\b/.test(body) || /role="main"/.test(body), "main-landmark", "no <main>");

  // Links with no discernible text: no inner text, no aria-label, no title.
  const links = [...body.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)];
  const emptyLinks = links.filter(([, attrs, inner]) => {
    const text = inner.replace(/<[^>]+>/g, "").replace(/\s+/g, "");
    return !text && !/aria-label=/.test(attrs) && !/title=/.test(attrs);
  });
  check(route, emptyLinks.length === 0, "link-name", `${emptyLinks.length} link(s) with no name`);

  // Buttons likewise.
  const buttons = [...body.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/gi)];
  const emptyButtons = buttons.filter(([, attrs, inner]) => {
    const text = inner.replace(/<[^>]+>/g, "").replace(/\s+/g, "");
    return !text && !/aria-label=/.test(attrs);
  });
  check(route, emptyButtons.length === 0, "button-name", `${emptyButtons.length} button(s) with no name`);

  // Every form control should be labelled.
  const controls = [...body.matchAll(/<(input|select|textarea)\b([^>]*)>/gi)].filter(
    ([, , attrs]) => !/type="(hidden|submit|button)"/.test(attrs),
  );
  const unlabelled = controls.filter(
    ([, , attrs]) => !/aria-label=/.test(attrs) && !/id="/.test(attrs) && !/name="/.test(attrs),
  );
  check(route, unlabelled.length === 0, "control-label", `${unlabelled.length} unlabelled control(s)`);

  // ── Structured data must be valid JSON ───────────────────────────────────
  const ld = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  let badLd = 0;
  const types = [];
  for (const [, raw] of ld) {
    try {
      const parsed = JSON.parse(raw);
      for (const node of Array.isArray(parsed) ? parsed : [parsed]) {
        if (node?.["@type"]) types.push(node["@type"]);
      }
    } catch {
      badLd++;
    }
  }
  check(route, badLd === 0, "jsonld-valid", `${badLd} block(s) failed to parse`);

  return { route, status: res.status, title, jsonld: types };
}

const rows = [];
for (const route of ROUTES) {
  try {
    rows.push(await auditRoute(route));
  } catch (err) {
    findings.push({ route, id: "fetch-failed", detail: String(err) });
  }
}

console.log("\nRoute                    Status  JSON-LD");
console.log("-".repeat(78));
for (const r of rows) {
  console.log(`${r.route.padEnd(24)} ${String(r.status).padEnd(7)} ${r.jsonld.join(", ") || "—"}`);
}

console.log(`\n${findings.length === 0 ? "PASS" : "FAIL"} — ${findings.length} finding(s)`);
for (const f of findings) {
  console.log(`  ${f.route.padEnd(24)} ${f.id.padEnd(20)} ${f.detail}`);
}

process.exit(findings.length === 0 ? 0 : 1);

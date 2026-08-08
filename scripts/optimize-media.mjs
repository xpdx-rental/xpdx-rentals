/**
 * Source-asset optimiser for everything under `public/`.
 *
 * ── Why this exists when next/image is already enabled ──────────────────────
 * `next/image` resizes and re-encodes on request, so an oversized *source* is
 * not directly served to visitors through `<Image>`. But it still costs, in
 * three places `next/image` cannot help with:
 *
 *  1. **Anything not routed through `<Image>`.** A `<video poster="…">`
 *     attribute, a CSS `background-image`, an `<img>` in an email template and
 *     an OG/social preview all fetch the raw file. `poster="/vans/sprinter-l2h2.jpg"`
 *     was shipping a 653 KB JPEG to every homepage visitor for that reason.
 *  2. **First-request latency.** The first visitor to hit an un-cached size
 *     variant waits for sharp to decode a 1 MB PNG. Feeding it a right-sized
 *     WebP makes that transform an order of magnitude cheaper, and cheaper on
 *     memory too — which matters on a small serverless instance.
 *  3. **Deploy size.** ~9 MB of raw PNG/JPEG in the repo is ~9 MB in every
 *     build artefact and every cold start.
 *
 * The script is **idempotent** — it skips a target that is already newer than
 * its source — so it is safe to re-run, and safe to wire into a release step.
 *
 * Usage:
 *     node scripts/optimize-media.mjs           # optimise
 *     node scripts/optimize-media.mjs --dry-run # report only, write nothing
 */
import { readFile, writeFile, stat, rename, unlink, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = path.join(ROOT, "public");
const DRY = process.argv.includes("--dry-run");

/**
 * Rules, in the order they run.
 *
 * `maxWidth` values are derived from where each asset actually renders, not
 * from a round number:
 *   1600 — full-bleed section imagery and video posters. The largest
 *          `deviceSizes` entry that these ever render at is 1920, and a poster
 *          is displayed behind a dark gradient overlay where the last 300 px of
 *          detail is invisible.
 *   1400 — van photographs, which render at most at half-width on desktop
 *          (`sizes="…50vw"`) and full-width on a phone.
 */
const RULES = [
  {
    label: "van photographs (recompress in place — paths are referenced widely)",
    dir: "vans",
    match: /\.jpe?g$/i,
    maxWidth: 1400,
    encode: (img) => img.jpeg({ quality: 78, progressive: true, mozjpeg: true }),
    inPlace: true,
  },
  {
    label: "video posters (recompress in place — used in the `poster` attribute)",
    dir: ".",
    match: /-poster\.jpe?g$/i,
    maxWidth: 1600,
    encode: (img) => img.jpeg({ quality: 72, progressive: true, mozjpeg: true }),
    inPlace: true,
  },
  {
    label: "section imagery (PNG → WebP; references updated by this script)",
    dir: "images",
    match: /\.png$/i,
    maxWidth: 1600,
    encode: (img) => img.webp({ quality: 80, effort: 5 }),
    extension: ".webp",
    inPlace: false,
  },
];

/** Source files whose extension changes, so callers must be rewritten. */
const REWRITES = new Map();

const fmt = (bytes) => `${(bytes / 1024).toFixed(0)} KB`;

async function optimiseFile(absSource, rule) {
  const before = (await stat(absSource)).size;
  const ext = rule.extension ?? path.extname(absSource);
  const absTarget = rule.inPlace
    ? absSource
    : absSource.slice(0, -path.extname(absSource).length) + ext;

  // Idempotence: a target that already exists and is newer than its source has
  // nothing to do. For in-place rules we use a marker of "already small" —
  // re-encoding an already-optimised JPEG generation-loses quality every run.
  if (!rule.inPlace && existsSync(absTarget)) {
    const [s, t] = await Promise.all([stat(absSource), stat(absTarget)]);
    if (t.mtimeMs >= s.mtimeMs) {
      REWRITES.set(absSource, absTarget);
      return { before, after: t.size, skipped: true };
    }
  }

  const pipeline = rule.encode(
    sharp(await readFile(absSource), { failOn: "error" })
      .rotate() // honour EXIF orientation before resizing
      .resize({ width: rule.maxWidth, withoutEnlargement: true })
      // Strip EXIF/GPS. A phone photo of the yard carries the yard's exact
      // coordinates and the device serial; neither belongs on a public CDN.
      .withMetadata({ exif: {} }),
  );

  const out = await pipeline.toBuffer();

  // Never write a "optimised" file that is larger than what we started with.
  if (out.length >= before && rule.inPlace) {
    return { before, after: before, skipped: true };
  }

  if (DRY) return { before, after: out.length, dry: true };

  if (rule.inPlace) {
    // Write to a temp path then rename, so an interrupted run cannot leave a
    // truncated image where a good one used to be.
    const tmp = `${absTarget}.tmp`;
    await writeFile(tmp, out);
    await rename(tmp, absTarget);
  } else {
    await writeFile(absTarget, out);
    await unlink(absSource);
    REWRITES.set(absSource, absTarget);
  }

  return { before, after: out.length };
}

async function listFiles(dir, match) {
  const abs = path.join(PUBLIC, dir);
  if (!existsSync(abs)) return [];
  const entries = await readdir(abs, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && match.test(e.name))
    .map((e) => path.join(abs, e.name));
}

/**
 * Rewrites `/images/foo.png` → `/images/foo.webp` across `src/`, so converting
 * an extension can never leave a dangling reference behind.
 */
async function rewriteReferences() {
  if (REWRITES.size === 0 || DRY) return;

  const pairs = [...REWRITES.entries()].map(([from, to]) => [
    "/" + path.relative(PUBLIC, from).split(path.sep).join("/"),
    "/" + path.relative(PUBLIC, to).split(path.sep).join("/"),
  ]);

  const srcFiles = [];
  const walk = async (dir) => {
    for (const e of await readdir(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) await walk(p);
      else if (/\.(tsx?|css|mdx?)$/.test(e.name)) srcFiles.push(p);
    }
  };
  await walk(path.join(ROOT, "src"));

  let touched = 0;
  for (const file of srcFiles) {
    const original = await readFile(file, "utf8");
    let next = original;
    for (const [from, to] of pairs) next = next.split(from).join(to);
    if (next !== original) {
      await writeFile(file, next);
      touched++;
    }
  }
  if (touched) console.log(`\n  rewrote asset references in ${touched} source file(s)`);
}

let totalBefore = 0;
let totalAfter = 0;

for (const rule of RULES) {
  const files = await listFiles(rule.dir, rule.match);
  if (files.length === 0) continue;

  console.log(`\n${rule.label}`);
  for (const file of files) {
    try {
      const { before, after, skipped } = await optimiseFile(file, rule);
      totalBefore += before;
      totalAfter += after;
      const pct = before ? Math.round((1 - after / before) * 100) : 0;
      console.log(
        `  ${path.basename(file).padEnd(34)} ${fmt(before).padStart(9)} → ${fmt(after).padStart(9)}` +
          (skipped ? "  (unchanged)" : `  −${pct}%`),
      );
    } catch (err) {
      console.error(`  ${path.basename(file)}: FAILED — ${err.message}`);
      process.exitCode = 1;
    }
  }
}

await rewriteReferences();

console.log(
  `\n${DRY ? "[dry run] " : ""}total: ${fmt(totalBefore)} → ${fmt(totalAfter)} ` +
    `(saved ${fmt(totalBefore - totalAfter)}, ` +
    `${totalBefore ? Math.round((1 - totalAfter / totalBefore) * 100) : 0}%)`,
);

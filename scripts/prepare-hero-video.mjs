/**
 * Turns a raw AI-generated clip into a shippable background video.
 *
 * ── Why this exists ─────────────────────────────────────────────────────────
 * Every hero clip on this site is generated (Gemini/Veo), and a raw export is
 * not fit to publish for three reasons:
 *
 *  1. **It carries the generator's watermark** — a white four-point sparkle in
 *     the bottom-right corner. Publishing it puts another company's mark on
 *     XPDX's advertising.
 *  2. **It has an audio track.** Every one of these renders in a `muted`,
 *     `aria-hidden` <video>, so the audio can never be heard — it is pure
 *     payload. Stripping it saved ~160 KB on the use-cases clip alone.
 *  3. **The moov atom is at the end.** Without `+faststart` the browser cannot
 *     begin playback until the whole file has arrived.
 *
 * Doing this by hand is how the watermark coordinates get lost and the next
 * clip ships with the sparkle still on it, so the recipe lives here.
 *
 * ── Finding the watermark box ───────────────────────────────────────────────
 * `--detect` samples frames across the clip and intersects their "near-white"
 * masks. A pixel bright in *every* frame while the scene moves behind it is
 * the watermark. It prints a ready-to-use `--logo` argument.
 *
 * Give `delogo` a box a few pixels LARGER than the detected core: detection
 * finds the bright centre, and the mark's antialiased tips extend past it. A
 * box that is too tight leaves a faint cross where the tips poke out (observed
 * at 46×46 on a 42×42 detected core); too large smears more of the image.
 *
 * ── Usage ───────────────────────────────────────────────────────────────────
 *   node scripts/prepare-hero-video.mjs --in raw.mp4 --detect
 *   node scripts/prepare-hero-video.mjs --in raw.mp4 \
 *     --logo 1133,576,52,52 \
 *     --out public/videos/use-cases-hero.mp4 \
 *     --poster public/use-cases-hero-poster.jpg --poster-at 5
 *
 * ── ffmpeg is resolved, not depended on ────────────────────────────────────
 * Deliberately NOT a declared dependency. `ffmpeg-static` ships a ~79 MB
 * binary and downloads it in a postinstall hook, which would land on every
 * `npm ci` in CI — where nothing processes video — and would fail the install
 * outright whenever GitHub releases are unreachable. That is a poor trade for
 * a tool used a handful of times a year.
 *
 * So it is looked up at run time, in order:
 *   1. `FFMPEG_PATH` environment variable
 *   2. an `ffmpeg-static` install, if someone has added one
 *   3. `ffmpeg` on PATH
 * and the script explains how to get one if all three miss.
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, rmSync, statSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { createRequire } from "node:module";
import path from "node:path";
import sharp from "sharp";

const require = createRequire(import.meta.url);

function resolveFfmpeg() {
  if (process.env.FFMPEG_PATH && existsSync(process.env.FFMPEG_PATH)) {
    return process.env.FFMPEG_PATH;
  }
  try {
    const p = require("ffmpeg-static");
    if (p && existsSync(p)) return p;
  } catch {
    // Not installed — fall through to PATH.
  }
  try {
    execFileSync("ffmpeg", ["-version"], { stdio: "ignore" });
    return "ffmpeg";
  } catch {
    console.error(
      "ffmpeg not found. Use any one of:\n" +
        "  npm i -D ffmpeg-static      (then re-run; remove it again afterwards)\n" +
        "  FFMPEG_PATH=/path/to/ffmpeg node scripts/prepare-hero-video.mjs …\n" +
        "  install ffmpeg on your PATH",
    );
    process.exit(1);
  }
}

const ffmpegPath = resolveFfmpeg();

const args = process.argv.slice(2);
const flag = (name, fallback = undefined) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args[i + 1];
};
const has = (name) => args.includes(`--${name}`);

const input = flag("in");
if (!input || !existsSync(input)) {
  console.error("Usage: --in <raw.mp4> [--detect | --logo x,y,w,h --out <file> [--poster <file> --poster-at <seconds>]]");
  process.exit(1);
}

const ffmpeg = (params) =>
  execFileSync(ffmpegPath, ["-hide_banner", "-loglevel", "error", "-y", ...params], {
    stdio: ["ignore", "pipe", "pipe"],
  });

const kb = (n) => `${(n / 1024).toFixed(0)} KB`;

/**
 * Intersect near-white masks across sampled frames to find a static overlay.
 *
 * Searched per-corner, not over the whole frame. A first version scanned
 * globally and "found" a 1203×623 region — it had locked onto the overcast sky,
 * which is just as persistently bright as a watermark and vastly larger.
 * Trusting that output would have handed `delogo` a box covering most of the
 * picture. Watermarks are corner-anchored and small, so the search is
 * constrained to both of those facts, and candidates that are too big to be a
 * mark are rejected rather than reported.
 */
async function detect() {
  const dir = mkdtempSync(path.join(tmpdir(), "xpdx-logo-"));
  try {
    const times = [0.2, 2, 4, 6, 8, 9.5];
    times.forEach((t, i) =>
      ffmpeg(["-ss", String(t), "-i", input, "-frames:v", "1", path.join(dir, `f${i}.png`)]),
    );

    const files = readdirSync(dir).filter((f) => f.endsWith(".png")).sort();
    if (files.length === 0) throw new Error("no frames extracted");

    const { width: W = 0, height: H = 0 } = await sharp(path.join(dir, files[0])).metadata();

    let persistent = null;
    for (const f of files) {
      const { data, info } = await sharp(path.join(dir, f)).greyscale().raw().toBuffer({
        resolveWithObject: true,
      });
      const mask = new Uint8Array(info.width * info.height);
      for (let i = 0; i < mask.length; i++) mask[i] = data[i] > 200 ? 1 : 0;
      if (!persistent) persistent = mask;
      else for (let i = 0; i < mask.length; i++) persistent[i] &= mask[i];
    }

    console.log(`frame size: ${W}x${H}, frames sampled: ${files.length}`);

    // A quarter of the frame in each corner is where every generator we have
    // seen puts its mark.
    const qw = Math.floor(W / 4);
    const qh = Math.floor(H / 4);
    const corners = [
      { name: "top-left", x0: 0, y0: 0 },
      { name: "top-right", x0: W - qw, y0: 0 },
      { name: "bottom-left", x0: 0, y0: H - qh },
      { name: "bottom-right", x0: W - qw, y0: H - qh },
    ];

    // A real watermark is a small fraction of its corner. Anything bigger is
    // scenery that happens to be bright in every frame.
    const MAX_SIDE = Math.floor(Math.min(W, H) * 0.2);
    const MAX_FILL = 0.25;

    const candidates = [];
    for (const c of corners) {
      let minX = qw, minY = qh, maxX = -1, maxY = -1, count = 0;
      for (let y = 0; y < qh; y++) {
        for (let x = 0; x < qw; x++) {
          if (!persistent[(c.y0 + y) * W + (c.x0 + x)]) continue;
          count++;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
      if (count === 0) continue;

      const w = maxX - minX + 1;
      const h = maxY - minY + 1;
      const fill = count / (w * h);
      const plausible = w <= MAX_SIDE && h <= MAX_SIDE && count / (qw * qh) < MAX_FILL;

      candidates.push({
        ...c, count, fill, plausible,
        x: c.x0 + minX, y: c.y0 + minY, w, h,
      });
    }

    if (candidates.length === 0) {
      console.log("No persistently-bright region in any corner — this clip may be unwatermarked.");
      return;
    }

    for (const c of candidates) {
      console.log(
        `  ${c.name.padEnd(13)} x=${c.x} y=${c.y} ${c.w}x${c.h} ` +
          `(${c.count} px, ${(c.fill * 100).toFixed(0)}% filled)` +
          (c.plausible ? "" : "  ← too large for a watermark, ignored"),
      );
    }

    // Densest plausible blob wins: a watermark is a solid shape, whereas
    // scenery that survives the intersection tends to be sparse and ragged.
    const best = candidates.filter((c) => c.plausible).sort((a, b) => b.fill - a.fill)[0];
    if (!best) {
      console.log("\nNo candidate small enough to be a watermark. Inspect a frame by hand.");
      return;
    }

    const pad = 5;
    console.log(
      `\nbest candidate: ${best.name}\n` +
        `suggested (core + ${pad}px for antialiased edges):\n` +
        `  --logo ${best.x - pad},${best.y - pad},${best.w + pad * 2},${best.h + pad * 2}`,
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

async function encode() {
  const out = flag("out");
  if (!out) throw new Error("--out is required when not using --detect");

  const logo = flag("logo");
  const crf = flag("crf", "29");
  const filters = [];
  if (logo) {
    const [x, y, w, h] = logo.split(",").map(Number);
    if ([x, y, w, h].some((n) => !Number.isFinite(n))) throw new Error("--logo must be x,y,w,h");
    filters.push(`delogo=x=${x}:y=${y}:w=${w}:h=${h}`);
  }

  const before = existsSync(out) ? statSync(out).size : 0;

  ffmpeg([
    "-i", input,
    ...(filters.length ? ["-vf", filters.join(",")] : []),
    // Muted, aria-hidden decoration — the audio track can never be heard.
    "-an",
    "-c:v", "libx264",
    "-profile:v", "high",
    // yuv420p, not the source's chroma format: anything else fails to decode
    // in Safari and on older Android.
    "-pix_fmt", "yuv420p",
    "-crf", crf,
    "-preset", "slow",
    // ~2s keyframe interval at 24fps, so a loop restarts cleanly.
    "-g", "48",
    // Moves the moov atom to the front — playback can start before the whole
    // file has downloaded.
    "-movflags", "+faststart",
    out,
  ]);

  console.log(`video: ${before ? kb(before) + " → " : ""}${kb(statSync(out).size)}  ${out}`);

  const poster = flag("poster");
  if (poster) {
    // Taken from the ENCODED file, never the source — a poster cut from the
    // raw clip would still carry the watermark the video no longer has.
    const dir = mkdtempSync(path.join(tmpdir(), "xpdx-poster-"));
    try {
      const raw = path.join(dir, "poster.png");
      ffmpeg(["-ss", flag("poster-at", "1"), "-i", out, "-frames:v", "1", raw]);
      const posterBefore = existsSync(poster) ? statSync(poster).size : 0;
      const buf = await sharp(raw)
        .resize({ width: 1600, withoutEnlargement: true })
        .withMetadata({ exif: {} })
        .jpeg({ quality: 72, progressive: true, mozjpeg: true })
        .toBuffer();
      const { writeFileSync } = await import("node:fs");
      writeFileSync(poster, buf);
      console.log(`poster: ${posterBefore ? kb(posterBefore) + " → " : ""}${kb(buf.length)}  ${poster}`);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }
}

if (has("detect")) await detect();
else await encode();

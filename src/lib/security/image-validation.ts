import type { Metadata } from "sharp";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-side validation of an image that has already landed in Storage.
 *
 * ── Why this exists ─────────────────────────────────────────────────────────
 * The van image upload is a **direct-to-Storage** flow: the browser compresses
 * the file (`lib/image-compress.ts`), uploads it straight to the `van-images`
 * bucket with the Supabase client, and then calls the `addVanImage` Server
 * Action with the storage key it chose. Nothing on the server saw the bytes,
 * and nothing on the server checked the key.
 *
 * Three separate problems came out of that:
 *
 *  1. **The storage key was client-controlled and unvalidated.** `addVanImage`
 *     wrote whatever string it was handed into `van_images.storage_path`, and
 *     `public-vans.ts` concatenates that straight into a public URL:
 *     `${base}/storage/v1/object/public/van-images/${storage_path}`. A key
 *     containing `../` therefore escapes the bucket — `../lead-attachments/x.jpg`
 *     would publish a private lead attachment through the van gallery. A Server
 *     Action is a public HTTP endpoint, so "only the admin UI calls it" is not
 *     a control.
 *  2. **Nothing tied the key to the van.** Any authenticated staff member could
 *     attach any object in the bucket to any van, including one they should not
 *     be able to enumerate.
 *  3. **The content type was whatever the client declared.** The bucket's
 *     `allowed_mime_types` check trusts the `Content-Type` the uploader sends,
 *     so arbitrary bytes labelled `image/webp` pass it. The bucket is public,
 *     so those bytes are then served from the Supabase CDN.
 *
 * The fix is layered: a strict key format, an ownership check against the van's
 * real slug, and a decode of the actual stored bytes with sharp — magic bytes,
 * real format, real dimensions. Extensions and declared MIME types are never
 * trusted.
 */

/** Formats sharp may report. Matches the bucket's `allowed_mime_types`. */
const ALLOWED_FORMATS = new Set(["webp", "jpeg", "png", "avif"]);

/**
 * Bounds, not guesses. The browser pipeline clamps to 1920×1080 before upload
 * (`lib/image-compress.ts`), so anything far outside that never came from our
 * own uploader. The lower bound rejects tracking-pixel-sized files; the upper
 * bound is the real defence — a "decompression bomb" is a tiny file that
 * expands to gigapixels and exhausts memory when anything tries to resize it,
 * and `next/image` resizes every one of these on request.
 */
const MIN_DIMENSION = 200;
const MAX_DIMENSION = 6000;
const MAX_PIXELS = 24_000_000;

/** Post-compression images are ~250 KB; the bucket's own ceiling is 10 MB. */
const MAX_BYTES = 10 * 1024 * 1024;

/**
 * The exact shape `vanStorageKey()` produces: `vans/<slug>/<rand>_<epoch>.webp`.
 *
 * Anchored, with no `.` allowed in any segment, so path traversal cannot be
 * expressed at all — this is a whitelist of a known-good format, not a
 * blacklist of bad sequences. `<slug>` uses the same character class the van
 * slug schema enforces (`validation/van.ts`).
 */
const STORAGE_KEY = /^vans\/[a-z0-9]+(?:-[a-z0-9]+)*\/[a-z0-9]{1,24}_\d{10,16}\.webp$/;

export type ImageValidationResult =
  | { ok: true; format: string; width: number; height: number; bytes: number }
  | { ok: false; error: string };

/** Structural check on the key alone. Cheap, and runs before any I/O. */
export function isValidVanStorageKey(key: string, vanSlug: string): boolean {
  if (!STORAGE_KEY.test(key)) return false;
  // Decoded traversal attempts (`%2e%2e%2f`) would already have failed the
  // pattern, but a key must also live under *this* van's folder.
  return key.startsWith(`vans/${vanSlug}/`);
}

/**
 * Downloads the stored object and validates the bytes themselves.
 *
 * Runs in the admin path only, on files the browser has already compressed to
 * roughly 250 KB, so the extra round-trip is not on any customer's critical
 * path.
 */
export async function validateStoredImage(
  supabase: SupabaseClient,
  bucket: string,
  key: string,
): Promise<ImageValidationResult> {
  let buffer: Buffer;

  try {
    const { data, error } = await supabase.storage.from(bucket).download(key);
    if (error || !data) {
      // Also the check that the object exists at all — a key can no longer be
      // registered against the database without something really being there.
      return { ok: false, error: "That upload could not be read back. Please try again." };
    }
    buffer = Buffer.from(await data.arrayBuffer());
  } catch {
    return { ok: false, error: "That upload could not be read back. Please try again." };
  }

  if (buffer.byteLength === 0) {
    return { ok: false, error: "That file is empty." };
  }
  if (buffer.byteLength > MAX_BYTES) {
    return { ok: false, error: "That image is too large. The limit is 10 MB." };
  }

  let metadata: Metadata;
  try {
    // `sharp` reads the container header — the magic bytes — so a text file or
    // an executable renamed `.webp` fails here regardless of what the client
    // declared as its content type.
    const sharp = (await import("sharp")).default;
    metadata = await sharp(buffer, { failOn: "error" }).metadata();
  } catch {
    return { ok: false, error: "That file is not a readable image." };
  }

  const { format, width, height } = metadata;

  if (!format || !ALLOWED_FORMATS.has(format)) {
    return {
      ok: false,
      error: "Only JPEG, PNG, WebP and AVIF images can be used.",
    };
  }

  if (!width || !height) {
    return { ok: false, error: "That image has no readable dimensions." };
  }

  if (width * height > MAX_PIXELS) {
    return { ok: false, error: "That image has too many pixels to process safely." };
  }

  if (width < MIN_DIMENSION || height < MIN_DIMENSION) {
    return {
      ok: false,
      error: `That image is too small — it must be at least ${MIN_DIMENSION}px on both sides.`,
    };
  }

  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    return {
      ok: false,
      error: `That image is too large — the maximum is ${MAX_DIMENSION}px on either side.`,
    };
  }

  return { ok: true, format, width, height, bytes: buffer.byteLength };
}

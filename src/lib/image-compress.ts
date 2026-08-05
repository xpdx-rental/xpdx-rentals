/**
 * Client-side image compression, run before upload.
 *
 * CLAUDE.md §7 screen 4 asks for a resize before upload with a sensible max
 * width. Doing it in the browser means a 6 MB phone photo never crosses the
 * network, which matters when the operator is uploading from the yard on
 * mobile data.
 *
 * Extracted from the inherited `ImageUpload` component in Phase 3 so the van
 * image manager can reuse it without dragging along the media_assets pipeline.
 *
 * Browser-only: uses Image, canvas and URL.createObjectURL.
 */

/** Landscape clamp. Wide enough for a full-bleed gallery on a 2x display. */
const MAX_W = 1920;
/** Portrait clamp. */
const MAX_H = 1080;
const QUALITY_HIGH = 0.82;
const QUALITY_FALLBACK = 0.72;
/** Re-encode at lower quality if the first pass still exceeds this. */
const HARD_CAP_BYTES = 250 * 1024;

export type CompressResult = {
  blob: Blob;
  originalKb: number;
  compressedKb: number;
};

export async function compressToWebP(file: File): Promise<CompressResult> {
  const originalKb = Math.round(file.size / 1024);

  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;
      const ratio = width / height;
      if (width > MAX_W) {
        width = MAX_W;
        height = Math.round(MAX_W / ratio);
      }
      if (height > MAX_H) {
        height = MAX_H;
        width = Math.round(MAX_H * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas context unavailable"));
        return;
      }

      // White background: WebP keeps alpha, and a transparent PNG source would
      // otherwise render as black on a dark gallery.
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob1) => {
          if (!blob1) {
            reject(new Error("Canvas toBlob failed"));
            return;
          }
          if (blob1.size <= HARD_CAP_BYTES) {
            resolve({ blob: blob1, originalKb, compressedKb: Math.round(blob1.size / 1024) });
            return;
          }
          canvas.toBlob(
            (blob2) => {
              const final = blob2 ?? blob1;
              resolve({ blob: final, originalKb, compressedKb: Math.round(final.size / 1024) });
            },
            "image/webp",
            QUALITY_FALLBACK,
          );
        },
        "image/webp",
        QUALITY_HIGH,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`Failed to load image: ${file.name}`));
    };

    img.src = objectUrl;
  });
}

/** Storage key for a van image: `vans/<slug>/<random>_<ts>.webp`. */
export function vanStorageKey(vanSlug: string): string {
  const rand = Math.random().toString(36).slice(2, 15);
  return `vans/${vanSlug}/${rand}_${Date.now()}.webp`;
}

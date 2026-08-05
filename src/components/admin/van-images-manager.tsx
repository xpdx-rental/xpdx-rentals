"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { UploadCloud, Loader2, Star, ArrowUp, ArrowDown, Trash2, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { compressToWebP, vanStorageKey } from "@/lib/image-compress";
import {
  addVanImage,
  updateVanImageAlt,
  setPrimaryVanImage,
  moveVanImage,
  deleteVanImage,
} from "@/app/admin/vans/actions";
import type { VanImage } from "@/lib/van";

const BUCKET = "van-images";

/**
 * Van image manager — CLAUDE.md §7 screen 4.
 *
 * Multi-upload, reorder, set primary, and a required alt text on every image.
 * Alt is not optional: this is an SEO site, and its audience often works
 * outdoors on cracked screens where images fail to load. A blank alt fails
 * validation in the Server Action and again at the database check constraint.
 *
 * Files are compressed in the browser before upload (see lib/image-compress),
 * so a 6 MB phone photo never crosses the network.
 */
export function VanImagesManager({
  vanId,
  vanSlug,
  images,
}: {
  vanId: string;
  vanSlug: string;
  images: VanImage[];
}) {
  const supabase = createClient();
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();
  const [altDrafts, setAltDrafts] = useState<Record<string, string>>({});

  const missingAlt = images.filter((i) => !i.alt?.trim()).length;

  function run(fn: () => Promise<{ error?: string }>, success: string) {
    startTransition(async () => {
      const res = await fn();
      if (res?.error) toast.error(res.error);
      else toast.success(success);
    });
  }

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    e.target.value = "";

    setUploading(true);
    let ok = 0;
    for (const file of files) {
      try {
        const { blob } = await compressToWebP(file);
        const path = vanStorageKey(vanSlug);
        const { error: upErr } = await supabase.storage
          .from(BUCKET)
          .upload(path, blob, { contentType: "image/webp", upsert: false });
        if (upErr) {
          toast.error(`${file.name}: ${upErr.message}`);
          continue;
        }
        // Seed alt from the filename so the required field is never blank on
        // arrival; the operator is expected to replace it with something real.
        const seedAlt = file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim() || vanSlug;
        const res = await addVanImage(vanId, { storagePath: path, alt: seedAlt });
        if (res?.error) toast.error(res.error);
        else ok++;
      } catch (err) {
        toast.error(err instanceof Error ? err.message : `Could not process ${file.name}`);
      }
    }
    setUploading(false);
    if (ok) toast.success(`${ok} image${ok === 1 ? "" : "s"} uploaded — check the alt text.`);
  }

  const busy = uploading || pending;

  return (
    <section className="space-y-4 rounded-xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Photos</h2>
          <p className="text-xs text-muted-foreground">
            Resized and converted to WebP in your browser before upload.
          </p>
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted">
          {uploading ? <Loader2 className="size-4 animate-spin" /> : <UploadCloud className="size-4" />}
          {uploading ? "Uploading…" : "Add photos"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            multiple
            disabled={busy}
            onChange={handleFiles}
            className="sr-only"
          />
        </label>
      </div>

      {missingAlt > 0 ? (
        <p className="flex items-center gap-2 rounded-lg bg-warning/10 px-3 py-2 text-sm text-warning">
          <AlertTriangle className="size-4 shrink-0" />
          {missingAlt} image{missingAlt === 1 ? "" : "s"} still need alt text.
        </p>
      ) : null}

      {images.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No photos yet. The public page shows a labelled placeholder until real
          photographs of this van are supplied.
        </p>
      ) : (
        <ul className="space-y-3">
          {images.map((img, i) => {
            const draft = altDrafts[img.id] ?? img.alt;
            const dirty = draft.trim() !== img.alt.trim();
            return (
              <li
                key={img.id}
                className="flex flex-col gap-3 rounded-lg border border-border p-3 sm:flex-row sm:items-start"
              >
                <div className="relative size-24 shrink-0 overflow-hidden rounded-md bg-muted">
                  <Image src={img.url} alt={img.alt} fill sizes="96px" className="object-cover" />
                  {img.isPrimary ? (
                    <span className="absolute left-1 top-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                      Primary
                    </span>
                  ) : null}
                </div>

                <div className="min-w-0 flex-1 space-y-2">
                  <label className="block">
                    <span className="text-xs font-medium text-muted-foreground">
                      Alt text (required)
                    </span>
                    <input
                      value={draft}
                      onChange={(e) => setAltDrafts({ ...altDrafts, [img.id]: e.target.value })}
                      placeholder="e.g. Mercedes Sprinter MWB high roof, side profile"
                      className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground"
                    />
                  </label>
                  {dirty ? (
                    <button
                      type="button"
                      disabled={busy || !draft.trim()}
                      onClick={() =>
                        run(() => updateVanImageAlt(img.id, vanId, draft), "Alt text saved")
                      }
                      className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50"
                    >
                      Save alt text
                    </button>
                  ) : null}
                </div>

                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    aria-label="Move up"
                    disabled={busy || i === 0}
                    onClick={() => run(() => moveVanImage(img.id, vanId, "up"), "Reordered")}
                    className="inline-flex size-9 items-center justify-center rounded-lg border border-border text-foreground hover:bg-muted disabled:opacity-30"
                  >
                    <ArrowUp className="size-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Move down"
                    disabled={busy || i === images.length - 1}
                    onClick={() => run(() => moveVanImage(img.id, vanId, "down"), "Reordered")}
                    className="inline-flex size-9 items-center justify-center rounded-lg border border-border text-foreground hover:bg-muted disabled:opacity-30"
                  >
                    <ArrowDown className="size-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Set as primary"
                    disabled={busy || img.isPrimary}
                    onClick={() => run(() => setPrimaryVanImage(img.id, vanId), "Primary image set")}
                    className="inline-flex size-9 items-center justify-center rounded-lg border border-border text-foreground hover:bg-muted disabled:opacity-30"
                  >
                    <Star className={img.isPrimary ? "size-4 fill-primary text-link" : "size-4"} />
                  </button>
                  <button
                    type="button"
                    aria-label="Delete image"
                    disabled={busy}
                    onClick={() => run(() => deleteVanImage(img.id, vanId), "Image deleted")}
                    className="inline-flex size-9 items-center justify-center rounded-lg border border-danger/40 text-danger hover:bg-danger/10 disabled:opacity-30"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

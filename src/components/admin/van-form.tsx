"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { VAN_STATUSES, ROOF_HEIGHTS, VAN_STATUS_LABELS, ROOF_LABELS, slugifyVanName, type Van } from "@/lib/van";

type Result = { ok?: true; error?: string; fieldErrors?: Record<string, string> };
type Action = (prev: Result | null, formData: FormData) => Promise<Result>;

const input =
  "mt-1 h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground";
const textarea =
  "mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground";

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-foreground">{label}</span>
      {children}
      {hint && !error ? <span className="mt-1 block text-xs text-muted-foreground">{hint}</span> : null}
      {error ? <span className="mt-1 block text-xs text-danger">{error}</span> : null}
    </label>
  );
}

function Group({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 rounded-xl border border-border bg-card p-5">
      <div>
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

/**
 * Van editor — CLAUDE.md §7 screen 3.
 *
 * Fields grouped as identity / pricing / specs / content+SEO. Zod-validated on
 * the server (lib/validation/van.ts is the authority); this form only mirrors
 * the rules for immediate feedback.
 *
 * Slug is auto-derived from the name while the operator has not touched it,
 * stays editable, and uniqueness is checked server-side before save.
 */
export function VanForm({
  action,
  van,
  mode,
}: {
  action: Action;
  van?: Van;
  mode: "create" | "edit";
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const [name, setName] = useState(van?.name ?? "");
  const [slug, setSlug] = useState(van?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(van?.slug));

  useEffect(() => {
    if (state?.ok) toast.success("Van saved");
    else if (state?.error) toast.error(state.error);
  }, [state]);

  const err = (f: string) => state?.fieldErrors?.[f];
  const effectiveSlug = slugTouched ? slug : slugifyVanName(name);

  return (
    <form action={formAction} className="space-y-6">
      {van ? <input type="hidden" name="id" value={van.id} /> : null}

      <Group title="Identity" description="What this van is and where it lives on the site.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Name" error={err("name")}>
            <input
              name="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Mercedes Sprinter MWB High Roof"
              className={input}
            />
          </Field>

          <Field
            label="URL slug"
            hint={`Public URL: /vans/${effectiveSlug || "…"}`}
            error={err("slug")}
          >
            <input
              name="slug"
              value={effectiveSlug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value);
              }}
              placeholder="sprinter-mwb-high"
              className={input}
            />
          </Field>

          <Field label="Body type" hint="HiAce or Sprinter" error={err("bodyType")}>
            <input name="bodyType" required defaultValue={van?.bodyType ?? ""} className={input} />
          </Field>

          <Field label="Wheelbase" hint="LWB, SWLB, SWB or MWB" error={err("wheelbaseLabel")}>
            <input
              name="wheelbaseLabel"
              required
              defaultValue={van?.wheelbaseLabel ?? ""}
              className={input}
            />
          </Field>

          <Field label="Roof" error={err("roof")}>
            <select name="roof" defaultValue={van?.roof ?? "standard"} className={input}>
              {ROOF_HEIGHTS.map((r) => (
                <option key={r} value={r}>
                  {ROOF_LABELS[r]}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Tonnage" hint="e.g. 2.5" error={err("tonnage")}>
            <input
              name="tonnage"
              type="number"
              step="0.1"
              required
              defaultValue={van?.tonnage ?? ""}
              className={input}
            />
          </Field>

          <Field label="Transmission" error={err("transmission")}>
            <input
              name="transmission"
              required
              defaultValue={van?.transmission ?? "Automatic"}
              className={input}
            />
          </Field>

          <Field label="Fuel" error={err("fuel")}>
            <input name="fuel" required defaultValue={van?.fuel ?? "Diesel"} className={input} />
          </Field>

          <Field label="Seats" hint="Leave blank if unconfirmed" error={err("seats")}>
            <input name="seats" type="number" defaultValue={van?.seats ?? ""} className={input} />
          </Field>

          <Field label="Status" error={err("status")}>
            <select name="status" defaultValue={van?.status ?? "draft"} className={input}>
              {VAN_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {VAN_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </Group>

      <Group
        title="Pricing"
        description="Rates are quoted per week. The 28-day minimum is contractual and cannot be lowered here."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="From, per week (AUD)" error={err("priceWeeklyFrom")}>
            <input
              name="priceWeeklyFrom"
              type="number"
              required
              defaultValue={van?.priceWeeklyFrom ?? ""}
              className={input}
            />
          </Field>

          <Field
            label="From, per month (AUD)"
            hint="Leave blank if not offered"
            error={err("priceMonthlyFrom")}
          >
            <input
              name="priceMonthlyFrom"
              type="number"
              defaultValue={van?.priceMonthlyFrom ?? ""}
              className={input}
            />
          </Field>

          <Field label="Minimum hire (days)" hint="28 days minimum" error={err("minHireDays")}>
            <input
              name="minHireDays"
              type="number"
              min={28}
              defaultValue={van?.minHireDays ?? 28}
              className={input}
            />
          </Field>

          <label className="flex items-start gap-3 self-end rounded-lg border border-border p-3">
            <input
              type="checkbox"
              name="priceVerified"
              defaultChecked={van?.priceVerified ?? false}
              className="mt-0.5 size-4"
            />
            <span className="text-sm">
              <span className="font-medium text-foreground">Pricing confirmed by the client</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                Seeded rates are inferred from the old site and are unverified. Tick only once
                someone has confirmed this figure.
              </span>
            </span>
          </label>
        </div>
      </Group>

      <Group
        title="Dimensions"
        description="Leave anything unconfirmed blank. A blank field renders as nothing; a guessed number gets published."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Length (mm)" error={err("lengthMm")}>
            <input name="lengthMm" type="number" defaultValue={van?.lengthMm ?? ""} className={input} />
          </Field>
          <Field label="Height (mm)" error={err("heightMm")}>
            <input name="heightMm" type="number" defaultValue={van?.heightMm ?? ""} className={input} />
          </Field>
          <Field label="Width (mm)" error={err("widthMm")}>
            <input name="widthMm" type="number" defaultValue={van?.widthMm ?? ""} className={input} />
          </Field>
          <Field label="Wheelbase (mm)" error={err("wheelbaseMm")}>
            <input
              name="wheelbaseMm"
              type="number"
              defaultValue={van?.wheelbaseMm ?? ""}
              className={input}
            />
          </Field>
          <Field label="Load volume (m³)" error={err("loadVolumeM3")}>
            <input
              name="loadVolumeM3"
              type="number"
              step="0.1"
              defaultValue={van?.loadVolumeM3 ?? ""}
              className={input}
            />
          </Field>
          <Field label="Payload (kg)" error={err("payloadKg")}>
            <input name="payloadKg" type="number" defaultValue={van?.payloadKg ?? ""} className={input} />
          </Field>
        </div>

        <label className="flex items-start gap-3 rounded-lg border border-border p-3">
          <input
            type="checkbox"
            name="dimensionsVerified"
            defaultChecked={van?.dimensionsVerified ?? false}
            className="mt-0.5 size-4"
          />
          <span className="text-sm">
            <span className="font-medium text-foreground">Dimensions measured and confirmed</span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              Seeded figures are indicative manufacturer numbers for the body type, not measured.
            </span>
          </span>
        </label>
      </Group>

      <Group title="Content and SEO" description="What customers read, and what search engines index.">
        <Field label="Features" hint="One per line" error={err("features")}>
          <textarea
            name="features"
            rows={5}
            defaultValue={(van?.features ?? []).join("\n")}
            placeholder={"Cargo fit-out with bulkhead\nReverse camera\nGPS tracked"}
            className={textarea}
          />
        </Field>

        <Field label="Summary" hint="Short blurb for the fleet card" error={err("summary")}>
          <textarea name="summary" rows={2} defaultValue={van?.summary ?? ""} className={textarea} />
        </Field>

        <Field label="Description" hint="Body copy on the van's own page" error={err("description")}>
          <textarea
            name="description"
            rows={6}
            defaultValue={van?.description ?? ""}
            className={textarea}
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="SEO title" hint="Up to 70 characters" error={err("seoTitle")}>
            <input name="seoTitle" defaultValue={van?.seoTitle ?? ""} className={input} />
          </Field>
          <Field label="SEO description" hint="Up to 160 characters" error={err("seoDescription")}>
            <input name="seoDescription" defaultValue={van?.seoDescription ?? ""} className={input} />
          </Field>
        </div>

        <Field label="Sort order" hint="Lower numbers appear first" error={err("sortOrder")}>
          <input name="sortOrder" type="number" defaultValue={van?.sortOrder ?? 0} className={input} />
        </Field>
      </Group>

      {state?.error ? (
        <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{state.error}</p>
      ) : null}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : null}
          {mode === "create" ? "Add van" : "Save changes"}
        </button>
      </div>
    </form>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { getVanById } from "@/lib/data/vans";
import { VanForm } from "@/components/admin/van-form";
import { VanImagesManager } from "@/components/admin/van-images-manager";
import { DeleteVanButton } from "./delete-van-button";
import { updateVan } from "../actions";

export const metadata = { title: "Edit van" };
export const dynamic = "force-dynamic";

export default async function EditVanPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const [{ id }, { created }] = await Promise.all([params, searchParams]);
  const van = await getVanById(id);
  if (!van) notFound();

  return (
    <div className="max-w-4xl space-y-6">
      <Link
        href="/admin/vans"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to fleet
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">{van.name}</h1>
          {created ? <p className="text-sm text-success">Van created.</p> : null}
        </div>
        {van.status !== "draft" ? (
          <a
            href={`/vans/${van.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-border px-3 text-sm font-medium text-foreground hover:bg-muted"
          >
            View live <ExternalLink className="size-4" />
          </a>
        ) : null}
      </div>

      <VanImagesManager vanId={van.id} vanSlug={van.slug} images={van.images} />

      <VanForm action={updateVan} van={van} mode="edit" />

      <section className="rounded-xl border border-danger/30 bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground">Delete this van</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Removes the van and its photos. Enquiries about it are kept — they store the slug
          separately so a lead never loses what it was about.
        </p>
        <div className="mt-3">
          <DeleteVanButton id={van.id} />
        </div>
      </section>
    </div>
  );
}

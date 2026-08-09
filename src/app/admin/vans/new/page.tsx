import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { VanForm } from "@/components/admin/van-form";
import { createVan } from "../actions";

export const metadata = { title: "Add van" };
export const dynamic = "force-dynamic";

export default function NewVanPage() {
  return (
    <div className="max-w-4xl space-y-6">
      <Link
        href="/admin/vans"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to fleet
      </Link>
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Add a van</h1>
        <p className="text-sm text-muted-foreground">
          Saves as a draft unless you set it available.
        </p>
      </div>
      <VanForm action={createVan} mode="create" />
    </div>
  );
}

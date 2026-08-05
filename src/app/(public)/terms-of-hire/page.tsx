import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo/metadata";
import { PendingLegalPage } from "@/components/public/pending-legal-page";

// See the note in privacy-policy/page.tsx — same reasoning.
export const metadata: Metadata = pageMetadata({
  path: "/terms-of-hire",
  title: "Terms of hire",
  description:
    "The terms that apply when you hire a vehicle from XPDX Rentals. These terms are being finalised — your rental agreement governs your hire.",
  noindex: true,
});

export default function TermsOfHirePage() {
  return (
    <PendingLegalPage
      title="Terms of hire"
      intro="The terms that apply when you hire a vehicle from XPDX Rentals."
    />
  );
}

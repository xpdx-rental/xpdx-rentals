import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo/metadata";
import { PendingLegalPage } from "@/components/public/pending-legal-page";

// noindex: a placeholder must not be indexed as thin content, and it is
// excluded from the sitemap for the same reason. Removing `noindex` is part of
// publishing the real policy — see docs/handover.md.
//
// It still declares its own canonical and its own description: two noindex
// pages sharing the root default description is a duplicate-metadata problem
// the moment either becomes indexable.
export const metadata: Metadata = pageMetadata({
  path: "/privacy-policy",
  title: "Privacy policy",
  description:
    "How XPDX Rentals collects, uses and protects your personal information. This policy is being finalised — contact us in the meantime.",
  noindex: true,
});

export default function PrivacyPolicyPage() {
  return (
    <PendingLegalPage
      title="Privacy policy"
      intro="How we collect, use and protect your personal information."
    />
  );
}

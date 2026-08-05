import Link from "next/link";
import { FileText } from "lucide-react";
import { getSiteContact } from "@/lib/data/settings";
import { telHref } from "@/lib/lead";

/**
 * Placeholder for a legal page whose text the client has not supplied.
 *
 * Phase 1 deleted the inherited Terms, Privacy Policy and Disclaimer because
 * they set out the obligations of a completely different business — legally
 * operative text that was false for this one.
 *
 * Writing replacements is not something this build can do. A privacy policy
 * describes what a specific business actually does with personal information,
 * and terms of hire set out obligations that bind real customers. Both are the
 * client's to provide, ideally with their own advice. CLAUDE.md §1.6 forbids
 * inventing business facts, and inventing them here would be the most damaging
 * possible place to do it.
 *
 * So this renders an honest placeholder and points people at a human. It is
 * `noindex` so it cannot be indexed as thin content, and it is tracked as a
 * launch blocker in docs/handover.md.
 */
export async function PendingLegalPage({
  title,
  intro,
}: {
  title: string;
  intro: string;
}) {
  const contact = await getSiteContact();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="font-heading text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
        {title}
      </h1>
      <p className="mt-4 text-lg text-body">{intro}</p>

      <div className="mt-8 rounded-xl border border-border bg-muted/30 p-6">
        <FileText className="size-6 text-link" aria-hidden="true" />
        <h2 className="mt-3 font-heading text-xl font-bold text-foreground">
          This document is being finalised
        </h2>
        <p className="mt-2 text-body">
          We are preparing this page and will publish it here shortly. In the meantime, the terms
          that apply to your hire are the ones set out in your rental agreement, and our team can
          answer any question before you book.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          {contact.phone ? (
            <a
              href={telHref(contact.phone)}
              className="inline-flex min-h-11 items-center rounded-lg bg-primary px-5 font-semibold text-primary-foreground hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Call {contact.phone}
            </a>
          ) : null}
          <Link
            href="/contact-us"
            className="inline-flex min-h-11 items-center rounded-lg border border-border px-5 font-semibold text-foreground hover:border-primary hover:text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Contact us
          </Link>
        </div>
      </div>

      <p className="mt-6 text-sm text-muted-foreground">
        For questions about your rental terms, see our{" "}
        <Link href="/faq" className="font-medium text-link hover:underline">
          frequently asked questions
        </Link>
        , which cover the bond, insurance, eligibility and what happens on the road.
      </p>
    </div>
  );
}

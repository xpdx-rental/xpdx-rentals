import Link from "next/link";
import { ChevronDown } from "lucide-react";
import type { Faq, FaqBlock } from "@/lib/content/faqs";

/**
 * FAQ list.
 *
 * Built on native `<details>` / `<summary>`: no JavaScript, no hydration, and
 * it is keyboard-accessible and expandable before React loads — which matters
 * because these answers are legally operative and must be readable even if the
 * bundle fails. It is also the zero-animation requirement of Phase 4 met for
 * free.
 *
 * The answers are rendered verbatim from `lib/content/faqs.ts`. Nothing is
 * truncated or summarised: the supplied copy is explicit that if a component
 * cannot hold the text, the component changes.
 */

function Block({ block }: { block: FaqBlock }) {
  if (block.kind === "p") return <p>{block.text}</p>;
  if (block.kind === "ul")
    return (
      <ul className="list-disc space-y-1 pl-5">
        {block.items.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
    );
  return (
    <ol className="list-decimal space-y-1 pl-5">
      {block.items.map((i) => (
        <li key={i}>{i}</li>
      ))}
    </ol>
  );
}

export function FaqItem({ faq, defaultOpen = false }: { faq: Faq; defaultOpen?: boolean }) {
  return (
    <details
      id={faq.id}
      open={defaultOpen}
      className="group border-b border-border last:border-0"
    >
      <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 py-4 text-left font-semibold text-foreground/80 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition-colors [&::-webkit-details-marker]:hidden">
        <span>{faq.question}</span>
        <ChevronDown
          className="size-5 shrink-0 text-white/20 transition-transform duration-300 group-open:rotate-180 group-open:text-primary"
          aria-hidden="true"
        />
      </summary>
      <div className="space-y-3 pb-5 text-body">
        {faq.answer.map((b, i) => (
          <Block key={i} block={b} />
        ))}
      </div>
    </details>
  );
}

export function FaqList({ faqs }: { faqs: Faq[] }) {
  return (
    <div className="rounded-2xl border border-white/[0.05] bg-card/40 backdrop-blur-md shadow-lg px-6">
      {faqs.map((f) => (
        <FaqItem key={f.id} faq={f} />
      ))}
    </div>
  );
}

/**
 * Home-page subset. Each question links through to the full page, which is
 * where the complete answer and the full `FAQPage` markup live.
 */
export function FaqSummaryList({ faqs }: { faqs: Faq[] }) {
  return (
    <div>
      <FaqList faqs={faqs} />
      <p className="mt-4 text-sm">
        <Link
          href="/faq"
          className="font-semibold text-link hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Read all frequently asked questions →
        </Link>
      </p>
    </div>
  );
}

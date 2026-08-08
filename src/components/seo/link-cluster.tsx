import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { SeoLink } from "@/lib/seo/links";

/**
 * A contextual internal-link block.
 *
 * Renders NOTHING when it has no links. That is the whole reason it exists as
 * a component: the alternative is every template guarding its own link section,
 * one of them forgetting, and a page shipping an empty "Nearby suburbs"
 * heading — which reads to a crawler exactly like a broken template.
 *
 * Link lists arrive pre-filtered by `lib/seo/links.ts`, which resolves every
 * href against the registry, so a target that was gated out never reaches here.
 */
export function LinkCluster({
  title,
  description,
  links,
  columns = 3,
}: {
  title: string;
  description?: string;
  links: SeoLink[];
  columns?: 2 | 3;
}) {
  if (links.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground">{title}</h2>
      {description ? <p className="mt-2 text-body">{description}</p> : null}

      <ul
        className={`mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 ${
          columns === 3 ? "lg:grid-cols-3" : ""
        }`}
      >
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="group flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3.5 transition-colors hover:border-primary/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <span className="min-w-0">
                <span className="block truncate font-semibold text-foreground group-hover:text-link">
                  {link.label}
                </span>
                {link.sublabel ? (
                  <span className="block truncate text-xs text-muted-foreground">{link.sublabel}</span>
                ) : null}
              </span>
              <ArrowRight
                className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
                aria-hidden="true"
              />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

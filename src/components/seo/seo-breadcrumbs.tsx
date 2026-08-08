import Link from "next/link";
import { ChevronRight } from "lucide-react";

/**
 * Visible breadcrumbs.
 *
 * Takes the SAME array that `breadcrumbSchema()` is given, because Google
 * requires the marked-up trail to match the one on the page — a `BreadcrumbList`
 * describing a trail the user cannot see is an ignored rich result at best.
 * Passing one array to both is the cheapest way to keep them in step, so every
 * programmatic route does exactly that.
 *
 * The last crumb is the current page and is not a link.
 */
export function SeoBreadcrumbs({ items }: { items: { name: string; path: string }[] }) {
  if (items.length < 2) return null;

  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={item.path} className="flex items-center gap-1.5">
              {i > 0 ? <ChevronRight className="size-3.5 shrink-0 opacity-50" aria-hidden="true" /> : null}
              {isLast ? (
                <span className="font-medium text-foreground" aria-current="page">
                  {item.name}
                </span>
              ) : (
                <Link href={item.path} className="hover:text-link hover:underline">
                  {item.name}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

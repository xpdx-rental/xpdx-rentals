import { SiteNav } from "@/components/public/site-nav";
import { SiteFooter } from "@/components/public/site-footer";
import { StickyContactBar } from "@/components/public/sticky-contact-bar";

/**
 * Public shell. No auth, no session, no account — CLAUDE.md §1.10.
 *
 * The sticky call/WhatsApp bar is rendered here so it is on every page under
 * 700px without each page remembering to include it (§8).
 */
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:font-semibold focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <SiteNav />
      <main id="main" className="flex-1 overflow-x-hidden">
        {children}
      </main>
      <SiteFooter />
      <StickyContactBar />
    </div>
  );
}

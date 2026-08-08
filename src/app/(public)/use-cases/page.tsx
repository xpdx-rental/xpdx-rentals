import type { Metadata } from "next";
import { USE_CASES, recommendedVans, type UseCaseIcon } from "@/lib/data/use-cases";
import { getPublicVans } from "@/lib/data/public-vans";
import { getSeoRegistry } from "@/lib/seo/registry";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbSchema } from "@/lib/seo/jsonld";
import { pageMetadata } from "@/lib/seo/metadata";
import { corePage } from "@/lib/seo/entities/core-pages";
import { SplitTextReveal } from "@/components/animations/split-text-reveal";
import { FadeIn } from "@/components/animations/fade-in";
import { UseCasesHeroVideo } from "@/components/public/use-cases-hero-video";
import Link from "next/link";
import {
  ArrowRight,
  Home,
  PackageSearch,
  HardHat,
  Snowflake,
  Users,
  Infinity as InfinityIcon,
  Shield,
  Settings2,
  Camera,
  type LucideIcon,
} from "lucide-react";

export const revalidate = 300;

export const metadata: Metadata = pageMetadata(corePage("/use-cases"));

const USE_CASE_ICONS: Record<UseCaseIcon, LucideIcon> = {
  home: Home,
  "package-search": PackageSearch,
  "hard-hat": HardHat,
  snowflake: Snowflake,
  users: Users,
  camera: Camera,
};

export default async function UseCasesPage() {
  // The directory lists only what the registry generated. A directory that
  // links to a page the gate declined is a 404 with a nice card around it —
  // and it is how a link-checker first learns the two lists disagree.
  const [registry, vans] = await Promise.all([getSeoRegistry(), getPublicVans()]);
  const live = new Set(
    registry.filter((p) => p.kind === "use-case" && p.decision.generate).map((p) => p.slug),
  );
  const useCases = USE_CASES.filter((uc) => live.has(uc.id));

  // Counted from the live fleet with the same selector the landing pages use.
  // The previous version printed `uc.slugs.length` — the length of a
  // hardcoded wish list, which said "3 van options" on a card whose page
  // showed one.
  const vanCounts = new Map(
    useCases.map((uc) => [uc.id, recommendedVans(uc, vans).length] as const),
  );

  return (
    <>
      <JsonLd
        schema={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Use Cases", path: "/use-cases" },
          ]),
        ]}
      />

      {/* ── Hero ── */}
      <section className="relative flex min-h-[70vh] w-full items-center overflow-hidden bg-black sm:min-h-[80vh]">
        <div className="absolute inset-0 z-0">
          <UseCasesHeroVideo />
          {/* Vignette + bottom blend into the light body below */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/50 to-black/90" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-4xl px-4 py-24 text-center sm:px-6 sm:py-32">
          <FadeIn direction="none">
            <div className="mx-auto mb-6 inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/[0.04] px-4 py-1.5 backdrop-blur-sm">
              <span className="h-px w-6 bg-primary" />
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Vehicle Use Cases</span>
            </div>
          </FadeIn>

          <SplitTextReveal
            text="Find the right van for your job."
            as="h1"
            className="font-heading text-4xl font-black tracking-tight text-white sm:text-6xl"
          />

          <FadeIn delay={0.3}>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/70">
              Select what you need to do, and we&apos;ll show you the vans that are best suited for the task.
              All our vans come with unlimited kilometres, comprehensive insurance, and automatic transmissions.
            </p>
          </FadeIn>

          <FadeIn delay={0.45}>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
              {[
                { icon: InfinityIcon, label: "Unlimited kilometres" },
                { icon: Shield, label: "Comprehensive insurance" },
                { icon: Settings2, label: "Automatic transmissions" },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-2 backdrop-blur-sm"
                >
                  <Icon className="size-3.5 text-primary" aria-hidden="true" />
                  <span className="text-xs font-medium tracking-wide text-white/70">{label}</span>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Directory ── */}
      <section className="bg-background py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {useCases.map((uc, i) => {
              const Icon = USE_CASE_ICONS[uc.icon];
              return (
                <FadeIn key={uc.id} delay={i * 0.1}>
                  <Link
                    href={`/use-cases/${uc.id}`}
                    className="card-lift group relative flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card p-8"
                  >
                    <div
                      aria-hidden="true"
                      className="ambient-glow -right-10 -top-10 size-40 bg-primary/10 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                    />

                    <div className="relative z-10 mb-6 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                      <Icon className="size-6" aria-hidden="true" />
                    </div>

                    <h2 className="relative z-10 mb-3 text-2xl font-bold text-foreground transition-colors group-hover:text-primary">
                      {uc.title}
                    </h2>
                    <p className="relative z-10 mb-6 flex-grow text-muted-foreground">{uc.description}</p>

                    <div className="relative z-10 flex items-center justify-between border-t border-border pt-5">
                      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {vanCounts.get(uc.id) ?? 0} van{" "}
                        {vanCounts.get(uc.id) === 1 ? "option" : "options"}
                      </span>
                      <span className="flex items-center text-sm font-semibold uppercase tracking-widest text-primary">
                        View Fleet
                        <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-1" />
                      </span>
                    </div>
                  </Link>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}

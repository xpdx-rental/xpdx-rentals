"use client";

import { useState } from "react";
import { PublicVan } from "@/lib/data/public-vans";
import { USE_CASES, recommendedVans } from "@/lib/data/use-cases";
import { VanCard } from "@/components/public/van-card";
import { FadeIn } from "@/components/animations/fade-in";
import { cn } from "@/lib/utils";

type UseCasesClientProps = {
  vans: PublicVan[];
};

export function UseCasesClient({ vans }: UseCasesClientProps) {
  const [activeId, setActiveId] = useState<string>(USE_CASES[0].id);

  const activeUseCase = USE_CASES.find((uc) => uc.id === activeId)!;
  // Shares the selector used by the use-case landing pages, so this tab never
  // shows a different set of vans from `/use-cases/[slug]` for the same job.
  const filteredVans: PublicVan[] = recommendedVans(activeUseCase, vans);

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      {/* Category Selector */}
      <div className="flex flex-col md:flex-row gap-8 mb-16">
        <div className="md:w-1/3 shrink-0 flex flex-col gap-2">
          {USE_CASES.map((uc) => {
            const isActive = uc.id === activeId;
            return (
              <button
                key={uc.id}
                onClick={() => setActiveId(uc.id)}
                className={cn(
                  "text-left p-4 rounded-xl border transition-all duration-200",
                  isActive
                    ? "bg-primary/10 border-primary shadow-sm"
                    : "bg-surface border-border hover:bg-surface-raised hover:border-primary/50"
                )}
              >
                <h3
                  className={cn(
                    "text-lg font-bold mb-1",
                    isActive ? "text-primary" : "text-foreground"
                  )}
                >
                  {uc.title}
                </h3>
                <p
                  className={cn(
                    "text-sm",
                    isActive ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {uc.description}
                </p>
              </button>
            );
          })}
        </div>

        {/* Fleet Grid */}
        <div className="md:w-2/3">
          <div className="mb-6 border-b border-border pb-4">
            <h2 className="text-2xl font-black text-foreground">
              {activeUseCase.title} Vans
            </h2>
            <p className="text-muted-foreground mt-2">
              Showing {filteredVans.length} recommended {filteredVans.length === 1 ? "vehicle" : "vehicles"}.
            </p>
          </div>

          {filteredVans.length > 0 ? (
            <div key={activeId} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {filteredVans.map((van, i) => (
                <FadeIn key={van.id} delay={i * 0.1}>
                  <VanCard van={van} />
                </FadeIn>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground py-12 text-center bg-surface rounded-xl border border-border">
              No vehicles currently available for this category.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

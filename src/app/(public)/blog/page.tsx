import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Calendar, FileText, ArrowRight } from "lucide-react";
import { getPublicBlogPosts } from "@/lib/data/blog";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbSchema } from "@/lib/seo/jsonld";
import { pageMetadata } from "@/lib/seo/metadata";
import { corePage } from "@/lib/seo/entities/core-pages";
import { FadeIn } from "@/components/animations/fade-in";

export const revalidate = 86400; // 24 hours

export const metadata: Metadata = pageMetadata(corePage("/blog"));

function formatDate(dateStr: string | null) {
  if (!dateStr) return "Recent Post";
  return new Date(dateStr).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function BlogPage() {
  const posts = await getPublicBlogPosts();

  return (
    <>
      <JsonLd
        schema={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Blog", path: "/blog" },
          ]),
        ]}
      />

      {/* ── Blog Hero Header ── */}
      <section className="relative border-b border-border bg-background overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[40vw] h-full bg-primary/5 blur-[100px]" />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-px w-8 bg-primary" />
            <span className="text-primary text-xs font-bold uppercase tracking-[0.2em]">Our Blog</span>
          </div>
          
          <h1 className="font-heading text-4xl font-black tracking-tight text-foreground sm:text-5xl">
            Latest Guides & Insights
          </h1>
          
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed">
            Tips, guides, and advice for long-term commercial van hire, moving, and fleet operations in Sydney from our team at Condell Park.
          </p>
        </div>
      </section>

      {/* ── Blog Posts Grid ── */}
      <section aria-labelledby="blog-grid" className="bg-gradient-to-b from-background via-background to-secondary/30 py-16 sm:py-20 min-h-[50vh]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 id="blog-grid" className="sr-only">
            Published Articles
          </h2>
          
          {posts.length === 0 ? (
            <div className="rounded-3xl border border-border bg-card p-12 text-center text-muted-foreground shadow-sm">
              <FileText className="mx-auto size-12 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-1">No articles found</h3>
              <p className="text-sm max-w-md mx-auto">
                We haven&apos;t published any articles yet. Check back soon for guides, tips, and operational insights!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post, i) => {
                const categories = post.categoriesRaw
                  ? post.categoriesRaw.split(",").map((c) => c.trim())
                  : [];
                
                return (
                  <FadeIn key={post.id} delay={i * 0.1} className="flex">
                    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-500 hover:shadow-lg hover:border-primary/45 hover:-translate-y-1.5 w-full">
                      <Link
                        href={`/blog/${post.slug}`}
                        className="relative aspect-[16/9] w-full overflow-hidden bg-muted border-b border-border"
                        tabIndex={-1}
                        aria-hidden="true"
                      >
                        <Image
                          src={post.coverImageUrl || "/images/xpdx-fleet-compound-branded.webp"}
                          alt={post.title}
                          fill
                          className="object-cover transition-transform duration-[1.5s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.06]"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                        <span className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/15 to-transparent" />
                      </Link>

                      <div className="flex flex-1 flex-col p-6">
                        {/* Meta Category & Date */}
                        <div className="flex items-center flex-wrap gap-3 text-xs text-muted-foreground mb-3">
                          {categories.length > 0 ? (
                            <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                              {categories[0]}
                            </span>
                          ) : null}
                          <span className="flex items-center gap-1.5">
                            <Calendar className="size-3.5" />
                            {formatDate(post.publishedAt)}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="font-heading text-xl font-bold leading-snug text-foreground hover:text-link group-hover:text-primary transition-colors duration-300">
                          <Link href={`/blog/${post.slug}`}>
                            {post.title}
                          </Link>
                        </h3>

                        {/* Summary */}
                        {post.summary ? (
                          <p className="mt-3 text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                            {post.summary}
                          </p>
                        ) : null}

                        {/* Card CTA Footer */}
                        <div className="mt-auto pt-5 border-t border-border/40 flex items-center justify-between">
                          <Link
                            href={`/blog/${post.slug}`}
                            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-hover transition-colors duration-300"
                          >
                            Read article
                            <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
                          </Link>
                        </div>
                      </div>
                    </article>
                  </FadeIn>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

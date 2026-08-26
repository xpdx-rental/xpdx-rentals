import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Calendar, FileText, ArrowLeft } from "lucide-react";
import { getPublicBlogPostBySlug } from "@/lib/data/blog";
import { getSiteContact } from "@/lib/data/settings";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbSchema, webPageSchema } from "@/lib/seo/jsonld";
import { pageMetadata, suppressedMetadata } from "@/lib/seo/metadata";
import { ConversionBlock } from "@/components/seo/conversion-block";
import { generatedSlugs } from "@/lib/seo/registry";
import { SeoBreadcrumbs } from "@/components/seo/seo-breadcrumbs";

export const revalidate = 86400; // 24 hours
export const dynamicParams = true;

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const slugs = await generatedSlugs("blog");
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublicBlogPostBySlug(slug);

  if (!post) {
    return suppressedMetadata(`/blog/${slug}`);
  }

  const cleanSlug = post.slug.replace(/\/$/, "");

  return pageMetadata({
    path: `/blog/${cleanSlug}`,
    title: post.metaTitle || post.title,
    description: post.metaDescription || post.summary || "",
    image: post.coverImageUrl,
  });
}

export default async function BlogPostDetailPage({ params }: Props) {
  const { slug } = await params;
  const [post, contact] = await Promise.all([
    getPublicBlogPostBySlug(slug),
    getSiteContact(),
  ]);

  if (!post) {
    notFound();
  }

  // Strip leading h1/h2 if it contains the title text (case-insensitive, ignoring tags)
  let cleanContent = post.content;
  const titleText = post.title;
  cleanContent = cleanContent.replace(/^<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/i, (match, p1) => {
    const headingText = p1.replace(/<[^>]*>/g, "").trim().toLowerCase();
    const cleanTitle = titleText.toLowerCase().trim();
    if (
      cleanTitle.includes(headingText) ||
      headingText.includes(cleanTitle) ||
      cleanTitle.substring(0, 15) === headingText.substring(0, 15)
    ) {
      return ""; // strip the duplicate heading
    }
    return match; // keep the heading if it's different
  });

  const cleanSlug = post.slug.replace(/\/$/, "");
  const categories = post.categoriesRaw
    ? post.categoriesRaw.split(",").map((c) => c.trim())
    : [];

  const breadcrumbs = [
    { name: "Home", path: "/" },
    { name: "Blog", path: "/blog" },
    { name: post.title, path: `/blog/${cleanSlug}` },
  ];

  const formattedDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString("en-AU", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "Recent Post";

  return (
    <>
      <JsonLd
        schema={[
          breadcrumbSchema(breadcrumbs),
          webPageSchema({
            path: `/blog/${cleanSlug}`,
            name: post.title,
            description: post.metaDescription || post.summary || "",
            lastModified: new Date(post.publishedAt || post.createdAt),
          }),
        ]}
      />

      <article className="min-h-screen bg-background">
        {/* ── Breadcrumb & Header ── */}
        <header className="mx-auto max-w-4xl px-4 pt-8 pb-4 sm:px-6">
          <SeoBreadcrumbs items={breadcrumbs} />

          <div className="flex items-center gap-3 mb-4 text-xs font-semibold text-primary">
            {categories.length > 0 ? (
              <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 uppercase tracking-wider">
                {categories[0]}
              </span>
            ) : null}
            <span className="flex items-center gap-1.5 text-muted-foreground font-normal">
              <Calendar className="size-3.5" />
              {formattedDate}
            </span>
          </div>

          <h1 className="font-heading text-3xl font-black tracking-tight text-foreground sm:text-4xl lg:text-5xl leading-tight">
            {post.title}
          </h1>

          {post.summary ? (
            <p className="mt-4 text-lg text-muted-foreground leading-relaxed border-l-2 border-primary/40 pl-4 italic">
              {post.summary}
            </p>
          ) : null}
        </header>

        {/* ── Cover Image ── */}
        <div className="mx-auto max-w-5xl px-4 sm:px-6 my-6">
          <div className="relative aspect-[16/9] md:aspect-[21/9] w-full overflow-hidden rounded-2xl border border-border shadow-sm bg-muted">
            <Image
              src={post.coverImageUrl || "/images/xpdx-fleet-compound-branded.webp"}
              alt={post.title}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 1200px"
            />
          </div>
        </div>

        {/* ── Main content body ── */}
        <section className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
          <div 
            className="blog-post-content text-body leading-relaxed space-y-6"
            dangerouslySetInnerHTML={{ __html: cleanContent }}
          />

          <div className="mt-12 pt-6 border-t border-border flex items-center">
            <Link 
              href="/blog" 
              className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-primary-hover transition-colors"
            >
              <ArrowLeft className="size-4" />
              Back to all articles
            </Link>
          </div>
        </section>
      </article>

      <ConversionBlock
        heading="Need a van for your business?"
        lead="We provide fully-maintained commercial cargo vans for long-term hire across Sydney."
        phone={contact.phone}
        whatsapp={contact.whatsapp}
        whatsappMessage={`Hi XPDX Rentals, I read your blog post "${post.title}" and would like to enquire about van hire.`}
      />
    </>
  );
}

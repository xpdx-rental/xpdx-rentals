import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public";
import type { Database } from "@/lib/database.types";

export type BlogPostRow = Database["public"]["Tables"]["blog_posts"]["Row"];

export type PublicBlogPost = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  coverImageUrl: string | null;
  content: string;
  status: "draft" | "scheduled" | "published";
  publishedAt: string | null;
  createdAt: string;
  categoriesRaw: string | null;
  tagsRaw: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
};

function toPublicBlogPost(r: BlogPostRow): PublicBlogPost {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    summary: r.summary ?? null,
    coverImageUrl: r.cover_image_url ?? null,
    content: r.content,
    status: r.status,
    publishedAt: r.published_at ?? null,
    createdAt: r.created_at,
    categoriesRaw: r.categories_raw ?? null,
    tagsRaw: r.tags_raw ?? null,
    metaTitle: r.meta_title ?? null,
    metaDescription: r.meta_description ?? null,
  };
}

/**
 * Fetch all published blog posts, sorted by published date descending.
 */
export const getPublicBlogPosts = cache(async function getPublicBlogPosts(): Promise<PublicBlogPost[]> {
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("status", "published")
      .lte("published_at", new Date().toISOString())
      .order("published_at", { ascending: false });

    if (error || !data) return [];
    return data.map(toPublicBlogPost);
  } catch (error) {
    console.error("Failed to fetch public blog posts:", error);
    return [];
  }
});

/**
 * Fetch a single published blog post by its slug.
 * Normalizes query to support matching the slug with or without trailing slash.
 */
export const getPublicBlogPostBySlug = cache(async function getPublicBlogPostBySlug(
  slug: string,
): Promise<PublicBlogPost | null> {
  try {
    const supabase = createPublicClient();
    const normalizedSlug = slug.replace(/\/$/, "");
    
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("status", "published")
      .lte("published_at", new Date().toISOString())
      .or(`slug.eq.${normalizedSlug},slug.eq.${normalizedSlug}/`)
      .maybeSingle();

    if (error || !data) return null;
    return toPublicBlogPost(data);
  } catch (error) {
    console.error(`Failed to fetch public blog post by slug ${slug}:`, error);
    return null;
  }
});

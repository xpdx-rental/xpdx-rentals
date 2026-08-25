"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/security/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { Database } from "@/lib/database.types";

type BlogPostInsert = Database["public"]["Tables"]["blog_posts"]["Insert"];

export async function saveBlogPost(data: BlogPostInsert) {
  await requireAdmin();
  
  const supabase = createAdminClient();
  
  // Set published_at if status is published and it's not set
  if (data.status === 'published' && !data.published_at) {
    data.published_at = new Date().toISOString();
  }

  const { data: post, error } = await supabase
    .from("blog_posts")
    .upsert(data)
    .select()
    .single();

  if (error) {
    console.error("Failed to save blog post:", error);
    return { error: error.message };
  }

  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  if (post?.slug) {
    revalidatePath(`/blog/${post.slug}`);
  }

  return { ok: true, post };
}

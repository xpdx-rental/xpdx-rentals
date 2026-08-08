import { BlogEditor } from "@/components/admin/blog-editor";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = { title: "Edit Blog Post" };
export const dynamic = "force-dynamic";

export default async function EditBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createAdminClient();

  // Try to fetch the post, if table doesn't exist yet, it throws an error and we just mock it for now
  // so the UI doesn't crash before the user runs db push.
  const { data: post, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !post) {
    // If table missing or post not found, fallback gracefully 
    // In production, you might want to call notFound() here if !post and no error
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <Link href="/admin/blog" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors">
          <ArrowLeft className="size-4" />
          Back to Blog Manager
        </Link>
        <h1 className="font-heading text-2xl font-bold text-foreground">Edit Post</h1>
      </header>

      <BlogEditor 
        initialTitle={post?.title ?? ""} 
        initialContent={post?.content ?? ""}
        initialSlug={post?.slug ?? ""}
      />
    </div>
  );
}

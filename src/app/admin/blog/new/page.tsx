import { BlogEditor } from "@/components/admin/blog-editor";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = { title: "New Blog Post" };
export const dynamic = "force-dynamic";

export default function NewBlogPostPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <Link href="/admin/blog" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors">
          <ArrowLeft className="size-4" />
          Back to Blog Manager
        </Link>
        <h1 className="font-heading text-2xl font-bold text-foreground">Write a New Post</h1>
      </header>

      <BlogEditor />
    </div>
  );
}

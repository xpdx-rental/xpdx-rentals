import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { Plus, Sparkles, FileText, Calendar, Eye, PenLine } from "lucide-react";

import { requireAdminRole } from "@/lib/security/auth";

export const metadata = { title: "Blog Manager" };
export const dynamic = "force-dynamic";

export default async function AdminBlogPage() {
  await requireAdminRole(["owner"]);
  const supabase = createAdminClient();

  // Fetch blogs (ignoring errors if table doesn't exist yet, we will just show empty state)
  const { data: posts } = await supabase
    .from("blog_posts")
    .select("id, title, slug, status, published_at, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Blog Manager</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage, write, and schedule your blog posts.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Link
            href="/admin/blog/automated"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-indigo-600/10 px-4 text-sm font-semibold text-indigo-400 transition-colors hover:bg-indigo-600/20"
          >
            <Sparkles className="size-4" />
            AI Draft
          </Link>
          <Link
            href="/admin/blog/new"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
          >
            <Plus className="size-4" />
            New Manual Post
          </Link>
        </div>
      </header>

      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        {(!posts || posts.length === 0) ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 rounded-full bg-slate-800/50 p-4 shadow-inner">
              <FileText className="size-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">No blog posts yet</h3>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Get started by writing a new post manually, or let our AI generate an SEO-optimized draft for you.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/5 bg-slate-900/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-6 py-4">Title</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Published Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {posts.map((post) => (
                  <tr key={post.id} className="group hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-foreground">{post.title}</div>
                      <div className="text-xs text-muted-foreground mt-1">/{post.slug}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                          post.status === "published"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : post.status === "scheduled"
                            ? "bg-indigo-500/10 text-indigo-400"
                            : "bg-slate-500/10 text-slate-400"
                        }`}
                      >
                        {post.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {post.published_at ? (
                        <div className="flex items-center gap-1.5">
                          <Calendar className="size-3.5" />
                          {new Date(post.published_at).toLocaleDateString()}
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {post.status === "published" && (
                          <Link
                            href={`/blog/${post.slug}`}
                            target="_blank"
                            className="p-2 text-slate-400 hover:text-white transition-colors"
                            title="View on site"
                          >
                            <Eye className="size-4" />
                          </Link>
                        )}
                        <Link
                          href={`/admin/blog/${post.id}`}
                          className="p-2 text-primary hover:text-primary-hover transition-colors"
                          title="Edit"
                        >
                          <PenLine className="size-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

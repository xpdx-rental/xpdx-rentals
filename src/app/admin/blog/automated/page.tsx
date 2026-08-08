"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AutomatedBlogPage() {
  const [topic, setTopic] = useState("");
  const [generating, setGenerating] = useState(false);
  const router = useRouter();

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    
    setGenerating(true);
    // Simulate generation delay
    await new Promise(r => setTimeout(r, 2000));
    setGenerating(false);
    alert("AI draft generated successfully! Check your Blog Manager.");
    router.push("/admin/blog");
  };

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <Link href="/admin/blog" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors">
          <ArrowLeft className="size-4" />
          Back to Blog Manager
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="font-heading text-2xl font-bold text-foreground">Generate AI Post</h1>
          <Sparkles className="size-5 text-indigo-400" />
        </div>
      </header>

      <div className="max-w-2xl rounded-xl border border-border bg-card p-6 shadow-sm">
        <form onSubmit={handleGenerate} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Topic or Keywords</label>
            <textarea 
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              rows={4}
              required
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. 5 reasons to hire a refrigerated van for your catering business in Sydney..."
            />
            <p className="text-xs text-muted-foreground">
              Our AI pipeline will research this topic, outline an article, write SEO-optimized content, and save it as a draft for you to review.
            </p>
          </div>

          <button 
            type="submit"
            disabled={generating || !topic.trim()}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
          >
            {generating ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Generating magic...
              </>
            ) : (
              <>
                <Sparkles className="size-4" />
                Generate Draft
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

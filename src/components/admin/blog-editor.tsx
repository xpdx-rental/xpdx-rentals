"use client";

import { useState, type ComponentProps } from "react";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import { Loader2, ImagePlus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function BlogEditor({ initialContent = "", initialTitle = "", initialSlug = "" }) {
  const [title, setTitle] = useState(initialTitle);
  const [slug, setSlug] = useState(initialSlug);
  const [content, setContent] = useState(initialContent);
  const [saving, setSaving] = useState(false);
  
  const handleSave = async (status: 'draft' | 'published') => {
    setSaving(true);
    // Simulate save
    await new Promise(r => setTimeout(r, 1000));
    setSaving(false);
    alert(`Successfully saved as ${status}!`);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Post Title</label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground"
              placeholder="E.g., The Ultimate Guide to Van Hire"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Post Content</label>
            <div className="prose prose-invert max-w-none ck-editor-container bg-background text-foreground rounded-lg overflow-hidden border border-border">
              <CKEditor
                // The classic build ships its own `Editor` class whose type
                // does not structurally match the one `@ckeditor/ckeditor5-react`
                // declares, so a cast is unavoidable — but it can be a cast to
                // the prop's real type rather than to `any`, which would also
                // have silenced mistakes in every other prop on this element.
                editor={ClassicEditor as unknown as ComponentProps<typeof CKEditor>["editor"]}
                data={content}
                onReady={(editor) => {
                  editor.plugins.get("FileRepository").createUploadAdapter = (loader) => {
                    return {
                      upload: async () => {
                        const file = await loader.file;
                        if (!file) throw new Error("No file provided");
                        const supabase = createClient();
                        const filename = `${Date.now()}-${file.name}`;
                        
                        // Only `error` is used — the public URL is resolved
                        // separately below, so destructuring `data` here just
                        // bound a value nothing read.
                        const { error } = await supabase.storage
                          .from("media")
                          .upload(`blog/${filename}`, file, {
                            cacheControl: '3600',
                            upsert: false
                          });
                          
                        if (error) throw error;
                        
                        const { data: { publicUrl } } = supabase.storage
                          .from("media")
                          .getPublicUrl(`blog/${filename}`);
                          
                        return { default: publicUrl };
                      }
                    };
                  };
                }}
                onChange={(event, editor) => {
                  const data = editor.getData();
                  setContent(data);
                }}
              />
            </div>
            <style jsx global>{`
              .ck-editor__editable_inline {
                min-height: 400px;
                background-color: var(--background) !important;
                border: 0 !important;
                color: white;
              }
              .ck.ck-toolbar {
                background: #0f172a !important;
                border: 0 !important;
                border-bottom: 1px solid #1e293b !important;
              }
              .ck.ck-button {
                color: #cbd5e1 !important;
              }
              .ck.ck-button:hover, .ck.ck-button.ck-on {
                background: #1e293b !important;
                color: white !important;
              }
              .ck.ck-tooltip .ck-tooltip__text {
                color: white;
                background: black;
              }
            `}</style>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h3 className="font-semibold text-foreground">Publish Settings</h3>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">URL Slug</label>
              <input 
                type="text" 
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full rounded-md border border-border bg-background/50 px-3 py-1.5 text-sm text-foreground"
                placeholder="ultimate-guide"
              />
            </div>

            <div className="space-y-2 pt-2">
              <label className="text-sm font-medium text-muted-foreground">Cover Image</label>
              <button className="flex h-20 w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-background/50 text-muted-foreground hover:bg-background hover:text-foreground transition-colors">
                <ImagePlus className="size-5" />
                <span className="text-xs font-medium">Upload Cover</span>
              </button>
            </div>

            <div className="pt-4 flex flex-col gap-3">
              <button 
                onClick={() => handleSave('published')}
                disabled={saving}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
              >
                {saving ? <Loader2 className="size-4 animate-spin" /> : null}
                Publish Now
              </button>
              <button 
                onClick={() => handleSave('draft')}
                disabled={saving}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-slate-800 font-medium text-white hover:bg-slate-700 disabled:opacity-50"
              >
                Save Draft
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

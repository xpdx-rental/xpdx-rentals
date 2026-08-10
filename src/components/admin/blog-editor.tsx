"use client";

import { useState, useRef } from "react";
import { CKEditor } from "@ckeditor/ckeditor5-react";
/**
 * Imported from the single `ckeditor5` package rather than the legacy
 * `@ckeditor/ckeditor5-build-classic` pre-bundled distribution.
 *
 * The old build was v41, from the era when every feature shipped as its own
 * `@ckeditor/ckeditor5-*` package. Each of those depended on the `ckeditor5`
 * umbrella, and that umbrella declared a dependency on *all six* editor
 * distributions (classic, balloon, balloon-block, decoupled-document, inline,
 * multi-root) — each of which pulled its own nested copy of the ~30 feature
 * packages. The cycle resolved to 1,115 packages and 1.68 GB of node_modules,
 * 70% of the entire dependency tree, to render one admin textarea.
 *
 * It was also the wrong version: `@ckeditor/ckeditor5-react` peer-requires
 * `ckeditor5 >= 46`, which v41 never satisfied. That unsatisfied peer is why
 * the `editor` prop previously needed a cast — the build's `Editor` class did
 * not structurally match the one the React wrapper declared. Both packages now
 * come from the same major, so the cast is gone and the types line up.
 */
import {
  ClassicEditor,
  Autoformat,
  BlockQuote,
  Bold,
  Essentials,
  Heading,
  Image,
  ImageCaption,
  ImageResize,
  ImageStyle,
  ImageToolbar,
  ImageUpload,
  Indent,
  Italic,
  Link,
  List,
  MediaEmbed,
  Paragraph,
  PasteFromOffice,
  Table,
  TableToolbar,
  Underline,
} from "ckeditor5";
import "ckeditor5/ckeditor5.css";
import { Loader2, ImagePlus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function BlogEditor({ initialContent = "", initialTitle = "", initialSlug = "" }) {
  const [title, setTitle] = useState(initialTitle);
  const [slug, setSlug] = useState(initialSlug);
  const [content, setContent] = useState(initialContent);
  const [saving, setSaving] = useState(false);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCover(true);
    try {
      const supabase = createClient();
      const filename = `${Date.now()}-${file.name}`;
      
      const { error } = await supabase.storage
        .from("media")
        .upload(`blog/covers/${filename}`, file, {
          cacheControl: '3600',
          upsert: false
        });
        
      if (error) throw error;
      
      const { data: { publicUrl } } = supabase.storage
        .from("media")
        .getPublicUrl(`blog/covers/${filename}`);
        
      setCoverUrl(publicUrl);
    } catch (error) {
      console.error("Upload failed", error);
      alert("Failed to upload cover image.");
    } finally {
      setUploadingCover(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

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
                editor={ClassicEditor}
                config={{
                  // Required since v44. "GPL" is the correct value for
                  // open-source use and needs no account or network call.
                  licenseKey: "GPL",
                  // The pre-bundled build shipped a fixed plugin list baked in.
                  // Importing from `ckeditor5` means declaring it, which is the
                  // point: this is now the set actually loaded, rather than
                  // every feature CKEditor ships whether used or not.
                  plugins: [
                    Essentials,
                    Paragraph,
                    Heading,
                    Bold,
                    Italic,
                    Underline,
                    Link,
                    List,
                    BlockQuote,
                    Autoformat,
                    PasteFromOffice,
                    Indent,
                    Image,
                    ImageUpload,
                    ImageToolbar,
                    ImageCaption,
                    ImageStyle,
                    ImageResize,
                    MediaEmbed,
                    Table,
                    TableToolbar,
                  ],
                  toolbar: [
                    "undo",
                    "redo",
                    "|",
                    "heading",
                    "|",
                    "bold",
                    "italic",
                    "underline",
                    "link",
                    "|",
                    "bulletedList",
                    "numberedList",
                    "outdent",
                    "indent",
                    "|",
                    "blockQuote",
                    "uploadImage",
                    "insertTable",
                    "mediaEmbed",
                  ],
                  image: {
                    toolbar: [
                      "imageStyle:inline",
                      "imageStyle:block",
                      "imageStyle:side",
                      "|",
                      "toggleImageCaption",
                      "imageTextAlternative",
                    ],
                  },
                  table: {
                    contentToolbar: ["tableColumn", "tableRow", "mergeTableCells"],
                  },
                }}
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
              
              {coverUrl ? (
                <div className="relative aspect-video w-full rounded-lg overflow-hidden border border-border group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={coverUrl} alt="Cover preview" className="object-cover w-full h-full" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="text-white text-xs font-medium bg-black/50 px-3 py-1.5 rounded hover:bg-black/70 transition-colors"
                      disabled={uploadingCover}
                    >
                      {uploadingCover ? "Uploading..." : "Change Image"}
                    </button>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingCover}
                  className="flex h-20 w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-background/50 text-muted-foreground hover:bg-background hover:text-foreground transition-colors disabled:opacity-50"
                >
                  {uploadingCover ? <Loader2 className="size-5 animate-spin" /> : <ImagePlus className="size-5" />}
                  <span className="text-xs font-medium">{uploadingCover ? "Uploading..." : "Upload Cover"}</span>
                </button>
              )}
              
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleCoverUpload} 
                accept="image/*" 
                className="hidden" 
              />
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

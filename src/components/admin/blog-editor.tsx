"use client";

import { useState, useRef, type ComponentProps } from "react";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import { Loader2, ImagePlus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { saveBlogPost } from "@/app/admin/blog/actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function BlogEditor({ 
  id = "",
  initialContent = "", 
  initialTitle = "", 
  initialSlug = "",
  initialCategories = "",
  initialMetaTitle = "",
  initialMetaDescription = "",
  initialTags = "",
  initialCoverUrl = ""
}) {
  const [title, setTitle] = useState(initialTitle);
  const [slug, setSlug] = useState(initialSlug);
  const [content, setContent] = useState(initialContent);
  const [categories, setCategories] = useState(initialCategories);
  const [metaTitle, setMetaTitle] = useState(initialMetaTitle);
  const [metaDescription, setMetaDescription] = useState(initialMetaDescription);
  const [tags, setTags] = useState(initialTags);
  const [saving, setSaving] = useState(false);
  const [coverUrl, setCoverUrl] = useState<string | null>(initialCoverUrl || null);
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
        .from("blog-media")
        .upload(`blog/covers/${filename}`, file, {
          cacheControl: '3600',
          upsert: false
        });
        
      if (error) throw error;
      
      const { data: { publicUrl } } = supabase.storage
        .from("blog-media")
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

  const router = useRouter();

  const handleSave = async (status: 'draft' | 'published') => {
    if (!title || !slug) {
      toast.error("Title and slug are required.");
      return;
    }

    setSaving(true);
    
    try {
      const result = await saveBlogPost({
        ...(id ? { id } : {}),
        title,
        slug,
        content,
        cover_image_url: coverUrl,
        status,
        categories_raw: categories,
        tags_raw: tags,
        meta_title: metaTitle,
        meta_description: metaDescription,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`Successfully saved as ${status}!`);
        if (!id && result.post?.id) {
          router.push(`/admin/blog/${result.post.id}`);
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("An unexpected error occurred while saving.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        <div className="md:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Post Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-base font-medium">Post Title</Label>
                <Input 
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="E.g., The Ultimate Guide to Van Hire"
                  className="text-lg font-medium"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-base font-medium">Body</Label>
                <div className="prose max-w-none ck-editor-container bg-background text-foreground rounded-lg overflow-hidden border border-input shadow-sm">
                  <CKEditor
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
                            
                            const { error } = await supabase.storage
                              .from("blog-media")
                              .upload(`blog/${filename}`, file, {
                                cacheControl: '3600',
                                upsert: false
                              });
                              
                            if (error) throw error;
                            
                            const { data: { publicUrl } } = supabase.storage
                              .from("blog-media")
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
                    min-height: 500px;
                    background-color: var(--background) !important;
                    border: 0 !important;
                    color: var(--foreground) !important;
                  }
                  .ck.ck-toolbar {
                    background: var(--muted) !important;
                    border: 0 !important;
                    border-bottom: 1px solid var(--border) !important;
                  }
                  .ck.ck-button {
                    color: var(--foreground) !important;
                  }
                  .ck.ck-button:hover, .ck.ck-button.ck-on {
                    background: var(--background) !important;
                    color: var(--foreground) !important;
                  }
                  .ck.ck-tooltip .ck-tooltip__text {
                    color: white;
                    background: black;
                  }
                `}</style>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Publish Settings</CardTitle>
              <CardDescription>Manage your post visibility</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="slug">URL Slug</Label>
                <Input 
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="ultimate-guide"
                />
              </div>

              <div className="space-y-2">
                <Label>Cover Image</Label>
                {coverUrl ? (
                  <div className="relative aspect-video w-full rounded-lg overflow-hidden border border-input group shadow-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={coverUrl} alt="Cover preview" className="object-cover w-full h-full" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-sm">
                      <Button 
                        variant="secondary"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingCover}
                      >
                        {uploadingCover ? "Uploading..." : "Change Image"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingCover}
                    className="flex h-32 w-full flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-input bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:border-muted-foreground/50 transition-all disabled:opacity-50"
                  >
                    {uploadingCover ? <Loader2 className="size-6 animate-spin" /> : <ImagePlus className="size-6" />}
                    <span className="text-sm font-medium">{uploadingCover ? "Uploading..." : "Upload Cover Image"}</span>
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

              <div className="pt-2 flex flex-col gap-3">
                <Button 
                  onClick={() => handleSave('published')}
                  disabled={saving}
                  size="lg"
                  className="w-full font-bold"
                >
                  {saving && <Loader2 className="size-4 animate-spin mr-2" />}
                  Publish Now
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => handleSave('draft')}
                  disabled={saving}
                  size="lg"
                  className="w-full"
                >
                  Save Draft
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Organization & SEO</CardTitle>
              <CardDescription>Improve discoverability</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="categories">Categories</Label>
                <Input 
                  id="categories"
                  value={categories}
                  onChange={(e) => setCategories(e.target.value)}
                  placeholder="e.g. Travel, Advice"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <Input 
                  id="tags"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="e.g. Roadtrip, Vanlife"
                />
              </div>

              <div className="space-y-2 pt-2">
                <Label htmlFor="metaTitle">Meta Title</Label>
                <Input 
                  id="metaTitle"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  placeholder="SEO Title (max 60 chars)"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="metaDescription">Meta Description</Label>
                <Textarea 
                  id="metaDescription"
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  placeholder="SEO Description (max 160 chars)"
                  className="min-h-[100px] resize-y"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

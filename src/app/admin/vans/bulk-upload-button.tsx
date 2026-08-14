"use client";

import { useState, useRef } from "react";
import { Upload, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { bulkUploadVans } from "./bulk-actions";

export function BulkUploadButton() {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
      toast.error("Please upload a valid CSV file.");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const result = (await bulkUploadVans(formData)) as { success: boolean; count?: number; error?: string };
      if (result.success) {
        toast.success(`Successfully uploaded ${result.count} vans!`);
      } else {
        toast.error(result.error || "Failed to upload vans.");
      }
    } catch (err: unknown) {
      toast.error("An unexpected error occurred during upload.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = ""; // reset input
      }
    }
  };

  return (
    <div className="flex items-center gap-2">
      <a
        href="/templates/vans-bulk-upload.csv"
        download
        className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-semibold text-foreground hover:bg-muted"
        title="Download CSV Template"
      >
        <Download className="size-4" /> Template
      </a>
      
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-semibold text-foreground hover:bg-muted disabled:opacity-50"
      >
        {isUploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
        {isUploading ? "Uploading..." : "Bulk upload"}
      </button>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".csv"
        className="hidden"
      />
    </div>
  );
}

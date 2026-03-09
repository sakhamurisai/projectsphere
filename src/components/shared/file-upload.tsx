"use client";

import { useRef, useState } from "react";
import { Upload, X, File, ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE } from "@/types/file";

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  url: string;
}

interface FileUploadProps {
  entityType: "task" | "project";
  entityId: string;
  onUploadComplete?: (file: UploadedFile) => void;
  className?: string;
  accept?: string;
  maxFiles?: number;
}

export function FileUpload({
  entityType,
  entityId,
  onUploadComplete,
  className,
  accept = ALLOWED_FILE_TYPES.join(","),
  maxFiles = 5,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  async function uploadFile(file: File) {
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`File "${file.name}" exceeds the 10MB size limit`);
      return;
    }

    if (!ALLOWED_FILE_TYPES.includes(file.type as never)) {
      toast.error(`File type "${file.type}" is not allowed`);
      return;
    }

    setUploading(true);
    try {
      // Step 1: Get presigned upload URL
      const presignRes = await fetch("/api/uploads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          entityType,
          entityId,
        }),
      });

      if (!presignRes.ok) {
        const err = await presignRes.json();
        throw new Error(err.error?.message || "Failed to get upload URL");
      }

      const { data: presign } = await presignRes.json();

      // Step 2: Upload directly to S3
      const s3Res = await fetch(presign.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!s3Res.ok) {
        throw new Error("Failed to upload file to storage");
      }

      // Step 3: Register the file in DynamoDB
      const confirmRes = await fetch(`/api/uploads/${presign.fileId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: presign.key,
          name: file.name,
          size: file.size,
          mimeType: file.type,
          entityType,
          entityId,
        }),
      });

      if (!confirmRes.ok) {
        throw new Error("Failed to register uploaded file");
      }

      const { data: uploaded } = await confirmRes.json();
      toast.success(`"${file.name}" uploaded successfully`);
      onUploadComplete?.(uploaded);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function handleFiles(files: FileList | null) {
    if (!files) return;
    const fileArray = Array.from(files).slice(0, maxFiles);
    fileArray.forEach(uploadFile);
  }

  return (
    <div className={cn("relative", className)}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={maxFiles > 1}
        className="sr-only"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <div
        role="button"
        tabIndex={0}
        onClick={() => !uploading && inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && !uploading && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center cursor-pointer transition-colors",
          dragOver
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
          uploading && "opacity-50 cursor-not-allowed"
        )}
      >
        {uploading ? (
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        ) : (
          <Upload className="h-8 w-8 text-muted-foreground" />
        )}
        <div>
          <p className="text-sm font-medium">
            {uploading ? "Uploading..." : "Click or drag files here"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Max 10MB per file
          </p>
        </div>
      </div>
    </div>
  );
}

interface AttachmentListProps {
  attachments: UploadedFile[];
  onDelete?: (fileId: string) => void;
  className?: string;
}

export function AttachmentList({ attachments, onDelete, className }: AttachmentListProps) {
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleDelete(fileId: string) {
    setDeleting(fileId);
    try {
      const res = await fetch(`/api/uploads/${fileId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete file");
      toast.success("File deleted");
      onDelete?.(fileId);
    } catch {
      toast.error("Failed to delete file");
    } finally {
      setDeleting(null);
    }
  }

  function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  if (attachments.length === 0) return null;

  return (
    <ul className={cn("space-y-2", className)}>
      {attachments.map((file) => (
        <li
          key={file.id}
          className="flex items-center gap-3 rounded-md border bg-muted/30 px-3 py-2"
        >
          {file.mimeType.startsWith("image/") ? (
            <ImageIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
          ) : (
            <File className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
          <div className="flex-1 min-w-0">
            <a
              href={file.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium truncate hover:underline"
            >
              {file.name}
            </a>
            <p className="text-xs text-muted-foreground">{formatSize(file.size)}</p>
          </div>
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={() => handleDelete(file.id)}
              disabled={deleting === file.id}
            >
              {deleting === file.id ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <X className="h-3 w-3" />
              )}
            </Button>
          )}
        </li>
      ))}
    </ul>
  );
}

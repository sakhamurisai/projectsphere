"use client";

import { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { UserAvatar } from "./user-avatar";
import { cn } from "@/lib/utils";
import { ALLOWED_IMAGE_TYPES, MAX_AVATAR_SIZE } from "@/types/file";

interface AvatarUploadProps {
  userId: string;
  name?: string;
  email?: string;
  currentAvatarUrl?: string;
  onUploadComplete?: (avatarUrl: string) => void;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function AvatarUpload({
  userId,
  name,
  email,
  currentAvatarUrl,
  onUploadComplete,
  size = "lg",
  className,
}: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(currentAvatarUrl);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type as never)) {
      toast.error("Please upload a JPEG, PNG, GIF, or WebP image");
      return;
    }

    if (file.size > MAX_AVATAR_SIZE) {
      toast.error("Avatar must be under 2MB");
      return;
    }

    // Show preview immediately
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
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
          entityType: "user",
          entityId: userId,
        }),
      });

      if (!presignRes.ok) {
        const err = await presignRes.json();
        throw new Error(err.error?.message || "Failed to get upload URL");
      }

      const { data: presign } = await presignRes.json();

      // Step 2: Upload to S3
      const s3Res = await fetch(presign.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!s3Res.ok) {
        throw new Error("Failed to upload avatar");
      }

      // Step 3: Build the public URL and update user profile
      const region = process.env.NEXT_PUBLIC_AWS_S3_REGION || "us-east-1";
      const bucket = process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME || "projectsphere-files";
      const avatarUrl = `https://${bucket}.s3.${region}.amazonaws.com/${presign.key}`;

      const updateRes = await fetch("/api/auth/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl }),
      });

      if (!updateRes.ok) {
        throw new Error("Failed to update profile picture");
      }

      toast.success("Profile picture updated");
      onUploadComplete?.(avatarUrl);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
      setPreviewUrl(currentAvatarUrl);
    } finally {
      setUploading(false);
      URL.revokeObjectURL(objectUrl);
    }
  }

  return (
    <div className={cn("relative inline-block", className)}>
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_IMAGE_TYPES.join(",")}
        className="sr-only"
        onChange={handleFileChange}
        disabled={uploading}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="group relative"
        aria-label="Upload profile picture"
      >
        <UserAvatar
          name={name}
          email={email}
          avatarUrl={previewUrl}
          size={size}
        />
        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin text-white" />
          ) : (
            <Camera className="h-4 w-4 text-white" />
          )}
        </div>
      </button>
    </div>
  );
}

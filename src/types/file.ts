export interface FileAttachment {
  id: string;
  key: string;
  name: string;
  size: number;
  mimeType: string;
  url: string;
  uploadedBy: string;
  entityType: "task" | "project" | "user";
  entityId: string;
  createdAt: string;
}

export interface FileAttachmentDBItem extends Record<string, unknown> {
  PK: string;
  SK: string;
  GSI1PK: string;
  GSI1SK: string;
  id: string;
  key: string;
  name: string;
  size: number;
  mimeType: string;
  uploadedBy: string;
  entityType: "task" | "project" | "user";
  entityId: string;
  createdAt: string;
}

export interface PresignedUploadResponse {
  uploadUrl: string;
  fileId: string;
  key: string;
  expiresAt: string;
}

export interface PresignedDownloadResponse {
  downloadUrl: string;
  expiresAt: string;
}

export const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/zip",
] as const;

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
] as const;

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2MB

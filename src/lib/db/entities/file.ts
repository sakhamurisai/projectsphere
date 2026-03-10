import { nanoid } from "nanoid";
import { putItem, queryItems, queryByIndex, deleteItem } from "../operations";
import { TABLES } from "../client";
import { deleteS3Object } from "@/lib/storage/s3";
import type { FileAttachment, FileAttachmentDBItem } from "@/types/file";

const T = TABLES.FILES;

function createEntityPK(entityType: string, entityId: string): string {
  return `${entityType.toUpperCase()}#${entityId}`;
}

function createFileSK(fileId: string): string {
  return `FILE#${fileId}`;
}

function createFileGSI1PK(fileId: string): string {
  return `FILE#${fileId}`;
}

function dbItemToFile(item: FileAttachmentDBItem): FileAttachment {
  const region = process.env.NEXT_PUBLIC_AWS_S3_REGION || "us-east-2";
  const bucket = process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME || "projectsphere-files";

  return {
    id: item.id,
    key: item.key,
    name: item.name,
    size: item.size,
    mimeType: item.mimeType,
    url: `https://${bucket}.s3.${region}.amazonaws.com/${item.key}`,
    uploadedBy: item.uploadedBy,
    entityType: item.entityType,
    entityId: item.entityId,
    createdAt: item.createdAt,
  };
}

export async function createFileRecord(input: {
  key: string;
  name: string;
  size: number;
  mimeType: string;
  uploadedBy: string;
  entityType: "task" | "project" | "user";
  entityId: string;
}): Promise<FileAttachment> {
  const id = nanoid();
  const now = new Date().toISOString();

  const item: FileAttachmentDBItem = {
    PK: createEntityPK(input.entityType, input.entityId),
    SK: createFileSK(id),
    GSI1PK: createFileGSI1PK(id),
    GSI1SK: "METADATA",
    id,
    key: input.key,
    name: input.name,
    size: input.size,
    mimeType: input.mimeType,
    uploadedBy: input.uploadedBy,
    entityType: input.entityType,
    entityId: input.entityId,
    createdAt: now,
  };

  await putItem(T, item);
  return dbItemToFile(item);
}

export async function getFileById(fileId: string): Promise<FileAttachment | null> {
  const { items } = await queryByIndex<FileAttachmentDBItem>(
    T,
    "GSI1",
    "GSI1PK",
    createFileGSI1PK(fileId),
    "GSI1SK",
    "METADATA"
  );

  if (items.length === 0) return null;
  return dbItemToFile(items[0]);
}

export async function getEntityFiles(
  entityType: "task" | "project" | "user",
  entityId: string
): Promise<FileAttachment[]> {
  const { items } = await queryItems<FileAttachmentDBItem>(
    T,
    createEntityPK(entityType, entityId),
    "FILE#"
  );

  return items.map(dbItemToFile);
}

export async function deleteFileRecord(
  fileId: string,
  deleteFromS3: boolean = true
): Promise<void> {
  const file = await getFileById(fileId);
  if (!file) return;

  await deleteItem(
    T,
    createEntityPK(file.entityType, file.entityId),
    createFileSK(fileId)
  );

  if (deleteFromS3) {
    await deleteS3Object(file.key);
  }
}

import { nanoid } from "nanoid";
import { GetCommand, PutCommand, DeleteCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { dynamodb, TABLES } from "../client";
import { deleteS3Object } from "@/lib/storage/s3";
import type { FileAttachment } from "@/types/file";

// projectsphere-files | Key: { fileId }
// GSI: entityId-index (entityId HASH, createdAt RANGE)
const T = TABLES.FILES;

function toFile(i: Record<string, unknown>): FileAttachment {
  const region = process.env.NEXT_PUBLIC_AWS_S3_REGION || "us-east-2";
  const bucket = process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME || "projectsphere-files";
  return {
    id: i.fileId as string,
    key: i.key as string,
    name: i.name as string,
    size: i.size as number,
    mimeType: i.mimeType as string,
    url: `https://${bucket}.s3.${region}.amazonaws.com/${i.key as string}`,
    uploadedBy: i.uploadedBy as string,
    entityType: i.entityType as FileAttachment["entityType"],
    entityId: i.entityId as string,
    createdAt: i.createdAt as string,
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
  const fileId = nanoid();
  const now = new Date().toISOString();
  const item = { fileId, key: input.key, name: input.name, size: input.size, mimeType: input.mimeType, uploadedBy: input.uploadedBy, entityType: input.entityType, entityId: input.entityId, createdAt: now };
  await dynamodb.send(new PutCommand({ TableName: T, Item: item }));
  return toFile(item);
}

export async function getFileById(fileId: string): Promise<FileAttachment | null> {
  const res = await dynamodb.send(new GetCommand({ TableName: T, Key: { fileId } }));
  return res.Item ? toFile(res.Item) : null;
}

export async function getEntityFiles(entityType: "task" | "project" | "user", entityId: string): Promise<FileAttachment[]> {
  const { Items = [] } = await dynamodb.send(new QueryCommand({
    TableName: T,
    IndexName: "entityId-index",
    KeyConditionExpression: "entityId = :e",
    ExpressionAttributeValues: { ":e": entityId },
  }));
  return Items.map(toFile);
}

export async function deleteFileRecord(fileId: string, deleteFromS3: boolean = true): Promise<void> {
  const file = await getFileById(fileId);
  if (!file) return;
  await dynamodb.send(new DeleteCommand({ TableName: T, Key: { fileId } }));
  if (deleteFromS3) await deleteS3Object(file.key);
}

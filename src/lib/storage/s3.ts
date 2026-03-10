import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  region: process.env.NEXT_PUBLIC_AWS_S3_REGION || "us-east-2",
  credentials: {
    accessKeyId: process.env.NEXT_AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.NEXT_AWS_SECRET_ACCESS_KEY || "",
  },
});

export const S3_BUCKET = process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME || "projectsphere-files";

export function buildS3Key(
  entityType: "avatars" | "tasks" | "projects",
  entityId: string,
  fileId: string,
  fileName: string
): string {
  const ext = fileName.includes(".") ? fileName.split(".").pop() : "";
  return ext
    ? `${entityType}/${entityId}/${fileId}.${ext}`
    : `${entityType}/${entityId}/${fileId}`;
}

export async function generatePresignedUploadUrl(
  key: string,
  mimeType: string,
  expiresIn: number = 300
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    ContentType: mimeType,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}

export async function generatePresignedDownloadUrl(
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}

export async function deleteS3Object(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
  });

  await s3Client.send(command);
}

export async function objectExists(key: string): Promise<boolean> {
  try {
    const command = new HeadObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
    });
    await s3Client.send(command);
    return true;
  } catch {
    return false;
  }
}

export function getPublicUrl(key: string): string {
  const region = process.env.NEXT_PUBLIC_AWS_S3_REGION || "us-east-2";
  return `https://${S3_BUCKET}.s3.${region}.amazonaws.com/${key}`;
}

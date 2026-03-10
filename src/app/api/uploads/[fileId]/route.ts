import { NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserById } from "@/lib/db/entities/user";
import { getFileById, createFileRecord, deleteFileRecord } from "@/lib/db/entities/file";
import { generatePresignedDownloadUrl } from "@/lib/storage/s3";
import { successResponse, noContentResponse, errorResponse } from "@/lib/api/response";
import { UnauthorizedError, NotFoundError, ForbiddenError } from "@/lib/api/errors";

interface RouteParams {
  params: Promise<{ fileId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { fileId } = await params;

    const authUser = await getCurrentUser();
    if (!authUser) {
      throw new UnauthorizedError();
    }

    const file = await getFileById(fileId);
    if (!file) {
      throw new NotFoundError("File not found");
    }

    // Generate a fresh presigned download URL (1 hour expiry)
    const downloadUrl = await generatePresignedDownloadUrl(file.key, 3600);
    const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString();

    return successResponse({ ...file, downloadUrl, expiresAt });
  } catch (error) {
    return errorResponse(error);
  }
}

const confirmUploadSchema = z.object({
  key: z.string().min(1),
  name: z.string().min(1).max(255),
  size: z.number().positive(),
  mimeType: z.string().min(1),
  entityType: z.enum(["task", "project", "user"]),
  entityId: z.string().min(1),
});

// Called after the client finishes uploading to S3 to register the file in DynamoDB
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { fileId } = await params;

    const authUser = await getCurrentUser();
    if (!authUser) {
      throw new UnauthorizedError();
    }

    const user = await getUserById(authUser.id);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    const body = await request.json();
    const { key, name, size, mimeType, entityType, entityId } =
      confirmUploadSchema.parse(body);

    const file = await createFileRecord({
      key,
      name,
      size,
      mimeType,
      uploadedBy: user.id,
      entityType,
      entityId,
    });

    return successResponse(file);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { fileId } = await params;

    const authUser = await getCurrentUser();
    if (!authUser) {
      throw new UnauthorizedError();
    }

    const user = await getUserById(authUser.id);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    const file = await getFileById(fileId);
    if (!file) {
      throw new NotFoundError("File not found");
    }

    // Only the uploader can delete their file
    if (file.uploadedBy !== user.id) {
      throw new ForbiddenError("You don't have permission to delete this file");
    }

    await deleteFileRecord(fileId);

    return noContentResponse();
  } catch (error) {
    return errorResponse(error);
  }
}

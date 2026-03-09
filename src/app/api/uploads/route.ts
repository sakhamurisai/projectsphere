import { NextRequest } from "next/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserByEmail } from "@/lib/db/entities/user";
import { generatePresignedUploadUrl, buildS3Key } from "@/lib/storage/s3";
import { successResponse, errorResponse } from "@/lib/api/response";
import { UnauthorizedError, BadRequestError, NotFoundError } from "@/lib/api/errors";
import { ALLOWED_FILE_TYPES, ALLOWED_IMAGE_TYPES, MAX_FILE_SIZE, MAX_AVATAR_SIZE } from "@/types/file";

const requestUploadSchema = z.object({
  fileName: z.string().min(1).max(255),
  fileSize: z.number().positive(),
  mimeType: z.string().min(1),
  entityType: z.enum(["task", "project", "user"]),
  entityId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const authUser = await getCurrentUser();
    if (!authUser) {
      throw new UnauthorizedError();
    }

    const user = await getUserByEmail(authUser.email);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    const body = await request.json();
    const { fileName, fileSize, mimeType, entityType, entityId } =
      requestUploadSchema.parse(body);

    // Validate file type
    const isAvatar = entityType === "user";
    const allowedTypes = isAvatar ? ALLOWED_IMAGE_TYPES : ALLOWED_FILE_TYPES;
    if (!allowedTypes.includes(mimeType as never)) {
      throw new BadRequestError(
        `File type ${mimeType} is not allowed. Allowed types: ${allowedTypes.join(", ")}`
      );
    }

    // Validate file size
    const maxSize = isAvatar ? MAX_AVATAR_SIZE : MAX_FILE_SIZE;
    if (fileSize > maxSize) {
      const maxMB = maxSize / (1024 * 1024);
      throw new BadRequestError(`File size exceeds the ${maxMB}MB limit`);
    }

    const fileId = nanoid();
    const s3Folder = isAvatar ? "avatars" : entityType === "task" ? "tasks" : "projects";
    const key = buildS3Key(s3Folder as "avatars" | "tasks" | "projects", entityId, fileId, fileName);

    const uploadUrl = await generatePresignedUploadUrl(key, mimeType, 300);

    const expiresAt = new Date(Date.now() + 300 * 1000).toISOString();

    return successResponse({
      uploadUrl,
      fileId,
      key,
      expiresAt,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

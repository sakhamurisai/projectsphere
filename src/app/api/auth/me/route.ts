import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserById, updateUser } from "@/lib/db/entities/user";
import { successResponse, errorResponse } from "@/lib/api/response";
import { UnauthorizedError, NotFoundError } from "@/lib/api/errors";
import { z } from "zod";

export async function GET(request: NextRequest) {
  try {
    const authUser = await getCurrentUser();

    if (!authUser) {
      throw new UnauthorizedError();
    }

    const user = await getUserById(authUser.id);

    if (!user) {
      throw new NotFoundError("User not found");
    }

    return successResponse({
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  avatarUrl: z.string().url().optional(),
});

export async function PUT(request: NextRequest) {
  try {
    const authUser = await getCurrentUser();

    if (!authUser) {
      throw new UnauthorizedError();
    }

    const user = await getUserById(authUser.id);

    if (!user) {
      throw new NotFoundError("User not found");
    }

    const body = await request.json();
    const validatedData = updateUserSchema.parse(body);

    const updatedUser = await updateUser(user.id, validatedData);

    if (!updatedUser) {
      throw new NotFoundError("User not found");
    }

    return successResponse({
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      avatarUrl: updatedUser.avatarUrl,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

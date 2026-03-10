import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserById } from "@/lib/db/entities/user";
import { createWorkspace, getUserWorkspaces } from "@/lib/db/entities/workspace";
import { createWorkspaceSchema } from "@/validations/workspace";
import { successResponse, createdResponse, errorResponse } from "@/lib/api/response";
import { UnauthorizedError, NotFoundError } from "@/lib/api/errors";

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

    const workspaces = await getUserWorkspaces(user.id);

    return successResponse(workspaces);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
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
    const validatedData = createWorkspaceSchema.parse(body);

    const workspace = await createWorkspace(validatedData, user.id);

    return createdResponse(workspace);
  } catch (error) {
    return errorResponse(error);
  }
}

import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserById } from "@/lib/db/entities/user";
import { createWorkspace, getUserWorkspaces } from "@/lib/db/entities/workspace";
import { createWorkspaceSchema } from "@/validations/workspace";
import { successResponse, createdResponse, errorResponse } from "@/lib/api/response";
import { UnauthorizedError, NotFoundError } from "@/lib/api/errors";
import { getOrCreateUser } from "@/lib/db/entities/user";

async function resolveUser() {
  const authUser = await getCurrentUser();
  if (!authUser) throw new UnauthorizedError();

  let user = await getUserById(authUser.id);

  // Auto-create the DB record if it's missing (e.g. first request after login)
  if (!user) {
    if (!authUser.email) throw new NotFoundError("User not found and email missing from token");
    user = await getOrCreateUser(authUser.email, authUser.name, authUser.id);
  }

  return user;
}

export async function GET(request: NextRequest) {
  try {
    const user = await resolveUser();
    const workspaces = await getUserWorkspaces(user.id);
    return successResponse(workspaces);
  } catch (error) {
    console.error("[GET /api/workspaces]", error);
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await resolveUser();
    const body = await request.json();
    const validatedData = createWorkspaceSchema.parse(body);
    const workspace = await createWorkspace(validatedData, user.id);
    return createdResponse(workspace);
  } catch (error) {
    console.error("[POST /api/workspaces]", error);
    return errorResponse(error);
  }
}

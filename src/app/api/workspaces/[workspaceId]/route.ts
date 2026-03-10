import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserById } from "@/lib/db/entities/user";
import {
  getWorkspaceById,
  updateWorkspace,
  deleteWorkspace,
  getUserWorkspaceRole,
} from "@/lib/db/entities/workspace";
import { updateWorkspaceSchema } from "@/validations/workspace";
import { successResponse, noContentResponse, errorResponse } from "@/lib/api/response";
import { UnauthorizedError, NotFoundError, ForbiddenError } from "@/lib/api/errors";
import { canManageWorkspaceSettings, canDeleteWorkspace } from "@/constants/roles";

interface RouteParams {
  params: Promise<{ workspaceId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId } = await params;

    const authUser = await getCurrentUser();
    if (!authUser) {
      throw new UnauthorizedError();
    }

    const user = await getUserById(authUser.id);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    const workspace = await getWorkspaceById(workspaceId);
    if (!workspace) {
      throw new NotFoundError("Workspace not found");
    }

    const role = await getUserWorkspaceRole(workspaceId, user.id);
    if (!role) {
      throw new ForbiddenError("You are not a member of this workspace");
    }

    return successResponse({ ...workspace, role });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId } = await params;

    const authUser = await getCurrentUser();
    if (!authUser) {
      throw new UnauthorizedError();
    }

    const user = await getUserById(authUser.id);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    const role = await getUserWorkspaceRole(workspaceId, user.id);
    if (!role || !canManageWorkspaceSettings(role)) {
      throw new ForbiddenError("You don't have permission to update this workspace");
    }

    const body = await request.json();
    const validatedData = updateWorkspaceSchema.parse(body);

    const workspace = await updateWorkspace(workspaceId, validatedData);
    if (!workspace) {
      throw new NotFoundError("Workspace not found");
    }

    return successResponse(workspace);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId } = await params;

    const authUser = await getCurrentUser();
    if (!authUser) {
      throw new UnauthorizedError();
    }

    const user = await getUserById(authUser.id);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    const role = await getUserWorkspaceRole(workspaceId, user.id);
    if (!role || !canDeleteWorkspace(role)) {
      throw new ForbiddenError("Only the workspace owner can delete this workspace");
    }

    await deleteWorkspace(workspaceId);

    return noContentResponse();
  } catch (error) {
    return errorResponse(error);
  }
}

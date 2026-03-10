import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserById } from "@/lib/db/entities/user";
import {
  updateWorkspaceMemberRole,
  removeWorkspaceMember,
  getUserWorkspaceRole,
  getWorkspaceMember,
  getWorkspaceById,
} from "@/lib/db/entities/workspace";
import { updateMemberRoleSchema } from "@/validations/workspace";
import { successResponse, noContentResponse, errorResponse } from "@/lib/api/response";
import { UnauthorizedError, NotFoundError, ForbiddenError, BadRequestError } from "@/lib/api/errors";
import { canManageWorkspaceMembers } from "@/constants/roles";

interface RouteParams {
  params: Promise<{ workspaceId: string; memberId: string }>;
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId, memberId } = await params;

    const authUser = await getCurrentUser();
    if (!authUser) {
      throw new UnauthorizedError();
    }

    const currentUser = await getUserById(authUser.id);
    if (!currentUser) {
      throw new NotFoundError("User not found");
    }

    const role = await getUserWorkspaceRole(workspaceId, currentUser.id);
    if (!role || !canManageWorkspaceMembers(role)) {
      throw new ForbiddenError("You don't have permission to update member roles");
    }

    // Check if trying to update owner's role
    const workspace = await getWorkspaceById(workspaceId);
    if (workspace && workspace.ownerId === memberId) {
      throw new BadRequestError("Cannot change the owner's role");
    }

    const body = await request.json();
    const validatedData = updateMemberRoleSchema.parse(body);

    const member = await updateWorkspaceMemberRole(workspaceId, memberId, validatedData.role);
    if (!member) {
      throw new NotFoundError("Member not found");
    }

    return successResponse(member);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId, memberId } = await params;

    const authUser = await getCurrentUser();
    if (!authUser) {
      throw new UnauthorizedError();
    }

    const currentUser = await getUserById(authUser.id);
    if (!currentUser) {
      throw new NotFoundError("User not found");
    }

    const role = await getUserWorkspaceRole(workspaceId, currentUser.id);

    // Users can remove themselves, or admins/owners can remove others
    const isSelfRemoval = currentUser.id === memberId;
    const canRemoveOthers = role && canManageWorkspaceMembers(role);

    if (!isSelfRemoval && !canRemoveOthers) {
      throw new ForbiddenError("You don't have permission to remove this member");
    }

    // Check if trying to remove owner
    const workspace = await getWorkspaceById(workspaceId);
    if (workspace && workspace.ownerId === memberId) {
      throw new BadRequestError("Cannot remove the workspace owner");
    }

    // Check if member exists
    const member = await getWorkspaceMember(workspaceId, memberId);
    if (!member) {
      throw new NotFoundError("Member not found");
    }

    await removeWorkspaceMember(workspaceId, memberId);

    return noContentResponse();
  } catch (error) {
    return errorResponse(error);
  }
}

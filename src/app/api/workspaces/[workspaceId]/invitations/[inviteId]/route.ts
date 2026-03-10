import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserByEmail } from "@/lib/db/entities/user";
import { getUserWorkspaceRole } from "@/lib/db/entities/workspace";
import { revokeInvitation } from "@/lib/db/entities/invitation";
import { successResponse, noContentResponse, errorResponse } from "@/lib/api/response";
import { UnauthorizedError, ForbiddenError, NotFoundError } from "@/lib/api/errors";

interface RouteParams {
  params: Promise<{ workspaceId: string; inviteId: string }>;
}

// DELETE /api/workspaces/[workspaceId]/invitations/[inviteId]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId, inviteId } = await params;

    const authUser = await getCurrentUser();
    if (!authUser) throw new UnauthorizedError();

    const user = await getUserByEmail(authUser.email);
    if (!user) throw new NotFoundError("User not found");

    const role = await getUserWorkspaceRole(workspaceId, user.id);
    if (!role) throw new ForbiddenError("Access denied");
    if (role === "viewer" || role === "member") throw new ForbiddenError("Insufficient permissions");

    await revokeInvitation(workspaceId, inviteId);
    return noContentResponse();
  } catch (error) {
    return errorResponse(error);
  }
}

import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserById } from "@/lib/db/entities/user";
import { addWorkspaceMember, getUserWorkspaceRole } from "@/lib/db/entities/workspace";
import { getInvitationByToken, acceptInvitation } from "@/lib/db/entities/invitation";
import { successResponse, errorResponse } from "@/lib/api/response";
import { NotFoundError, UnauthorizedError, ForbiddenError } from "@/lib/api/errors";

interface RouteParams {
  params: Promise<{ token: string }>;
}

// GET /api/invitations/[token] — fetch invite details (public, used to show info before accepting)
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { token } = await params;

    const invitation = await getInvitationByToken(token);
    if (!invitation) throw new NotFoundError("Invitation not found or expired");

    if (invitation.status !== "pending") {
      throw new ForbiddenError(`This invitation has already been ${invitation.status}`);
    }

    if (new Date(invitation.expiresAt) < new Date()) {
      throw new ForbiddenError("This invitation has expired");
    }

    // Return safe subset (omit internal IDs)
    return successResponse({
      workspaceName: invitation.workspaceName,
      email: invitation.email,
      role: invitation.role,
      invitedByName: invitation.invitedByName,
      expiresAt: invitation.expiresAt,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

// POST /api/invitations/[token] — accept invitation
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { token } = await params;

    const authUser = await getCurrentUser();
    if (!authUser) throw new UnauthorizedError();

    const user = await getUserById(authUser.id);
    if (!user) throw new NotFoundError("User not found");

    const invitation = await getInvitationByToken(token);
    if (!invitation) throw new NotFoundError("Invitation not found");

    if (invitation.status !== "pending") {
      throw new ForbiddenError(`This invitation has already been ${invitation.status}`);
    }

    if (new Date(invitation.expiresAt) < new Date()) {
      throw new ForbiddenError("This invitation has expired");
    }

    // Verify email matches
    if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      throw new ForbiddenError(
        `This invitation was sent to ${invitation.email}. Please sign in with that email.`
      );
    }

    // Check if already a member
    const existingRole = await getUserWorkspaceRole(invitation.workspaceId, user.id);
    if (existingRole) {
      throw new ForbiddenError("You are already a member of this workspace");
    }

    // Add to workspace
    await addWorkspaceMember(invitation.workspaceId, user.id, invitation.role);

    // Mark invite as accepted
    await acceptInvitation(invitation);

    return successResponse({
      workspaceId: invitation.workspaceId,
      workspaceName: invitation.workspaceName,
      role: invitation.role,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

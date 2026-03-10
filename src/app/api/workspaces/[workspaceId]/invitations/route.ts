import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserByEmail } from "@/lib/db/entities/user";
import { getUserWorkspaceRole, getWorkspaceById, addWorkspaceMember } from "@/lib/db/entities/workspace";
import {
  createInvitation,
  getWorkspaceInvitations,
  revokeInvitation,
} from "@/lib/db/entities/invitation";
import { sendInvitationEmail } from "@/lib/email/ses";
import { successResponse, errorResponse, createdResponse } from "@/lib/api/response";
import { UnauthorizedError, ForbiddenError, NotFoundError } from "@/lib/api/errors";
import { z } from "zod";

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "member", "viewer"]),
});

interface RouteParams {
  params: Promise<{ workspaceId: string }>;
}

// GET /api/workspaces/[workspaceId]/invitations
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId } = await params;

    const authUser = await getCurrentUser();
    if (!authUser) throw new UnauthorizedError();

    const user = await getUserByEmail(authUser.email);
    if (!user) throw new NotFoundError("User not found");

    const role = await getUserWorkspaceRole(workspaceId, user.id);
    if (!role) throw new ForbiddenError("Access denied");
    if (role === "viewer" || role === "member") throw new ForbiddenError("Insufficient permissions");

    const invitations = await getWorkspaceInvitations(workspaceId);
    return successResponse(invitations);
  } catch (error) {
    return errorResponse(error);
  }
}

// POST /api/workspaces/[workspaceId]/invitations
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId } = await params;

    const authUser = await getCurrentUser();
    if (!authUser) throw new UnauthorizedError();

    const user = await getUserByEmail(authUser.email);
    if (!user) throw new NotFoundError("User not found");

    const workspaceRole = await getUserWorkspaceRole(workspaceId, user.id);
    if (!workspaceRole) throw new ForbiddenError("Access denied");
    if (workspaceRole === "viewer" || workspaceRole === "member") {
      throw new ForbiddenError("Only admins and owners can invite members");
    }

    const workspace = await getWorkspaceById(workspaceId);
    if (!workspace) throw new NotFoundError("Workspace not found");

    const body = await request.json();
    const { email, role } = inviteSchema.parse(body);

    // Check if user already exists and is a member
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      const existingRole = await getUserWorkspaceRole(workspaceId, existingUser.id);
      if (existingRole) {
        return errorResponse(
          Object.assign(new Error("User is already a member of this workspace"), { statusCode: 409 })
        );
      }
    }

    const invitation = await createInvitation({
      workspaceId,
      workspaceName: workspace.name,
      email,
      role,
      invitedById: user.id,
      invitedByName: user.name,
    });

    // Send email (best-effort — don't fail if SES isn't configured)
    try {
      await sendInvitationEmail({
        to: email,
        invitedByName: user.name,
        workspaceName: workspace.name,
        role,
        token: invitation.token,
      });
    } catch (emailErr) {
      console.warn("Failed to send invitation email:", emailErr);
    }

    return createdResponse(invitation);
  } catch (error) {
    return errorResponse(error);
  }
}

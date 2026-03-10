import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserById, getUserByEmail } from "@/lib/db/entities/user";
import {
  getWorkspaceMembers,
  addWorkspaceMember,
  getUserWorkspaceRole,
  isWorkspaceMember,
} from "@/lib/db/entities/workspace";
import { addMemberSchema } from "@/validations/workspace";
import { successResponse, createdResponse, errorResponse } from "@/lib/api/response";
import { UnauthorizedError, NotFoundError, ForbiddenError, ConflictError } from "@/lib/api/errors";
import { canManageWorkspaceMembers } from "@/constants/roles";

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

    const role = await getUserWorkspaceRole(workspaceId, user.id);
    if (!role) {
      throw new ForbiddenError("You are not a member of this workspace");
    }

    const members = await getWorkspaceMembers(workspaceId);

    return successResponse(members);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId } = await params;

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
      throw new ForbiddenError("You don't have permission to add members");
    }

    const body = await request.json();
    const validatedData = addMemberSchema.parse(body);

    // Find user by email
    const newUser = await getUserByEmail(validatedData.email);
    if (!newUser) {
      throw new NotFoundError("User with this email not found. They must register first.");
    }

    // Check if already a member
    const isMember = await isWorkspaceMember(workspaceId, newUser.id);
    if (isMember) {
      throw new ConflictError("User is already a member of this workspace");
    }

    const member = await addWorkspaceMember(workspaceId, newUser.id, validatedData.role);

    return createdResponse({
      ...member,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        avatarUrl: newUser.avatarUrl,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}

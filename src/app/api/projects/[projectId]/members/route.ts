import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserById } from "@/lib/db/entities/user";
import { getUserWorkspaceRole, isWorkspaceMember } from "@/lib/db/entities/workspace";
import {
  getProjectById,
  getProjectMembers,
  addProjectMember,
  getUserProjectRole,
  isProjectMember,
} from "@/lib/db/entities/project";
import { addProjectMemberSchema } from "@/validations/project";
import { successResponse, createdResponse, errorResponse } from "@/lib/api/response";
import { UnauthorizedError, NotFoundError, ForbiddenError, ConflictError, BadRequestError } from "@/lib/api/errors";
import { canManageProjectMembers } from "@/constants/roles";

interface RouteParams {
  params: Promise<{ projectId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { projectId } = await params;

    const authUser = await getCurrentUser();
    if (!authUser) {
      throw new UnauthorizedError();
    }

    const user = await getUserById(authUser.id);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    const project = await getProjectById(projectId);
    if (!project) {
      throw new NotFoundError("Project not found");
    }

    // Check workspace membership
    const workspaceRole = await getUserWorkspaceRole(project.workspaceId, user.id);
    if (!workspaceRole) {
      throw new ForbiddenError("You don't have access to this project");
    }

    const members = await getProjectMembers(projectId);

    return successResponse(members);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { projectId } = await params;

    const authUser = await getCurrentUser();
    if (!authUser) {
      throw new UnauthorizedError();
    }

    const currentUser = await getUserById(authUser.id);
    if (!currentUser) {
      throw new NotFoundError("User not found");
    }

    const project = await getProjectById(projectId);
    if (!project) {
      throw new NotFoundError("Project not found");
    }

    // Check project or workspace permissions
    const projectRole = await getUserProjectRole(projectId, currentUser.id);
    const workspaceRole = await getUserWorkspaceRole(project.workspaceId, currentUser.id);

    const hasPermission =
      (projectRole && canManageProjectMembers(projectRole)) ||
      (workspaceRole && (workspaceRole === "owner" || workspaceRole === "admin"));

    if (!hasPermission) {
      throw new ForbiddenError("You don't have permission to add members");
    }

    const body = await request.json();
    const validatedData = addProjectMemberSchema.parse(body);

    // Check if user exists
    const newUser = await getUserById(validatedData.userId);
    if (!newUser) {
      throw new NotFoundError("User not found");
    }

    // Check if user is a workspace member
    const isWsMember = await isWorkspaceMember(project.workspaceId, validatedData.userId);
    if (!isWsMember) {
      throw new BadRequestError("User must be a workspace member first");
    }

    // Check if already a project member
    const isProjMember = await isProjectMember(projectId, validatedData.userId);
    if (isProjMember) {
      throw new ConflictError("User is already a member of this project");
    }

    const member = await addProjectMember(projectId, validatedData.userId, validatedData.role);

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

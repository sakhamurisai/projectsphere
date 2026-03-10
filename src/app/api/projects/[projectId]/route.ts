import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserById } from "@/lib/db/entities/user";
import { getUserWorkspaceRole } from "@/lib/db/entities/workspace";
import {
  getProjectById,
  updateProject,
  deleteProject,
  getUserProjectRole,
} from "@/lib/db/entities/project";
import { updateProjectSchema } from "@/validations/project";
import { successResponse, noContentResponse, errorResponse } from "@/lib/api/response";
import { UnauthorizedError, NotFoundError, ForbiddenError } from "@/lib/api/errors";
import { canManageProjectSettings, canDeleteProject } from "@/constants/roles";

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

    return successResponse(project);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
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

    // Check project or workspace permissions
    const projectRole = await getUserProjectRole(projectId, user.id);
    const workspaceRole = await getUserWorkspaceRole(project.workspaceId, user.id);

    const hasPermission =
      (projectRole && canManageProjectSettings(projectRole)) ||
      (workspaceRole && (workspaceRole === "owner" || workspaceRole === "admin"));

    if (!hasPermission) {
      throw new ForbiddenError("You don't have permission to update this project");
    }

    const body = await request.json();
    const validatedData = updateProjectSchema.parse(body);

    const updatedProject = await updateProject(projectId, validatedData);
    if (!updatedProject) {
      throw new NotFoundError("Project not found");
    }

    return successResponse(updatedProject);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    // Check project or workspace permissions
    const projectRole = await getUserProjectRole(projectId, user.id);
    const workspaceRole = await getUserWorkspaceRole(project.workspaceId, user.id);

    const hasPermission =
      (projectRole && canDeleteProject(projectRole)) ||
      workspaceRole === "owner";

    if (!hasPermission) {
      throw new ForbiddenError("You don't have permission to delete this project");
    }

    await deleteProject(projectId);

    return noContentResponse();
  } catch (error) {
    return errorResponse(error);
  }
}

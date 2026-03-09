import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserByEmail } from "@/lib/db/entities/user";
import { getUserWorkspaceRole } from "@/lib/db/entities/workspace";
import { getProjectById } from "@/lib/db/entities/project";
import { getEntityFiles } from "@/lib/db/entities/file";
import { successResponse, errorResponse } from "@/lib/api/response";
import { UnauthorizedError, NotFoundError, ForbiddenError } from "@/lib/api/errors";

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

    const user = await getUserByEmail(authUser.email);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    const project = await getProjectById(projectId);
    if (!project) {
      throw new NotFoundError("Project not found");
    }

    const workspaceRole = await getUserWorkspaceRole(project.workspaceId, user.id);
    if (!workspaceRole) {
      throw new ForbiddenError("You don't have access to this project");
    }

    const attachments = await getEntityFiles("project", projectId);

    return successResponse(attachments);
  } catch (error) {
    return errorResponse(error);
  }
}

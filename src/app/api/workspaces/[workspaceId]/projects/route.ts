import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserById } from "@/lib/db/entities/user";
import { getUserWorkspaceRole } from "@/lib/db/entities/workspace";
import { createProject, getWorkspaceProjects } from "@/lib/db/entities/project";
import { createProjectSchema } from "@/validations/project";
import { successResponse, createdResponse, errorResponse } from "@/lib/api/response";
import { UnauthorizedError, NotFoundError, ForbiddenError } from "@/lib/api/errors";

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

    const projects = await getWorkspaceProjects(workspaceId);

    return successResponse(projects);
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

    const user = await getUserById(authUser.id);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    const role = await getUserWorkspaceRole(workspaceId, user.id);
    if (!role) {
      throw new ForbiddenError("You are not a member of this workspace");
    }

    // Only owners, admins, and members can create projects
    if (role === "viewer") {
      throw new ForbiddenError("Viewers cannot create projects");
    }

    const body = await request.json();
    const validatedData = createProjectSchema.parse(body);

    const project = await createProject(workspaceId, validatedData, user.id);

    return createdResponse(project);
  } catch (error) {
    return errorResponse(error);
  }
}

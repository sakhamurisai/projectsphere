import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserById } from "@/lib/db/entities/user";
import { getUserWorkspaceRole } from "@/lib/db/entities/workspace";
import { getProjectById } from "@/lib/db/entities/project";
import { createTask, getProjectTasks } from "@/lib/db/entities/task";
import { createTaskSchema } from "@/validations/task";
import { successResponse, createdResponse, errorResponse } from "@/lib/api/response";
import { UnauthorizedError, NotFoundError, ForbiddenError } from "@/lib/api/errors";
import type { TaskStatus, TaskPriority, TaskFilters } from "@/types/task";

interface RouteParams {
  params: Promise<{ projectId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { projectId } = await params;
    const { searchParams } = new URL(request.url);

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

    // Parse filters
    const filters: TaskFilters = {};

    const statusParam = searchParams.get("status");
    if (statusParam) {
      filters.status = statusParam.split(",") as TaskStatus[];
    }

    const priorityParam = searchParams.get("priority");
    if (priorityParam) {
      filters.priority = priorityParam.split(",") as TaskPriority[];
    }

    const assigneeId = searchParams.get("assigneeId");
    if (assigneeId) {
      filters.assigneeId = assigneeId;
    }

    const search = searchParams.get("search");
    if (search) {
      filters.search = search;
    }

    const tasks = await getProjectTasks(projectId, filters);

    return successResponse(tasks);
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

    // Viewers cannot create tasks
    if (workspaceRole === "viewer") {
      throw new ForbiddenError("Viewers cannot create tasks");
    }

    const body = await request.json();
    const validatedData = createTaskSchema.parse(body);

    const task = await createTask(projectId, validatedData, user.id);

    return createdResponse(task);
  } catch (error) {
    return errorResponse(error);
  }
}

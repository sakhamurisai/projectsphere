import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserById } from "@/lib/db/entities/user";
import { getUserWorkspaceRole } from "@/lib/db/entities/workspace";
import { getTaskById, getSubtasks, createTask } from "@/lib/db/entities/task";
import { createSubtaskSchema } from "@/validations/task";
import { successResponse, createdResponse, errorResponse } from "@/lib/api/response";
import { UnauthorizedError, NotFoundError, ForbiddenError } from "@/lib/api/errors";

interface RouteParams {
  params: Promise<{ taskId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { taskId } = await params;

    const authUser = await getCurrentUser();
    if (!authUser) {
      throw new UnauthorizedError();
    }

    const user = await getUserById(authUser.id);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    const task = await getTaskById(taskId);
    if (!task) {
      throw new NotFoundError("Task not found");
    }

    // Check workspace membership
    const workspaceRole = await getUserWorkspaceRole(task.workspaceId, user.id);
    if (!workspaceRole) {
      throw new ForbiddenError("You don't have access to this task");
    }

    const subtasks = await getSubtasks(taskId);

    return successResponse(subtasks);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { taskId } = await params;

    const authUser = await getCurrentUser();
    if (!authUser) {
      throw new UnauthorizedError();
    }

    const user = await getUserById(authUser.id);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    const parentTask = await getTaskById(taskId);
    if (!parentTask) {
      throw new NotFoundError("Parent task not found");
    }

    // Check workspace membership
    const workspaceRole = await getUserWorkspaceRole(parentTask.workspaceId, user.id);
    if (!workspaceRole) {
      throw new ForbiddenError("You don't have access to this task");
    }

    // Viewers cannot create subtasks
    if (workspaceRole === "viewer") {
      throw new ForbiddenError("Viewers cannot create subtasks");
    }

    const body = await request.json();
    const validatedData = createSubtaskSchema.parse(body);

    const subtask = await createTask(
      parentTask.projectId,
      {
        title: validatedData.title,
        parentTaskId: taskId,
        status: "todo",
        priority: parentTask.priority,
      },
      user.id
    );

    return createdResponse(subtask);
  } catch (error) {
    return errorResponse(error);
  }
}

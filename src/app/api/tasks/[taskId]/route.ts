import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserById } from "@/lib/db/entities/user";
import { getUserWorkspaceRole } from "@/lib/db/entities/workspace";
import { getProjectById } from "@/lib/db/entities/project";
import { getTaskById, updateTask, deleteTask } from "@/lib/db/entities/task";
import { updateTaskSchema } from "@/validations/task";
import { successResponse, noContentResponse, errorResponse } from "@/lib/api/response";
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

    return successResponse(task);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
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

    // Viewers cannot update tasks
    if (workspaceRole === "viewer") {
      throw new ForbiddenError("Viewers cannot update tasks");
    }

    const body = await request.json();
    const parsed = updateTaskSchema.parse(body);
    // Normalise nullable fields to undefined for the DB layer
    const validatedData = {
      ...parsed,
      assigneeId: parsed.assigneeId ?? undefined,
      dueDate: parsed.dueDate ?? undefined,
    };

    const updatedTask = await updateTask(taskId, validatedData);
    if (!updatedTask) {
      throw new NotFoundError("Task not found");
    }

    return successResponse(updatedTask);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    // Only owner, admin, member, or the task reporter/assignee can delete
    if (
      workspaceRole === "viewer" ||
      (workspaceRole === "member" && task.reporterId !== user.id && task.assigneeId !== user.id)
    ) {
      throw new ForbiddenError("You don't have permission to delete this task");
    }

    await deleteTask(taskId);

    return noContentResponse();
  } catch (error) {
    return errorResponse(error);
  }
}

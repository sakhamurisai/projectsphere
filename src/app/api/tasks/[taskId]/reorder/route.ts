import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserById } from "@/lib/db/entities/user";
import { getUserWorkspaceRole } from "@/lib/db/entities/workspace";
import { getTaskById, reorderTask } from "@/lib/db/entities/task";
import { reorderTaskSchema } from "@/validations/task";
import { successResponse, errorResponse } from "@/lib/api/response";
import { UnauthorizedError, NotFoundError, ForbiddenError } from "@/lib/api/errors";

interface RouteParams {
  params: Promise<{ taskId: string }>;
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

    // Viewers cannot reorder tasks
    if (workspaceRole === "viewer") {
      throw new ForbiddenError("Viewers cannot reorder tasks");
    }

    const body = await request.json();
    const validatedData = reorderTaskSchema.parse(body);

    const updatedTask = await reorderTask(taskId, validatedData.status, validatedData.order);
    if (!updatedTask) {
      throw new NotFoundError("Task not found");
    }

    return successResponse(updatedTask);
  } catch (error) {
    return errorResponse(error);
  }
}

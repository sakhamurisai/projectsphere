import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserByEmail } from "@/lib/db/entities/user";
import { getUserWorkspaceRole } from "@/lib/db/entities/workspace";
import { getTaskById } from "@/lib/db/entities/task";
import { getEntityFiles } from "@/lib/db/entities/file";
import { successResponse, errorResponse } from "@/lib/api/response";
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

    const user = await getUserByEmail(authUser.email);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    const task = await getTaskById(taskId);
    if (!task) {
      throw new NotFoundError("Task not found");
    }

    const workspaceRole = await getUserWorkspaceRole(task.workspaceId, user.id);
    if (!workspaceRole) {
      throw new ForbiddenError("You don't have access to this task");
    }

    const attachments = await getEntityFiles("task", taskId);

    return successResponse(attachments);
  } catch (error) {
    return errorResponse(error);
  }
}

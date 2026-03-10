"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TaskForm } from "./task-form";
import type { CreateTaskInput } from "@/validations/task";
import type { TaskStatus } from "@/types/task";

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateTaskInput) => Promise<void>;
  isSubmitting?: boolean;
  defaultStatus?: TaskStatus;
  workspaceId: string;
}

export function CreateTaskDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
  defaultStatus,
  workspaceId,
}: CreateTaskDialogProps) {
  const handleSubmit = async (data: CreateTaskInput) => {
    await onSubmit(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">New Task</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Add a task to this project. Use @ to mention teammates.
          </DialogDescription>
        </DialogHeader>
        <TaskForm
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          isSubmitting={isSubmitting}
          defaultValues={{ status: defaultStatus }}
          workspaceId={workspaceId}
        />
      </DialogContent>
    </Dialog>
  );
}

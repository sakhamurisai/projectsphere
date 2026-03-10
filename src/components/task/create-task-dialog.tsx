"use client";

import { useState } from "react";
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
import type { Project } from "@/types/project";

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with (projectId, taskData) — projectId is the selected/fixed project */
  onSubmit: (projectId: string, data: CreateTaskInput) => Promise<void>;
  isSubmitting?: boolean;
  defaultStatus?: TaskStatus;
  workspaceId: string;
  /** Fixed project — used when creating from within a project board/list */
  projectId?: string;
  /** Pass all workspace projects to enable a project picker inside the dialog */
  projects?: Project[];
  /** Pre-select a project in the picker */
  defaultProjectId?: string;
}

export function CreateTaskDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
  defaultStatus,
  workspaceId,
  projectId,
  projects,
  defaultProjectId,
}: CreateTaskDialogProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    defaultProjectId ?? projectId ?? ""
  );

  // Reset picker when dialog opens
  const handleOpenChange = (o: boolean) => {
    if (o) setSelectedProjectId(defaultProjectId ?? projectId ?? "");
    onOpenChange(o);
  };

  const handleSubmit = async (data: CreateTaskInput) => {
    const pid = projectId ?? selectedProjectId;
    if (!pid) return;
    await onSubmit(pid, data);
    onOpenChange(false);
  };

  const showPicker = !projectId && !!projects && projects.length > 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">New Task</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {showPicker
              ? "Choose a project, then fill in the task details."
              : "Add a task to this project. Use @ to mention teammates."}
          </DialogDescription>
        </DialogHeader>

        <TaskForm
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          isSubmitting={isSubmitting}
          defaultValues={{ status: defaultStatus }}
          workspaceId={workspaceId}
          projects={showPicker ? projects : undefined}
          selectedProjectId={showPicker ? selectedProjectId : undefined}
          onProjectChange={showPicker ? setSelectedProjectId : undefined}
        />
      </DialogContent>
    </Dialog>
  );
}

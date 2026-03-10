"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { MentionTextarea } from "@/components/shared/mention-textarea";
import { createTaskSchema, type CreateTaskInput } from "@/validations/task";
import { TASK_STATUSES } from "@/constants/task-status";
import { TASK_PRIORITIES } from "@/constants/task-priority";
import { cn } from "@/lib/utils";
import type { Project } from "@/types/project";

const PROJECT_COLORS = [
  "bg-violet-500","bg-blue-500","bg-emerald-500","bg-orange-500",
  "bg-pink-500","bg-teal-500","bg-fuchsia-500","bg-amber-500",
];
function projectColor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return PROJECT_COLORS[h % PROJECT_COLORS.length];
}

interface TaskFormProps {
  onSubmit: (data: CreateTaskInput) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  defaultValues?: Partial<CreateTaskInput>;
  workspaceId: string;
  /** When provided, renders a project picker at the top of the form */
  projects?: Project[];
  selectedProjectId?: string;
  onProjectChange?: (projectId: string) => void;
}

export function TaskForm({
  onSubmit,
  onCancel,
  isSubmitting,
  defaultValues,
  workspaceId,
  projects,
  selectedProjectId,
  onProjectChange,
}: TaskFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateTaskInput>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      status: "todo",
      priority: "medium",
      labels: [],
      description: "",
      ...defaultValues,
    },
  });

  const status = watch("status");
  const priority = watch("priority");
  const description = watch("description") ?? "";

  const selectedProject = projects?.find((p) => p.id === selectedProjectId);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

      {/* Project selector — only shown when projects are injected */}
      {projects && projects.length > 0 && (
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">
            Project <span className="text-destructive">*</span>
          </Label>
          <Select
            value={selectedProjectId ?? ""}
            onValueChange={(v) => onProjectChange?.(v)}
          >
            <SelectTrigger className={cn("text-sm", !selectedProjectId && "text-muted-foreground")}>
              <SelectValue placeholder="Select a project…">
                {selectedProject && (
                  <span className="flex items-center gap-2">
                    <span className={cn("w-2 h-2 rounded-full shrink-0", projectColor(selectedProject.id))} />
                    <span className="font-mono text-xs text-muted-foreground">{selectedProject.key}</span>
                    <span>{selectedProject.name}</span>
                  </span>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  <span className="flex items-center gap-2">
                    <span className={cn("w-2 h-2 rounded-full shrink-0", projectColor(p.id))} />
                    <span className="font-mono text-xs text-muted-foreground">{p.key}</span>
                    <span>{p.name}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {projects && !selectedProjectId && (
            <p className="text-xs text-muted-foreground">Choose the project this task belongs to.</p>
          )}
        </div>
      )}

      {/* Title */}
      <div className="space-y-1.5">
        <Label htmlFor="title" className="text-sm font-medium">
          Title <span className="text-destructive">*</span>
        </Label>
        <Input
          id="title"
          placeholder="What needs to be done?"
          {...register("title")}
          aria-invalid={!!errors.title}
          className="text-sm"
        />
        {errors.title && (
          <p className="text-xs text-destructive">{errors.title.message}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label htmlFor="description" className="text-sm font-medium">
          Description{" "}
          <span className="text-xs font-normal text-muted-foreground ml-1">
            — use @ to mention teammates
          </span>
        </Label>
        <MentionTextarea
          id="description"
          value={description}
          onChange={(v) => setValue("description", v)}
          workspaceId={workspaceId}
          rows={3}
          placeholder="Add details… @ to mention a teammate"
        />
        {errors.description && (
          <p className="text-xs text-destructive">{errors.description.message}</p>
        )}
      </div>

      {/* Status + Priority */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Status</Label>
          <Select
            value={status}
            onValueChange={(v) => setValue("status", v as CreateTaskInput["status"])}
          >
            <SelectTrigger className="text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TASK_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value} className="text-sm">
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Priority</Label>
          <Select
            value={priority}
            onValueChange={(v) => setValue("priority", v as CreateTaskInput["priority"])}
          >
            <SelectTrigger className="text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TASK_PRIORITIES.map((p) => (
                <SelectItem key={p.value} value={p.value} className="text-sm">
                  {p.icon} {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Due date */}
      <div className="space-y-1.5">
        <Label htmlFor="dueDate" className="text-sm font-medium">
          Due Date{" "}
          <span className="text-xs font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="dueDate"
          type="date"
          {...register("dueDate")}
          className="text-sm"
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-1">
        {onCancel && (
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          size="sm"
          disabled={isSubmitting || (!!projects && !selectedProjectId)}
        >
          {isSubmitting && <LoadingSpinner size="sm" className="mr-2" />}
          Create Task
        </Button>
      </div>
    </form>
  );
}

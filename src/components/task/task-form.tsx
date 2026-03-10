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

interface TaskFormProps {
  onSubmit: (data: CreateTaskInput) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  defaultValues?: Partial<CreateTaskInput>;
  workspaceId: string;
}

export function TaskForm({
  onSubmit,
  onCancel,
  isSubmitting,
  defaultValues,
  workspaceId,
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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

      {/* Description with @ mentions */}
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
        <Button type="submit" size="sm" disabled={isSubmitting}>
          {isSubmitting && <LoadingSpinner size="sm" className="mr-2" />}
          Create Task
        </Button>
      </div>
    </form>
  );
}

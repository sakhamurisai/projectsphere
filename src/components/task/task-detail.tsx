"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import { Separator } from "@/components/ui/separator";
import { UserAvatar } from "@/components/shared/user-avatar";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { MentionTextarea, RenderWithMentions } from "@/components/shared/mention-textarea";
import { TaskStatusBadge } from "./task-status-badge";
import { TaskPriorityBadge } from "./task-priority-badge";
import { useTask } from "@/hooks/use-tasks";
import { updateTaskSchema, type UpdateTaskInput } from "@/validations/task";
import { TASK_STATUSES } from "@/constants/task-status";
import { TASK_PRIORITIES } from "@/constants/task-priority";
import { format } from "date-fns";
import { CalendarDays, Pencil, Trash2, User, Flag, Tag, X } from "lucide-react";
import { toast } from "sonner";

interface TaskDetailProps {
  taskId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
}

export function TaskDetail({ taskId, open, onOpenChange, workspaceId }: TaskDetailProps) {
  const { task, isLoading, updateTaskAsync, isUpdating, deleteTaskAsync, isDeleting } =
    useTask(taskId);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
    reset,
  } = useForm<UpdateTaskInput>({
    resolver: zodResolver(updateTaskSchema),
    values: task
      ? {
          title: task.title,
          description: task.description ?? "",
          status: task.status,
          priority: task.priority,
          dueDate: task.dueDate,
        }
      : undefined,
  });

  const descriptionValue = watch("description") ?? "";

  const onSubmit = async (data: UpdateTaskInput) => {
    try {
      await updateTaskAsync(data);
      toast.success("Task updated");
      setIsEditing(false);
    } catch {
      toast.error("Failed to update task");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteTaskAsync();
      toast.success("Task deleted");
      onOpenChange(false);
    } catch {
      toast.error("Failed to delete task");
    }
  };

  const handleQuickStatusChange = async (newStatus: string) => {
    try {
      await updateTaskAsync({ status: newStatus as UpdateTaskInput["status"] });
      toast.success("Status updated");
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleQuickPriorityChange = async (newPriority: string) => {
    try {
      await updateTaskAsync({ priority: newPriority as UpdateTaskInput["priority"] });
      toast.success("Priority updated");
    } catch {
      toast.error("Failed to update priority");
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-xl flex flex-col p-0 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center flex-1">
              <LoadingSpinner size="lg" />
            </div>
          ) : task ? (
            <>
              {/* Top bar */}
              <div className="flex items-center justify-between px-5 py-3 border-b bg-muted/30">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-muted-foreground font-semibold uppercase tracking-wide">
                    Task
                  </span>
                  <span className="text-xs text-muted-foreground/50">·</span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(task.createdAt), "MMM d, yyyy")}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {!isEditing && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={() => setIsEditing(true)}
                      title="Edit"
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => setDeleteDialogOpen(true)}
                    title="Delete task"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    onClick={() => onOpenChange(false)}
                  >
                    <X className="size-3.5" />
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                <div className="px-5 py-5 space-y-6">
                  {isEditing ? (
                    /* ── Edit form ── */
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium">Title</Label>
                        <Input
                          {...register("title")}
                          aria-invalid={!!errors.title}
                          className="text-sm font-medium"
                        />
                        {errors.title && (
                          <p className="text-xs text-destructive">{errors.title.message}</p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium">
                          Description{" "}
                          <span className="text-xs font-normal text-muted-foreground">
                            — @ to mention
                          </span>
                        </Label>
                        <MentionTextarea
                          value={descriptionValue}
                          onChange={(v) => setValue("description", v, { shouldDirty: true })}
                          workspaceId={workspaceId}
                          rows={5}
                          placeholder="Add details… @ to mention a teammate"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium">Due Date</Label>
                        <Input type="date" {...register("dueDate")} className="text-sm" />
                      </div>

                      <div className="flex gap-2">
                        <Button type="submit" size="sm" disabled={isUpdating || !isDirty}>
                          {isUpdating && <LoadingSpinner size="sm" className="mr-2" />}
                          Save changes
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => { reset(); setIsEditing(false); }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  ) : (
                    /* ── Read view ── */
                    <>
                      {/* Title */}
                      <SheetHeader className="p-0">
                        <SheetTitle className="text-left text-lg font-semibold leading-snug">
                          {task.title}
                        </SheetTitle>
                      </SheetHeader>

                      {/* Quick property pills */}
                      <div className="flex flex-wrap gap-2">
                        <Select value={task.status} onValueChange={handleQuickStatusChange}>
                          <SelectTrigger className="w-fit h-7 text-xs gap-1 border-border/60">
                            <TaskStatusBadge status={task.status} />
                          </SelectTrigger>
                          <SelectContent>
                            {TASK_STATUSES.map((s) => (
                              <SelectItem key={s.value} value={s.value} className="text-sm">
                                {s.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Select value={task.priority} onValueChange={handleQuickPriorityChange}>
                          <SelectTrigger className="w-fit h-7 text-xs gap-1 border-border/60">
                            <TaskPriorityBadge priority={task.priority} />
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

                      <Separator />

                      {/* Description */}
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                          Description
                        </p>
                        <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed min-h-[40px]">
                          {task.description ? (
                            <RenderWithMentions text={task.description} />
                          ) : (
                            <span className="italic text-muted-foreground/50">No description</span>
                          )}
                        </div>
                      </div>

                      <Separator />

                      {/* Metadata grid */}
                      <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                        {/* Assignee */}
                        <div>
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <User className="size-3 text-muted-foreground" />
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                              Assignee
                            </p>
                          </div>
                          {task.assignee ? (
                            <div className="flex items-center gap-2">
                              <UserAvatar
                                name={task.assignee.name}
                                email={task.assignee.email}
                                avatarUrl={task.assignee.avatarUrl}
                                size="sm"
                              />
                              <span className="text-sm font-medium truncate">
                                {task.assignee.name || task.assignee.email}
                              </span>
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground/50">Unassigned</p>
                          )}
                        </div>

                        {/* Reporter */}
                        <div>
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <User className="size-3 text-muted-foreground" />
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                              Reporter
                            </p>
                          </div>
                          {task.reporter ? (
                            <div className="flex items-center gap-2">
                              <UserAvatar
                                name={task.reporter.name}
                                email={task.reporter.email}
                                avatarUrl={task.reporter.avatarUrl}
                                size="sm"
                              />
                              <span className="text-sm font-medium truncate">
                                {task.reporter.name || task.reporter.email}
                              </span>
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground/50">—</p>
                          )}
                        </div>

                        {/* Due date */}
                        <div>
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <CalendarDays className="size-3 text-muted-foreground" />
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                              Due Date
                            </p>
                          </div>
                          {task.dueDate ? (
                            <p className="text-sm font-medium">
                              {format(new Date(task.dueDate), "MMM d, yyyy")}
                            </p>
                          ) : (
                            <p className="text-sm text-muted-foreground/50">No due date</p>
                          )}
                        </div>

                        {/* Priority */}
                        <div>
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <Flag className="size-3 text-muted-foreground" />
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                              Priority
                            </p>
                          </div>
                          <TaskPriorityBadge priority={task.priority} />
                        </div>

                        {/* Labels */}
                        {task.labels && task.labels.length > 0 && (
                          <div className="col-span-2">
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <Tag className="size-3 text-muted-foreground" />
                              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Labels
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {task.labels.map((label) => (
                                <span
                                  key={label}
                                  className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium"
                                >
                                  {label}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center flex-1">
              <p className="text-sm text-muted-foreground">Task not found</p>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete task?"
        description="This action cannot be undone. The task will be permanently deleted."
        confirmText="Delete"
        variant="destructive"
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </>
  );
}

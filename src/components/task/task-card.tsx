"use client";

import { TaskPriorityBadge } from "./task-priority-badge";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Calendar, GripVertical } from "lucide-react";
import { format, isPast, isToday } from "date-fns";
import { cn } from "@/lib/utils";
import type { Task } from "@/types/task";

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
  isDragging?: boolean;
}

export function TaskCard({ task, onClick, isDragging }: TaskCardProps) {
  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== "done";
  const isDueToday = task.dueDate && isToday(new Date(task.dueDate));

  return (
    <div
      onClick={onClick}
      className={cn(
        "group rounded-lg border bg-card p-3 cursor-pointer transition-all",
        "hover:shadow-md hover:-translate-y-0.5",
        isDragging && "opacity-50 shadow-lg rotate-1"
      )}
    >
      <div className="flex items-start gap-2 mb-2">
        <GripVertical className="h-4 w-4 text-muted-foreground/30 shrink-0 mt-0.5 group-hover:text-muted-foreground/60 transition-colors" />
        <p className="text-sm font-medium leading-tight flex-1 group-hover:text-primary transition-colors">
          {task.title}
        </p>
      </div>

      {task.labels && task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2 ml-6">
          {task.labels.map((label) => (
            <span
              key={label}
              className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
            >
              {label}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between ml-6">
        <TaskPriorityBadge priority={task.priority} />
        <div className="flex items-center gap-2">
          {task.dueDate && (
            <span
              className={cn(
                "flex items-center gap-1 text-xs",
                isOverdue ? "text-red-500 font-medium" : isDueToday ? "text-orange-500" : "text-muted-foreground"
              )}
            >
              <Calendar className="h-3 w-3" />
              {format(new Date(task.dueDate), "MMM d")}
            </span>
          )}
          {task.assignee ? (
            <UserAvatar
              name={task.assignee.name}
              email={task.assignee.email}
              avatarUrl={task.assignee.avatarUrl}
              size="sm"
            />
          ) : (
            <div className="w-6 h-6 rounded-full border-2 border-dashed border-muted-foreground/20" />
          )}
        </div>
      </div>
    </div>
  );
}

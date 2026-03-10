"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { TaskStatusBadge } from "@/components/task/task-status-badge";
import { TaskPriorityBadge } from "@/components/task/task-priority-badge";
import { UserAvatar } from "@/components/shared/user-avatar";
import { CheckSquare, ChevronDown, ChevronRight, Plus, Calendar } from "lucide-react";
import { TASK_STATUS_ORDER, TASK_STATUSES } from "@/constants/task-status";
import { format, isPast, isToday } from "date-fns";
import { cn } from "@/lib/utils";
import type { Task, TaskStatus } from "@/types/task";

// ── Status section ────────────────────────────────────────────────────────────
const SECTION_STYLES: Record<TaskStatus, { dot: string; label: string; count: string }> = {
  todo:        { dot: "bg-slate-400",   label: "text-slate-700",   count: "bg-slate-100 text-slate-600" },
  in_progress: { dot: "bg-blue-500",    label: "text-blue-700",    count: "bg-blue-100 text-blue-600"   },
  in_review:   { dot: "bg-amber-500",   label: "text-amber-700",   count: "bg-amber-100 text-amber-600" },
  done:        { dot: "bg-emerald-500", label: "text-emerald-700", count: "bg-emerald-100 text-emerald-600" },
};

function StatusSection({
  status,
  tasks,
  onTaskClick,
  onAddTask,
}: {
  status: TaskStatus;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onAddTask?: (status: TaskStatus) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const statusDef = TASK_STATUSES.find((s) => s.value === status)!;
  const styles = SECTION_STYLES[status];

  return (
    <div>
      {/* Section header */}
      <div
        className="flex items-center gap-2 px-4 py-2 bg-muted/40 border-b cursor-pointer hover:bg-muted/60 transition-colors select-none"
        onClick={() => setCollapsed(!collapsed)}
      >
        <button className="text-muted-foreground p-0.5">
          {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
        <span className={cn("w-2 h-2 rounded-full shrink-0", styles.dot)} />
        <span className={cn("text-xs font-semibold uppercase tracking-wide", styles.label)}>
          {statusDef.label}
        </span>
        <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", styles.count)}>
          {tasks.length}
        </span>
      </div>

      {/* Task rows */}
      {!collapsed && (
        <>
          {tasks.map((task) => (
            <TaskRow key={task.id} task={task} onClick={() => onTaskClick(task)} />
          ))}
          {onAddTask && (
            <button
              onClick={() => onAddTask(status)}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors border-b"
            >
              <Plus className="h-3.5 w-3.5" />
              Add task
            </button>
          )}
        </>
      )}
    </div>
  );
}

function TaskRow({ task, onClick }: { task: Task; onClick: () => void }) {
  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== "done";
  const isDueToday = task.dueDate && isToday(new Date(task.dueDate));

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-2.5 border-b border-border/50 hover:bg-muted/30 cursor-pointer group transition-colors"
    >
      {/* Checkbox placeholder */}
      <div className="w-4 h-4 rounded border border-border/60 shrink-0 group-hover:border-primary/60 transition-colors" />

      {/* Title */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate group-hover:text-primary transition-colors">
            {task.title}
          </span>
          {task.labels && task.labels.length > 0 && (
            <div className="hidden sm:flex gap-1 shrink-0">
              {task.labels.slice(0, 2).map((l) => (
                <span
                  key={l}
                  className="inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
                >
                  {l}
                </span>
              ))}
            </div>
          )}
        </div>
        {task.description && (
          <p className="text-xs text-muted-foreground truncate mt-0.5 max-w-md">
            {task.description}
          </p>
        )}
      </div>

      {/* Status */}
      <div className="shrink-0 hidden sm:block">
        <TaskStatusBadge status={task.status} />
      </div>

      {/* Priority */}
      <div className="shrink-0">
        <TaskPriorityBadge priority={task.priority} />
      </div>

      {/* Assignee */}
      <div className="shrink-0 w-7">
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

      {/* Due date */}
      <div className="shrink-0 w-20 text-right hidden md:block">
        {task.dueDate ? (
          <span
            className={cn(
              "text-xs flex items-center justify-end gap-1",
              isOverdue ? "text-red-500 font-medium" : isDueToday ? "text-orange-500" : "text-muted-foreground"
            )}
          >
            <Calendar className="h-3 w-3" />
            {format(new Date(task.dueDate), "MMM d")}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground/40">—</span>
        )}
      </div>
    </div>
  );
}

// ── Main ListView ─────────────────────────────────────────────────────────────
interface ListViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onAddTask?: (status: TaskStatus) => void;
  groupByStatus?: boolean;
}

export function ListView({ tasks, onTaskClick, onAddTask, groupByStatus = true }: ListViewProps) {
  if (tasks.length === 0) {
    return (
      <EmptyState
        icon={<CheckSquare className="h-10 w-10" />}
        title="No tasks found"
        description="Create a new task or adjust your filters."
        action={
          onAddTask ? (
            <Button onClick={() => onAddTask("todo")}>
              <Plus className="mr-2 h-4 w-4" />
              New Task
            </Button>
          ) : undefined
        }
      />
    );
  }

  if (!groupByStatus) {
    return (
      <div className="overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[1fr_120px_110px_40px_90px] gap-3 px-4 py-2.5 bg-muted/50 border-b text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:grid">
          <span>Task</span>
          <span>Status</span>
          <span>Priority</span>
          <span>Assignee</span>
          <span className="text-right">Due</span>
        </div>
        {tasks.map((task) => <TaskRow key={task.id} task={task} onClick={() => onTaskClick(task)} />)}
      </div>
    );
  }

  const grouped = TASK_STATUS_ORDER.reduce((acc, status) => {
    acc[status] = tasks.filter((t) => t.status === status);
    return acc;
  }, {} as Record<TaskStatus, Task[]>);

  return (
    <div className="overflow-hidden">
      {/* Column headers */}
      <div className="grid grid-cols-[1fr_120px_110px_40px_90px] gap-3 px-4 py-2.5 bg-muted/50 border-b text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:grid">
        <span>Task</span>
        <span>Status</span>
        <span>Priority</span>
        <span>Assignee</span>
        <span className="text-right">Due</span>
      </div>
      {TASK_STATUS_ORDER.map((status) => (
        <StatusSection
          key={status}
          status={status}
          tasks={grouped[status]}
          onTaskClick={onTaskClick}
          onAddTask={onAddTask}
        />
      ))}
    </div>
  );
}

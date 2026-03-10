"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/shared/user-avatar";
import { TaskPriorityBadge } from "@/components/task/task-priority-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Plus, ChevronDown, ChevronRight, CheckSquare, Calendar } from "lucide-react";
import { TASK_STATUS_ORDER, TASK_STATUSES } from "@/constants/task-status";
import { format, isPast, isToday } from "date-fns";
import { cn } from "@/lib/utils";
import type { Task, TaskStatus } from "@/types/task";

// ── Progress derivation ───────────────────────────────────────────────────────
function getProgress(task: Task): number {
  if (task.status === "done") return 100;
  if (task.status === "todo") return 0;
  let h = 0;
  for (const c of task.id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  if (task.status === "in_review") return 55 + (h % 40);
  return 15 + (h % 45);
}

// ── Status group config ───────────────────────────────────────────────────────
const STATUS_CFG: Record<TaskStatus, {
  bg: string; text: string; dot: string; badge: string; bar: string;
}> = {
  todo:        { bg: "bg-slate-50",   text: "text-slate-600",   dot: "bg-slate-400",   badge: "bg-slate-100 text-slate-600 border-slate-200",    bar: "bg-slate-400"   },
  in_progress: { bg: "bg-blue-50/60", text: "text-blue-700",    dot: "bg-blue-500",    badge: "bg-blue-100 text-blue-700 border-blue-200",        bar: "bg-blue-500"    },
  in_review:   { bg: "bg-amber-50/60",text: "text-amber-700",   dot: "bg-amber-500",   badge: "bg-amber-100 text-amber-700 border-amber-200",     bar: "bg-amber-500"   },
  done:        { bg: "bg-emerald-50/50",text:"text-emerald-700",dot: "bg-emerald-500", badge: "bg-emerald-100 text-emerald-700 border-emerald-200",bar: "bg-emerald-500" },
};

const PRIORITY_CFG: Record<string, { pill: string; label: string }> = {
  urgent: { pill: "bg-red-100 text-red-700 border-red-200",       label: "Urgent"  },
  high:   { pill: "bg-orange-100 text-orange-700 border-orange-200", label: "High" },
  medium: { pill: "bg-blue-100 text-blue-700 border-blue-200",    label: "Normal"  },
  low:    { pill: "bg-slate-100 text-slate-500 border-slate-200", label: "Low"     },
};

// ── Priority pill ─────────────────────────────────────────────────────────────
function PriorityPill({ priority }: { priority: string }) {
  const cfg = PRIORITY_CFG[priority] ?? PRIORITY_CFG.medium;
  return (
    <span className={cn("inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium", cfg.pill)}>
      {cfg.label}
    </span>
  );
}

// ── Progress bar ──────────────────────────────────────────────────────────────
function ProgressBar({ value, barColor }: { value: number; barColor: string }) {
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-1.5 rounded-full bg-slate-200 overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", barColor)}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground w-8 text-right shrink-0">{value}%</span>
    </div>
  );
}

// ── Column header ─────────────────────────────────────────────────────────────
function ColHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("text-xs font-semibold text-slate-500 uppercase tracking-wide select-none", className)}>
      {children}
    </div>
  );
}

// ── Task row ──────────────────────────────────────────────────────────────────
function TaskRow({
  task,
  onClick,
  barColor,
}: {
  task: Task;
  onClick: () => void;
  barColor: string;
}) {
  const progress = getProgress(task);
  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== "done";
  const isDueToday = task.dueDate && isToday(new Date(task.dueDate));

  return (
    <div
      onClick={onClick}
      className="group grid items-center border-b border-slate-100 hover:bg-slate-50/80 cursor-pointer transition-colors"
      style={{ gridTemplateColumns: "28px minmax(180px,1.5fr) minmax(0,1fr) 88px 110px 90px 110px 32px" }}
    >
      {/* Checkbox */}
      <div className="flex items-center justify-center py-2.5">
        <div className="w-3.5 h-3.5 rounded border border-slate-300 group-hover:border-blue-400 transition-colors shrink-0" />
      </div>

      {/* Task name */}
      <div className="py-2.5 pr-3 min-w-0 flex items-center gap-1.5">
        <span className="text-sm font-medium text-slate-800 truncate group-hover:text-blue-600 transition-colors">
          {task.title}
        </span>
        {task.labels && task.labels.length > 0 && (
          <span className="hidden sm:inline-flex items-center rounded-full bg-violet-100 text-violet-700 border border-violet-200 px-1.5 py-0.5 text-[10px] font-medium shrink-0">
            {task.labels[0]}
          </span>
        )}
      </div>

      {/* Description */}
      <div className="py-2.5 pr-3 min-w-0 hidden lg:block">
        <span className="text-xs text-slate-400 truncate block">
          {task.description || "—"}
        </span>
      </div>

      {/* Assignee */}
      <div className="py-2.5 pr-3 flex items-center">
        {task.assignee ? (
          <UserAvatar
            name={task.assignee.name}
            email={task.assignee.email}
            avatarUrl={task.assignee.avatarUrl}
            size="sm"
          />
        ) : (
          <div className="w-6 h-6 rounded-full border-2 border-dashed border-slate-300" />
        )}
      </div>

      {/* Due date */}
      <div className="py-2.5 pr-3 hidden sm:block">
        {task.dueDate ? (
          <span className={cn(
            "text-xs flex items-center gap-1",
            isOverdue ? "text-red-500 font-medium" : isDueToday ? "text-orange-500" : "text-slate-500"
          )}>
            <Calendar className="h-3 w-3 shrink-0" />
            {format(new Date(task.dueDate), "MMM d, yyyy")}
          </span>
        ) : (
          <span className="text-xs text-slate-300">—</span>
        )}
      </div>

      {/* Priority */}
      <div className="py-2.5 pr-3 hidden sm:block">
        <PriorityPill priority={task.priority} />
      </div>

      {/* Progress */}
      <div className="py-2.5 pr-3 hidden md:block">
        <ProgressBar value={progress} barColor={barColor} />
      </div>

      {/* Action */}
      <div className="py-2.5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-slate-400 text-xs">···</span>
      </div>
    </div>
  );
}

// ── Status section ────────────────────────────────────────────────────────────
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
  const cfg = STATUS_CFG[status];

  return (
    <div>
      {/* Status group header */}
      <div
        className={cn(
          "group grid items-center border-b border-slate-100 cursor-pointer select-none",
          cfg.bg
        )}
        style={{ gridTemplateColumns: "28px minmax(180px,1.5fr) minmax(0,1fr) 88px 110px 90px 110px 32px" }}
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="flex items-center justify-center py-2.5">
          <span className={cn("text-slate-400 transition-transform", collapsed && "-rotate-90")}>
            {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </span>
        </div>
        <div className="py-2.5 pr-3 flex items-center gap-2 col-span-7">
          <span className={cn("w-2 h-2 rounded-full shrink-0", cfg.dot)} />
          <span className={cn("text-xs font-bold uppercase tracking-wide", cfg.text)}>
            {statusDef.label}
          </span>
          <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold", cfg.badge)}>
            {tasks.length}
          </span>
        </div>
      </div>

      {/* Task rows */}
      {!collapsed && (
        <>
          {tasks.length === 0 ? (
            <div className="py-3 pl-10 text-xs text-slate-400 italic border-b border-slate-100">
              No tasks — click below to add one
            </div>
          ) : (
            tasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onClick={() => onTaskClick(task)}
                barColor={cfg.bar}
              />
            ))
          )}
          {onAddTask && (
            <button
              onClick={(e) => { e.stopPropagation(); onAddTask(status); }}
              className="flex items-center gap-2 w-full pl-8 pr-4 py-2.5 text-xs text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-100"
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

// ── Main SpreadsheetView ──────────────────────────────────────────────────────
interface SpreadsheetViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onAddTask?: (status: TaskStatus) => void;
}

export function SpreadsheetView({ tasks, onTaskClick, onAddTask }: SpreadsheetViewProps) {
  const grouped = TASK_STATUS_ORDER.reduce((acc, status) => {
    acc[status] = tasks.filter((t) => t.status === status);
    return acc;
  }, {} as Record<TaskStatus, Task[]>);

  if (tasks.length === 0) {
    return (
      <EmptyState
        icon={<CheckSquare className="h-10 w-10" />}
        title="No tasks yet"
        description="Create your first task to get started."
        action={
          onAddTask ? (
            <Button onClick={() => onAddTask("todo")}>
              <Plus className="mr-2 h-4 w-4" /> New Task
            </Button>
          ) : undefined
        }
      />
    );
  }

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Column headers */}
      <div
        className="grid items-center border-b border-slate-200 bg-slate-50"
        style={{ gridTemplateColumns: "28px minmax(180px,1.5fr) minmax(0,1fr) 88px 110px 90px 110px 32px" }}
      >
        <div /> {/* checkbox */}
        <ColHeader className="py-2.5 pr-3">Task</ColHeader>
        <ColHeader className="py-2.5 pr-3 hidden lg:block">Description</ColHeader>
        <ColHeader className="py-2.5 pr-3">Assignee</ColHeader>
        <ColHeader className="py-2.5 pr-3 hidden sm:block">Due Date</ColHeader>
        <ColHeader className="py-2.5 pr-3 hidden sm:block">Priority</ColHeader>
        <ColHeader className="py-2.5 pr-3 hidden md:block">Progress</ColHeader>
        <div /> {/* action */}
      </div>

      {/* Status groups */}
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

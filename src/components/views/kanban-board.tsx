"use client";

import { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/shared/user-avatar";
import { TaskPriorityBadge } from "@/components/task/task-priority-badge";
import { Plus, Calendar, GripVertical } from "lucide-react";
import { TASK_STATUS_ORDER, TASK_STATUSES } from "@/constants/task-status";
import { format, isPast, isToday } from "date-fns";
import { cn } from "@/lib/utils";
import type { Task, TaskStatus } from "@/types/task";

// ── Column config ─────────────────────────────────────────────────────────────
const COLUMN_CONFIG: Record<TaskStatus, {
  border: string; header: string; badge: string; dot: string;
}> = {
  todo:        { border: "border-t-slate-400",   header: "text-slate-700 dark:text-slate-300",   badge: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",  dot: "bg-slate-400"   },
  in_progress: { border: "border-t-blue-500",    header: "text-blue-700 dark:text-blue-400",     badge: "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300",      dot: "bg-blue-500"    },
  in_review:   { border: "border-t-amber-500",   header: "text-amber-700 dark:text-amber-400",   badge: "bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-300",  dot: "bg-amber-500"   },
  done:        { border: "border-t-emerald-500", header: "text-emerald-700 dark:text-emerald-400", badge: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-300", dot: "bg-emerald-500" },
};

// ── Task card ─────────────────────────────────────────────────────────────────
function KanbanTaskCard({
  task,
  onClick,
  isDragging = false,
}: {
  task: Task;
  onClick?: () => void;
  isDragging?: boolean;
}) {
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
      {/* Drag handle + title */}
      <div className="flex items-start gap-2 mb-2">
        <GripVertical className="h-4 w-4 text-muted-foreground/30 shrink-0 mt-0.5 group-hover:text-muted-foreground/60 transition-colors" />
        <p className="text-sm font-medium leading-tight flex-1 group-hover:text-primary transition-colors">
          {task.title}
        </p>
      </div>

      {/* Labels */}
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

      {/* Footer */}
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

// ── Sortable wrapper ─────────────────────────────────────────────────────────
function SortableCard({ task, onClick }: { task: Task; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id, data: { task, status: task.status } });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
    >
      <KanbanTaskCard task={task} onClick={onClick} isDragging={isDragging} />
    </div>
  );
}

// ── Column ────────────────────────────────────────────────────────────────────
function KanbanColumn({
  status,
  tasks,
  onTaskClick,
  onAddTask,
}: {
  status: TaskStatus;
  tasks: Task[];
  onTaskClick: (t: Task) => void;
  onAddTask: (s: TaskStatus) => void;
}) {
  const cfg = COLUMN_CONFIG[status];
  const statusDef = TASK_STATUSES.find((s) => s.value === status)!;

  return (
    <div className={cn("flex w-80 shrink-0 flex-col rounded-xl border-t-4 bg-muted/30", cfg.border)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <span className={cn("w-2 h-2 rounded-full", cfg.dot)} />
          <span className={cn("text-sm font-semibold", cfg.header)}>{statusDef.label}</span>
          <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", cfg.badge)}>
            {tasks.length}
          </span>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onAddTask(status)}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Cards */}
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2 overflow-y-auto px-3 pb-2 min-h-[120px] max-h-[calc(100vh-260px)]">
          {tasks.map((task) => (
            <SortableCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
          ))}
          {tasks.length === 0 && (
            <div className="flex items-center justify-center h-24 rounded-lg border-2 border-dashed border-border/50">
              <p className="text-xs text-muted-foreground/50">Drop tasks here</p>
            </div>
          )}
        </div>
      </SortableContext>

      {/* Add button */}
      <div className="px-3 pb-3 pt-1">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-muted/60"
          onClick={() => onAddTask(status)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add task
        </Button>
      </div>
    </div>
  );
}

// ── Board ─────────────────────────────────────────────────────────────────────
export function KanbanBoard({
  tasksByStatus,
  onTaskClick,
  onAddTask,
  onReorderTask,
}: {
  tasksByStatus: Partial<Record<TaskStatus, Task[]>>;
  onTaskClick: (task: Task) => void;
  onAddTask: (status: TaskStatus) => void;
  onReorderTask: (taskId: string, newStatus: TaskStatus, newOrder: number) => void;
}) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const getColumnTasks = (status: TaskStatus) =>
    (tasksByStatus[status] ?? []).slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const handleDragStart = (e: DragStartEvent) => {
    setActiveTask(e.active.data.current?.task ?? null);
  };

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    setActiveTask(null);
    if (!over) return;

    const activeData = active.data.current?.task as Task | undefined;
    if (!activeData) return;

    const overData = over.data.current;
    const targetStatus: TaskStatus =
      overData?.status ?? overData?.task?.status ?? activeData.status;

    const columnTasks = getColumnTasks(targetStatus);
    const overIndex = columnTasks.findIndex((t) => t.id === over.id);
    const newOrder = overIndex === -1 ? columnTasks.length : overIndex;

    if (activeData.status !== targetStatus || (activeData.order ?? 0) !== newOrder) {
      onReorderTask(activeData.id, targetStatus, newOrder);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 h-full">
        {TASK_STATUS_ORDER.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            tasks={getColumnTasks(status)}
            onTaskClick={onTaskClick}
            onAddTask={onAddTask}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask && (
          <div className="w-80">
            <KanbanTaskCard task={activeTask} isDragging />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}

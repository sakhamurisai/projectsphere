"use client";

import { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
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
import { TaskCard } from "@/components/task/task-card";
import { Button } from "@/components/ui/button";
import { Plus, MoreHorizontal } from "lucide-react";
import { TASK_STATUS_ORDER, TASK_STATUSES } from "@/constants/task-status";
import { cn } from "@/lib/utils";
import type { Task, TaskStatus } from "@/types/task";

// ── Sortable task card wrapper ───────────────────────────────────────────────
function SortableTaskCard({
  task,
  onClick,
}: {
  task: Task;
  onClick: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: { task, status: task.status } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard task={task} onClick={onClick} isDragging={isDragging} />
    </div>
  );
}

// ── Kanban column ────────────────────────────────────────────────────────────
const COLUMN_STYLES: Record<TaskStatus, { header: string; badge: string; border: string }> = {
  todo: {
    header: "text-slate-600 dark:text-slate-400",
    badge: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    border: "border-t-slate-400",
  },
  in_progress: {
    header: "text-blue-600 dark:text-blue-400",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    border: "border-t-blue-500",
  },
  in_review: {
    header: "text-amber-600 dark:text-amber-400",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
    border: "border-t-amber-500",
  },
  done: {
    header: "text-emerald-600 dark:text-emerald-400",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
    border: "border-t-emerald-500",
  },
};

function KanbanColumn({
  status,
  tasks,
  onTaskClick,
  onAddTask,
}: {
  status: TaskStatus;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onAddTask: (status: TaskStatus) => void;
}) {
  const statusDef = TASK_STATUSES.find((s) => s.value === status)!;
  const styles = COLUMN_STYLES[status];

  return (
    <div
      className={cn(
        "flex w-72 shrink-0 flex-col rounded-xl border-t-4 bg-muted/30",
        styles.border
      )}
    >
      {/* Column header */}
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-2">
          <span className={cn("text-sm font-semibold", styles.header)}>
            {statusDef.label}
          </span>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-medium",
              styles.badge
            )}
          >
            {tasks.length}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => onAddTask(status)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Cards */}
      <SortableContext
        items={tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-3 pt-0 min-h-[120px]">
          {tasks.map((task) => (
            <SortableTaskCard
              key={task.id}
              task={task}
              onClick={() => onTaskClick(task)}
            />
          ))}
        </div>
      </SortableContext>

      {/* Add task button */}
      <div className="p-3 pt-0">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground hover:text-foreground"
          onClick={() => onAddTask(status)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add task
        </Button>
      </div>
    </div>
  );
}

// ── Main board ───────────────────────────────────────────────────────────────
interface KanbanBoardProps {
  tasksByStatus: Partial<Record<TaskStatus, Task[]>>;
  onTaskClick: (task: Task) => void;
  onAddTask: (status: TaskStatus) => void;
  onReorderTask: (taskId: string, newStatus: TaskStatus, newOrder: number) => void;
}

export function KanbanBoard({
  tasksByStatus,
  onTaskClick,
  onAddTask,
  onReorderTask,
}: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const getColumnTasks = (status: TaskStatus): Task[] =>
    (tasksByStatus[status] ?? []).slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveTask(active.data.current?.task ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeTaskData = active.data.current?.task as Task | undefined;
    if (!activeTaskData) return;

    // Determine target status (from over item or column droppable)
    const overData = over.data.current;
    const targetStatus: TaskStatus =
      overData?.status ?? overData?.task?.status ?? activeTaskData.status;

    const columnTasks = getColumnTasks(targetStatus);

    // Find new order — insert at position of over item
    const overIndex = columnTasks.findIndex((t) => t.id === over.id);
    const newOrder = overIndex === -1 ? columnTasks.length : overIndex;

    if (
      activeTaskData.status !== targetStatus ||
      (activeTaskData.order ?? 0) !== newOrder
    ) {
      onReorderTask(activeTaskData.id, targetStatus, newOrder);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
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
        {activeTask ? (
          <div className="rotate-2 opacity-90 w-72">
            <TaskCard task={activeTask} isDragging />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

"use client";

import { use, useState } from "react";
import { ProjectHeader } from "@/components/project/project-header";
import { KanbanBoard } from "@/components/views/kanban-board";
import { TaskDetail } from "@/components/task/task-detail";
import { CreateTaskDialog } from "@/components/task/create-task-dialog";
import { TaskFilters } from "@/components/task/task-filters";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Plus, LayoutGrid } from "lucide-react";
import { useTasks } from "@/hooks/use-tasks";
import { useProject } from "@/hooks/use-projects";
import { toast } from "sonner";
import type { Task, TaskStatus, TaskFilters as TFilters } from "@/types/task";
import type { CreateTaskInput } from "@/validations/task";
import Link from "next/link";

interface BoardPageProps {
  params: Promise<{ workspaceId: string; projectId: string }>;
}

export default function BoardPage({ params }: BoardPageProps) {
  const { workspaceId, projectId } = use(params);

  const [filters, setFilters] = useState<TFilters>({});
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [taskDetailOpen, setTaskDetailOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [defaultCreateStatus, setDefaultCreateStatus] = useState<TaskStatus>("todo");

  const { project, isLoading: projectLoading } = useProject(projectId);
  const {
    tasks,
    tasksByStatus,
    isLoading: tasksLoading,
    createTaskAsync,
    isCreating,
    reorderTask,
  } = useTasks(projectId, filters);

  const handleTaskClick = (task: Task) => {
    setSelectedTaskId(task.id);
    setTaskDetailOpen(true);
  };

  const handleAddTask = (status: TaskStatus) => {
    setDefaultCreateStatus(status);
    setCreateDialogOpen(true);
  };

  const handleCreateTask = async (_pid: string, data: CreateTaskInput) => {
    try {
      await createTaskAsync({ ...data, status: data.status ?? defaultCreateStatus });
      toast.success("Task created");
    } catch {
      toast.error("Failed to create task");
    }
  };

  const handleReorderTask = (taskId: string, newStatus: TaskStatus, newOrder: number) => {
    reorderTask({ taskId, input: { status: newStatus, order: newOrder } });
  };

  if (projectLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-14 w-full" />
        <div className="flex gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-96 w-72 shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <EmptyState
        title="Project not found"
        description="The project you're looking for doesn't exist."
        action={
          <Button asChild>
            <Link href={`/dashboard/workspaces/${workspaceId}/projects`}>Back to projects</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Project header with view switcher */}
      <ProjectHeader project={project} workspaceId={workspaceId} currentView="board" />

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <TaskFilters
          filters={filters}
          onFiltersChange={setFilters}
          projectId={projectId}
        />
        <Button onClick={() => handleAddTask("todo")}>
          <Plus className="mr-2 h-4 w-4" />
          New Task
        </Button>
      </div>

      {/* Board */}
      {tasksLoading ? (
        <div className="flex gap-4 overflow-x-auto">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-64 w-72 shrink-0 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          <KanbanBoard
            tasksByStatus={tasksByStatus}
            onTaskClick={handleTaskClick}
            onAddTask={handleAddTask}
            onReorderTask={handleReorderTask}
          />
        </div>
      )}

      {/* Task detail sheet */}
      {selectedTaskId && (
        <TaskDetail
          taskId={selectedTaskId}
          open={taskDetailOpen}
          workspaceId={workspaceId}
          onOpenChange={(open) => {
            setTaskDetailOpen(open);
            if (!open) setSelectedTaskId(null);
          }}
        />
      )}

      {/* Create task dialog */}
      <CreateTaskDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={handleCreateTask}
        isSubmitting={isCreating}
        defaultStatus={defaultCreateStatus}
        workspaceId={workspaceId}
        projectId={projectId}
      />
    </div>
  );
}

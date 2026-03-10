"use client";

import { use, useState } from "react";
import { ProjectHeader } from "@/components/project/project-header";
import { ListView } from "@/components/views/list-view";
import { TaskDetail } from "@/components/task/task-detail";
import { CreateTaskDialog } from "@/components/task/create-task-dialog";
import { TaskFilters } from "@/components/task/task-filters";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useTasks } from "@/hooks/use-tasks";
import { useProject } from "@/hooks/use-projects";
import { toast } from "sonner";
import type { Task, TaskFilters as TFilters } from "@/types/task";
import type { CreateTaskInput } from "@/validations/task";
import Link from "next/link";

interface ListPageProps {
  params: Promise<{ workspaceId: string; projectId: string }>;
}

export default function ListPage({ params }: ListPageProps) {
  const { workspaceId, projectId } = use(params);

  const [filters, setFilters] = useState<TFilters>({});
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [taskDetailOpen, setTaskDetailOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const { project, isLoading: projectLoading } = useProject(projectId);
  const {
    tasks,
    isLoading: tasksLoading,
    createTaskAsync,
    isCreating,
  } = useTasks(projectId, filters);

  const handleTaskClick = (task: Task) => {
    setSelectedTaskId(task.id);
    setTaskDetailOpen(true);
  };

  const handleCreateTask = async (data: CreateTaskInput) => {
    try {
      await createTaskAsync(data);
      toast.success("Task created");
    } catch {
      toast.error("Failed to create task");
    }
  };

  if (projectLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-96 w-full" />
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
            <Link href={`/workspaces/${workspaceId}/projects`}>Back to projects</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <ProjectHeader project={project} workspaceId={workspaceId} currentView="list" />

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <TaskFilters
          filters={filters}
          onFiltersChange={setFilters}
          projectId={projectId}
        />
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Task
        </Button>
      </div>

      {tasksLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border">
          <ListView tasks={tasks} onTaskClick={handleTaskClick} />
        </div>
      )}

      {selectedTaskId && (
        <TaskDetail
          taskId={selectedTaskId}
          open={taskDetailOpen}
          onOpenChange={(open) => {
            setTaskDetailOpen(open);
            if (!open) setSelectedTaskId(null);
          }}
        />
      )}

      <CreateTaskDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={handleCreateTask}
        isSubmitting={isCreating}
      />
    </div>
  );
}

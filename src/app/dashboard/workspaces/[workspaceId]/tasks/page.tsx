"use client";

import { use, useState, useMemo } from "react";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useProjects } from "@/hooks/use-projects";
import { TaskDetail } from "@/components/task/task-detail";
import { CreateTaskDialog } from "@/components/task/create-task-dialog";
import { SpreadsheetView } from "@/components/views/spreadsheet-view";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckSquare, Plus, Search, Filter, FolderKanban, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Task, TaskStatus } from "@/types/task";
import type { Project } from "@/types/project";

const PROJECT_COLORS = [
  "bg-violet-500", "bg-blue-500", "bg-emerald-500", "bg-orange-500",
  "bg-pink-500", "bg-teal-500", "bg-fuchsia-500", "bg-amber-500",
];
function projectColor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return PROJECT_COLORS[h % PROJECT_COLORS.length];
}

type TaskWithProject = Task & { project?: Project };

interface WorkspaceTasksPageProps {
  params: Promise<{ workspaceId: string }>;
}

export default function WorkspaceTasksPage({ params }: WorkspaceTasksPageProps) {
  const { workspaceId } = use(params);
  const { projects, isLoading: projectsLoading } = useProjects(workspaceId);
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [taskDetailOpen, setTaskDetailOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const taskQueries = useQueries({
    queries: projects.map((project) => ({
      queryKey: ["tasks", project.id],
      queryFn: async () => {
        const res = await fetch(`/api/projects/${project.id}/tasks`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error?.message || "Failed");
        return (data.data as Task[]).map((t) => ({ ...t, project }));
      },
      enabled: projects.length > 0,
      staleTime: 60 * 1000,
    })),
  });

  const isTasksLoading = taskQueries.some((q) => q.isLoading);
  const allTasks: TaskWithProject[] = taskQueries.flatMap((q) => q.data ?? []);

  const filteredTasks = useMemo(() => {
    return allTasks.filter((t) => {
      if (selectedProject !== "all" && t.projectId !== selectedProject) return false;
      if (selectedStatus !== "all" && t.status !== selectedStatus) return false;
      if (search) {
        const s = search.toLowerCase();
        if (!t.title.toLowerCase().includes(s) && !t.description?.toLowerCase().includes(s)) return false;
      }
      return true;
    });
  }, [allTasks, selectedProject, selectedStatus, search]);

  const handleTaskClick = (task: Task) => {
    setSelectedTaskId(task.id);
    setTaskDetailOpen(true);
  };

  const isLoading = projectsLoading || isTasksLoading;
  const hasFilters = !!(search || selectedProject !== "all" || selectedStatus !== "all");

  return (
    <div className="flex flex-col gap-4">
      {/* Page title row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-blue-600" />
            All Tasks
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {filteredTasks.length} task{filteredTasks.length !== 1 ? "s" : ""} across {projects.length} project{projects.length !== 1 ? "s" : ""}
          </p>
        </div>
        {projects.length > 0 && (
          <Button size="sm" className="h-8 self-start" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            New Task
          </Button>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <Input
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-44 sm:w-52 pl-8 h-8 text-sm bg-white border-slate-200"
          />
        </div>
        <Select value={selectedProject} onValueChange={setSelectedProject}>
          <SelectTrigger className="w-36 sm:w-40 h-8 text-sm bg-white border-slate-200">
            <SelectValue placeholder="All Projects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                <span className="flex items-center gap-2">
                  <span className={cn("w-2 h-2 rounded-full inline-block shrink-0", projectColor(p.id))} />
                  <span className="truncate">{p.name}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" className="h-8 gap-1.5 border-slate-200 text-slate-600 bg-white">
          <Filter className="h-3.5 w-3.5" />
          <span className="hidden sm:inline text-xs">Filter</span>
        </Button>
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-slate-400 hover:text-slate-600"
            onClick={() => { setSearch(""); setSelectedProject("all"); setSelectedStatus("all"); }}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-1 rounded-xl border border-slate-200 overflow-hidden bg-white">
          <div className="h-10 bg-slate-50 border-b border-slate-100" />
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-10 w-full rounded-none" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={<FolderKanban className="h-10 w-10" />}
          title="No projects yet"
          description="Create a project first, then add tasks to it."
          action={
            <Button asChild>
              <Link href={`/dashboard/workspaces/${workspaceId}/projects/new`}>
                <Plus className="mr-2 h-4 w-4" /> Create Project
              </Link>
            </Button>
          }
        />
      ) : (
        <SpreadsheetView
          tasks={filteredTasks}
          onTaskClick={handleTaskClick}
          onAddTask={() => setCreateDialogOpen(true)}
        />
      )}

      {selectedTaskId && (
        <TaskDetail
          taskId={selectedTaskId}
          open={taskDetailOpen}
          workspaceId={workspaceId}
          onOpenChange={(open) => { setTaskDetailOpen(open); if (!open) setSelectedTaskId(null); }}
        />
      )}

      <CreateTaskDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        workspaceId={workspaceId}
        projects={projects}
        onSubmit={async (projectId, data) => {
          const res = await fetch(`/api/projects/${projectId}/tasks`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });
          if (!res.ok) throw new Error("Failed to create task");
          queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
        }}
        isSubmitting={false}
      />
    </div>
  );
}

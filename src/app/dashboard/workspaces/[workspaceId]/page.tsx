"use client";

import { use } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { useWorkspace } from "@/hooks/use-workspaces";
import { useProjects } from "@/hooks/use-projects";
import { Plus, FolderKanban, Users, Settings, ArrowRight, LayoutGrid } from "lucide-react";

const PROJECT_COLORS = [
  "from-violet-500 to-purple-600",
  "from-blue-500 to-indigo-600",
  "from-emerald-500 to-teal-600",
  "from-orange-500 to-amber-600",
  "from-pink-500 to-rose-600",
  "from-cyan-500 to-sky-600",
];

function getProjectColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return PROJECT_COLORS[hash % PROJECT_COLORS.length];
}

interface WorkspacePageProps {
  params: Promise<{ workspaceId: string }>;
}

export default function WorkspacePage({ params }: WorkspacePageProps) {
  const { workspaceId } = use(params);
  const { data: workspace, isLoading: workspaceLoading } = useWorkspace(workspaceId);
  const { projects, isLoading: projectsLoading } = useProjects(workspaceId);

  if (workspaceLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full rounded-xl" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-36" />
          <Skeleton className="h-36" />
          <Skeleton className="h-36" />
        </div>
      </div>
    );
  }

  if (!workspace) {
    return (
      <EmptyState
        title="Workspace not found"
        description="The workspace you're looking for doesn't exist or you don't have access."
        action={
          <Button asChild>
            <Link href="/dashboard/workspaces">View all workspaces</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header banner */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-violet-600 via-purple-700 to-indigo-800 p-6 text-white">
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-4 left-1/3 h-32 w-32 rounded-full bg-white/10 blur-xl" />
        <div className="relative flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-purple-200 text-sm mb-1">
              <LayoutGrid className="h-4 w-4" />
              Workspace
            </div>
            <h1 className="text-3xl font-bold">{workspace.name}</h1>
            <p className="mt-1 text-purple-100/80 max-w-lg">
              {workspace.description || "No description provided for this workspace."}
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm"
            asChild
          >
            <Link href={`/dashboard/workspaces/${workspaceId}/settings`}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Link>
          </Button>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10">
              <FolderKanban className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Projects</p>
              <p className="text-2xl font-bold">{projects.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-500/20 bg-blue-50/50 dark:bg-blue-950/20">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-500/10">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Team Members</p>
              <Button variant="link" className="h-auto p-0 text-2xl font-bold text-foreground" asChild>
                <Link href={`/dashboard/workspaces/${workspaceId}/members`}>View</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/20">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-500/10">
              <Plus className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">New Project</p>
              <Button variant="link" className="h-auto p-0 text-sm font-semibold text-emerald-600 dark:text-emerald-400" asChild>
                <Link href={`/dashboard/workspaces/${workspaceId}/projects/new`}>
                  Create one →
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projects section */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Projects</h2>
            <p className="text-sm text-muted-foreground">
              {projects.length} project{projects.length !== 1 ? "s" : ""} in this workspace
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/workspaces/${workspaceId}/projects`}>
                View all
                <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
            <Button size="sm" asChild>
              <Link href={`/dashboard/workspaces/${workspaceId}/projects/new`}>
                <Plus className="mr-1 h-4 w-4" />
                New Project
              </Link>
            </Button>
          </div>
        </div>

        {projectsLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-36" />
            <Skeleton className="h-36" />
            <Skeleton className="h-36" />
          </div>
        ) : projects.length === 0 ? (
          <EmptyState
            icon={<FolderKanban className="h-10 w-10" />}
            title="No projects yet"
            description="Create your first project to start organizing and tracking tasks."
            action={
              <Button asChild>
                <Link href={`/dashboard/workspaces/${workspaceId}/projects/new`}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create project
                </Link>
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.slice(0, 6).map((project) => (
              <Link
                key={project.id}
                href={`/dashboard/workspaces/${workspaceId}/projects/${project.id}/board`}
                className="group"
              >
                <Card className="h-full transition-all hover:shadow-md hover:-translate-y-0.5">
                  <CardHeader className="pb-3">
                    <div className={`mb-3 h-1.5 w-12 rounded-full bg-gradient-to-r ${getProjectColor(project.id)}`} />
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base leading-tight group-hover:text-primary transition-colors">
                        {project.name}
                      </CardTitle>
                      <Badge variant="outline" className="shrink-0 font-mono text-xs">
                        {project.key}
                      </Badge>
                    </div>
                    <CardDescription className="line-clamp-2">
                      {project.description || "No description"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{project.taskCount ?? 0} tasks</span>
                      <span className="flex items-center gap-1 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                        Open board <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}

            {/* Add new project card */}
            <Link href={`/dashboard/workspaces/${workspaceId}/projects/new`}>
              <Card className="h-full flex items-center justify-center border-dashed hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer min-h-[140px]">
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-dashed">
                    <Plus className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-medium">New Project</span>
                </div>
              </Card>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

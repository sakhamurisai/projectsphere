"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ProjectCard } from "@/components/project/project-card";
import { useProjects } from "@/hooks/use-projects";
import { Plus, FolderKanban } from "lucide-react";
import Link from "next/link";

interface ProjectsPageProps {
  params: Promise<{ workspaceId: string }>;
}

export default function ProjectsPage({ params }: ProjectsPageProps) {
  const { workspaceId } = use(params);
  const router = useRouter();
  const { projects, isLoading } = useProjects(workspaceId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground">
            Manage your projects in this workspace
          </p>
        </div>
        <Button asChild>
          <Link href={`/dashboard/workspaces/${workspaceId}/projects/new`}>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Link>
        </Button>
      </div>

      {projects.length === 0 ? (
        <EmptyState
          icon={<FolderKanban className="h-12 w-12" />}
          title="No projects yet"
          description="Create your first project to start managing tasks"
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
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={() => router.push(`/dashboard/workspaces/${workspaceId}/projects/${project.id}/board`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

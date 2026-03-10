"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ViewSwitcher } from "./view-switcher";
import { Settings, FolderKanban } from "lucide-react";
import type { Project } from "@/types/project";

interface ProjectHeaderProps {
  project: Project;
  workspaceId: string;
  currentView: "board" | "list";
}

export function ProjectHeader({ project, workspaceId, currentView }: ProjectHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <FolderKanban className="h-6 w-6 text-primary" />
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{project.name}</h1>
            <Badge variant={project.status === "active" ? "default" : "secondary"}>
              {project.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {project.key} - {project.taskCount} tasks
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <ViewSwitcher
          workspaceId={workspaceId}
          projectId={project.id}
          currentView={currentView}
        />
        <Button variant="outline" size="icon" asChild>
          <Link href={`/dashboard/workspaces/${workspaceId}/projects/${project.id}/settings`}>
            <Settings className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

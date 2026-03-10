"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckSquare, ArrowRight } from "lucide-react";
import type { Project } from "@/types/project";

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

interface ProjectCardProps {
  project: Project;
  onClick?: () => void;
}

export function ProjectCard({ project, onClick }: ProjectCardProps) {
  const color = getProjectColor(project.id);

  return (
    <Card
      className="group cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className={`mb-2 h-1.5 w-10 rounded-full bg-gradient-to-r ${color}`} />
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base leading-tight group-hover:text-primary transition-colors">
            {project.name}
          </CardTitle>
          <Badge
            variant={project.status === "active" ? "default" : "secondary"}
            className="shrink-0 capitalize"
          >
            {project.status}
          </Badge>
        </div>
        <CardDescription className="line-clamp-2">
          {project.description || "No description provided"}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="font-mono rounded bg-muted px-1.5 py-0.5">{project.key}</span>
            <div className="flex items-center gap-1">
              <CheckSquare className="h-3.5 w-3.5" />
              <span>{project.taskCount ?? 0} tasks</span>
            </div>
          </div>
          <span className="flex items-center gap-1 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
            Board <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

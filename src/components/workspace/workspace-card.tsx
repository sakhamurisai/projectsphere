"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";
import type { WorkspaceWithRole } from "@/types/workspace";

const WORKSPACE_COLORS = [
  "from-violet-500 to-purple-600",
  "from-blue-500 to-indigo-600",
  "from-emerald-500 to-teal-600",
  "from-orange-500 to-amber-600",
  "from-pink-500 to-rose-600",
  "from-cyan-500 to-sky-600",
];

const ROLE_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  owner: "default",
  admin: "secondary",
  member: "outline",
  viewer: "outline",
};

function getWorkspaceColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return WORKSPACE_COLORS[hash % WORKSPACE_COLORS.length];
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

interface WorkspaceCardProps {
  workspace: WorkspaceWithRole;
  onClick?: () => void;
}

export function WorkspaceCard({ workspace, onClick }: WorkspaceCardProps) {
  const color = getWorkspaceColor(workspace.id);

  return (
    <Card
      className="group cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${color} text-white text-sm font-bold shadow-sm`}>
            {getInitials(workspace.name)}
          </div>
          <Badge variant={ROLE_VARIANT[workspace.role] ?? "outline"} className="capitalize">
            {workspace.role}
          </Badge>
        </div>
        <CardTitle className="mt-3 text-lg group-hover:text-primary transition-colors">
          {workspace.name}
        </CardTitle>
        <CardDescription className="line-clamp-2">
          {workspace.description || "No description provided"}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-mono">/{workspace.slug}</span>
          <span className="flex items-center gap-1 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
            Open <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

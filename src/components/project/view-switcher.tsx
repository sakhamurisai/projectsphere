"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/utils";

interface ViewSwitcherProps {
  workspaceId: string;
  projectId: string;
  currentView: "board" | "list";
}

export function ViewSwitcher({ workspaceId, projectId, currentView }: ViewSwitcherProps) {
  const baseUrl = `/dashboard/workspaces/${workspaceId}/projects/${projectId}`;

  return (
    <div className="flex rounded-lg border p-1">
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "h-8 px-3",
          currentView === "board" && "bg-muted"
        )}
        asChild
      >
        <Link href={`${baseUrl}/board`}>
          <LayoutGrid className="mr-2 h-4 w-4" />
          Board
        </Link>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "h-8 px-3",
          currentView === "list" && "bg-muted"
        )}
        asChild
      >
        <Link href={`${baseUrl}/list`}>
          <List className="mr-2 h-4 w-4" />
          List
        </Link>
      </Button>
    </div>
  );
}

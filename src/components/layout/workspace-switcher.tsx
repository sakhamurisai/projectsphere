"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useWorkspaces } from "@/hooks/use-workspaces";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { Plus, Building2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

export function WorkspaceSwitcher() {
  const router = useRouter();
  const params = useParams();
  const { workspaces, isLoading } = useWorkspaces();
  const { currentWorkspace, setCurrentWorkspace, setWorkspaces } = useWorkspaceStore();

  const workspaceId = params?.workspaceId as string | undefined;

  useEffect(() => {
    if (workspaces.length > 0) {
      setWorkspaces(workspaces);

      // Set current workspace based on URL or fallback to first
      if (workspaceId) {
        const workspace = workspaces.find((ws) => ws.id === workspaceId);
        if (workspace) {
          setCurrentWorkspace(workspace);
        }
      } else if (!currentWorkspace) {
        setCurrentWorkspace(workspaces[0]);
      }
    }
  }, [workspaces, workspaceId, currentWorkspace, setCurrentWorkspace, setWorkspaces]);

  const handleWorkspaceChange = (value: string) => {
    const workspace = workspaces.find((ws) => ws.id === value);
    if (workspace) {
      setCurrentWorkspace(workspace);
      router.push(`/dashboard/workspaces/${workspace.id}`);
    }
  };

  if (isLoading) {
    return <Skeleton className="h-9 w-40" />;
  }

  if (workspaces.length === 0) {
    return (
      <Button variant="outline" size="sm" asChild>
        <Link href="/dashboard/workspaces/new" className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create workspace
        </Link>
      </Button>
    );
  }

  return (
    <Select
      value={currentWorkspace?.id || ""}
      onValueChange={handleWorkspaceChange}
    >
      <SelectTrigger className="w-[180px]">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          <SelectValue placeholder="Select workspace" />
        </div>
      </SelectTrigger>
      <SelectContent>
        {workspaces.map((workspace) => (
          <SelectItem key={workspace.id} value={workspace.id}>
            {workspace.name}
          </SelectItem>
        ))}
        <div className="border-t pt-1 mt-1">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            asChild
          >
            <Link href="/dashboard/workspaces/new" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create workspace
            </Link>
          </Button>
        </div>
      </SelectContent>
    </Select>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { WorkspaceCard } from "@/components/workspace/workspace-card";
import { useWorkspaces } from "@/hooks/use-workspaces";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { Plus, LayoutGrid } from "lucide-react";
import Link from "next/link";

export default function WorkspacesPage() {
  const router = useRouter();
  const { workspaces, isLoading } = useWorkspaces();
  const { setCurrentWorkspace } = useWorkspaceStore();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-44" />
          <Skeleton className="h-44" />
          <Skeleton className="h-44" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <LayoutGrid className="h-4 w-4" />
            <span>All Workspaces</span>
          </div>
          <h1 className="text-3xl font-bold">Workspaces</h1>
          <p className="text-muted-foreground">
            {workspaces.length > 0
              ? `You're a member of ${workspaces.length} workspace${workspaces.length !== 1 ? "s" : ""}`
              : "Create a workspace to start collaborating"}
          </p>
        </div>
        <Button asChild>
          <Link href="/workspaces/new">
            <Plus className="mr-2 h-4 w-4" />
            New Workspace
          </Link>
        </Button>
      </div>

      {workspaces.length === 0 ? (
        <EmptyState
          icon={<LayoutGrid className="h-12 w-12" />}
          title="No workspaces yet"
          description="Create your first workspace to start managing projects with your team."
          action={
            <Button asChild>
              <Link href="/workspaces/new">
                <Plus className="mr-2 h-4 w-4" />
                Create workspace
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {workspaces.map((workspace) => (
            <WorkspaceCard
              key={workspace.id}
              workspace={workspace}
              onClick={() => {
                setCurrentWorkspace(workspace);
                router.push(`/workspaces/${workspace.id}`);
              }}
            />
          ))}
          <Link href="/workspaces/new">
            <div className="flex h-full min-h-[160px] cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed text-muted-foreground transition-all hover:border-primary/50 hover:text-primary hover:bg-primary/5">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-dashed">
                <Plus className="h-6 w-6" />
              </div>
              <span className="text-sm font-medium">New Workspace</span>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WorkspaceForm } from "@/components/workspace/workspace-form";
import { useWorkspaces } from "@/hooks/use-workspaces";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { toast } from "sonner";
import type { CreateWorkspaceInput } from "@/validations/workspace";

export default function NewWorkspacePage() {
  const router = useRouter();
  const { createWorkspaceAsync, isCreating } = useWorkspaces();
  const { setCurrentWorkspace } = useWorkspaceStore();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: CreateWorkspaceInput) => {
    try {
      setError(null);
      const workspace = await createWorkspaceAsync(data);
      setCurrentWorkspace({ ...workspace, role: "owner" });
      toast.success("Workspace created successfully");
      router.push(`/dashboard/workspaces/${workspace.id}`);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to create workspace");
      }
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Create Workspace</CardTitle>
          <CardDescription>
            Create a new workspace to organize your projects and collaborate with your team.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <WorkspaceForm onSubmit={handleSubmit} isSubmitting={isCreating} />
        </CardContent>
      </Card>
    </div>
  );
}

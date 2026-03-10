"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { useWorkspace, useWorkspaces, useWorkspaceMembers } from "@/hooks/use-workspaces";
import { useAuthStore } from "@/stores/auth-store";
import { canManageWorkspaceSettings, canDeleteWorkspace } from "@/constants/roles";
import { updateWorkspaceSchema, type UpdateWorkspaceInput } from "@/validations/workspace";
import { toast } from "sonner";

interface SettingsPageProps {
  params: Promise<{ workspaceId: string }>;
}

export default function SettingsPage({ params }: SettingsPageProps) {
  const { workspaceId } = use(params);
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: workspace, isLoading: workspaceLoading } = useWorkspace(workspaceId);
  const { members } = useWorkspaceMembers(workspaceId);
  const { updateWorkspaceAsync, isUpdating, deleteWorkspaceAsync, isDeleting } = useWorkspaces();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentMember = members.find((m) => m.userId === user?.id);
  const canManage = currentMember && canManageWorkspaceSettings(currentMember.role);
  const canDelete = currentMember && canDeleteWorkspace(currentMember.role);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<UpdateWorkspaceInput>({
    resolver: zodResolver(updateWorkspaceSchema),
    values: workspace ? { name: workspace.name, description: workspace.description } : undefined,
  });

  const onSubmit = async (data: UpdateWorkspaceInput) => {
    try {
      setError(null);
      await updateWorkspaceAsync({ workspaceId, input: data });
      toast.success("Workspace updated");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to update workspace");
      }
    }
  };

  const handleDelete = async () => {
    try {
      await deleteWorkspaceAsync(workspaceId);
      toast.success("Workspace deleted");
      router.push("/dashboard/workspaces");
    } catch (err) {
      toast.error("Failed to delete workspace");
    }
  };

  if (workspaceLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage workspace settings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
          <CardDescription>Update workspace information</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                {...register("name")}
                disabled={!canManage}
                aria-invalid={!!errors.name}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={3}
                {...register("description")}
                disabled={!canManage}
                aria-invalid={!!errors.description}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>
            {canManage && (
              <Button type="submit" disabled={isUpdating || !isDirty}>
                {isUpdating ? <LoadingSpinner size="sm" className="mr-2" /> : null}
                Save Changes
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      {canDelete && (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>
              Permanently delete this workspace and all its data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
              Delete Workspace
            </Button>
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete workspace?"
        description="This action cannot be undone. All projects, tasks, and data will be permanently deleted."
        confirmText="Delete"
        variant="destructive"
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </div>
  );
}

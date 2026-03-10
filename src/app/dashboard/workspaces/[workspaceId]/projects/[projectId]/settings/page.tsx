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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { ProjectMembersTab } from "@/components/project/project-members-tab";
import { useProject, useProjectMembers } from "@/hooks/use-projects";
import { useAuthStore } from "@/stores/auth-store";
import { updateProjectSchema, type UpdateProjectInput } from "@/validations/project";
import { toast } from "sonner";
import { Settings, Users, Archive, Trash2 } from "lucide-react";

interface ProjectSettingsPageProps {
  params: Promise<{ workspaceId: string; projectId: string }>;
}

export default function ProjectSettingsPage({ params }: ProjectSettingsPageProps) {
  const { workspaceId, projectId } = use(params);
  const router = useRouter();
  const { user } = useAuthStore();
  const { project, isLoading, updateProjectAsync, isUpdating, deleteProjectAsync, isDeleting } =
    useProject(projectId);
  const { members } = useProjectMembers(projectId);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<UpdateProjectInput>({
    resolver: zodResolver(updateProjectSchema),
    values: project ? { name: project.name, description: project.description } : undefined,
  });

  const currentUserRole = members.find((m) => m.userId === user?.id)?.role ?? null;
  const canManage = currentUserRole === "owner" || currentUserRole === "admin";

  const onSubmit = async (data: UpdateProjectInput) => {
    try {
      await updateProjectAsync(data);
      toast.success("Project updated");
    } catch {
      toast.error("Failed to update project");
    }
  };

  const handleArchive = async () => {
    try {
      await updateProjectAsync({ status: project?.status === "active" ? "archived" : "active" });
      toast.success(project?.status === "active" ? "Project archived" : "Project restored");
      setArchiveDialogOpen(false);
    } catch {
      toast.error("Failed to update project status");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteProjectAsync();
      toast.success("Project deleted");
      router.push(`/dashboard/workspaces/${workspaceId}/projects`);
    } catch {
      toast.error("Failed to delete project");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!project) return <div className="text-sm text-muted-foreground">Project not found.</div>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">{project.name} — Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage project details, members, and danger zone actions.
        </p>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="mb-2">
          <TabsTrigger value="general" className="gap-2">
            <Settings className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="members" className="gap-2">
            <Users className="h-4 w-4" />
            Members
          </TabsTrigger>
          {canManage && (
            <TabsTrigger value="danger" className="gap-2 text-destructive data-[state=active]:text-destructive">
              <Trash2 className="h-4 w-4" />
              Danger Zone
            </TabsTrigger>
          )}
        </TabsList>

        {/* General tab */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General</CardTitle>
              <CardDescription>Update project name and description</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="name">Project Name</Label>
                  <Input id="name" {...register("name")} aria-invalid={!!errors.name} />
                  {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Project Key</Label>
                  <Input value={project.key} disabled className="font-mono tracking-widest" />
                  <p className="text-xs text-muted-foreground">Keys cannot be changed after creation</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    rows={3}
                    placeholder="What is this project about?"
                    {...register("description")}
                    aria-invalid={!!errors.description}
                  />
                  {errors.description && (
                    <p className="text-sm text-destructive">{errors.description.message}</p>
                  )}
                </div>

                <Button type="submit" disabled={isUpdating || !isDirty}>
                  {isUpdating && <LoadingSpinner size="sm" className="mr-2" />}
                  Save Changes
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Archive */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Archive className="h-4 w-4" />
                Project Status
              </CardTitle>
              <CardDescription>
                {project.status === "active"
                  ? "Archive this project to hide it from the main view."
                  : "Restore this project to make it active again."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant={project.status === "active" ? "secondary" : "default"}
                onClick={() => setArchiveDialogOpen(true)}
              >
                {project.status === "active" ? "Archive Project" : "Restore Project"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Members tab */}
        <TabsContent value="members">
          <Card>
            <CardHeader>
              <CardTitle>Project Members</CardTitle>
              <CardDescription>
                Control who has access to this project.{" "}
                {!canManage && "Only admins and owners can manage members."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProjectMembersTab
                projectId={projectId}
                workspaceId={workspaceId}
                ownerId={project.ownerId}
                currentUserRole={currentUserRole}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Danger zone */}
        {canManage && (
          <TabsContent value="danger">
            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                <CardDescription>
                  Permanently delete this project and all its tasks. This cannot be undone.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Project
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      <ConfirmDialog
        open={archiveDialogOpen}
        onOpenChange={setArchiveDialogOpen}
        title={project.status === "active" ? "Archive project?" : "Restore project?"}
        description={
          project.status === "active"
            ? "Archived projects are hidden from the main list but can be restored."
            : "This project will become active and visible again."
        }
        confirmText={project.status === "active" ? "Archive" : "Restore"}
        onConfirm={handleArchive}
        isLoading={isUpdating}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete project?"
        description="All tasks and data will be permanently deleted. This cannot be undone."
        confirmText="Delete"
        variant="destructive"
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </div>
  );
}

"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectForm } from "@/components/project/project-form";
import { useProjects } from "@/hooks/use-projects";
import { toast } from "sonner";
import type { CreateProjectInput } from "@/validations/project";

interface NewProjectPageProps {
  params: Promise<{ workspaceId: string }>;
}

export default function NewProjectPage({ params }: NewProjectPageProps) {
  const { workspaceId } = use(params);
  const router = useRouter();
  const { createProjectAsync, isCreating } = useProjects(workspaceId);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: CreateProjectInput) => {
    try {
      setError(null);
      const project = await createProjectAsync(data);
      toast.success("Project created successfully");
      router.push(`/dashboard/workspaces/${workspaceId}/projects/${project.id}/board`);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to create project");
      }
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Create Project</CardTitle>
          <CardDescription>
            Create a new project to organize and track your tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <ProjectForm onSubmit={handleSubmit} isSubmitting={isCreating} />
        </CardContent>
      </Card>
    </div>
  );
}

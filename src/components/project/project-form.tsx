"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { createProjectSchema, type CreateProjectInput } from "@/validations/project";

interface ProjectFormProps {
  onSubmit: (data: CreateProjectInput) => void;
  isSubmitting?: boolean;
  defaultValues?: Partial<CreateProjectInput>;
}

export function ProjectForm({ onSubmit, isSubmitting, defaultValues }: ProjectFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateProjectInput>({
    resolver: zodResolver(createProjectSchema),
    defaultValues,
  });

  const name = watch("name");

  useEffect(() => {
    if (name && !defaultValues?.key) {
      const key = name
        .replace(/[^a-zA-Z0-9]+/g, "")
        .toUpperCase()
        .slice(0, 6);
      if (key.length >= 2) setValue("key", key, { shouldValidate: true });
    }
  }, [name, setValue, defaultValues?.key]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Project Name</Label>
        <Input
          id="name"
          placeholder="My Project"
          {...register("name")}
          aria-invalid={!!errors.name}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="key">Project Key</Label>
        <Input
          id="key"
          placeholder="PROJ"
          maxLength={10}
          {...register("key")}
          onChange={(e) => {
            const upper = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
            setValue("key", upper, { shouldValidate: true });
          }}
          aria-invalid={!!errors.key}
          className="font-mono tracking-widest"
        />
        <p className="text-xs text-muted-foreground">
          This key will be used as a prefix for task IDs (e.g., PROJ-1)
        </p>
        {errors.key && (
          <p className="text-sm text-destructive">{errors.key.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (optional)</Label>
        <Textarea
          id="description"
          placeholder="Describe your project..."
          rows={3}
          {...register("description")}
          aria-invalid={!!errors.description}
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? <LoadingSpinner size="sm" className="mr-2" /> : null}
        Create Project
      </Button>
    </form>
  );
}

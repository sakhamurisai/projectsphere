"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RoleSelect } from "./role-select";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { addMemberSchema, type AddMemberInput } from "@/validations/workspace";
import type { WorkspaceRole } from "@/types/workspace";

interface AddMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: AddMemberInput) => Promise<void>;
}

export function AddMemberDialog({ open, onOpenChange, onSubmit }: AddMemberDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [role, setRole] = useState<WorkspaceRole>("member");
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddMemberInput>({
    resolver: zodResolver(addMemberSchema),
    defaultValues: {
      role: "member",
    },
  });

  const handleFormSubmit = async (data: AddMemberInput) => {
    try {
      setIsSubmitting(true);
      setError(null);
      const safeRole = (["admin", "member", "viewer"] as const).includes(role as "admin" | "member" | "viewer")
        ? (role as "admin" | "member" | "viewer")
        : "member";
      await onSubmit({ ...data, role: safeRole });
      reset();
      setRole("member");
      onOpenChange(false);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to add member");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Member</DialogTitle>
          <DialogDescription>
            Invite a new member to this workspace by their email address.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <div className="space-y-4 py-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="member@example.com"
                {...register("email")}
                aria-invalid={!!errors.email}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <RoleSelect value={role} onChange={setRole} />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <LoadingSpinner size="sm" className="mr-2" /> : null}
              Add Member
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

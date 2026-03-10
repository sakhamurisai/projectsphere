"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/shared/user-avatar";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useProjectMembers } from "@/hooks/use-projects";
import { useWorkspaceMembers } from "@/hooks/use-workspaces";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";
import { Plus, MoreHorizontal, Trash2, Users, Crown, ShieldCheck, Eye, UserCheck } from "lucide-react";
import { format } from "date-fns";
import type { ProjectMember, ProjectRole } from "@/types/project";
import { cn } from "@/lib/utils";

const ROLE_CONFIG: Record<ProjectRole, { label: string; icon: React.ReactNode; color: string }> = {
  owner:  { label: "Owner",  icon: <Crown className="h-3 w-3" />,       color: "bg-amber-100 text-amber-700 border-amber-200" },
  admin:  { label: "Admin",  icon: <ShieldCheck className="h-3 w-3" />, color: "bg-blue-100 text-blue-700 border-blue-200" },
  member: { label: "Member", icon: <UserCheck className="h-3 w-3" />,   color: "bg-slate-100 text-slate-700 border-slate-200" },
  viewer: { label: "Viewer", icon: <Eye className="h-3 w-3" />,         color: "bg-purple-100 text-purple-700 border-purple-200" },
};

interface AddMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  workspaceId: string;
  existingMemberIds: string[];
}

function AddMemberDialog({ open, onOpenChange, projectId, workspaceId, existingMemberIds }: AddMemberDialogProps) {
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState<ProjectRole>("member");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { members: wsMembers, isLoading } = useWorkspaceMembers(workspaceId);
  const available = wsMembers.filter((m) => !existingMemberIds.includes(m.userId));

  const handleAdd = async () => {
    if (!selectedUserId) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedUserId, role: selectedRole }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? "Failed to add member");
      toast.success("Member added to project");
      setSelectedUserId("");
      setSelectedRole("member");
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add member");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Project Member</DialogTitle>
          <DialogDescription>
            Add a workspace member to this project with a specific role.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {error && (
            <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Member</label>
            {isLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : available.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">
                All workspace members are already in this project.
              </p>
            ) : (
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a member..." />
                </SelectTrigger>
                <SelectContent>
                  {available.map((m) => (
                    <SelectItem key={m.userId} value={m.userId}>
                      <div className="flex items-center gap-2">
                        <UserAvatar
                          name={m.user?.name}
                          email={m.user?.email}
                          avatarUrl={m.user?.avatarUrl}
                          size="sm"
                        />
                        <span>{m.user?.name ?? m.user?.email}</span>
                        <span className="text-xs text-muted-foreground">({m.role})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Role</label>
            <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as ProjectRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(["admin", "member", "viewer"] as ProjectRole[]).map((role) => {
                  const cfg = ROLE_CONFIG[role];
                  return (
                    <SelectItem key={role} value={role}>
                      <div className="flex items-center gap-2">
                        {cfg.icon}
                        {cfg.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={!selectedUserId || isSubmitting || available.length === 0}>
            {isSubmitting ? <LoadingSpinner size="sm" className="mr-2" /> : <Plus className="mr-2 h-4 w-4" />}
            Add to Project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface ProjectMembersTabProps {
  projectId: string;
  workspaceId: string;
  ownerId: string;
  currentUserRole: ProjectRole | null;
}

export function ProjectMembersTab({ projectId, workspaceId, ownerId, currentUserRole }: ProjectMembersTabProps) {
  const { user } = useAuthStore();
  const {
    members,
    isLoading,
    updateMemberRoleAsync,
    isUpdatingRole,
    removeMemberAsync,
    isRemovingMember,
  } = useProjectMembers(projectId);

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<ProjectMember | null>(null);

  const canManage = currentUserRole === "owner" || currentUserRole === "admin";

  const handleRoleChange = async (memberId: string, role: ProjectRole) => {
    try {
      await updateMemberRoleAsync({ memberId, role });
      toast.success("Role updated");
    } catch {
      toast.error("Failed to update role");
    }
  };

  const handleRemove = async () => {
    if (!memberToRemove) return;
    try {
      await removeMemberAsync(memberToRemove.userId);
      toast.success("Member removed from project");
      setMemberToRemove(null);
    } catch {
      toast.error("Failed to remove member");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>{members.length} member{members.length !== 1 ? "s" : ""}</span>
        </div>
        {canManage && (
          <Button size="sm" onClick={() => setAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Member
          </Button>
        )}
      </div>

      {/* Member rows */}
      <div className="divide-y rounded-xl border overflow-hidden">
        {members.map((member) => {
          const cfg = ROLE_CONFIG[member.role];
          const isOwner = member.userId === ownerId;
          const isSelf = member.userId === user?.id;
          const canEdit = canManage && !isOwner;

          return (
            <div key={member.userId} className="flex items-center gap-4 px-4 py-3 hover:bg-muted/30 transition-colors">
              <UserAvatar
                name={member.user?.name}
                email={member.user?.email}
                avatarUrl={member.user?.avatarUrl}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{member.user?.name ?? "—"}</p>
                  {isSelf && <span className="text-[10px] text-muted-foreground bg-muted rounded-full px-1.5 py-0.5">You</span>}
                </div>
                <p className="text-xs text-muted-foreground truncate">{member.user?.email}</p>
              </div>

              {/* Role */}
              <div className="shrink-0">
                {canEdit ? (
                  <Select
                    value={member.role}
                    onValueChange={(v) => handleRoleChange(member.userId, v as ProjectRole)}
                    disabled={isUpdatingRole}
                  >
                    <SelectTrigger className="h-7 w-32 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(["admin", "member", "viewer"] as ProjectRole[]).map((role) => (
                        <SelectItem key={role} value={role} className="text-sm">
                          <div className="flex items-center gap-1.5">
                            {ROLE_CONFIG[role].icon}
                            {ROLE_CONFIG[role].label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium", cfg.color)}>
                    {cfg.icon}
                    {cfg.label}
                  </span>
                )}
              </div>

              {/* Joined */}
              <div className="shrink-0 w-24 text-right hidden md:block">
                <p className="text-xs text-muted-foreground">
                  {format(new Date(member.joinedAt), "MMM d, yyyy")}
                </p>
              </div>

              {/* Actions */}
              {canManage && !isOwner && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => setMemberToRemove(member)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {isSelf ? "Leave project" : "Remove member"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          );
        })}

        {members.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <Users className="h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No members yet</p>
            {canManage && (
              <Button size="sm" variant="outline" onClick={() => setAddDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add first member
              </Button>
            )}
          </div>
        )}
      </div>

      <AddMemberDialog
        open={addDialogOpen}
        onOpenChange={(open) => { setAddDialogOpen(open); }}
        projectId={projectId}
        workspaceId={workspaceId}
        existingMemberIds={members.map((m) => m.userId)}
      />

      <ConfirmDialog
        open={!!memberToRemove}
        onOpenChange={(open) => !open && setMemberToRemove(null)}
        title={memberToRemove?.userId === user?.id ? "Leave project?" : "Remove member?"}
        description={
          memberToRemove?.userId === user?.id
            ? "You'll lose access to this project."
            : `Remove ${memberToRemove?.user?.name ?? "this member"} from the project?`
        }
        confirmText={memberToRemove?.userId === user?.id ? "Leave" : "Remove"}
        variant="destructive"
        onConfirm={handleRemove}
        isLoading={isRemovingMember}
      />
    </div>
  );
}

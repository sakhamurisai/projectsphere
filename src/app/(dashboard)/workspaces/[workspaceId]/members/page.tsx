"use client";

import { use, useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MemberList } from "@/components/workspace/member-list";
import { AddMemberDialog } from "@/components/workspace/add-member-dialog";
import { useWorkspace, useWorkspaceMembers } from "@/hooks/use-workspaces";
import { useAuthStore } from "@/stores/auth-store";
import { canManageWorkspaceMembers } from "@/constants/roles";
import { Plus, Mail, Clock, CheckCircle2, XCircle, Users } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import type { WorkspaceRole } from "@/types/workspace";
import type { Invitation } from "@/types/invitation";

interface MembersPageProps {
  params: Promise<{ workspaceId: string }>;
}

export default function MembersPage({ params }: MembersPageProps) {
  const { workspaceId } = use(params);
  const { user } = useAuthStore();
  const { data: workspace, isLoading: workspaceLoading } = useWorkspace(workspaceId);
  const {
    members,
    isLoading: membersLoading,
    addMemberAsync,
    isAddingMember,
    updateMemberRole,
    isUpdatingRole,
    removeMemberAsync,
    isRemovingMember,
  } = useWorkspaceMembers(workspaceId);

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [invitesLoading, setInvitesLoading] = useState(false);

  const currentMember = members.find((m) => m.userId === user?.id);
  const canManage = currentMember && canManageWorkspaceMembers(currentMember.role);

  // Load invitations
  useEffect(() => {
    if (!canManage) return;
    setInvitesLoading(true);
    fetch(`/api/workspaces/${workspaceId}/invitations`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setInvitations(d.data);
      })
      .catch(() => {})
      .finally(() => setInvitesLoading(false));
  }, [workspaceId, canManage]);

  const handleAddMember = async (data: { email: string; role: "admin" | "member" | "viewer" }) => {
    await addMemberAsync(data);
    toast.success("Member added successfully");
  };

  const handleInviteMember = async (data: { email: string; role: "admin" | "member" | "viewer" }) => {
    const res = await fetch(`/api/workspaces/${workspaceId}/invitations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message ?? "Failed to send invitation");
    setInvitations((prev) => [json.data, ...prev]);
    toast.success(`Invitation sent to ${data.email}`);
  };

  const handleUpdateRole = (memberId: string, role: WorkspaceRole) => {
    updateMemberRole({ memberId, role });
    toast.success("Role updated");
  };

  const handleRemoveMember = async (memberId: string) => {
    await removeMemberAsync(memberId);
    toast.success("Member removed");
  };

  const handleRevokeInvite = async (inviteId: string) => {
    const res = await fetch(`/api/workspaces/${workspaceId}/invitations/${inviteId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setInvitations((prev) => prev.filter((i) => i.id !== inviteId));
      toast.success("Invitation revoked");
    }
  };

  const STATUS_ICON: Record<string, React.ReactNode> = {
    pending: <Clock className="h-3.5 w-3.5 text-amber-500" />,
    accepted: <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />,
    revoked: <XCircle className="h-3.5 w-3.5 text-red-500" />,
    expired: <XCircle className="h-3.5 w-3.5 text-muted-foreground" />,
  };

  if (workspaceLoading || membersLoading) {
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

  const pendingInvites = invitations.filter((i) => i.status === "pending");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Members</h1>
          <p className="text-muted-foreground">
            Manage the team for <strong>{workspace?.name}</strong>
          </p>
        </div>
        {canManage && (
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Invite Member
          </Button>
        )}
      </div>

      <Tabs defaultValue="members">
        <TabsList>
          <TabsTrigger value="members" className="gap-2">
            <Users className="h-4 w-4" />
            Members
            <Badge variant="secondary" className="ml-1">{members.length}</Badge>
          </TabsTrigger>
          {canManage && (
            <TabsTrigger value="invitations" className="gap-2">
              <Mail className="h-4 w-4" />
              Invitations
              {pendingInvites.length > 0 && (
                <Badge variant="default" className="ml-1">{pendingInvites.length}</Badge>
              )}
            </TabsTrigger>
          )}
        </TabsList>

        {/* Members tab */}
        <TabsContent value="members">
          <Card>
            <CardHeader>
              <CardTitle>Workspace Members</CardTitle>
              <CardDescription>
                {members.length} member{members.length !== 1 ? "s" : ""} in this workspace
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MemberList
                members={members}
                currentUserId={user?.id}
                ownerId={workspace?.ownerId}
                canManageMembers={canManage || false}
                onUpdateRole={handleUpdateRole}
                onRemoveMember={handleRemoveMember}
                isUpdating={isUpdatingRole}
                isRemoving={isRemovingMember}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invitations tab */}
        {canManage && (
          <TabsContent value="invitations">
            <Card>
              <CardHeader>
                <CardTitle>Pending Invitations</CardTitle>
                <CardDescription>
                  Manage email invitations for this workspace
                </CardDescription>
              </CardHeader>
              <CardContent>
                {invitesLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
                  </div>
                ) : invitations.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-10 text-center">
                    <Mail className="h-10 w-10 text-muted-foreground/40" />
                    <p className="text-muted-foreground text-sm">No invitations sent yet</p>
                    <Button size="sm" onClick={() => setAddDialogOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Send an invite
                    </Button>
                  </div>
                ) : (
                  <div className="divide-y rounded-lg border">
                    {invitations.map((invite) => (
                      <div key={invite.id} className="flex items-center justify-between px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium">
                            {invite.email[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{invite.email}</p>
                            <p className="text-xs text-muted-foreground">
                              Invited by {invite.invitedByName} ·{" "}
                              {format(new Date(invite.createdAt), "MMM d, yyyy")}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="capitalize text-xs">
                            {invite.role}
                          </Badge>
                          <div className="flex items-center gap-1 text-xs">
                            {STATUS_ICON[invite.status]}
                            <span className="capitalize text-muted-foreground">{invite.status}</span>
                          </div>
                          {invite.status === "pending" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs text-destructive hover:text-destructive"
                              onClick={() => handleRevokeInvite(invite.id)}
                            >
                              Revoke
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      <AddMemberDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSubmit={handleInviteMember}
      />
    </div>
  );
}

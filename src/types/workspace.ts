export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description?: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceCreateInput {
  name: string;
  slug: string;
  description?: string;
}

export interface WorkspaceUpdateInput {
  name?: string;
  description?: string;
}

export interface WorkspaceMember {
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  user?: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
  joinedAt: string;
}

export type WorkspaceRole = "owner" | "admin" | "member" | "viewer";

export interface WorkspaceDBItem extends Record<string, unknown> {
  PK: string;
  SK: string;
  GSI1PK: string;
  GSI1SK: string;
  id: string;
  name: string;
  slug: string;
  description?: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceMemberDBItem extends Record<string, unknown> {
  PK: string;
  SK: string;
  GSI1PK: string;
  GSI1SK: string;
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  joinedAt: string;
}

export interface WorkspaceWithRole extends Workspace {
  role: WorkspaceRole;
}

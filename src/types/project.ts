export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  key: string;
  description?: string;
  status: ProjectStatus;
  ownerId: string;
  taskCount: number;
  createdAt: string;
  updatedAt: string;
}

export type ProjectStatus = "active" | "archived";

export interface ProjectCreateInput {
  name: string;
  key: string;
  description?: string;
}

export interface ProjectUpdateInput {
  name?: string;
  description?: string;
  status?: ProjectStatus;
}

export interface ProjectMember {
  projectId: string;
  userId: string;
  role: ProjectRole;
  user?: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
  joinedAt: string;
}

export type ProjectRole = "owner" | "admin" | "member" | "viewer";

export interface ProjectDBItem extends Record<string, unknown> {
  PK: string;
  SK: string;
  GSI1PK: string;
  GSI1SK: string;
  id: string;
  workspaceId: string;
  name: string;
  key: string;
  description?: string;
  status: ProjectStatus;
  ownerId: string;
  taskCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMemberDBItem extends Record<string, unknown> {
  PK: string;
  SK: string;
  GSI1PK: string;
  GSI1SK: string;
  projectId: string;
  userId: string;
  role: ProjectRole;
  joinedAt: string;
}

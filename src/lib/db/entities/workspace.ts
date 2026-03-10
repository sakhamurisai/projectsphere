import { nanoid } from "nanoid";
import { getItem, putItem, updateItem, deleteItem, queryItems, queryByIndex, batchWriteItems } from "../operations";
import { TABLES } from "../client";
import { getUserById } from "./user";
import type {
  Workspace,
  WorkspaceCreateInput,
  WorkspaceUpdateInput,
  WorkspaceMember,
  WorkspaceRole,
  WorkspaceDBItem,
  WorkspaceMemberDBItem,
  WorkspaceWithRole
} from "@/types/workspace";

// Workspace metadata and members are stored in the same WORKSPACES table,
// differentiated by SK (METADATA vs MEMBER#userId)
const T = TABLES.WORKSPACES;

export function createWorkspacePK(workspaceId: string): string {
  return `WORKSPACE#${workspaceId}`;
}

export function createWorkspaceSK(): string {
  return "METADATA";
}

export function createMemberSK(userId: string): string {
  return `MEMBER#${userId}`;
}

export function createUserWorkspaceGSI(userId: string): string {
  return `USER#${userId}`;
}

function dbItemToWorkspace(item: WorkspaceDBItem): Workspace {
  return {
    id: item.id,
    name: item.name,
    slug: item.slug,
    description: item.description,
    ownerId: item.ownerId,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

function dbItemToMember(item: WorkspaceMemberDBItem): WorkspaceMember {
  return {
    workspaceId: item.workspaceId,
    userId: item.userId,
    role: item.role,
    joinedAt: item.joinedAt,
  };
}

export async function createWorkspace(input: WorkspaceCreateInput, ownerId: string): Promise<Workspace> {
  const id = nanoid();
  const now = new Date().toISOString();

  const workspaceItem: WorkspaceDBItem = {
    PK: createWorkspacePK(id),
    SK: createWorkspaceSK(),
    GSI1PK: createWorkspacePK(id),
    GSI1SK: createWorkspaceSK(),
    id,
    name: input.name,
    slug: input.slug.toLowerCase(),
    description: input.description,
    ownerId,
    createdAt: now,
    updatedAt: now,
  };

  const memberItem: WorkspaceMemberDBItem = {
    PK: createWorkspacePK(id),
    SK: createMemberSK(ownerId),
    GSI1PK: createUserWorkspaceGSI(ownerId),
    GSI1SK: createWorkspacePK(id),
    workspaceId: id,
    userId: ownerId,
    role: "owner",
    joinedAt: now,
  };

  await batchWriteItems(T, [{ put: workspaceItem }, { put: memberItem }]);

  return dbItemToWorkspace(workspaceItem);
}

export async function getWorkspaceById(workspaceId: string): Promise<Workspace | null> {
  const item = await getItem<WorkspaceDBItem>(T, createWorkspacePK(workspaceId), createWorkspaceSK());
  return item ? dbItemToWorkspace(item) : null;
}

export async function updateWorkspace(workspaceId: string, input: WorkspaceUpdateInput): Promise<Workspace | null> {
  const existingWorkspace = await getWorkspaceById(workspaceId);
  if (!existingWorkspace) return null;

  const updates: Record<string, unknown> = {
    ...input,
    updatedAt: new Date().toISOString(),
  };

  await updateItem(T, createWorkspacePK(workspaceId), createWorkspaceSK(), updates);

  return getWorkspaceById(workspaceId);
}

export async function deleteWorkspace(workspaceId: string): Promise<void> {
  const { items } = await queryItems<{ PK: string; SK: string }>(T, createWorkspacePK(workspaceId));

  const deleteOps = items.map((item) => ({
    delete: { pk: item.PK, sk: item.SK },
  }));

  if (deleteOps.length > 0) {
    await batchWriteItems(T, deleteOps);
  }
}

export async function getUserWorkspaces(userId: string): Promise<WorkspaceWithRole[]> {
  const { items: memberItems } = await queryByIndex<WorkspaceMemberDBItem>(
    T,
    "GSI1",
    "GSI1PK",
    createUserWorkspaceGSI(userId)
  );

  const workspaces: WorkspaceWithRole[] = [];

  for (const memberItem of memberItems) {
    const workspace = await getWorkspaceById(memberItem.workspaceId);
    if (workspace) {
      workspaces.push({
        ...workspace,
        role: memberItem.role,
      });
    }
  }

  return workspaces;
}

export async function getWorkspaceMembers(workspaceId: string): Promise<WorkspaceMember[]> {
  const { items } = await queryItems<WorkspaceMemberDBItem>(T, createWorkspacePK(workspaceId), "MEMBER#");

  const members: WorkspaceMember[] = [];

  for (const item of items) {
    const member = dbItemToMember(item);
    const user = await getUserById(member.userId);
    if (user) {
      member.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
      };
    }
    members.push(member);
  }

  return members;
}

export async function getWorkspaceMember(workspaceId: string, userId: string): Promise<WorkspaceMember | null> {
  const item = await getItem<WorkspaceMemberDBItem>(T, createWorkspacePK(workspaceId), createMemberSK(userId));
  if (!item) return null;

  const member = dbItemToMember(item);
  const user = await getUserById(userId);
  if (user) {
    member.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
    };
  }

  return member;
}

export async function addWorkspaceMember(
  workspaceId: string,
  userId: string,
  role: WorkspaceRole
): Promise<WorkspaceMember> {
  const now = new Date().toISOString();

  const item: WorkspaceMemberDBItem = {
    PK: createWorkspacePK(workspaceId),
    SK: createMemberSK(userId),
    GSI1PK: createUserWorkspaceGSI(userId),
    GSI1SK: createWorkspacePK(workspaceId),
    workspaceId,
    userId,
    role,
    joinedAt: now,
  };

  await putItem(T, item);

  return dbItemToMember(item);
}

export async function updateWorkspaceMemberRole(
  workspaceId: string,
  userId: string,
  role: WorkspaceRole
): Promise<WorkspaceMember | null> {
  const existingMember = await getWorkspaceMember(workspaceId, userId);
  if (!existingMember) return null;

  await updateItem(T, createWorkspacePK(workspaceId), createMemberSK(userId), { role });

  return getWorkspaceMember(workspaceId, userId);
}

export async function removeWorkspaceMember(workspaceId: string, userId: string): Promise<void> {
  await deleteItem(T, createWorkspacePK(workspaceId), createMemberSK(userId));
}

export async function isWorkspaceMember(workspaceId: string, userId: string): Promise<boolean> {
  const member = await getWorkspaceMember(workspaceId, userId);
  return member !== null;
}

export async function getUserWorkspaceRole(workspaceId: string, userId: string): Promise<WorkspaceRole | null> {
  const member = await getWorkspaceMember(workspaceId, userId);
  return member?.role || null;
}

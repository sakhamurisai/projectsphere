import { nanoid } from "nanoid";
import { GetCommand, PutCommand, UpdateCommand, DeleteCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { dynamodb, TABLES } from "../client";
import { getUserById } from "./user";
import type { Workspace, WorkspaceCreateInput, WorkspaceUpdateInput, WorkspaceMember, WorkspaceRole, WorkspaceWithRole } from "@/types/workspace";

// projectsphere-workspaces   | Key: { workspaceId }  GSI: ownerId-index, slug-index
// projectsphere-workspace-members | Key: { workspaceId, userId }  GSI: userId-index
const TW = TABLES.WORKSPACES;
const TM = TABLES.WORKSPACE_MEMBERS;

function toWorkspace(i: Record<string, unknown>): Workspace {
  return { id: i.workspaceId as string, name: i.name as string, slug: i.slug as string, description: i.description as string | undefined, ownerId: i.ownerId as string, createdAt: i.createdAt as string, updatedAt: i.updatedAt as string };
}

function toMember(i: Record<string, unknown>): WorkspaceMember {
  return { workspaceId: i.workspaceId as string, userId: i.userId as string, role: i.role as WorkspaceRole, joinedAt: i.joinedAt as string };
}

export async function createWorkspace(input: WorkspaceCreateInput, ownerId: string): Promise<Workspace> {
  const workspaceId = nanoid();
  const now = new Date().toISOString();

  const ws = { workspaceId, name: input.name, slug: input.slug.toLowerCase(), description: input.description, ownerId, createdAt: now, updatedAt: now };
  await dynamodb.send(new PutCommand({ TableName: TW, Item: ws }));

  await dynamodb.send(new PutCommand({ TableName: TM, Item: { workspaceId, userId: ownerId, role: "owner", joinedAt: now } }));

  return toWorkspace(ws);
}

export async function getWorkspaceById(workspaceId: string): Promise<Workspace | null> {
  const res = await dynamodb.send(new GetCommand({ TableName: TW, Key: { workspaceId } }));
  return res.Item ? toWorkspace(res.Item) : null;
}

export async function updateWorkspace(workspaceId: string, input: WorkspaceUpdateInput): Promise<Workspace | null> {
  if (!(await getWorkspaceById(workspaceId))) return null;
  const fields = { ...input, updatedAt: new Date().toISOString() };
  const names: Record<string, string> = {};
  const values: Record<string, unknown> = {};
  const exprs = Object.entries(fields).map(([k, v], i) => { names[`#a${i}`] = k; values[`:v${i}`] = v; return `#a${i} = :v${i}`; });
  await dynamodb.send(new UpdateCommand({ TableName: TW, Key: { workspaceId }, UpdateExpression: `SET ${exprs.join(", ")}`, ExpressionAttributeNames: names, ExpressionAttributeValues: values }));
  return getWorkspaceById(workspaceId);
}

export async function deleteWorkspace(workspaceId: string): Promise<void> {
  await dynamodb.send(new DeleteCommand({ TableName: TW, Key: { workspaceId } }));
  // Delete all members
  const { Items = [] } = await dynamodb.send(new QueryCommand({ TableName: TM, KeyConditionExpression: "workspaceId = :w", ExpressionAttributeValues: { ":w": workspaceId } }));
  for (const item of Items) {
    await dynamodb.send(new DeleteCommand({ TableName: TM, Key: { workspaceId, userId: item.userId } }));
  }
}

export async function getUserWorkspaces(userId: string): Promise<WorkspaceWithRole[]> {
  const { Items = [] } = await dynamodb.send(new QueryCommand({
    TableName: TM,
    IndexName: "userId-index",
    KeyConditionExpression: "userId = :u",
    ExpressionAttributeValues: { ":u": userId },
  }));

  const results: WorkspaceWithRole[] = [];
  for (const item of Items) {
    const ws = await getWorkspaceById(item.workspaceId as string);
    if (ws) results.push({ ...ws, role: item.role as WorkspaceRole });
  }
  return results;
}

export async function getWorkspaceMembers(workspaceId: string): Promise<WorkspaceMember[]> {
  const { Items = [] } = await dynamodb.send(new QueryCommand({ TableName: TM, KeyConditionExpression: "workspaceId = :w", ExpressionAttributeValues: { ":w": workspaceId } }));
  const members: WorkspaceMember[] = [];
  for (const item of Items) {
    const m = toMember(item);
    const user = await getUserById(m.userId);
    if (user) m.user = { id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl };
    members.push(m);
  }
  return members;
}

export async function getWorkspaceMember(workspaceId: string, userId: string): Promise<WorkspaceMember | null> {
  const res = await dynamodb.send(new GetCommand({ TableName: TM, Key: { workspaceId, userId } }));
  if (!res.Item) return null;
  const m = toMember(res.Item);
  const user = await getUserById(userId);
  if (user) m.user = { id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl };
  return m;
}

export async function addWorkspaceMember(workspaceId: string, userId: string, role: WorkspaceRole): Promise<WorkspaceMember> {
  const now = new Date().toISOString();
  await dynamodb.send(new PutCommand({ TableName: TM, Item: { workspaceId, userId, role, joinedAt: now } }));
  return toMember({ workspaceId, userId, role, joinedAt: now });
}

export async function updateWorkspaceMemberRole(workspaceId: string, userId: string, role: WorkspaceRole): Promise<WorkspaceMember | null> {
  if (!(await getWorkspaceMember(workspaceId, userId))) return null;
  await dynamodb.send(new UpdateCommand({ TableName: TM, Key: { workspaceId, userId }, UpdateExpression: "SET #r = :r", ExpressionAttributeNames: { "#r": "role" }, ExpressionAttributeValues: { ":r": role } }));
  return getWorkspaceMember(workspaceId, userId);
}

export async function removeWorkspaceMember(workspaceId: string, userId: string): Promise<void> {
  await dynamodb.send(new DeleteCommand({ TableName: TM, Key: { workspaceId, userId } }));
}

export async function isWorkspaceMember(workspaceId: string, userId: string): Promise<boolean> {
  return !!(await getWorkspaceMember(workspaceId, userId));
}

export async function getUserWorkspaceRole(workspaceId: string, userId: string): Promise<WorkspaceRole | null> {
  return (await getWorkspaceMember(workspaceId, userId))?.role ?? null;
}

import { nanoid } from "nanoid";
import { GetCommand, PutCommand, UpdateCommand, DeleteCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { dynamodb, TABLES } from "../client";
import { getUserById } from "./user";
import type { Project, ProjectCreateInput, ProjectUpdateInput, ProjectMember, ProjectRole, ProjectStatus } from "@/types/project";

// projectsphere-projects  | Key: { projectId }  GSI: workspaceId-index (workspaceId, createdAt)
// projectsphere-project-members | Key: { projectId, userId }  GSI: userId-index (userId, projectId)
const TP = TABLES.PROJECTS;
const TM = TABLES.PROJECT_MEMBERS;

function toProject(i: Record<string, unknown>): Project {
  return { id: i.projectId as string, workspaceId: i.workspaceId as string, name: i.name as string, key: i.key as string, description: i.description as string | undefined, status: i.status as ProjectStatus, ownerId: i.ownerId as string, taskCount: (i.taskCount as number) ?? 0, createdAt: i.createdAt as string, updatedAt: i.updatedAt as string };
}

function toMember(i: Record<string, unknown>): ProjectMember {
  return { projectId: i.projectId as string, userId: i.userId as string, role: i.role as ProjectRole, joinedAt: i.joinedAt as string };
}

export async function createProject(workspaceId: string, input: ProjectCreateInput, ownerId: string): Promise<Project> {
  const projectId = nanoid();
  const now = new Date().toISOString();
  const item = { projectId, workspaceId, name: input.name, key: input.key.toUpperCase(), description: input.description, status: "active", ownerId, taskCount: 0, createdAt: now, updatedAt: now };
  await dynamodb.send(new PutCommand({ TableName: TP, Item: item }));
  await dynamodb.send(new PutCommand({ TableName: TM, Item: { projectId, userId: ownerId, role: "owner", joinedAt: now } }));
  return toProject(item);
}

export async function getProjectById(projectId: string): Promise<Project | null> {
  const res = await dynamodb.send(new GetCommand({ TableName: TP, Key: { projectId } }));
  return res.Item ? toProject(res.Item) : null;
}

export async function getWorkspaceProjects(workspaceId: string): Promise<Project[]> {
  const { Items = [] } = await dynamodb.send(new QueryCommand({
    TableName: TP,
    IndexName: "workspaceId-index",
    KeyConditionExpression: "workspaceId = :w",
    ExpressionAttributeValues: { ":w": workspaceId },
  }));
  return Items.map(toProject);
}

export async function updateProject(projectId: string, input: ProjectUpdateInput): Promise<Project | null> {
  if (!(await getProjectById(projectId))) return null;
  const fields = { ...input, updatedAt: new Date().toISOString() };
  const names: Record<string, string> = {};
  const values: Record<string, unknown> = {};
  const exprs = Object.entries(fields).map(([k, v], i) => { names[`#a${i}`] = k; values[`:v${i}`] = v; return `#a${i} = :v${i}`; });
  await dynamodb.send(new UpdateCommand({ TableName: TP, Key: { projectId }, UpdateExpression: `SET ${exprs.join(", ")}`, ExpressionAttributeNames: names, ExpressionAttributeValues: values }));
  return getProjectById(projectId);
}

export async function deleteProject(projectId: string): Promise<void> {
  await dynamodb.send(new DeleteCommand({ TableName: TP, Key: { projectId } }));
  const { Items = [] } = await dynamodb.send(new QueryCommand({ TableName: TM, KeyConditionExpression: "projectId = :p", ExpressionAttributeValues: { ":p": projectId } }));
  for (const item of Items) {
    await dynamodb.send(new DeleteCommand({ TableName: TM, Key: { projectId, userId: item.userId } }));
  }
}

export async function incrementProjectTaskCount(projectId: string): Promise<void> {
  await dynamodb.send(new UpdateCommand({ TableName: TP, Key: { projectId }, UpdateExpression: "SET taskCount = if_not_exists(taskCount, :zero) + :one", ExpressionAttributeValues: { ":zero": 0, ":one": 1 } }));
}

export async function decrementProjectTaskCount(projectId: string): Promise<void> {
  const p = await getProjectById(projectId);
  if (!p) return;
  await dynamodb.send(new UpdateCommand({ TableName: TP, Key: { projectId }, UpdateExpression: "SET taskCount = :v", ExpressionAttributeValues: { ":v": Math.max(0, p.taskCount - 1) } }));
}

export async function getProjectMembers(projectId: string): Promise<ProjectMember[]> {
  const { Items = [] } = await dynamodb.send(new QueryCommand({ TableName: TM, KeyConditionExpression: "projectId = :p", ExpressionAttributeValues: { ":p": projectId } }));
  const members: ProjectMember[] = [];
  for (const item of Items) {
    const m = toMember(item);
    const user = await getUserById(m.userId);
    if (user) m.user = { id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl };
    members.push(m);
  }
  return members;
}

export async function getProjectMember(projectId: string, userId: string): Promise<ProjectMember | null> {
  const res = await dynamodb.send(new GetCommand({ TableName: TM, Key: { projectId, userId } }));
  if (!res.Item) return null;
  const m = toMember(res.Item);
  const user = await getUserById(userId);
  if (user) m.user = { id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl };
  return m;
}

export async function addProjectMember(projectId: string, userId: string, role: ProjectRole): Promise<ProjectMember> {
  const now = new Date().toISOString();
  await dynamodb.send(new PutCommand({ TableName: TM, Item: { projectId, userId, role, joinedAt: now } }));
  return toMember({ projectId, userId, role, joinedAt: now });
}

export async function updateProjectMemberRole(projectId: string, userId: string, role: ProjectRole): Promise<ProjectMember | null> {
  if (!(await getProjectMember(projectId, userId))) return null;
  await dynamodb.send(new UpdateCommand({ TableName: TM, Key: { projectId, userId }, UpdateExpression: "SET #r = :r", ExpressionAttributeNames: { "#r": "role" }, ExpressionAttributeValues: { ":r": role } }));
  return getProjectMember(projectId, userId);
}

export async function removeProjectMember(projectId: string, userId: string): Promise<void> {
  await dynamodb.send(new DeleteCommand({ TableName: TM, Key: { projectId, userId } }));
}

export async function isProjectMember(projectId: string, userId: string): Promise<boolean> {
  return !!(await getProjectMember(projectId, userId));
}

export async function getUserProjectRole(projectId: string, userId: string): Promise<ProjectRole | null> {
  return (await getProjectMember(projectId, userId))?.role ?? null;
}

export async function getUserProjects(userId: string): Promise<Project[]> {
  const { Items = [] } = await dynamodb.send(new QueryCommand({ TableName: TM, IndexName: "userId-index", KeyConditionExpression: "userId = :u", ExpressionAttributeValues: { ":u": userId } }));
  const projects: Project[] = [];
  for (const item of Items) {
    const p = await getProjectById(item.projectId as string);
    if (p && p.status === "active") projects.push(p);
  }
  return projects;
}

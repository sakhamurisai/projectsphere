import { nanoid } from "nanoid";
import { GetCommand, PutCommand, UpdateCommand, DeleteCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { dynamodb, TABLES } from "../client";
import { getUserById } from "./user";
import { getProjectById, incrementProjectTaskCount, decrementProjectTaskCount } from "./project";
import type { Task, TaskCreateInput, TaskUpdateInput, TaskStatus, TaskFilters } from "@/types/task";

// projectsphere-tasks | Key: { taskId }
// GSI: assigneeId-index (assigneeId), parentTaskId-index (parentTaskId), projectId-status-index (projectId HASH, status RANGE)
const T = TABLES.TASKS;

function toTask(i: Record<string, unknown>): Task {
  return {
    id: i.taskId as string,
    projectId: i.projectId as string,
    workspaceId: i.workspaceId as string,
    title: i.title as string,
    description: i.description as string | undefined,
    status: i.status as TaskStatus,
    priority: i.priority as Task["priority"],
    assigneeId: i.assigneeId as string | undefined,
    reporterId: i.reporterId as string,
    dueDate: i.dueDate as string | undefined,
    labels: (i.labels as string[]) || [],
    parentTaskId: i.parentTaskId as string | undefined,
    order: (i.order as number) ?? 0,
    createdAt: i.createdAt as string,
    updatedAt: i.updatedAt as string,
  };
}

async function enrichTask(task: Task): Promise<Task> {
  if (task.assigneeId) {
    const assignee = await getUserById(task.assigneeId);
    if (assignee) task.assignee = { id: assignee.id, name: assignee.name, email: assignee.email, avatarUrl: assignee.avatarUrl };
  }
  const reporter = await getUserById(task.reporterId);
  if (reporter) task.reporter = { id: reporter.id, name: reporter.name, email: reporter.email, avatarUrl: reporter.avatarUrl };
  return task;
}

export async function getTaskById(taskId: string): Promise<Task | null> {
  const res = await dynamodb.send(new GetCommand({ TableName: T, Key: { taskId } }));
  if (!res.Item) return null;
  return enrichTask(toTask(res.Item));
}

export async function createTask(projectId: string, input: TaskCreateInput, reporterId: string): Promise<Task> {
  const project = await getProjectById(projectId);
  if (!project) throw new Error("Project not found");

  const taskId = nanoid();
  const now = new Date().toISOString();
  const status = input.status || "todo";
  const priority = input.priority || "medium";

  // Get max order for this project+status
  const { Items: existing = [] } = await dynamodb.send(new QueryCommand({
    TableName: T,
    IndexName: "projectId-status-index",
    KeyConditionExpression: "projectId = :p AND #s = :s",
    ExpressionAttributeNames: { "#s": "status" },
    ExpressionAttributeValues: { ":p": projectId, ":s": status },
    ScanIndexForward: false,
    Limit: 1,
  }));
  const order = existing.length > 0 ? ((existing[0].order as number) ?? 0) + 1 : 0;

  const item = { taskId, projectId, workspaceId: project.workspaceId, title: input.title, description: input.description, status, priority, assigneeId: input.assigneeId, reporterId, dueDate: input.dueDate, labels: input.labels || [], parentTaskId: input.parentTaskId, order, createdAt: now, updatedAt: now };
  await dynamodb.send(new PutCommand({ TableName: T, Item: item }));
  await incrementProjectTaskCount(projectId);
  return enrichTask(toTask(item));
}

export async function getProjectTasks(projectId: string, filters?: TaskFilters): Promise<Task[]> {
  const { Items = [] } = await dynamodb.send(new QueryCommand({
    TableName: T,
    IndexName: "projectId-status-index",
    KeyConditionExpression: "projectId = :p",
    ExpressionAttributeValues: { ":p": projectId },
  }));

  let tasks = Items.map(toTask);

  if (filters) {
    if (filters.status?.length) tasks = tasks.filter(t => filters.status!.includes(t.status));
    if (filters.priority?.length) tasks = tasks.filter(t => filters.priority!.includes(t.priority));
    if (filters.assigneeId) tasks = tasks.filter(t => t.assigneeId === filters.assigneeId);
    if (filters.search) {
      const s = filters.search.toLowerCase();
      tasks = tasks.filter(t => t.title.toLowerCase().includes(s) || t.description?.toLowerCase().includes(s));
    }
  }

  tasks.sort((a, b) => a.order - b.order);
  return Promise.all(tasks.map(enrichTask));
}

export async function getTasksByStatus(projectId: string, status: TaskStatus): Promise<Task[]> {
  const { Items = [] } = await dynamodb.send(new QueryCommand({
    TableName: T,
    IndexName: "projectId-status-index",
    KeyConditionExpression: "projectId = :p AND #s = :s",
    ExpressionAttributeNames: { "#s": "status" },
    ExpressionAttributeValues: { ":p": projectId, ":s": status },
  }));
  return Promise.all(Items.map(toTask).map(enrichTask));
}

export async function updateTask(taskId: string, input: TaskUpdateInput): Promise<Task | null> {
  if (!(await getTaskById(taskId))) return null;
  const fields = { ...input, updatedAt: new Date().toISOString() };
  const names: Record<string, string> = {};
  const values: Record<string, unknown> = {};
  const exprs = Object.entries(fields).map(([k, v], i) => { names[`#a${i}`] = k; values[`:v${i}`] = v; return `#a${i} = :v${i}`; });
  await dynamodb.send(new UpdateCommand({ TableName: T, Key: { taskId }, UpdateExpression: `SET ${exprs.join(", ")}`, ExpressionAttributeNames: names, ExpressionAttributeValues: values }));
  return getTaskById(taskId);
}

export async function deleteTask(taskId: string): Promise<void> {
  const task = await getTaskById(taskId);
  if (!task) return;
  await dynamodb.send(new DeleteCommand({ TableName: T, Key: { taskId } }));
  await decrementProjectTaskCount(task.projectId);

  // Delete subtasks
  const { Items: subtasks = [] } = await dynamodb.send(new QueryCommand({
    TableName: T,
    IndexName: "parentTaskId-index",
    KeyConditionExpression: "parentTaskId = :p",
    ExpressionAttributeValues: { ":p": taskId },
  }));
  for (const st of subtasks) {
    await dynamodb.send(new DeleteCommand({ TableName: T, Key: { taskId: st.taskId } }));
  }
}

export async function reorderTask(taskId: string, newStatus: TaskStatus, newOrder: number): Promise<Task | null> {
  if (!(await getTaskById(taskId))) return null;
  await dynamodb.send(new UpdateCommand({ TableName: T, Key: { taskId }, UpdateExpression: "SET #s = :s, #o = :o, updatedAt = :u", ExpressionAttributeNames: { "#s": "status", "#o": "order" }, ExpressionAttributeValues: { ":s": newStatus, ":o": newOrder, ":u": new Date().toISOString() } }));
  return getTaskById(taskId);
}

export async function getSubtasks(parentTaskId: string): Promise<Task[]> {
  const { Items = [] } = await dynamodb.send(new QueryCommand({
    TableName: T,
    IndexName: "parentTaskId-index",
    KeyConditionExpression: "parentTaskId = :p",
    ExpressionAttributeValues: { ":p": parentTaskId },
  }));
  return Promise.all(Items.map(toTask).map(enrichTask));
}

export async function getUserAssignedTasks(userId: string): Promise<Task[]> {
  const { Items = [] } = await dynamodb.send(new QueryCommand({
    TableName: T,
    IndexName: "assigneeId-index",
    KeyConditionExpression: "assigneeId = :u",
    ExpressionAttributeValues: { ":u": userId },
  }));
  return Promise.all(Items.map(toTask).map(enrichTask));
}

import { nanoid } from "nanoid";
import { getItem, putItem, updateItem, deleteItem, queryItems, queryByIndex, batchWriteItems } from "../operations";
import { TABLES } from "../client";
import { getUserById } from "./user";
import type {
  Project,
  ProjectCreateInput,
  ProjectUpdateInput,
  ProjectMember,
  ProjectRole,
  ProjectDBItem,
  ProjectMemberDBItem
} from "@/types/project";

// Project metadata and members are stored in the same PROJECTS table,
// differentiated by PK/SK patterns
const T = TABLES.PROJECTS;

export function createWorkspacePK(workspaceId: string): string {
  return `WORKSPACE#${workspaceId}`;
}

export function createProjectSK(projectId: string): string {
  return `PROJECT#${projectId}`;
}

export function createProjectPK(projectId: string): string {
  return `PROJECT#${projectId}`;
}

export function createProjectMemberSK(userId: string): string {
  return `MEMBER#${userId}`;
}

export function createUserProjectGSI(userId: string): string {
  return `USER#${userId}`;
}

function dbItemToProject(item: ProjectDBItem): Project {
  return {
    id: item.id,
    workspaceId: item.workspaceId,
    name: item.name,
    key: item.key,
    description: item.description,
    status: item.status,
    ownerId: item.ownerId,
    taskCount: item.taskCount,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

function dbItemToMember(item: ProjectMemberDBItem): ProjectMember {
  return {
    projectId: item.projectId,
    userId: item.userId,
    role: item.role,
    joinedAt: item.joinedAt,
  };
}

export async function createProject(
  workspaceId: string,
  input: ProjectCreateInput,
  ownerId: string
): Promise<Project> {
  const id = nanoid();
  const now = new Date().toISOString();

  const projectItem: ProjectDBItem = {
    PK: createWorkspacePK(workspaceId),
    SK: createProjectSK(id),
    GSI1PK: createProjectPK(id),
    GSI1SK: "METADATA",
    id,
    workspaceId,
    name: input.name,
    key: input.key.toUpperCase(),
    description: input.description,
    status: "active",
    ownerId,
    taskCount: 0,
    createdAt: now,
    updatedAt: now,
  };

  const memberItem: ProjectMemberDBItem = {
    PK: createProjectPK(id),
    SK: createProjectMemberSK(ownerId),
    GSI1PK: createUserProjectGSI(ownerId),
    GSI1SK: createProjectPK(id),
    projectId: id,
    userId: ownerId,
    role: "owner",
    joinedAt: now,
  };

  await batchWriteItems(T, [{ put: projectItem }, { put: memberItem }]);

  return dbItemToProject(projectItem);
}

export async function getProjectById(projectId: string): Promise<Project | null> {
  const { items } = await queryByIndex<ProjectDBItem>(
    T,
    "GSI1",
    "GSI1PK",
    createProjectPK(projectId),
    "GSI1SK",
    "METADATA"
  );

  return items.length > 0 ? dbItemToProject(items[0]) : null;
}

export async function getWorkspaceProjects(workspaceId: string): Promise<Project[]> {
  const { items } = await queryItems<ProjectDBItem>(T, createWorkspacePK(workspaceId), "PROJECT#");

  return items.map(dbItemToProject);
}

export async function updateProject(projectId: string, input: ProjectUpdateInput): Promise<Project | null> {
  const existingProject = await getProjectById(projectId);
  if (!existingProject) return null;

  const updates: Record<string, unknown> = {
    ...input,
    updatedAt: new Date().toISOString(),
  };

  await updateItem(
    T,
    createWorkspacePK(existingProject.workspaceId),
    createProjectSK(projectId),
    updates
  );

  return getProjectById(projectId);
}

export async function deleteProject(projectId: string): Promise<void> {
  const project = await getProjectById(projectId);
  if (!project) return;

  await deleteItem(T, createWorkspacePK(project.workspaceId), createProjectSK(projectId));

  const { items: members } = await queryItems<{ PK: string; SK: string }>(T, createProjectPK(projectId), "MEMBER#");

  if (members.length > 0) {
    await batchWriteItems(T, members.map((m) => ({ delete: { pk: m.PK, sk: m.SK } })));
  }
}

export async function incrementProjectTaskCount(projectId: string): Promise<void> {
  const project = await getProjectById(projectId);
  if (!project) return;

  await updateItem(
    T,
    createWorkspacePK(project.workspaceId),
    createProjectSK(projectId),
    { taskCount: project.taskCount + 1 }
  );
}

export async function decrementProjectTaskCount(projectId: string): Promise<void> {
  const project = await getProjectById(projectId);
  if (!project) return;

  await updateItem(
    T,
    createWorkspacePK(project.workspaceId),
    createProjectSK(projectId),
    { taskCount: Math.max(0, project.taskCount - 1) }
  );
}

export async function getProjectMembers(projectId: string): Promise<ProjectMember[]> {
  const { items } = await queryItems<ProjectMemberDBItem>(T, createProjectPK(projectId), "MEMBER#");

  const members: ProjectMember[] = [];

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

export async function getProjectMember(projectId: string, userId: string): Promise<ProjectMember | null> {
  const item = await getItem<ProjectMemberDBItem>(T, createProjectPK(projectId), createProjectMemberSK(userId));
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

export async function addProjectMember(
  projectId: string,
  userId: string,
  role: ProjectRole
): Promise<ProjectMember> {
  const now = new Date().toISOString();

  const item: ProjectMemberDBItem = {
    PK: createProjectPK(projectId),
    SK: createProjectMemberSK(userId),
    GSI1PK: createUserProjectGSI(userId),
    GSI1SK: createProjectPK(projectId),
    projectId,
    userId,
    role,
    joinedAt: now,
  };

  await putItem(T, item);

  return dbItemToMember(item);
}

export async function updateProjectMemberRole(
  projectId: string,
  userId: string,
  role: ProjectRole
): Promise<ProjectMember | null> {
  const existingMember = await getProjectMember(projectId, userId);
  if (!existingMember) return null;

  await updateItem(T, createProjectPK(projectId), createProjectMemberSK(userId), { role });

  return getProjectMember(projectId, userId);
}

export async function removeProjectMember(projectId: string, userId: string): Promise<void> {
  await deleteItem(T, createProjectPK(projectId), createProjectMemberSK(userId));
}

export async function isProjectMember(projectId: string, userId: string): Promise<boolean> {
  const member = await getProjectMember(projectId, userId);
  return member !== null;
}

export async function getUserProjectRole(projectId: string, userId: string): Promise<ProjectRole | null> {
  const member = await getProjectMember(projectId, userId);
  return member?.role || null;
}

export async function getUserProjects(userId: string): Promise<Project[]> {
  const { items: memberItems } = await queryByIndex<ProjectMemberDBItem>(
    T,
    "GSI1",
    "GSI1PK",
    createUserProjectGSI(userId)
  );

  const projects: Project[] = [];

  for (const memberItem of memberItems) {
    const project = await getProjectById(memberItem.projectId);
    if (project && project.status === "active") {
      projects.push(project);
    }
  }

  return projects;
}

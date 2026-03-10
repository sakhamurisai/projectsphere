import { nanoid } from "nanoid";
import { putItem, queryByIndex, updateItem, queryItems } from "../operations";
import { TABLES } from "../client";
import type { Invitation, InvitationDBItem } from "@/types/invitation";

const T = TABLES.INVITATIONS;

function createInvitePK(workspaceId: string): string {
  return `WORKSPACE#${workspaceId}`;
}

function createInviteSK(inviteId: string): string {
  return `INVITE#${inviteId}`;
}

function dbItemToInvitation(item: InvitationDBItem): Invitation {
  return {
    id: item.id,
    workspaceId: item.workspaceId,
    workspaceName: item.workspaceName,
    email: item.email,
    role: item.role,
    token: item.token,
    status: item.status,
    invitedById: item.invitedById,
    invitedByName: item.invitedByName,
    expiresAt: item.expiresAt,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

export async function createInvitation(input: {
  workspaceId: string;
  workspaceName: string;
  email: string;
  role: "admin" | "member" | "viewer";
  invitedById: string;
  invitedByName: string;
}): Promise<Invitation> {
  const id = nanoid();
  const token = nanoid(32);
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const item: InvitationDBItem = {
    PK: createInvitePK(input.workspaceId),
    SK: createInviteSK(id),
    GSI2PK: `INVITE_TOKEN#${token}`,
    GSI2SK: "METADATA",
    id,
    workspaceId: input.workspaceId,
    workspaceName: input.workspaceName,
    email: input.email.toLowerCase(),
    role: input.role,
    token,
    status: "pending",
    invitedById: input.invitedById,
    invitedByName: input.invitedByName,
    expiresAt,
    createdAt: now,
    updatedAt: now,
  };

  await putItem(T, item);
  return dbItemToInvitation(item);
}

export async function getInvitationByToken(token: string): Promise<Invitation | null> {
  const { items } = await queryByIndex<InvitationDBItem>(
    T,
    "GSI2",
    "GSI2PK",
    `INVITE_TOKEN#${token}`,
    "GSI2SK",
    "METADATA"
  );
  if (items.length === 0) return null;
  return dbItemToInvitation(items[0]);
}

export async function getWorkspaceInvitations(workspaceId: string): Promise<Invitation[]> {
  const { items } = await queryItems<InvitationDBItem>(
    T,
    createInvitePK(workspaceId),
    "INVITE#"
  );
  return items.map(dbItemToInvitation);
}

export async function acceptInvitation(invitation: Invitation): Promise<void> {
  const now = new Date().toISOString();
  await updateItem(
    T,
    createInvitePK(invitation.workspaceId),
    createInviteSK(invitation.id),
    { status: "accepted", updatedAt: now }
  );
}

export async function revokeInvitation(workspaceId: string, inviteId: string): Promise<void> {
  const now = new Date().toISOString();
  await updateItem(
    T,
    createInvitePK(workspaceId),
    createInviteSK(inviteId),
    { status: "revoked", updatedAt: now }
  );
}

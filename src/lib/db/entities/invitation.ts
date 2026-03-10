import { nanoid } from "nanoid";
import { GetCommand, PutCommand, UpdateCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { dynamodb, TABLES } from "../client";
import type { Invitation, InvitationStatus } from "@/types/invitation";

// projectsphere-invitations | Key: { invitationId }
// GSI: token-index (token), workspaceId-index (workspaceId HASH, createdAt RANGE)
const T = TABLES.INVITATIONS;

function toInvitation(i: Record<string, unknown>): Invitation {
  return {
    id: i.invitationId as string,
    workspaceId: i.workspaceId as string,
    workspaceName: i.workspaceName as string,
    email: i.email as string,
    role: i.role as Invitation["role"],
    token: i.token as string,
    status: i.status as InvitationStatus,
    invitedById: i.invitedById as string,
    invitedByName: i.invitedByName as string,
    expiresAt: i.expiresAt as string,
    createdAt: i.createdAt as string,
    updatedAt: i.updatedAt as string,
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
  const invitationId = nanoid();
  const token = nanoid(32);
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const item = { invitationId, workspaceId: input.workspaceId, workspaceName: input.workspaceName, email: input.email.toLowerCase(), role: input.role, token, status: "pending", invitedById: input.invitedById, invitedByName: input.invitedByName, expiresAt, createdAt: now, updatedAt: now };
  await dynamodb.send(new PutCommand({ TableName: T, Item: item }));
  return toInvitation(item);
}

export async function getInvitationById(invitationId: string): Promise<Invitation | null> {
  const res = await dynamodb.send(new GetCommand({ TableName: T, Key: { invitationId } }));
  return res.Item ? toInvitation(res.Item) : null;
}

export async function getInvitationByToken(token: string): Promise<Invitation | null> {
  const { Items = [] } = await dynamodb.send(new QueryCommand({
    TableName: T,
    IndexName: "token-index",
    KeyConditionExpression: "#t = :t",
    ExpressionAttributeNames: { "#t": "token" },
    ExpressionAttributeValues: { ":t": token },
    Limit: 1,
  }));
  return Items.length ? toInvitation(Items[0]) : null;
}

export async function getWorkspaceInvitations(workspaceId: string): Promise<Invitation[]> {
  const { Items = [] } = await dynamodb.send(new QueryCommand({
    TableName: T,
    IndexName: "workspaceId-index",
    KeyConditionExpression: "workspaceId = :w",
    ExpressionAttributeValues: { ":w": workspaceId },
  }));
  return Items.map(toInvitation);
}

export async function acceptInvitation(invitation: Invitation): Promise<void> {
  await dynamodb.send(new UpdateCommand({ TableName: T, Key: { invitationId: invitation.id }, UpdateExpression: "SET #s = :s, updatedAt = :u", ExpressionAttributeNames: { "#s": "status" }, ExpressionAttributeValues: { ":s": "accepted", ":u": new Date().toISOString() } }));
}

export async function revokeInvitation(invitationId: string): Promise<void> {
  await dynamodb.send(new UpdateCommand({ TableName: T, Key: { invitationId }, UpdateExpression: "SET #s = :s, updatedAt = :u", ExpressionAttributeNames: { "#s": "status" }, ExpressionAttributeValues: { ":s": "revoked", ":u": new Date().toISOString() } }));
}

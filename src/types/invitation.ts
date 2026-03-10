export type InvitationStatus = "pending" | "accepted" | "expired" | "revoked";

export interface Invitation {
  id: string;
  workspaceId: string;
  workspaceName: string;
  email: string;
  role: "admin" | "member" | "viewer";
  token: string;
  status: InvitationStatus;
  invitedById: string;
  invitedByName: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvitationDBItem extends Record<string, unknown> {
  PK: string;
  SK: string;
  GSI2PK: string;
  GSI2SK: string;
  id: string;
  workspaceId: string;
  workspaceName: string;
  email: string;
  role: "admin" | "member" | "viewer";
  token: string;
  status: InvitationStatus;
  invitedById: string;
  invitedByName: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

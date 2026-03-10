export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  cognitoSub?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserCreateInput {
  email: string;
  name: string;
  cognitoSub?: string;
}

export interface UserUpdateInput {
  name?: string;
  avatarUrl?: string;
}

export interface UserDBItem extends Record<string, unknown> {
  PK: string;
  SK: string;
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  cognitoSub: string;
  createdAt: string;
  updatedAt: string;
}

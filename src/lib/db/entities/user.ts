import { nanoid } from "nanoid";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { getItem, putItem, updateItem } from "../operations";
import { TABLES, dynamodb } from "../client";
import type { User, UserCreateInput, UserUpdateInput, UserDBItem } from "@/types/user";

const T = TABLES.USERS;

export function createUserPK(userId: string): string {
  return `USER#${userId}`;
}

export function createUserSK(): string {
  return "PROFILE";
}

function dbItemToUser(item: UserDBItem): User {
  return {
    id: item.id,
    email: item.email,
    name: item.name,
    avatarUrl: item.avatarUrl,
    cognitoSub: item.cognitoSub,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

export async function createUser(input: UserCreateInput): Promise<User> {
  // Use cognitoSub as the stable user ID so we can look up users without a GSI
  const id = input.cognitoSub || nanoid();
  const now = new Date().toISOString();

  const item: UserDBItem = {
    PK: createUserPK(id),
    SK: createUserSK(),
    id,
    email: input.email.toLowerCase(),
    name: input.name,
    cognitoSub: input.cognitoSub,
    createdAt: now,
    updatedAt: now,
  };

  await putItem(T, item);
  return dbItemToUser(item);
}

export async function getUserById(userId: string): Promise<User | null> {
  const item = await getItem<UserDBItem>(T, createUserPK(userId), createUserSK());
  return item ? dbItemToUser(item) : null;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const command = new ScanCommand({
    TableName: T,
    FilterExpression: "email = :email",
    ExpressionAttributeValues: { ":email": email.toLowerCase() },
    Limit: 1,
  });
  const response = await dynamodb.send(command);
  const items = response.Items as UserDBItem[] | undefined;
  return items && items.length > 0 ? dbItemToUser(items[0]) : null;
}

export async function updateUser(userId: string, input: UserUpdateInput): Promise<User | null> {
  const existingUser = await getUserById(userId);
  if (!existingUser) return null;

  const updates: Record<string, unknown> = {
    ...input,
    updatedAt: new Date().toISOString(),
  };

  await updateItem(T, createUserPK(userId), createUserSK(), updates);

  return getUserById(userId);
}

export async function getOrCreateUser(email: string, name: string, cognitoSub: string): Promise<User> {
  // Direct lookup by cognitoSub (used as user ID) — no GSI required
  const existingUser = await getUserById(cognitoSub);
  if (existingUser) {
    return existingUser;
  }

  return createUser({ email, name, cognitoSub });
}

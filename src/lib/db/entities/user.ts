import { nanoid } from "nanoid";
import { GetCommand, PutCommand, UpdateCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { dynamodb, TABLES } from "../client";
import type { User, UserCreateInput, UserUpdateInput } from "@/types/user";

// Table: projectsphere-users  |  Key: { userId }
const T = TABLES.USERS;

function toUser(item: Record<string, unknown>): User {
  return {
    id: item.userId as string,
    email: item.email as string,
    name: item.name as string,
    avatarUrl: item.avatarUrl as string | undefined,
    cognitoSub: item.cognitoSub as string | undefined,
    createdAt: item.createdAt as string,
    updatedAt: item.updatedAt as string,
  };
}

export async function getUserById(userId: string): Promise<User | null> {
  const res = await dynamodb.send(new GetCommand({ TableName: T, Key: { userId } }));
  return res.Item ? toUser(res.Item) : null;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const res = await dynamodb.send(new ScanCommand({
    TableName: T,
    FilterExpression: "email = :e",
    ExpressionAttributeValues: { ":e": email.toLowerCase() },
    Limit: 1,
  }));
  return res.Items?.length ? toUser(res.Items[0]) : null;
}

export async function createUser(input: UserCreateInput): Promise<User> {
  const userId = input.cognitoSub || nanoid();
  const now = new Date().toISOString();
  const item = { userId, email: input.email.toLowerCase(), name: input.name, cognitoSub: input.cognitoSub, createdAt: now, updatedAt: now };
  await dynamodb.send(new PutCommand({ TableName: T, Item: item }));
  return toUser(item);
}

export async function updateUser(userId: string, input: UserUpdateInput): Promise<User | null> {
  if (!(await getUserById(userId))) return null;
  const fields = { ...input, updatedAt: new Date().toISOString() };
  const names: Record<string, string> = {};
  const values: Record<string, unknown> = {};
  const exprs = Object.entries(fields).map(([k, v], i) => {
    names[`#a${i}`] = k; values[`:v${i}`] = v; return `#a${i} = :v${i}`;
  });
  await dynamodb.send(new UpdateCommand({ TableName: T, Key: { userId }, UpdateExpression: `SET ${exprs.join(", ")}`, ExpressionAttributeNames: names, ExpressionAttributeValues: values }));
  return getUserById(userId);
}

export async function getOrCreateUser(email: string, name: string, cognitoSub: string): Promise<User> {
  const existing = await getUserById(cognitoSub);
  if (existing) return existing;
  return createUser({ email, name, cognitoSub });
}

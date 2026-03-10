import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({
  region: process.env.NEXT_AWS_REGION || "us-east-2",
  credentials: {
    accessKeyId: process.env.NEXT_AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.NEXT_AWS_SECRET_ACCESS_KEY || "",
  },
});

export const dynamodb = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
    convertEmptyValues: false,
  },
  unmarshallOptions: {
    wrapNumbers: false,
  },
});

const e = (key: string, fallback: string) => (process.env[key] || fallback).trim();

// Separate tables — one per entity
export const TABLES = {
  USERS:             e("NEXT_PUBLIC_DYNAMODB_USERS_TABLE",             "projectsphere-users"),
  WORKSPACES:        e("NEXT_PUBLIC_DYNAMODB_WORKSPACES_TABLE",        "projectsphere-workspaces"),
  WORKSPACE_MEMBERS: e("NEXT_PUBLIC_DYNAMODB_WORKSPACE_MEMBERS_TABLE", "projectsphere-workspace-members"),
  PROJECTS:          e("NEXT_PUBLIC_DYNAMODB_PROJECTS_TABLE",          "projectsphere-projects"),
  PROJECT_MEMBERS:   e("NEXT_PUBLIC_DYNAMODB_PROJECT_MEMBERS_TABLE",   "projectsphere-project-members"),
  TASKS:             e("NEXT_PUBLIC_DYNAMODB_TASKS_TABLE",             "projectsphere-tasks"),
  INVITATIONS:       e("NEXT_PUBLIC_DYNAMODB_INVITATIONS_TABLE",       "projectsphere-invitations"),
  FILES:             e("NEXT_PUBLIC_DYNAMODB_FILES_TABLE",             "projectsphere-files"),
} as const;

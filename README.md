# ProjectSphere

A full-stack project management tool built with Next.js, powered entirely by AWS — Cognito for authentication, DynamoDB for data, and S3 for file storage.

---

## Features

- **Authentication** — Secure sign-up, sign-in, email verification, and password reset via AWS Cognito
- **Workspaces** — Create and manage workspaces with role-based access (Owner / Admin / Member)
- **Projects** — Organize work into projects with custom keys and status tracking
- **Tasks** — Full task lifecycle: create, assign, prioritize, label, and track due dates
- **Board & List views** — Kanban drag-and-drop board and a sortable list view
- **Subtasks** — Nested task hierarchy for complex work breakdown
- **File attachments** — Upload files to tasks and projects via S3 presigned URLs
- **Avatar uploads** — User profile pictures stored in S3
- **Dark mode** — System-aware theme with manual toggle

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 + shadcn/ui |
| State | Zustand + TanStack Query v5 |
| Forms | React Hook Form + Zod |
| Drag & Drop | @dnd-kit |
| Auth | AWS Cognito |
| Database | AWS DynamoDB (single-table design) |
| File storage | AWS S3 |
| Notifications | Sonner |

---

## AWS Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Next.js App                        │
│                                                         │
│  ┌──────────┐   ┌──────────────┐   ┌─────────────────┐ │
│  │  Auth    │   │  API Routes  │   │  React Client   │ │
│  │  Pages   │   │  /api/*      │   │  Components     │ │
│  └────┬─────┘   └──────┬───────┘   └────────┬────────┘ │
│       │                │                    │           │
└───────┼────────────────┼────────────────────┼───────────┘
        │                │                    │
        ▼                ▼                    ▼
  ┌──────────┐   ┌──────────────┐   ┌─────────────────┐
  │  Cognito │   │   DynamoDB   │   │       S3        │
  │ User Pool│   │ Single Table │   │  projectsphere  │
  │          │   │              │   │     -files      │
  └──────────┘   └──────────────┘   └─────────────────┘
```

### AWS Cognito
- Handles user registration, sign-in, email verification, and password reset
- JWT tokens stored in secure httpOnly cookies
- JWKS-based token verification on the server

### AWS DynamoDB (Single-Table Design)

**Table name:** `projectsphere`

| Entity | PK | SK |
|---|---|---|
| User profile | `USER#{userId}` | `PROFILE` |
| Workspace | `WORKSPACE#{workspaceId}` | `METADATA` |
| Workspace member | `WORKSPACE#{workspaceId}` | `MEMBER#{userId}` |
| Project | `WORKSPACE#{workspaceId}` | `PROJECT#{projectId}` |
| Project member | `PROJECT#{projectId}` | `MEMBER#{userId}` |
| Task | `PROJECT#{projectId}` | `TASK#{taskId}` |
| File attachment | `{ENTITY_TYPE}#{entityId}` | `FILE#{fileId}` |

**Global Secondary Indexes:**

| GSI | PK | SK | Purpose |
|---|---|---|---|
| GSI1 | `GSI1PK` | `GSI1SK` | Task/file lookup by ID |
| GSI2 | `GSI2PK` | `GSI2SK` | Tasks by assignee and due date |
| GSI3 | `GSI3PK` | `GSI3SK` | User lookup by email |
| GSI4 | `GSI4PK` | `GSI4SK` | Tasks by status and order |

### AWS S3

**Bucket:** `projectsphere-files`

**Key structure:**
```
avatars/{userId}/{fileId}.{ext}       — user profile pictures
tasks/{taskId}/{fileId}.{ext}         — task attachments
projects/{projectId}/{fileId}.{ext}   — project files
```

File uploads use **presigned PUT URLs** — the browser uploads directly to S3; the server never proxies file bytes.

---

## Getting Started

### Prerequisites

- Node.js 18+
- An AWS account with permissions to create Cognito, DynamoDB, and S3 resources

### 1. Clone and install

```bash
git clone https://github.com/your-org/projectsphere.git
cd projectsphere
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` with your AWS resource identifiers (see [Environment Variables](#environment-variables) below).

### 3. Create AWS resources

#### Cognito User Pool

1. Open **AWS Console → Cognito → Create user pool**
2. Sign-in options: **Email**
3. Password policy: at least 8 characters, uppercase, lowercase, number, symbol
4. **Enable self-service account recovery** (email)
5. **Required attributes:** `email`, `name`
6. **App client:** public client, no secret, enable **USER_PASSWORD_AUTH**
7. Copy the **User Pool ID** and **Client ID** to `.env.local`

#### DynamoDB Table

Create a table with the following settings:

```
Table name:        projectsphere          (or your chosen name)
Partition key:     PK     (String)
Sort key:          SK     (String)
Billing mode:      On-demand
```

Then add four Global Secondary Indexes:

| Name | Partition Key | Sort Key | Projection |
|---|---|---|---|
| GSI1 | GSI1PK (S) | GSI1SK (S) | ALL |
| GSI2 | GSI2PK (S) | GSI2SK (S) | ALL |
| GSI3 | GSI3PK (S) | GSI3SK (S) | ALL |
| GSI4 | GSI4PK (S) | GSI4SK (S) | ALL |

#### S3 Bucket

1. Create a bucket named `projectsphere-files` (or your chosen name)
2. **Block all public access** — keep it private (files are served via presigned URLs)
3. Add a **CORS policy** to allow browser uploads:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedOrigins": ["http://localhost:3000", "https://yourdomain.com"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

#### IAM User / Role

Create an IAM user (for local dev) or role (for production) with this policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "cognito-idp:GetUser",
        "cognito-idp:AdminGetUser"
      ],
      "Resource": "arn:aws:cognito-idp:REGION:ACCOUNT:userpool/POOL_ID"
    },
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query",
        "dynamodb:BatchWriteItem",
        "dynamodb:TransactWriteItems"
      ],
      "Resource": [
        "arn:aws:dynamodb:REGION:ACCOUNT:table/projectsphere",
        "arn:aws:dynamodb:REGION:ACCOUNT:table/projectsphere/index/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:HeadObject"
      ],
      "Resource": "arn:aws:s3:::projectsphere-files/*"
    }
  ]
}
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `AWS_REGION` | Yes | AWS region for DynamoDB and credentials |
| `AWS_ACCESS_KEY_ID` | Yes | IAM access key |
| `AWS_SECRET_ACCESS_KEY` | Yes | IAM secret key |
| `NEXT_PUBLIC_AWS_REGION` | Yes | AWS region (exposed to browser for Cognito) |
| `NEXT_PUBLIC_COGNITO_USER_POOL_ID` | Yes | Cognito User Pool ID |
| `NEXT_PUBLIC_COGNITO_CLIENT_ID` | Yes | Cognito App Client ID |
| `AWS_DYNAMODB_TABLE_NAME` | Yes | DynamoDB table name (default: `projectsphere`) |
| `AWS_S3_BUCKET_NAME` | Yes | S3 bucket name |
| `AWS_S3_REGION` | Yes | S3 bucket region |
| `NEXT_PUBLIC_AWS_S3_BUCKET_NAME` | Yes | S3 bucket name (browser, for URL construction) |
| `NEXT_PUBLIC_AWS_S3_REGION` | Yes | S3 region (browser, for URL construction) |
| `NODE_ENV` | No | `development` or `production` |
| `NEXT_PUBLIC_APP_URL` | No | Full app URL (e.g. `https://yourdomain.com`) |

---

## API Reference

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create a new account |
| POST | `/api/auth/login` | Sign in |
| POST | `/api/auth/logout` | Sign out (clears cookies) |
| GET | `/api/auth/me` | Get current user profile |
| PUT | `/api/auth/me` | Update name or avatar URL |
| POST | `/api/auth/verify-email` | Confirm email with code |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password` | Confirm password reset |
| POST | `/api/auth/refresh` | Refresh access token |

### Workspaces

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/workspaces` | List user's workspaces |
| POST | `/api/workspaces` | Create a workspace |
| GET | `/api/workspaces/:id` | Get workspace details |
| PUT | `/api/workspaces/:id` | Update workspace |
| DELETE | `/api/workspaces/:id` | Delete workspace |
| GET | `/api/workspaces/:id/members` | List members |
| POST | `/api/workspaces/:id/members` | Invite a member |
| PUT | `/api/workspaces/:id/members/:memberId` | Update member role |
| DELETE | `/api/workspaces/:id/members/:memberId` | Remove a member |
| GET | `/api/workspaces/:id/projects` | List workspace projects |

### Projects

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/workspaces/:id/projects` | Create a project |
| GET | `/api/projects/:id` | Get project details |
| PUT | `/api/projects/:id` | Update project |
| DELETE | `/api/projects/:id` | Delete project |
| GET | `/api/projects/:id/members` | List project members |
| POST | `/api/projects/:id/members` | Add project member |
| GET | `/api/projects/:id/tasks` | List project tasks |
| GET | `/api/projects/:id/attachments` | List project files |

### Tasks

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/projects/:id/tasks` | Create a task |
| GET | `/api/tasks/:id` | Get task details |
| PUT | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |
| POST | `/api/tasks/:id/reorder` | Move task in board |
| GET | `/api/tasks/:id/subtasks` | List subtasks |
| POST | `/api/tasks/:id/subtasks` | Create a subtask |
| GET | `/api/tasks/:id/attachments` | List task files |

### File Uploads

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/uploads` | Get a presigned S3 upload URL |
| POST | `/api/uploads/:fileId` | Register file in DB after upload |
| GET | `/api/uploads/:fileId` | Get file info + fresh download URL |
| DELETE | `/api/uploads/:fileId` | Delete file from S3 and DB |

**Upload flow:**

```
Client                    API                       S3
  │                        │                         │
  │  POST /api/uploads     │                         │
  │  {fileName, mimeType,  │                         │
  │   fileSize, entityType,│                         │
  │   entityId}            │                         │
  │ ──────────────────────►│                         │
  │                        │  Generate presigned URL │
  │                        │ ───────────────────────►│
  │                        │◄────────────────────────│
  │◄──────────────────────│                         │
  │  {uploadUrl, fileId,   │                         │
  │   key, expiresAt}      │                         │
  │                        │                         │
  │  PUT {uploadUrl}       │                         │
  │  (file bytes)          │                         │
  │ ───────────────────────────────────────────────►│
  │◄───────────────────────────────────────────────-│
  │                        │                         │
  │  POST /api/uploads/{fileId}                      │
  │  {key, name, size, ...}│                         │
  │ ──────────────────────►│                         │
  │                        │  Save to DynamoDB       │
  │◄──────────────────────│                         │
  │  {FileAttachment}      │                         │
```

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/                  # Login, register, verify, forgot/reset password
│   ├── (dashboard)/             # Protected app pages
│   │   ├── workspaces/
│   │   └── workspaces/[id]/
│   │       └── projects/[id]/
│   └── api/
│       ├── auth/                # Authentication endpoints
│       ├── workspaces/          # Workspace + member endpoints
│       ├── projects/            # Project + member + attachment endpoints
│       ├── tasks/               # Task + subtask + attachment endpoints
│       └── uploads/             # S3 presigned URL and file registration
├── components/
│   ├── auth/                    # Auth forms and pages
│   ├── layout/                  # Sidebar, header, app shell
│   ├── workspace/               # Workspace cards, forms, member management
│   ├── project/                 # Project cards, forms, settings
│   ├── task/                    # Task cards, board, detail modal, filters
│   ├── views/                   # List and board view implementations
│   ├── shared/                  # Avatar, file upload, confirm dialog, spinners
│   └── ui/                      # shadcn/ui primitives
├── lib/
│   ├── auth/                    # Cognito operations, token utils, session management
│   ├── db/
│   │   ├── client.ts            # DynamoDB client
│   │   ├── operations.ts        # Generic CRUD helpers
│   │   └── entities/            # user, workspace, project, task, file
│   ├── storage/
│   │   └── s3.ts                # S3 client + presigned URL helpers
│   └── api/                     # Error classes and response helpers
├── types/                       # TypeScript interfaces (auth, user, workspace, project, task, file)
├── constants/                   # Role definitions, task status/priority enums
└── validations/                 # Zod schemas for API input validation
```

---

## Roles and Permissions

### Workspace Roles

| Action | Owner | Admin | Member |
|---|---|---|---|
| View workspace | Yes | Yes | Yes |
| Update workspace settings | Yes | Yes | No |
| Delete workspace | Yes | No | No |
| Invite members | Yes | Yes | No |
| Remove members | Yes | Yes | No |
| Create projects | Yes | Yes | Yes |

### Project Roles

| Action | Owner | Manager | Member |
|---|---|---|---|
| View project | Yes | Yes | Yes |
| Update project settings | Yes | Yes | No |
| Delete project | Yes | No | No |
| Manage project members | Yes | Yes | No |
| Create tasks | Yes | Yes | Yes |
| Delete any task | Yes | Yes | No |
| Delete own task | Yes | Yes | Yes |

---

## Development Scripts

```bash
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Build for production
npm run start    # Run production build
```

---

## Deployment

This app can be deployed to any platform that supports Node.js. For **Vercel**:

1. Connect your repository
2. Set all environment variables in Project Settings → Environment Variables
3. Deploy — Vercel auto-detects Next.js

For production, prefer **IAM Roles** (via instance profiles or OIDC) over long-lived access keys.

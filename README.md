# ProjectSphere

A full-scale project management platform built with **Next.js 16**, **AWS Cognito**, **DynamoDB**, **S3**, and **SES** — designed to compete with Jira, ClickUp, and Linear.

---

## Features

### Organization Management
- **Multi-workspace (org) support** — create multiple organizations, each with independent projects and members
- **Role-Based Access Control** — Owner, Admin, Member, Viewer roles with granular permissions
- **Email invitations** — invite team members via email (AWS SES); they receive a branded invite link with `/join/[token]`

### Project & Task Management
- **Kanban board** — drag-and-drop task cards across status columns using `@dnd-kit`
- **List view** — table-based task view with filters
- **Task details** — slide-out sheet with rich editing: title, description, status, priority, due date, assignee, reporter
- **Subtasks** — hierarchical task breakdown
- **Task filters** — filter by status, priority, and keyword search
- **Priority levels** — Low, Medium, High, Urgent with visual indicators
- **File attachments** — attach files to tasks or projects via S3 presigned URLs

### Onboarding & Auth
- **Onboarding wizard** — 3-step flow for new users: Create Org → Invite Team → Done
- **Email invitation acceptance** — `/join/[token]` landing page for new and existing users
- **Auth pages** — Login, Register, Verify Email, Forgot/Reset Password (split-screen design)
- **AWS Cognito** — SRP auth, email verification, JWT sessions, MFA-ready

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| UI | shadcn/ui + Tailwind CSS v4 |
| State | Zustand (global) + TanStack Query v5 (server) |
| Auth | AWS Cognito |
| Database | AWS DynamoDB (single-table design) |
| Storage | AWS S3 (presigned URLs) |
| Email | AWS SES |
| Drag & Drop | @dnd-kit/core + @dnd-kit/sortable |
| Forms | React Hook Form + Zod v4 |

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/                  # Login, Register, Verify, Forgot/Reset Password
│   ├── (dashboard)/             # All authenticated pages
│   │   ├── page.tsx             # Dashboard home → redirects new users to onboarding
│   │   └── workspaces/
│   │       ├── page.tsx         # All workspaces list
│   │       ├── new/             # Create workspace form
│   │       └── [workspaceId]/
│   │           ├── page.tsx     # Workspace overview (stats + project grid)
│   │           ├── members/     # Members list + Invitations tab
│   │           ├── settings/    # Workspace settings + Danger zone
│   │           └── projects/
│   │               ├── page.tsx
│   │               ├── new/
│   │               └── [projectId]/
│   │                   ├── board/    # ← Kanban board (drag-and-drop)
│   │                   ├── list/     # ← Table/list view
│   │                   └── settings/
│   ├── (onboarding)/
│   │   └── onboarding/          # Multi-step org setup wizard
│   ├── join/[token]/            # Invitation acceptance page
│   └── api/
│       ├── auth/                # Auth endpoints
│       ├── workspaces/          # Workspace CRUD + members + invitations
│       ├── projects/            # Project CRUD + members + tasks
│       ├── tasks/               # Task CRUD + reorder + subtasks
│       ├── uploads/             # S3 presigned URLs
│       └── invitations/         # Token-based invite acceptance
├── components/
│   ├── app-sidebar.tsx          # Sidebar-07 pattern with live data
│   ├── auth/                    # Auth form components
│   ├── layout/                  # DashboardHeader, nav components
│   ├── project/                 # ProjectCard, ProjectHeader, ViewSwitcher
│   ├── task/                    # TaskCard, TaskDetail, CreateTaskDialog, TaskFilters
│   ├── views/                   # KanbanBoard (dnd-kit), ListView
│   ├── workspace/               # WorkspaceCard, MemberList, AddMemberDialog
│   └── shared/                  # EmptyState, LoadingSpinner, FileUpload, AvatarUpload
├── hooks/                       # use-auth, use-workspaces, use-projects, use-tasks, use-user
├── lib/
│   ├── auth/                    # Cognito client, session, JWT
│   ├── db/                      # DynamoDB client + entities (workspace, project, task, user, file, invitation)
│   ├── email/                   # AWS SES email service
│   └── storage/                 # S3 utilities
├── stores/                      # auth-store, workspace-store, ui-store
├── types/                       # TypeScript interfaces
└── validations/                 # Zod schemas
```

---

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/your-org/projectsphere.git
cd projectsphere
npm install
```

### 2. Configure AWS

See **[AWS-SETUP.md](./AWS-SETUP.md)** for step-by-step instructions to provision:
- Cognito User Pool + App Client
- DynamoDB table with 4 GSIs
- S3 bucket with CORS
- SES verified sender
- IAM policy + credentials

### 3. Environment Variables

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000

# AWS
NEXT_PUBLIC_AWS_REGION=us-east-1
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key

# Cognito
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
NEXT_PUBLIC_COGNITO_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX
COGNITO_JWKS_URL=https://cognito-idp.us-east-1.amazonaws.com/us-east-1_XXXXXXXXX/.well-known/jwks.json

# DynamoDB
DYNAMODB_TABLE_NAME=projectsphere

# S3
AWS_S3_BUCKET_NAME=projectsphere-files-ACCOUNTID
AWS_S3_REGION=us-east-1

# SES (for email invitations)
SES_FROM_EMAIL=noreply@yourdomain.com
```

### 4. Run

```bash
npm run dev       # Development
npm run build     # Production build
npm run start     # Production server
```

---

## DynamoDB Single-Table Design

| Entity | PK | SK | Purpose |
|---|---|---|---|
| Workspace | `WORKSPACE#{id}` | `METADATA` | Workspace data |
| Workspace Member | `WORKSPACE#{id}` | `MEMBER#{userId}` | Membership + role |
| Project | `WORKSPACE#{id}` | `PROJECT#{id}` | Project data |
| Task | `PROJECT#{projectId}` | `TASK#{id}` | Task data |
| User | `USER#{id}` | `PROFILE` | User profile |
| File | `ENTITY#{entityId}` | `FILE#{id}` | Attachment metadata |
| Invitation | `WORKSPACE#{id}` | `INVITE#{id}` | Email invitations |

**4 Global Secondary Indexes:**
- `GSI1` — User → Workspaces, Project lookups
- `GSI2` — Slug uniqueness, Invitation token lookup (`INVITE_TOKEN#...`)
- `GSI3` — Email → User lookup
- `GSI4` — Kanban ordering: `PROJECT#{id}#STATUS#{status}` / `ORDER#{n}`

---

## Application Flows

### New User Flow
```
Sign Up → Verify Email → Sign In → No Workspaces? → Onboarding Wizard
  1. Create Organization (name, slug, description)
  2. Invite Team (email + role → SES email sent)
  3. Done → Workspace Dashboard
```

### Email Invitation Flow
```
Admin → POST /api/workspaces/{id}/invitations
     → Invitation saved in DynamoDB
     → SES sends branded HTML email with /join/{token} link
     → Invitee clicks link → Join page
     → If not authenticated → redirect to login/register
     → POST /api/invitations/{token} → user added to workspace
     → Invitation marked "accepted"
```

### File Upload Flow
```
Client → POST /api/uploads { fileName, fileType, fileSize }
Server → Returns presigned S3 PUT URL
Client → PUT {presigned-url} (direct to S3, no proxying)
Client → POST /api/uploads/{fileId}/confirm
Server → Saves metadata in DynamoDB
```

---

## Build & Deploy

### AWS Amplify Hosting
1. Connect your GitHub repository in [Amplify Console](https://console.aws.amazon.com/amplify/)
2. Set all environment variables in **App Settings → Environment Variables**
3. Amplify auto-deploys on push to `main`

### Vercel / Self-hosted
Works with any Node.js 18+ hosting. Set environment variables in your platform's dashboard.

---

## License

MIT

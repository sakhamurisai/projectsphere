# AWS Setup — ProjectSphere

Full setup guide for every AWS service the app uses.

**Services:** Cognito · DynamoDB (8 tables) · S3 · SES · IAM

**Region:** `us-east-2` (all services unless noted)

---

## Quick Start

```bash
# 1. Clone and install
npm install

# 2. Copy env template
cp .env.example .env.local

# 3. Follow this guide top-to-bottom, fill in .env.local as you go
# 4. Run dev server
npm run dev
```

---

## 1. IAM — Credentials

Set up IAM **before** the other services so you have credentials ready.

### 1.1 Create IAM User

1. Open [IAM → Users → Create user](https://console.aws.amazon.com/iam/home#/users/create)
2. **User name:** `projectsphere-app`
3. **Access type:** Programmatic access only (no console login)
4. Skip permissions for now — attach policy in next step

### 1.2 Create IAM Policy

Create a policy named `ProjectSpherePolicy`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DynamoDB",
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query",
        "dynamodb:BatchGetItem",
        "dynamodb:BatchWriteItem",
        "dynamodb:TransactWriteItems"
      ],
      "Resource": [
        "arn:aws:dynamodb:us-east-2:*:table/projectsphere-users",
        "arn:aws:dynamodb:us-east-2:*:table/projectsphere-users/index/*",
        "arn:aws:dynamodb:us-east-2:*:table/projectsphere-workspaces",
        "arn:aws:dynamodb:us-east-2:*:table/projectsphere-workspaces/index/*",
        "arn:aws:dynamodb:us-east-2:*:table/projectsphere-workspace-members",
        "arn:aws:dynamodb:us-east-2:*:table/projectsphere-workspace-members/index/*",
        "arn:aws:dynamodb:us-east-2:*:table/projectsphere-projects",
        "arn:aws:dynamodb:us-east-2:*:table/projectsphere-projects/index/*",
        "arn:aws:dynamodb:us-east-2:*:table/projectsphere-project-members",
        "arn:aws:dynamodb:us-east-2:*:table/projectsphere-project-members/index/*",
        "arn:aws:dynamodb:us-east-2:*:table/projectsphere-tasks",
        "arn:aws:dynamodb:us-east-2:*:table/projectsphere-tasks/index/*",
        "arn:aws:dynamodb:us-east-2:*:table/projectsphere-invitations",
        "arn:aws:dynamodb:us-east-2:*:table/projectsphere-invitations/index/*",
        "arn:aws:dynamodb:us-east-2:*:table/projectsphere-files",
        "arn:aws:dynamodb:us-east-2:*:table/projectsphere-files/index/*"
      ]
    },
    {
      "Sid": "S3Objects",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:GetObjectAttributes"
      ],
      "Resource": "arn:aws:s3:::projectsphere-files/*"
    },
    {
      "Sid": "S3Bucket",
      "Effect": "Allow",
      "Action": ["s3:ListBucket"],
      "Resource": "arn:aws:s3:::projectsphere-files"
    },
    {
      "Sid": "SES",
      "Effect": "Allow",
      "Action": [
        "ses:SendEmail",
        "ses:SendRawEmail"
      ],
      "Resource": "*"
    }
  ]
}
```

### 1.3 Attach Policy & Get Keys

1. Attach `ProjectSpherePolicy` to the `projectsphere-app` user
2. Go to **Security credentials → Access keys → Create access key**
3. Choose **Application running outside AWS**
4. Copy both keys — you only see them once

```env
AWS_REGION=us-east-2
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
```

> **Production note:** Use IAM Roles (ECS/EC2 instance profile) instead of static keys. Never commit keys to git.

---

## 2. Cognito — Authentication

### 2.1 Create User Pool

1. Open [Cognito → Create user pool](https://console.aws.amazon.com/cognito/)
2. **Sign-in option:** Email
3. Click through with these settings:

**Security:**

| Setting | Value |
|---|---|
| Password min length | 8 |
| Require uppercase | ✅ |
| Require lowercase | ✅ |
| Require numbers | ✅ |
| Require special characters | ✅ |
| MFA | No MFA (enable for production) |
| Account recovery | Email only |

**Sign-up:**

| Setting | Value |
|---|---|
| Required attributes | `email`, `name` |
| Email verification | ✅ Send code |
| Verification type | Code |

**Email delivery:**
- Development: use Cognito default (50 emails/day limit)
- Production: use SES (see section 4)

### 2.2 Create App Client

Inside the user pool → **App clients → Add app client:**

| Setting | Value |
|---|---|
| App client name | `projectsphere-web` |
| Client secret | **None** (public client) |
| Auth flows | `ALLOW_USER_SRP_AUTH`, `ALLOW_REFRESH_TOKEN_AUTH` |

### 2.3 Collect Values

After creation, note the following:

```env
NEXT_PUBLIC_AWS_REGION=us-east-2
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-2_XXXXXXXXX
NEXT_PUBLIC_COGNITO_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_COGNITO_DOMAIN=https://us-east-2xxxxxxxxx.auth.us-east-2.amazoncognito.com
```

The JWKS URL for server-side JWT verification is:
```
https://cognito-idp.us-east-2.amazonaws.com/{USER_POOL_ID}/.well-known/jwks.json
```

### 2.4 CLI

```bash
# Create user pool
aws cognito-idp create-user-pool \
  --pool-name projectsphere-users \
  --policies 'PasswordPolicy={MinimumLength=8,RequireUppercase=true,RequireLowercase=true,RequireNumbers=true,RequireSymbols=true}' \
  --auto-verified-attributes email \
  --username-attributes email \
  --schema '[
    {"Name":"name","Required":true,"Mutable":true},
    {"Name":"email","Required":true,"Mutable":false}
  ]' \
  --region us-east-2

# Create app client (replace POOL_ID)
aws cognito-idp create-user-pool-client \
  --user-pool-id us-east-2_XXXXXXXXX \
  --client-name projectsphere-web \
  --no-generate-secret \
  --explicit-auth-flows ALLOW_USER_SRP_AUTH ALLOW_REFRESH_TOKEN_AUTH \
  --region us-east-2
```

---

## 3. DynamoDB — 8 Tables

One table per entity. All tables use **On-demand** billing (no capacity planning).

---

### Table 1 — `projectsphere-users`

Stores user profiles linked to Cognito.

| Key | Attribute | Type |
|---|---|---|
| Partition key | `userId` | String |

**GSIs:**

| Index | PK | SK | Used for |
|---|---|---|---|
| `email-index` | `email` | — | Login (`getUserByEmail`) |
| `cognitoSub-index` | `cognitoSub` | — | Post-auth user lookup |

```bash
aws dynamodb create-table \
  --table-name projectsphere-users \
  --attribute-definitions \
    AttributeName=userId,AttributeType=S \
    AttributeName=email,AttributeType=S \
    AttributeName=cognitoSub,AttributeType=S \
  --key-schema AttributeName=userId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --global-secondary-indexes '[
    {"IndexName":"email-index","KeySchema":[{"AttributeName":"email","KeyType":"HASH"}],"Projection":{"ProjectionType":"ALL"}},
    {"IndexName":"cognitoSub-index","KeySchema":[{"AttributeName":"cognitoSub","KeyType":"HASH"}],"Projection":{"ProjectionType":"ALL"}}
  ]' \
  --region us-east-2
```

---

### Table 2 — `projectsphere-workspaces`

Stores workspace metadata.

| Key | Attribute | Type |
|---|---|---|
| Partition key | `workspaceId` | String |

**GSIs:**

| Index | PK | SK | Used for |
|---|---|---|---|
| `slug-index` | `slug` | — | `getWorkspaceBySlug` |
| `ownerId-index` | `ownerId` | — | Workspaces created by user |

```bash
aws dynamodb create-table \
  --table-name projectsphere-workspaces \
  --attribute-definitions \
    AttributeName=workspaceId,AttributeType=S \
    AttributeName=slug,AttributeType=S \
    AttributeName=ownerId,AttributeType=S \
  --key-schema AttributeName=workspaceId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --global-secondary-indexes '[
    {"IndexName":"slug-index","KeySchema":[{"AttributeName":"slug","KeyType":"HASH"}],"Projection":{"ProjectionType":"ALL"}},
    {"IndexName":"ownerId-index","KeySchema":[{"AttributeName":"ownerId","KeyType":"HASH"}],"Projection":{"ProjectionType":"ALL"}}
  ]' \
  --region us-east-2
```

---

### Table 3 — `projectsphere-workspace-members`

Maps users to workspaces with roles (owner / admin / member / viewer).

| Key | Attribute | Type |
|---|---|---|
| Partition key | `workspaceId` | String |
| Sort key | `userId` | String |

**GSI:**

| Index | PK | SK | Used for |
|---|---|---|---|
| `userId-index` | `userId` | `workspaceId` | `getUserWorkspaces` (sidebar) |

```bash
aws dynamodb create-table \
  --table-name projectsphere-workspace-members \
  --attribute-definitions \
    AttributeName=workspaceId,AttributeType=S \
    AttributeName=userId,AttributeType=S \
  --key-schema \
    AttributeName=workspaceId,KeyType=HASH \
    AttributeName=userId,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --global-secondary-indexes '[
    {"IndexName":"userId-index","KeySchema":[{"AttributeName":"userId","KeyType":"HASH"},{"AttributeName":"workspaceId","KeyType":"RANGE"}],"Projection":{"ProjectionType":"ALL"}}
  ]' \
  --region us-east-2
```

---

### Table 4 — `projectsphere-projects`

Stores project metadata inside a workspace.

| Key | Attribute | Type |
|---|---|---|
| Partition key | `projectId` | String |

**GSI:**

| Index | PK | SK | Used for |
|---|---|---|---|
| `workspaceId-index` | `workspaceId` | `createdAt` | `getWorkspaceProjects` (sidebar + dashboard) |

```bash
aws dynamodb create-table \
  --table-name projectsphere-projects \
  --attribute-definitions \
    AttributeName=projectId,AttributeType=S \
    AttributeName=workspaceId,AttributeType=S \
    AttributeName=createdAt,AttributeType=S \
  --key-schema AttributeName=projectId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --global-secondary-indexes '[
    {"IndexName":"workspaceId-index","KeySchema":[{"AttributeName":"workspaceId","KeyType":"HASH"},{"AttributeName":"createdAt","KeyType":"RANGE"}],"Projection":{"ProjectionType":"ALL"}}
  ]' \
  --region us-east-2
```

---

### Table 5 — `projectsphere-project-members`

Maps users to projects with roles.

| Key | Attribute | Type |
|---|---|---|
| Partition key | `projectId` | String |
| Sort key | `userId` | String |

**GSI:**

| Index | PK | SK | Used for |
|---|---|---|---|
| `userId-index` | `userId` | `projectId` | `getUserProjects` |

```bash
aws dynamodb create-table \
  --table-name projectsphere-project-members \
  --attribute-definitions \
    AttributeName=projectId,AttributeType=S \
    AttributeName=userId,AttributeType=S \
  --key-schema \
    AttributeName=projectId,KeyType=HASH \
    AttributeName=userId,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --global-secondary-indexes '[
    {"IndexName":"userId-index","KeySchema":[{"AttributeName":"userId","KeyType":"HASH"},{"AttributeName":"projectId","KeyType":"RANGE"}],"Projection":{"ProjectionType":"ALL"}}
  ]' \
  --region us-east-2
```

---

### Table 6 — `projectsphere-tasks`

Stores tasks. Powers the Kanban board, list view, and subtasks.

| Key | Attribute | Type |
|---|---|---|
| Partition key | `taskId` | String |

**GSIs:**

| Index | PK | SK | Used for |
|---|---|---|---|
| `projectId-status-index` | `projectId` | `status` | Kanban columns per project |
| `assigneeId-index` | `assigneeId` | `dueDate` | My tasks + due-date sorting |
| `parentTaskId-index` | `parentTaskId` | — | Subtask lookup |

```bash
aws dynamodb create-table \
  --table-name projectsphere-tasks \
  --attribute-definitions \
    AttributeName=taskId,AttributeType=S \
    AttributeName=projectId,AttributeType=S \
    AttributeName=status,AttributeType=S \
    AttributeName=assigneeId,AttributeType=S \
    AttributeName=dueDate,AttributeType=S \
    AttributeName=parentTaskId,AttributeType=S \
  --key-schema AttributeName=taskId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --global-secondary-indexes '[
    {"IndexName":"projectId-status-index","KeySchema":[{"AttributeName":"projectId","KeyType":"HASH"},{"AttributeName":"status","KeyType":"RANGE"}],"Projection":{"ProjectionType":"ALL"}},
    {"IndexName":"assigneeId-index","KeySchema":[{"AttributeName":"assigneeId","KeyType":"HASH"},{"AttributeName":"dueDate","KeyType":"RANGE"}],"Projection":{"ProjectionType":"ALL"}},
    {"IndexName":"parentTaskId-index","KeySchema":[{"AttributeName":"parentTaskId","KeyType":"HASH"}],"Projection":{"ProjectionType":"ALL"}}
  ]' \
  --region us-east-2
```

---

### Table 7 — `projectsphere-invitations`

Workspace invite links sent via email. Expire after 7 days.

| Key | Attribute | Type |
|---|---|---|
| Partition key | `invitationId` | String |

**GSIs:**

| Index | PK | SK | Used for |
|---|---|---|---|
| `token-index` | `token` | — | Accept invite by token (`/join/[token]`) |
| `workspaceId-index` | `workspaceId` | `createdAt` | List pending invites in settings |

```bash
aws dynamodb create-table \
  --table-name projectsphere-invitations \
  --attribute-definitions \
    AttributeName=invitationId,AttributeType=S \
    AttributeName=token,AttributeType=S \
    AttributeName=workspaceId,AttributeType=S \
    AttributeName=createdAt,AttributeType=S \
  --key-schema AttributeName=invitationId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --global-secondary-indexes '[
    {"IndexName":"token-index","KeySchema":[{"AttributeName":"token","KeyType":"HASH"}],"Projection":{"ProjectionType":"ALL"}},
    {"IndexName":"workspaceId-index","KeySchema":[{"AttributeName":"workspaceId","KeyType":"HASH"},{"AttributeName":"createdAt","KeyType":"RANGE"}],"Projection":{"ProjectionType":"ALL"}}
  ]' \
  --region us-east-2
```

---

### Table 8 — `projectsphere-files`

Metadata for files uploaded to S3 (task/project attachments, avatars).

| Key | Attribute | Type |
|---|---|---|
| Partition key | `fileId` | String |

**GSI:**

| Index | PK | SK | Used for |
|---|---|---|---|
| `entityId-index` | `entityId` | `createdAt` | All files attached to a task or project |

```bash
aws dynamodb create-table \
  --table-name projectsphere-files \
  --attribute-definitions \
    AttributeName=fileId,AttributeType=S \
    AttributeName=entityId,AttributeType=S \
    AttributeName=createdAt,AttributeType=S \
  --key-schema AttributeName=fileId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --global-secondary-indexes '[
    {"IndexName":"entityId-index","KeySchema":[{"AttributeName":"entityId","KeyType":"HASH"},{"AttributeName":"createdAt","KeyType":"RANGE"}],"Projection":{"ProjectionType":"ALL"}}
  ]' \
  --region us-east-2
```

---

### 3.9 Verify All Tables

```bash
# List — should show all 8 tables
aws dynamodb list-tables --region us-east-2 --output table

# Verify each table's status and GSI names
for table in projectsphere-users projectsphere-workspaces projectsphere-workspace-members \
             projectsphere-projects projectsphere-project-members projectsphere-tasks \
             projectsphere-invitations projectsphere-files; do
  echo "--- $table ---"
  aws dynamodb describe-table \
    --table-name $table \
    --query 'Table.{Status:TableStatus,GSIs:GlobalSecondaryIndexes[*].IndexName}' \
    --region us-east-2
done
```

---

## 4. S3 — File Storage

Stores task attachments, project files, and user avatars. All access is via **presigned URLs** — the bucket stays private.

### 4.1 Create Bucket

1. Open [S3 → Create bucket](https://console.aws.amazon.com/s3/)

| Setting | Value |
|---|---|
| Bucket name | `projectsphere-files` |
| Region | `us-east-2` |
| Object Ownership | ACLs disabled |
| Block all public access | ✅ ON (keep all 4 blocked) |
| Versioning | Off (enable in production) |
| Encryption | SSE-S3 (AES-256) |

### 4.2 Configure CORS

Bucket → **Permissions** → **CORS** → paste:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://yourdomain.com"
    ],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

### 4.3 CLI

```bash
# Create bucket
aws s3api create-bucket \
  --bucket projectsphere-files \
  --region us-east-2 \
  --create-bucket-configuration LocationConstraint=us-east-2

# Block all public access
aws s3api put-public-access-block \
  --bucket projectsphere-files \
  --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

# Apply CORS
aws s3api put-bucket-cors \
  --bucket projectsphere-files \
  --cors-configuration '{
    "CORSRules": [{
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET","PUT","POST","DELETE","HEAD"],
      "AllowedOrigins": ["http://localhost:3000","https://yourdomain.com"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3600
    }]
  }'
```

### 4.4 Env vars

```env
AWS_S3_BUCKET_NAME=projectsphere-files
AWS_S3_REGION=us-east-2
NEXT_PUBLIC_AWS_S3_BUCKET_NAME=projectsphere-files
NEXT_PUBLIC_AWS_S3_REGION=us-east-2
```

---

## 5. SES — Email (Invitations)

Used to send workspace invite emails. ProjectSphere uses **SMTP credentials** (not the SDK directly).

### 5.1 Verify Sender Identity

1. Open [SES → Verified identities → Create identity](https://console.aws.amazon.com/ses/)
2. Choose **Email address**
3. Enter your from-address (e.g. `noreply@yourdomain.com`)
4. Click the verification link sent to that address

> In **sandbox mode** (default), both the sender AND recipient must be verified. Request production access to remove this restriction.

### 5.2 Create SMTP Credentials

1. Open [SES → SMTP settings → Create SMTP credentials](https://console.aws.amazon.com/ses/home#/smtp)
2. IAM username: `ses-smtp-user.projectsphere`
3. Click **Create** — download the SMTP credentials

The SMTP endpoint for `us-east-2` is:
```
email-smtp.us-east-2.amazonaws.com:587
```

### 5.3 Request Production Access (when ready)

SES sandbox limits you to verified emails only.

1. SES → **Account dashboard → Request production access**
2. Use case: transactional (invitation emails)
3. Approval usually within 24 hours

### 5.4 Env vars

```env
NEXT_AWS_STMP=<SMTP Access Key ID>
NEXT_AWS_STMP_PASSWORD=<SMTP Secret>
NEXT_AWS_STMP_IAM_USERNAME=ses-smtp-user.projectsphere
NEXT_AWS_SES_FROM_EMAIL=noreply@yourdomain.com
```

---

## 6. Complete Environment Variables

Full `.env.local` reference — fill in every value:

```env
# ─── App ─────────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ─── AWS ─────────────────────────────────────────────────────
AWS_REGION=us-east-2
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...

# ─── Cognito ─────────────────────────────────────────────────
NEXT_PUBLIC_AWS_REGION=us-east-2
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-2_XXXXXXXXX
NEXT_PUBLIC_COGNITO_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_COGNITO_DOMAIN=https://us-east-2xxxxxxxxx.auth.us-east-2.amazoncognito.com

# ─── DynamoDB ────────────────────────────────────────────────
DYNAMODB_USERS_TABLE=projectsphere-users
DYNAMODB_WORKSPACES_TABLE=projectsphere-workspaces
DYNAMODB_WORKSPACE_MEMBERS_TABLE=projectsphere-workspace-members
DYNAMODB_PROJECTS_TABLE=projectsphere-projects
DYNAMODB_PROJECT_MEMBERS_TABLE=projectsphere-project-members
DYNAMODB_TASKS_TABLE=projectsphere-tasks
DYNAMODB_INVITATIONS_TABLE=projectsphere-invitations
DYNAMODB_FILES_TABLE=projectsphere-files

# ─── S3 ──────────────────────────────────────────────────────
AWS_S3_BUCKET_NAME=projectsphere-files
AWS_S3_REGION=us-east-2
NEXT_PUBLIC_AWS_S3_BUCKET_NAME=projectsphere-files
NEXT_PUBLIC_AWS_S3_REGION=us-east-2

# ─── SES (SMTP) ──────────────────────────────────────────────
NEXT_AWS_STMP=AKIA...
NEXT_AWS_STMP_PASSWORD=...
NEXT_AWS_STMP_IAM_USERNAME=ses-smtp-user.projectsphere
NEXT_AWS_SES_FROM_EMAIL=noreply@yourdomain.com
```

---

## 7. Verification Checklist

Run after setup to confirm everything is working:

```bash
# ── Cognito ──────────────────────────────────────────────────
aws cognito-idp describe-user-pool \
  --user-pool-id us-east-2_XXXXXXXXX \
  --region us-east-2 \
  --query 'UserPool.{Name:Name,Status:Status}'

# ── DynamoDB — list all 8 tables ─────────────────────────────
aws dynamodb list-tables --region us-east-2

# ── DynamoDB — tasks table GSIs ──────────────────────────────
aws dynamodb describe-table \
  --table-name projectsphere-tasks \
  --region us-east-2 \
  --query 'Table.GlobalSecondaryIndexes[*].{Name:IndexName,Status:IndexStatus}'

# ── S3 ───────────────────────────────────────────────────────
aws s3api head-bucket --bucket projectsphere-files --region us-east-2

# ── SES — check verified identities ─────────────────────────
aws ses list-identities --region us-east-2

# ── IAM — check policy attached ──────────────────────────────
aws iam list-attached-user-policies --user-name projectsphere-app
```

---

## 8. Architecture

```
Browser
  │
  ├─ Auth: AWS Cognito (SRP flow → JWT tokens in Zustand)
  │
  ├─ API: Next.js /api/* routes
  │        ├─ Verify JWT (Cognito JWKS endpoint)
  │        ├─ DynamoDB (8 tables — users, workspaces, projects, tasks …)
  │        └─ SES SMTP (invitation emails)
  │
  └─ Files:
       1. Client → POST /api/uploads          → get S3 presigned PUT URL
       2. Client → PUT  {presigned-url}        → upload directly to S3
       3. Client → POST /api/uploads/[fileId]  → save metadata to DynamoDB
       4. Client → GET  /api/uploads/[fileId]  → get presigned GET URL to view
```

---

## 9. Production Checklist

| Area | Action |
|---|---|
| Cognito | Enable MFA (TOTP or SMS) |
| Cognito | Configure SES for email delivery (remove 50/day sandbox limit) |
| DynamoDB | Enable Point-in-Time Recovery (PITR) on all 8 tables |
| DynamoDB | Set up CloudWatch alarms for throttling |
| S3 | Enable versioning |
| S3 | Add lifecycle rule to delete incomplete multipart uploads after 7 days |
| S3 | Put CloudFront in front for fast file delivery |
| SES | Request production access (remove sandbox restriction) |
| IAM | Replace access keys with IAM Role (ECS/EC2 instance profile) |
| Secrets | Move credentials to AWS Secrets Manager |
| Monitoring | Enable AWS CloudTrail for audit logging |

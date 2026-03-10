# AWS Setup Guide — ProjectSphere

Complete setup instructions for all AWS services used by ProjectSphere: **Cognito** (auth), **DynamoDB** (database), and **S3** (file storage).

---

## Prerequisites

- AWS account with admin access
- AWS CLI installed and configured (`aws configure`)
- Node.js 18+

---

## 1. AWS Cognito — User Authentication

### 1.1 Create a User Pool

1. Open [AWS Console → Cognito](https://console.aws.amazon.com/cognito/)
2. Click **Create user pool**
3. **Authentication providers**: Select **Email** (Cognito user pool)
4. Click **Next**

### 1.2 Security Requirements

| Setting | Value |
|---|---|
| Password minimum length | 8 |
| Require uppercase | ✅ |
| Require lowercase | ✅ |
| Require numbers | ✅ |
| Require special characters | ✅ |
| MFA | Optional (No MFA for dev) |
| Self-service account recovery | Email only |

### 1.3 Sign-up & Verification

- **Required attributes**: `name`, `email`
- **Email verification**: ✅ Send verification code
- **Verification message type**: Code

### 1.4 Message Delivery

| Setting | Value |
|---|---|
| FROM email | your-noreply@yourdomain.com |
| SES region | Same as your app region |
| Reply-to | support@yourdomain.com |

> For development, you can use **Cognito's default email** (limited to 50 emails/day).
> For production, configure **Amazon SES**.

### 1.5 App Integration

- **User pool name**: `projectsphere-users`
- **Domain**: Create a Cognito domain → `projectsphere-auth`
- **App client**:
  - Click **Add an app client**
  - Name: `projectsphere-web`
  - **Authentication flows**: `ALLOW_USER_SRP_AUTH`, `ALLOW_REFRESH_TOKEN_AUTH`
  - **Auth flow session duration**: 3 minutes
  - Client secret: **Don't generate** (public client)

### 1.6 Collect Values

After creation, note:

```env
NEXT_PUBLIC_AWS_REGION=us-east-1
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
NEXT_PUBLIC_COGNITO_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX
```

Find **JWKS URL** for token verification:
```
https://cognito-idp.{REGION}.amazonaws.com/{USER_POOL_ID}/.well-known/jwks.json
```

```env
COGNITO_JWKS_URL=https://cognito-idp.us-east-1.amazonaws.com/us-east-1_XXXXXXXXX/.well-known/jwks.json
```

### 1.7 CLI Alternative

```bash
# Create user pool
aws cognito-idp create-user-pool \
  --pool-name projectsphere-users \
  --policies 'PasswordPolicy={MinimumLength=8,RequireUppercase=true,RequireLowercase=true,RequireNumbers=true,RequireSymbols=true}' \
  --auto-verified-attributes email \
  --username-attributes email \
  --schema '[{"Name":"name","Required":true,"Mutable":true},{"Name":"email","Required":true,"Mutable":false}]' \
  --region us-east-1

# Create app client (replace USER_POOL_ID)
aws cognito-idp create-user-pool-client \
  --user-pool-id us-east-1_XXXXXXXXX \
  --client-name projectsphere-web \
  --no-generate-secret \
  --explicit-auth-flows ALLOW_USER_SRP_AUTH ALLOW_REFRESH_TOKEN_AUTH \
  --region us-east-1
```

---

## 2. AWS DynamoDB — Single-Table Database

### 2.1 Create the Main Table

1. Open [AWS Console → DynamoDB](https://console.aws.amazon.com/dynamodb/)
2. Click **Create table**

| Setting | Value |
|---|---|
| Table name | `projectsphere` |
| Partition key | `PK` (String) |
| Sort key | `SK` (String) |
| Table class | DynamoDB Standard |
| Capacity mode | **On-demand** (pay per request) |

### 2.2 Create Global Secondary Indexes (GSIs)

After the table is created, go to **Indexes → Create index** for each:

#### GSI1 — Entity lookup by type

| Field | Value |
|---|---|
| Index name | `GSI1` |
| Partition key | `GSI1PK` (String) |
| Sort key | `GSI1SK` (String) |
| Projection | All |

#### GSI2 — Slug/unique lookup

| Field | Value |
|---|---|
| Index name | `GSI2` |
| Partition key | `GSI2PK` (String) |
| Sort key | `GSI2SK` (String) |
| Projection | All |

#### GSI3 — User lookup

| Field | Value |
|---|---|
| Index name | `GSI3` |
| Partition key | `GSI3PK` (String) |
| Sort key | `GSI3SK` (String) |
| Projection | All |

#### GSI4 — Inverted index / cross-entity

| Field | Value |
|---|---|
| Index name | `GSI4` |
| Partition key | `GSI4PK` (String) |
| Sort key | `GSI4SK` (String) |
| Projection | All |

### 2.3 Table Access Patterns

```
Workspaces:   PK=WORKSPACE#{id}  SK=METADATA
Members:      PK=WORKSPACE#{id}  SK=MEMBER#{userId}
Projects:     PK=PROJECT#{id}    SK=METADATA
Tasks:        PK=TASK#{id}       SK=METADATA
Users:        PK=USER#{id}       SK=METADATA
Files:        PK=FILE#{id}       SK=METADATA
```

### 2.4 Collect Values

```env
DYNAMODB_TABLE_NAME=projectsphere
```

### 2.5 CLI — Create Table with All GSIs

```bash
aws dynamodb create-table \
  --table-name projectsphere \
  --attribute-definitions \
    AttributeName=PK,AttributeType=S \
    AttributeName=SK,AttributeType=S \
    AttributeName=GSI1PK,AttributeType=S \
    AttributeName=GSI1SK,AttributeType=S \
    AttributeName=GSI2PK,AttributeType=S \
    AttributeName=GSI2SK,AttributeType=S \
    AttributeName=GSI3PK,AttributeType=S \
    AttributeName=GSI3SK,AttributeType=S \
    AttributeName=GSI4PK,AttributeType=S \
    AttributeName=GSI4SK,AttributeType=S \
  --key-schema \
    AttributeName=PK,KeyType=HASH \
    AttributeName=SK,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --global-secondary-indexes '[
    {
      "IndexName": "GSI1",
      "KeySchema": [
        {"AttributeName": "GSI1PK","KeyType": "HASH"},
        {"AttributeName": "GSI1SK","KeyType": "RANGE"}
      ],
      "Projection": {"ProjectionType": "ALL"}
    },
    {
      "IndexName": "GSI2",
      "KeySchema": [
        {"AttributeName": "GSI2PK","KeyType": "HASH"},
        {"AttributeName": "GSI2SK","KeyType": "RANGE"}
      ],
      "Projection": {"ProjectionType": "ALL"}
    },
    {
      "IndexName": "GSI3",
      "KeySchema": [
        {"AttributeName": "GSI3PK","KeyType": "HASH"},
        {"AttributeName": "GSI3SK","KeyType": "RANGE"}
      ],
      "Projection": {"ProjectionType": "ALL"}
    },
    {
      "IndexName": "GSI4",
      "KeySchema": [
        {"AttributeName": "GSI4PK","KeyType": "HASH"},
        {"AttributeName": "GSI4SK","KeyType": "RANGE"}
      ],
      "Projection": {"ProjectionType": "ALL"}
    }
  ]' \
  --region us-east-1
```

---

## 3. AWS S3 — File Storage

### 3.1 Create the Bucket

1. Open [AWS Console → S3](https://console.aws.amazon.com/s3/)
2. Click **Create bucket**

| Setting | Value |
|---|---|
| Bucket name | `projectsphere-files-{your-account-id}` |
| AWS Region | Same as your app (e.g., `us-east-1`) |
| Object Ownership | ACLs disabled |
| Block all public access | ✅ **Keep blocked** (use presigned URLs) |
| Versioning | Disabled (enable for production) |
| Default encryption | SSE-S3 |

### 3.2 Configure CORS

In the bucket → **Permissions** → **Cross-origin resource sharing (CORS)**:

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

### 3.3 Bucket Policy (optional — if using CloudFront)

For production with CloudFront, restrict direct S3 access:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontServicePrincipal",
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudfront.amazonaws.com"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::projectsphere-files-{account-id}/*"
    }
  ]
}
```

### 3.4 Collect Values

```env
AWS_S3_BUCKET_NAME=projectsphere-files-123456789012
AWS_S3_REGION=us-east-1
```

### 3.5 CLI — Create Bucket

```bash
# Create bucket
aws s3api create-bucket \
  --bucket projectsphere-files-$(aws sts get-caller-identity --query Account --output text) \
  --region us-east-1

# Block public access
aws s3api put-public-access-block \
  --bucket projectsphere-files-ACCOUNT_ID \
  --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

# Apply CORS
aws s3api put-bucket-cors \
  --bucket projectsphere-files-ACCOUNT_ID \
  --cors-configuration '{
    "CORSRules": [{
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET","PUT","POST","DELETE","HEAD"],
      "AllowedOrigins": ["http://localhost:3000"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3600
    }]
  }'
```

---

## 4. AWS SES — Email Service (Invitations)

ProjectSphere uses SES to send workspace invitation emails.

### 4.1 Verify a Sender Email (Sandbox Mode)

In sandbox mode, **both sender and recipient** must be verified.

1. Open [AWS Console → SES](https://console.aws.amazon.com/ses/)
2. Click **Verified identities → Create identity**
3. Choose **Email address**, enter `noreply@yourdomain.com`
4. Click the verification link sent to that address

### 4.2 Verify Your Domain (Production)

1. Add **Email address** or **Domain** identity
2. Add the DKIM CNAME records to your DNS provider
3. Wait for verification (can take up to 72 hours)

### 4.3 Move Out of Sandbox (Production)

By default SES is in sandbox mode (can only send to verified emails). For production:
1. Open **SES → Account dashboard → Request production access**
2. Explain your use case (transactional invitation emails)
3. AWS approves within 24 hours

### 4.4 CLI — Verify Email Address

```bash
aws ses verify-email-identity \
  --email-address noreply@yourdomain.com \
  --region us-east-1
```

### 4.5 Environment Variable

```env
SES_FROM_EMAIL=noreply@yourdomain.com
```

---

## 5. IAM — Service Credentials

### 5.1 Create an IAM User for the Application

1. Open [AWS Console → IAM](https://console.aws.amazon.com/iam/)
2. Click **Users → Create user**
3. Name: `projectsphere-app`
4. **Access type**: Programmatic access only
5. Attach the policy below

### 5.2 IAM Policy

Create a new policy named `ProjectSphereAppPolicy`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DynamoDBAccess",
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query",
        "dynamodb:Scan",
        "dynamodb:BatchGetItem",
        "dynamodb:BatchWriteItem",
        "dynamodb:TransactWriteItems"
      ],
      "Resource": [
        "arn:aws:dynamodb:us-east-1:*:table/projectsphere",
        "arn:aws:dynamodb:us-east-1:*:table/projectsphere/index/*"
      ]
    },
    {
      "Sid": "S3Access",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:GetObjectAttributes"
      ],
      "Resource": "arn:aws:s3:::projectsphere-files-*/*"
    },
    {
      "Sid": "S3PresignedUrls",
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket"
      ],
      "Resource": "arn:aws:s3:::projectsphere-files-*"
    },
    {
      "Sid": "SESAccess",
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

### 5.3 Collect Credentials

After creating the user, download the **Access Key ID** and **Secret Access Key**:

```env
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=us-east-1
```

> **Security tip**: In production, prefer **IAM Roles** (EC2/ECS instance profiles or Lambda execution roles) over long-lived access keys.

---

## 6. Environment Variables Summary

Copy `.env.example` to `.env.local` and fill in all values:

```env
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# AWS Region
NEXT_PUBLIC_AWS_REGION=us-east-1
AWS_REGION=us-east-1

# AWS Credentials (use IAM roles in production)
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key

# Cognito
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
NEXT_PUBLIC_COGNITO_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX
COGNITO_JWKS_URL=https://cognito-idp.us-east-1.amazonaws.com/us-east-1_XXXXXXXXX/.well-known/jwks.json

# DynamoDB
DYNAMODB_TABLE_NAME=projectsphere

# S3
AWS_S3_BUCKET_NAME=projectsphere-files-123456789012
AWS_S3_REGION=us-east-1

# SES (email invitations)
SES_FROM_EMAIL=noreply@yourdomain.com
```

---

## 7. Verification Checklist

Run these commands to verify everything is set up correctly:

```bash
# Test DynamoDB connection
aws dynamodb describe-table --table-name projectsphere --region us-east-1

# Verify all 4 GSIs exist
aws dynamodb describe-table --table-name projectsphere \
  --query 'Table.GlobalSecondaryIndexes[*].IndexName' \
  --output text

# Test S3 bucket
aws s3 ls s3://projectsphere-files-ACCOUNT_ID

# Verify Cognito user pool
aws cognito-idp describe-user-pool \
  --user-pool-id us-east-1_XXXXXXXXX \
  --region us-east-1
```

### Start the Development Server

```bash
npm install
cp .env.example .env.local
# Fill in .env.local with your values
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

---

## 8. Architecture Overview

```
Browser
  │
  ├── Auth: AWS Cognito (SRP auth, JWT tokens)
  │         └── Tokens stored in memory (zustand)
  │
  ├── API: Next.js App Router (/api/*)
  │         ├── Verify JWT via JWKS endpoint
  │         ├── DynamoDB (data storage)
  │         └── S3 presigned URLs (file uploads)
  │
  └── File Upload Flow:
        1. Client → POST /api/uploads (get presigned URL)
        2. Client → PUT {presigned-url} (upload directly to S3)
        3. Client → POST /api/uploads/{fileId}/confirm (register metadata)
```

---

## 9. Production Recommendations

| Area | Recommendation |
|---|---|
| Auth | Enable MFA in Cognito |
| DynamoDB | Enable Point-in-Time Recovery (PITR) |
| S3 | Enable versioning + lifecycle rules |
| IAM | Use IAM roles instead of access keys |
| Monitoring | Enable CloudWatch alarms for DynamoDB throttling |
| CDN | Put CloudFront in front of S3 for file serving |
| Secrets | Use AWS Secrets Manager or Parameter Store for env vars |

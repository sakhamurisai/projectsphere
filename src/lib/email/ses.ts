import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "email-smtp.us-east-2.amazonaws.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.NEXT_AWS_STMP ?? "",
    pass: process.env.NEXT_AWS_STMP_PASSWORD ?? "",
  },
});

const FROM_EMAIL = process.env.NEXT_AWS_SES_FROM_EMAIL ?? "noreply@projectsphere.app";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function sendInvitationEmail(opts: {
  to: string;
  invitedByName: string;
  workspaceName: string;
  role: string;
  token: string;
}): Promise<void> {
  const inviteUrl = `${APP_URL}/join/${opts.token}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>You've been invited to ${opts.workspaceName}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f4f4f5; margin: 0; padding: 40px 20px;">
  <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #7c3aed, #6d28d9); padding: 32px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">
        ProjectSphere
      </h1>
      <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px;">
        Your project management hub
      </p>
    </div>
    <!-- Body -->
    <div style="padding: 36px 32px;">
      <h2 style="color: #09090b; margin: 0 0 12px; font-size: 22px; font-weight: 600;">
        You've been invited!
      </h2>
      <p style="color: #71717a; margin: 0 0 24px; font-size: 15px; line-height: 1.6;">
        <strong style="color: #3f3f46;">${opts.invitedByName}</strong> has invited you to join
        <strong style="color: #3f3f46;">${opts.workspaceName}</strong> as a
        <strong style="color: #7c3aed; text-transform: capitalize;">${opts.role}</strong>.
      </p>
      <!-- CTA -->
      <div style="text-align: center; margin: 32px 0;">
        <a href="${inviteUrl}"
          style="display: inline-block; background: linear-gradient(135deg, #7c3aed, #6d28d9); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 15px; font-weight: 600; letter-spacing: 0.2px;">
          Accept Invitation
        </a>
      </div>
      <p style="color: #a1a1aa; font-size: 13px; text-align: center; margin: 0;">
        This invite expires in 7 days. If you did not expect this email, you can safely ignore it.
      </p>
    </div>
    <!-- Footer -->
    <div style="border-top: 1px solid #f4f4f5; padding: 20px 32px; text-align: center;">
      <p style="color: #a1a1aa; font-size: 12px; margin: 0;">
        © ${new Date().getFullYear()} ProjectSphere. All rights reserved.
      </p>
      <p style="color: #a1a1aa; font-size: 12px; margin: 4px 0 0;">
        If the button above doesn't work, copy this link:<br/>
        <a href="${inviteUrl}" style="color: #7c3aed; word-break: break-all;">${inviteUrl}</a>
      </p>
    </div>
  </div>
</body>
</html>`;

  await transporter.sendMail({
    from: FROM_EMAIL,
    to: opts.to,
    subject: `${opts.invitedByName} invited you to ${opts.workspaceName} on ProjectSphere`,
    html,
    text: `${opts.invitedByName} invited you to join ${opts.workspaceName} as a ${opts.role}.\n\nAccept your invitation: ${inviteUrl}\n\nThis invite expires in 7 days.`,
  });
}

export async function sendWelcomeEmail(opts: {
  to: string;
  name: string;
  workspaceName: string;
}): Promise<void> {
  const dashboardUrl = `${APP_URL}/`;

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f4f4f5; margin: 0; padding: 40px 20px;">
  <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
    <div style="background: linear-gradient(135deg, #7c3aed, #6d28d9); padding: 32px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">ProjectSphere</h1>
    </div>
    <div style="padding: 36px 32px;">
      <h2 style="color: #09090b; margin: 0 0 12px; font-size: 22px;">Welcome, ${opts.name}!</h2>
      <p style="color: #71717a; margin: 0 0 24px; font-size: 15px; line-height: 1.6;">
        Your workspace <strong style="color: #3f3f46;">${opts.workspaceName}</strong> is ready.
        Start managing projects, assign tasks, and collaborate with your team.
      </p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${dashboardUrl}"
          style="display: inline-block; background: linear-gradient(135deg, #7c3aed, #6d28d9); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 15px; font-weight: 600;">
          Go to Dashboard
        </a>
      </div>
    </div>
  </div>
</body>
</html>`;

  await transporter.sendMail({
    from: FROM_EMAIL,
    to: opts.to,
    subject: `Welcome to ProjectSphere — ${opts.workspaceName} is ready!`,
    html,
    text: `Welcome ${opts.name}! Your workspace ${opts.workspaceName} is ready. Visit: ${dashboardUrl}`,
  });
}

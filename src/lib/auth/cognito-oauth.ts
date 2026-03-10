const COGNITO_DOMAIN =
  process.env.NEXT_PUBLIC_COGNITO_DOMAIN ||
  "https://us-east-2pllwkiti8.auth.us-east-2.amazoncognito.com";

const CLIENT_ID =
  process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || "142a69dpeu9jornn9236ko48pc";

const CLIENT_SECRET = process.env.NEXT_PUBLIC_COGNITO_CLIENT_SECRET || "";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const CALLBACK_URI = `${APP_URL}/api/auth/callback`;

// Cognito requires %20 (not +) for spaces in scope
function buildUrl(base: string, params: Record<string, string>): string {
  const query = Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");
  return `${base}?${query}`;
}

export function getCognitoLoginUrl(redirectAfter?: string): string {
  const params: Record<string, string> = {
    client_id: CLIENT_ID,
    response_type: "code",
    scope: "email openid profile",
    redirect_uri: CALLBACK_URI,
  };
  if (redirectAfter && redirectAfter !== "/") {
    params.state = redirectAfter;
  }
  return buildUrl(`${COGNITO_DOMAIN}/login`, params);
}

export function getCognitoSignupUrl(): string {
  return buildUrl(`${COGNITO_DOMAIN}/signup`, {
    client_id: CLIENT_ID,
    response_type: "code",
    scope: "email openid profile",
    redirect_uri: CALLBACK_URI,
  });
}

export function getCognitoLogoutUrl(): string {
  return buildUrl(`${COGNITO_DOMAIN}/logout`, {
    client_id: CLIENT_ID,
    logout_uri: `${APP_URL}/login`,
  });
}

export async function exchangeCodeForTokens(code: string): Promise<{
  access_token: string;
  id_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  const params = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: CLIENT_ID,
    code,
    redirect_uri: CALLBACK_URI,
  });

  const headers: Record<string, string> = {
    "Content-Type": "application/x-www-form-urlencoded",
  };

  // If app client has a secret, send it as HTTP Basic Auth
  if (CLIENT_SECRET) {
    const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");
    headers["Authorization"] = `Basic ${credentials}`;
  }

  const response = await fetch(`${COGNITO_DOMAIN}/oauth2/token`, {
    method: "POST",
    headers,
    body: params.toString(),
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${text}`);
  }

  return JSON.parse(text);
}

import { NextRequest, NextResponse } from "next/server";

const CLIENT_ID = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!;
const CLIENT_SECRET = process.env.NEXT_PUBLIC_COGNITO_CLIENT_SECRET!;
const DOMAIN = process.env.NEXT_PUBLIC_COGNITO_DOMAIN!;

export async function GET(request: NextRequest) {
  const origin = new URL(request.url).origin;
  const { searchParams } = request.nextUrl;

  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent(error)}`);
  }
  if (!code) {
    return NextResponse.redirect(`${origin}/auth/login?error=no_code`);
  }

  try {
    // Exchange code for tokens
    const redirectUri = `${origin}/auth/callback`;
    const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");

    const res = await fetch(`${DOMAIN}/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${credentials}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: CLIENT_ID,
        code,
        redirect_uri: redirectUri,
      }).toString(),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("[auth/callback] token exchange failed:", text);
      return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent(text)}`);
    }

    const tokens = await res.json();

    // Create/update user in DB
    try {
      const { decodeToken } = await import("@/lib/auth/tokens");
      const { getOrCreateUser } = await import("@/lib/db/entities/user");

      // Fetch user info from /userInfo if id_token lacks email (openid-only scope)
      let email: string | undefined;
      let name: string | undefined;
      let sub: string | undefined;

      const payload = decodeToken(tokens.id_token);
      if (payload) {
        sub = payload.sub;
        email = payload.email as string | undefined;
        name = payload.name as string | undefined;
      }

      // Fallback: fetch from userInfo endpoint
      if (!email && tokens.access_token) {
        try {
          const uiRes = await fetch(`${DOMAIN}/oauth2/userInfo`, {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
          });
          if (uiRes.ok) {
            const ui = await uiRes.json();
            email = email || ui.email;
            name = name || ui.name;
            sub = sub || ui.sub;
          }
        } catch (uiErr) {
          console.error("[auth/callback] userInfo fetch failed:", uiErr);
        }
      }

      if (sub && email) {
        await getOrCreateUser(email, name || email.split("@")[0], sub);
      } else {
        console.error("[auth/callback] missing sub or email — user not created", { sub, email });
      }
    } catch (e) {
      console.error("[auth/callback] db error:", e);
    }

    // Redirect and set httpOnly cookies
    const redirectTo = state || "/dashboard";
    const response = NextResponse.redirect(`${origin}${redirectTo}`);

    const isProduction = process.env.NODE_ENV === "production";
    const base = { httpOnly: true, secure: isProduction, sameSite: "lax" as const, path: "/" };
    const accessExpiry = new Date(Date.now() + tokens.expires_in * 1000);
    const refreshExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    response.cookies.set("access_token", tokens.access_token, { ...base, expires: accessExpiry });
    response.cookies.set("id_token", tokens.id_token, { ...base, expires: accessExpiry });
    response.cookies.set("refresh_token", tokens.refresh_token, { ...base, expires: refreshExpiry });

    return response;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[auth/callback] error:", msg);
    return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent(msg)}`);
  }
}

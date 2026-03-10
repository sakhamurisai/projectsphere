import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/auth/cognito-oauth";
import { decodeToken } from "@/lib/auth/tokens";
import { getOrCreateUser } from "@/lib/db/entities/user";

const ACCESS_TOKEN_COOKIE = "access_token";
const REFRESH_TOKEN_COOKIE = "refresh_token";
const ID_TOKEN_COOKIE = "id_token";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error)}`, request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=no_code", request.url));
  }

  try {
    // Step 1 — exchange code for tokens
    let tokens;
    try {
      tokens = await exchangeCodeForTokens(code);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[callback] token exchange failed:", msg);
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent("token_exchange: " + msg)}`, request.url)
      );
    }

    // Step 2 — decode id_token
    const payload = decodeToken(tokens.id_token);
    if (!payload) {
      return NextResponse.redirect(new URL("/login?error=invalid_token", request.url));
    }

    // Step 3 — create or get user in DynamoDB
    try {
      await getOrCreateUser(
        payload.email,
        payload.name || payload.email.split("@")[0],
        payload.sub
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[callback] DynamoDB user create failed:", msg);
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent("db: " + msg)}`, request.url)
      );
    }

    // Step 4 — set cookies directly on the redirect response
    const redirectTo = state || "/";
    const response = NextResponse.redirect(new URL(redirectTo, request.url));

    const accessExpiry = new Date(Date.now() + tokens.expires_in * 1000);
    const refreshExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    const isProduction = process.env.NODE_ENV === "production";

    response.cookies.set(ACCESS_TOKEN_COOKIE, tokens.access_token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      expires: accessExpiry,
      path: "/",
    });

    response.cookies.set(REFRESH_TOKEN_COOKIE, tokens.refresh_token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      expires: refreshExpiry,
      path: "/",
    });

    response.cookies.set(ID_TOKEN_COOKIE, tokens.id_token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      expires: accessExpiry,
      path: "/",
    });

    return response;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[callback] unexpected error:", msg);
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(msg)}`, request.url)
    );
  }
}

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify, createRemoteJWKSet } from "jose";

const COGNITO_REGION = process.env.NEXT_PUBLIC_AWS_REGION || "us-east-2";
const USER_POOL_ID = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || "us-east-2_PLlWKITi8";

const COGNITO_BASE = `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/${USER_POOL_ID}`;
const JWKS_URL = `${COGNITO_BASE}/.well-known/jwks.json`;

// Paths that bypass auth entirely
const PUBLIC_PATHS = ["/", "/auth/login", "/auth/signup", "/auth/callback", "/auth/logout"];
const PUBLIC_API_PATHS = ["/api/auth/session"];

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;
function getJWKS() {
  if (!jwks) jwks = createRemoteJWKSet(new URL(JWKS_URL));
  return jwks;
}

async function verifyToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, getJWKS(), { issuer: COGNITO_BASE });
    return true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow public paths and static assets
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "?"))) {
    // Redirect authenticated users away from auth pages to dashboard
    if (pathname === "/auth/login" || pathname === "/auth/signup") {
      const idToken = request.cookies.get("id_token")?.value;
      if (idToken && (await verifyToken(idToken))) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }
    return NextResponse.next();
  }

  // Allow public API paths
  if (PUBLIC_API_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const idToken = request.cookies.get("id_token")?.value;

  // Protected API routes → 401
  if (pathname.startsWith("/api/")) {
    if (!idToken || !(await verifyToken(idToken))) {
      return NextResponse.json({ success: false, error: { message: "Unauthorized" } }, { status: 401 });
    }
    return NextResponse.next();
  }

  // Protected pages → redirect to login
  if (!idToken || !(await verifyToken(idToken))) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete("id_token");
    response.cookies.delete("access_token");
    response.cookies.delete("refresh_token");
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};

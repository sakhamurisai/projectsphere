import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify, createRemoteJWKSet } from "jose";

const COGNITO_REGION = process.env.NEXT_PUBLIC_AWS_REGION || "us-east-2";
const USER_POOL_ID = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || "us-east-2_PLlWKITi8";

const COGNITO_BASE = `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/${USER_POOL_ID}`;
const JWKS_URL = `${COGNITO_BASE}/.well-known/jwks.json`;

const publicPaths = ["/login", "/register", "/forgot-password", "/verify-email", "/reset-password"];
const authApiPaths = ["/api/auth/login", "/api/auth/register", "/api/auth/verify-email", "/api/auth/forgot-password", "/api/auth/reset-password", "/api/auth/refresh", "/api/auth/callback"];

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJWKS() {
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(JWKS_URL));
  }
  return jwks;
}

async function verifyToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, getJWKS(), {
      issuer: COGNITO_BASE,
    });
    return true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (publicPaths.some((path) => pathname.startsWith(path))) {
    const idToken = request.cookies.get("id_token")?.value;
    if (idToken) {
      const isValid = await verifyToken(idToken);
      if (isValid) {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }
    return NextResponse.next();
  }

  // Allow public API paths
  if (authApiPaths.some((path) => pathname === path)) {
    return NextResponse.next();
  }

  // Check for protected routes
  if (pathname.startsWith("/api/")) {
    const idToken = request.cookies.get("id_token")?.value;

    if (!idToken) {
      return NextResponse.json(
        { success: false, error: { message: "Unauthorized" } },
        { status: 401 }
      );
    }

    const isValid = await verifyToken(idToken);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: { message: "Invalid token" } },
        { status: 401 }
      );
    }

    return NextResponse.next();
  }

  // Check for protected pages
  const idToken = request.cookies.get("id_token")?.value;

  if (!idToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const isValid = await verifyToken(idToken);
  if (!isValid) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete("id_token");
    response.cookies.delete("access_token");
    response.cookies.delete("refresh_token");
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

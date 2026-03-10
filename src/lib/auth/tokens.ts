import { jwtVerify, decodeJwt, createRemoteJWKSet } from "jose";
import type { JWTPayload } from "@/types/auth";

const COGNITO_REGION = process.env.NEXT_PUBLIC_AWS_REGION || "us-east-2";
const USER_POOL_ID = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || "us-east-2_PLlWKITi8";

const COGNITO_BASE = `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/${USER_POOL_ID}`;
const JWKS_URL = `${COGNITO_BASE}/.well-known/jwks.json`;

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJWKS() {
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(JWKS_URL));
  }
  return jwks;
}

export async function verifyToken(token: string): Promise<JWTPayload> {
  try {
    const { payload } = await jwtVerify(token, getJWKS(), {
      issuer: COGNITO_BASE,
    });

    return payload as unknown as JWTPayload;
  } catch (error) {
    throw new Error("Invalid token");
  }
}

export function decodeToken(token: string): JWTPayload | null {
  try {
    return decodeJwt(token) as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const payload = decodeToken(token);
  if (!payload) return true;

  const now = Math.floor(Date.now() / 1000);
  return payload.exp < now;
}

export function getTokenExpiry(token: string): Date | null {
  const payload = decodeToken(token);
  if (!payload) return null;

  return new Date(payload.exp * 1000);
}

export function shouldRefreshToken(token: string, bufferSeconds = 300): boolean {
  const payload = decodeToken(token);
  if (!payload) return true;

  const now = Math.floor(Date.now() / 1000);
  return payload.exp - now < bufferSeconds;
}

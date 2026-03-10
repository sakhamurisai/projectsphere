import { NextRequest, NextResponse } from "next/server";

const isProduction = process.env.NODE_ENV === "production";
const BASE = { httpOnly: true, secure: isProduction, sameSite: "lax" as const, path: "/" };

export async function POST(req: NextRequest) {
  const { access_token, id_token, refresh_token, expires_in } = await req.json();

  const response = NextResponse.json({ success: true });
  const accessExpiry = new Date(Date.now() + expires_in * 1000);
  const refreshExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  response.cookies.set("access_token", access_token, { ...BASE, expires: accessExpiry });
  response.cookies.set("id_token", id_token, { ...BASE, expires: accessExpiry });
  response.cookies.set("refresh_token", refresh_token, { ...BASE, expires: refreshExpiry });

  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete("access_token");
  response.cookies.delete("id_token");
  response.cookies.delete("refresh_token");
  return response;
}

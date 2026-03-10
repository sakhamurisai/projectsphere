import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { headers } from "next/headers";

export default async function LogoutPage() {
  const cookieStore = await cookies();
  cookieStore.delete("access_token");
  cookieStore.delete("id_token");
  cookieStore.delete("refresh_token");

  const hdrs = await headers();
  const host = hdrs.get("host") ?? "localhost:3000";
  const proto = host.startsWith("localhost") ? "http" : "https";
  const origin = `${proto}://${host}`;

  const params = new URLSearchParams({
    client_id: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!,
    logout_uri: origin,
  });

  redirect(`${process.env.NEXT_PUBLIC_COGNITO_DOMAIN}/logout?${params}`);
}

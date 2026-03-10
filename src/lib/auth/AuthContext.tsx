"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { UserManager, User, WebStorageStateStore } from "oidc-client-ts";

interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  accessToken: string;
  idToken: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: () => Promise<void>;
  signUp: () => void;
  signOut: () => Promise<void>;
  logout: () => Promise<void>; // alias for signOut
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const createUserManagerConfig = () => {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const region = process.env.NEXT_PUBLIC_AWS_REGION!;
  const userPoolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID!;
  const domain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN!;

  return {
    authority: `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`,
    client_id: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!,
    client_secret: process.env.NEXT_PUBLIC_COGNITO_CLIENT_SECRET,
    redirect_uri: `${origin}/auth/callback`,
    post_logout_redirect_uri: origin,
    response_type: "code",
    scope: "openid",
    userStore: typeof window !== "undefined"
      ? new WebStorageStateStore({ store: window.sessionStorage })
      : undefined,
    metadata: {
      issuer: `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`,
      authorization_endpoint: `${domain}/oauth2/authorize`,
      token_endpoint: `${domain}/oauth2/token`,
      userinfo_endpoint: `${domain}/oauth2/userInfo`,
      end_session_endpoint: `${domain}/logout`,
      jwks_uri: `https://cognito-idp.${region}.amazonaws.com/${userPoolId}/.well-known/jwks.json`,
    },
  };
};

let userManagerInstance: UserManager | null = null;

export function getUserManager(): UserManager {
  if (!userManagerInstance && typeof window !== "undefined") {
    userManagerInstance = new UserManager(createUserManagerConfig());
  }
  return userManagerInstance!;
}

function parseUser(oidcUser: User): AuthUser {
  const p = oidcUser.profile;
  return {
    id: p.sub,
    email: (p.email as string) ?? "",
    name: (p.name as string) ?? (p.email as string) ?? "User",
    accessToken: oidcUser.access_token,
    idToken: oidcUser.id_token ?? "",
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const manager = getUserManager();

    manager.getUser().then((oidcUser) => {
      if (oidcUser && !oidcUser.expired) setUser(parseUser(oidcUser));
      setIsLoading(false);
    }).catch(() => setIsLoading(false));

    const onLoaded = (u: User) => setUser(parseUser(u));
    const onUnloaded = () => setUser(null);

    manager.events.addUserLoaded(onLoaded);
    manager.events.addUserUnloaded(onUnloaded);
    return () => {
      manager.events.removeUserLoaded(onLoaded);
      manager.events.removeUserUnloaded(onUnloaded);
    };
  }, []);

  const signIn = useCallback(async () => {
    await getUserManager().signinRedirect();
  }, []);

  const signUp = useCallback(() => {
    const origin = window.location.origin;
    const domain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN!;
    const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!;
    const params = new URLSearchParams({
      client_id: clientId,
      response_type: "code",
      scope: "openid",
      redirect_uri: `${origin}/auth/callback`,
    });
    window.location.href = `${domain}/signup?${params}`;
  }, []);

  const signOut = useCallback(async () => {
    const manager = getUserManager();
    await manager.removeUser();
    // Clear httpOnly cookies
    await fetch("/api/auth/session", { method: "DELETE" });
    const origin = window.location.origin;
    const domain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN!;
    const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!;
    const params = new URLSearchParams({ client_id: clientId, logout_uri: origin });
    window.location.href = `${domain}/logout?${params}`;
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, signIn, signUp, signOut, logout: signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used inside AuthProvider");
  return ctx;
}

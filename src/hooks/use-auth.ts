"use client";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { getCognitoLogoutUrl } from "@/lib/auth/cognito-oauth";
import type { AuthUser } from "@/types/auth";

export function useAuth() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, setUser, setLoading, logout: clearAuth } = useAuthStore();
  const { reset: resetWorkspaces } = useWorkspaceStore();

  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/auth/me");

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setUser(data.data);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Failed to fetch user:", error);
      setUser(null);
    }
  }, [setUser, setLoading]);

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Login failed");
      }

      setUser(data.data.user);
      return data.data;
    },
    [setUser, router]
  );

  const register = useCallback(
    async (email: string, password: string, name: string) => {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Registration failed");
      }

      return data.data;
    },
    []
  );

  const verifyEmail = useCallback(async (email: string, code: string) => {
    const response = await fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "Verification failed");
    }

    return data.data;
  }, []);

  const resendVerificationCode = useCallback(async (email: string) => {
    const response = await fetch("/api/auth/verify-email", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "Failed to resend code");
    }

    return data.data;
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "Failed to send reset email");
    }

    return data.data;
  }, []);

  const resetPassword = useCallback(
    async (email: string, code: string, newPassword: string) => {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Failed to reset password");
      }

      return data.data;
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      clearAuth();
      resetWorkspaces();
      window.location.href = getCognitoLogoutUrl();
    }
  }, [clearAuth, resetWorkspaces]);

  const refreshAuth = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/refresh", { method: "POST" });
      if (!response.ok) {
        throw new Error("Failed to refresh token");
      }
    } catch (error) {
      console.error("Failed to refresh auth:", error);
      logout();
    }
  }, [logout]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    verifyEmail,
    resendVerificationCode,
    forgotPassword,
    resetPassword,
    logout,
    refreshAuth,
    fetchUser,
  };
}

"use client";

import { useEffect, useCallback } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export function useAuth() {
  const { user, isAuthenticated, isLoading, setUser, setLoading, logout: clearAuth } = useAuthStore();
  const { reset: resetWorkspaces } = useWorkspaceStore();

  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.success && data.data ? data.data : null);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  }, [setUser, setLoading]);

  const logout = useCallback(() => {
    clearAuth();
    resetWorkspaces();
    window.location.href = "/auth/logout";
  }, [clearAuth, resetWorkspaces]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return { user, isAuthenticated, isLoading, logout, fetchUser };
}

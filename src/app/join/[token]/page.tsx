"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { useAuthStore } from "@/stores/auth-store";
import { Layers, CheckCircle2, XCircle, Users, Shield } from "lucide-react";

interface InviteInfo {
  workspaceName: string;
  email: string;
  role: string;
  invitedByName: string;
  expiresAt: string;
}

interface JoinPageProps {
  params: Promise<{ token: string }>;
}

export default function JoinPage({ params }: JoinPageProps) {
  const { token } = use(params);
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/invitations/${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setInvite(data.data);
        } else {
          setError(data.error?.message ?? "Invalid or expired invitation");
        }
      })
      .catch(() => setError("Failed to load invitation"))
      .finally(() => setLoading(false));
  }, [token]);

  const handleAccept = async () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/join/${token}`);
      return;
    }
    try {
      setAccepting(true);
      const res = await fetch(`/api/invitations/${token}`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setAccepted(true);
        setWorkspaceId(data.data.workspaceId);
      } else {
        setError(data.error?.message ?? "Failed to accept invitation");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setAccepting(false);
    }
  };

  const ROLE_LABEL: Record<string, string> = {
    admin: "Administrator",
    member: "Member",
    viewer: "Viewer",
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-violet-50 via-white to-indigo-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-violet-950 p-6">
      <Link href="/" className="mb-8 flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
          <Layers className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="text-xl font-bold">ProjectSphere</span>
      </Link>

      <div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-xl">
        {loading ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <LoadingSpinner size="lg" />
            <p className="text-muted-foreground">Loading invitation…</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <XCircle className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="text-xl font-semibold">Invitation Invalid</h2>
            <p className="text-muted-foreground text-sm">{error}</p>
            <Button asChild className="mt-2">
              <Link href="/">Go to ProjectSphere</Link>
            </Button>
          </div>
        ) : accepted ? (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-950">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-xl font-semibold">Welcome aboard! 🎉</h2>
            <p className="text-muted-foreground text-sm">
              You've successfully joined <strong>{invite?.workspaceName}</strong>.
            </p>
            <Button
              className="mt-2"
              onClick={() => router.push(workspaceId ? `/workspaces/${workspaceId}` : "/")}
            >
              Go to Workspace
            </Button>
          </div>
        ) : invite ? (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">You're invited!</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                <strong>{invite.invitedByName}</strong> invited you to join a workspace
              </p>
            </div>

            <div className="rounded-xl border bg-muted/30 p-5 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Workspace</span>
                <span className="font-semibold">{invite.workspaceName}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Your role</span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary capitalize">
                  <Shield className="h-3 w-3" />
                  {ROLE_LABEL[invite.role] ?? invite.role}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Sent to</span>
                <span className="font-mono text-xs">{invite.email}</span>
              </div>
            </div>

            {!isAuthenticated && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
                You need to sign in or create an account with{" "}
                <strong>{invite.email}</strong> to accept this invitation.
              </div>
            )}

            {isAuthenticated && user?.email.toLowerCase() !== invite.email.toLowerCase() && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                You're signed in as <strong>{user?.email}</strong>, but this invitation was
                sent to <strong>{invite.email}</strong>. Please sign out and sign in with the
                correct account.
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Button
                className="w-full h-11 text-base font-semibold"
                onClick={handleAccept}
                disabled={
                  accepting ||
                  (isAuthenticated &&
                    user?.email.toLowerCase() !== invite.email.toLowerCase())
                }
              >
                {accepting && <LoadingSpinner size="sm" className="mr-2" />}
                {isAuthenticated ? "Accept Invitation" : "Sign in to Accept"}
              </Button>
              {!isAuthenticated && (
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/register?email=${encodeURIComponent(invite.email)}&redirect=/join/${token}`}>
                    Create account instead
                  </Link>
                </Button>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

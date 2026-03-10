"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { CheckCircle2, AlertCircle, LogIn } from "lucide-react";
import { getCognitoLoginUrl, getCognitoSignupUrl } from "@/lib/auth/cognito-oauth";

export function LoginForm() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";
  const verified = searchParams.get("verified");
  const reset = searchParams.get("reset");
  const errorCode = searchParams.get("error");
  // Show raw error in dev so we can diagnose quickly
  const errorMessage = errorCode ?? null;

  const loginUrl = getCognitoLoginUrl(redirect);
  const signupUrl = getCognitoSignupUrl();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
        <p className="text-muted-foreground">Sign in to your ProjectSphere account</p>
      </div>

      {verified && (
        <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Email verified! You can now sign in.
        </div>
      )}

      {reset && (
        <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Password reset successful! Sign in with your new password.
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {errorMessage}
        </div>
      )}

      <Button asChild className="h-12 w-full text-base font-semibold">
        <a href={loginUrl}>
          <LogIn className="mr-2 h-5 w-5" />
          Sign in with AWS Cognito
        </a>
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">or</span>
        </div>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <a href={signupUrl} className="font-medium text-primary hover:underline">
          Create one for free
        </a>
      </p>
    </div>
  );
}

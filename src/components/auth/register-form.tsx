"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import { getCognitoSignupUrl, getCognitoLoginUrl } from "@/lib/auth/cognito-oauth";

export function RegisterForm() {
  const signupUrl = getCognitoSignupUrl();
  const loginUrl = getCognitoLoginUrl();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Create an account</h1>
        <p className="text-muted-foreground">
          Start managing projects smarter — for free
        </p>
      </div>

      <div className="space-y-4 rounded-xl border bg-muted/30 p-5 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">What happens next:</p>
        <ol className="list-decimal list-inside space-y-1.5">
          <li>You&apos;ll be taken to the secure AWS Cognito sign-up page</li>
          <li>Enter your name, email, and create a password</li>
          <li>Verify your email with the code sent by AWS</li>
          <li>You&apos;re in — create your first workspace</li>
        </ol>
      </div>

      <Button asChild className="h-12 w-full text-base font-semibold">
        <a href={signupUrl}>
          <UserPlus className="mr-2 h-5 w-5" />
          Create account with AWS Cognito
        </a>
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <a href={loginUrl} className="font-medium text-primary hover:underline">
          Sign in
        </a>
      </p>

      <p className="text-center text-xs text-muted-foreground">
        By creating an account you agree to our{" "}
        <Link href="/terms" className="hover:underline">Terms of Service</Link>{" "}
        and{" "}
        <Link href="/privacy" className="hover:underline">Privacy Policy</Link>.
      </p>
    </div>
  );
}

import Link from "next/link";
import { Layers } from "lucide-react";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-indigo-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-violet-950">
      <header className="flex items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Layers className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold">ProjectSphere</span>
        </Link>
      </header>
      <main className="flex items-start justify-center px-4 pt-8 pb-16">
        <div className="w-full max-w-2xl">
          {children}
        </div>
      </main>
    </div>
  );
}

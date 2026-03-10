import Link from "next/link";
import Image from "next/image";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-indigo-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-violet-950">
      <header className="flex items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.svg" alt="Logo" width={132} height={32} className="w-auto h-auto" />
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

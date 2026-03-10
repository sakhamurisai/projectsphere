import Link from "next/link";
import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Left panel – decorative gradient */}
      <div className="relative hidden lg:flex lg:w-1/2 flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-violet-600 via-purple-700 to-indigo-800 p-12 text-white">
        {/* Background blobs */}
        <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-pink-500/20 blur-2xl" />

        <div className="relative z-10 max-w-md text-center">
          <Link href="/" className="mb-8 inline-flex items-center gap-3">
            <Image
              src="/logo.svg"
              alt="ProjectSphere"
              width={160}
              height={40}
              className="brightness-0 invert"
              priority
            />
          </Link>

          <h1 className="mt-8 text-4xl font-bold leading-tight">
            Manage projects<br />
            <span className="text-purple-200">like a pro.</span>
          </h1>
          <p className="mt-4 text-lg text-purple-100/80">
            Collaborate, plan, and ship projects faster with your team — all in one beautiful workspace.
          </p>

          <div className="mt-12 grid grid-cols-3 gap-4 text-center">
            {[
              { label: "Teams", value: "10k+" },
              { label: "Projects", value: "50k+" },
              { label: "Uptime", value: "99.9%" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl bg-white/10 p-4 backdrop-blur-sm">
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-sm text-purple-200">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-col gap-3">
            {[
              "Real-time collaboration",
              "Kanban & Sprint boards",
              "AWS-powered infrastructure",
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-3 rounded-lg bg-white/10 px-4 py-2.5 text-sm backdrop-blur-sm">
                <div className="h-2 w-2 rounded-full bg-green-400" />
                {feature}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel – form */}
      <div className="flex w-full flex-col items-center justify-center bg-background px-6 py-12 lg:w-1/2">
        {/* Mobile logo */}
        <Link href="/" className="mb-8 flex items-center gap-2 lg:hidden">
          <Image src="/logo.svg" alt="ProjectSphere" width={140} height={35} priority />
        </Link>
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  );
}

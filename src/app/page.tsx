import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Zap,
  Shield,
  Users,
  BarChart3,
  Kanban,
  Globe,
  Star,
  ChevronRight,
  LayoutDashboard,
  ListTodo,
  GitBranch,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm shadow-lg shadow-primary/30">
              PS
            </div>
            <span className="text-lg font-bold">ProjectSphere</span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium md:flex">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#workflow" className="text-muted-foreground hover:text-foreground transition-colors">Workflow</a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button size="sm" className="shadow-lg shadow-primary/25" asChild>
              <Link href="/register">Get started free</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden pt-24 pb-20 px-6">
        {/* Background blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-primary/15 blur-3xl" />
          <div className="absolute top-60 -left-40 h-80 w-80 rounded-full bg-chart-1/15 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 h-64 w-64 rounded-full bg-chart-2/10 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-5xl text-center">
          <Badge variant="secondary" className="mb-6 gap-1.5 px-3 py-1.5 text-xs font-medium">
            <Zap className="h-3 w-3 text-primary" />
            Powered by AWS — Cognito, DynamoDB & S3
          </Badge>

          <h1 className="mb-6 text-5xl font-extrabold leading-tight tracking-tight sm:text-6xl lg:text-7xl">
            Ship projects faster
            <br />
            <span className="gradient-text">with your whole team</span>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground">
            ProjectSphere brings Kanban boards, task tracking, and team collaboration
            into one beautiful workspace — built on enterprise-grade AWS infrastructure.
          </p>

          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" className="gap-2 px-8 shadow-xl shadow-primary/30" asChild>
              <Link href="/register">
                Start for free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="gap-2 px-8" asChild>
              <Link href="/login">
                Sign in to demo
              </Link>
            </Button>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            {["No credit card required", "Free forever plan", "Set up in 5 minutes"].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Dashboard Preview */}
        <div className="relative mx-auto mt-16 max-w-5xl">
          <div className="overflow-hidden rounded-2xl border border-border/60 shadow-2xl shadow-primary/10">
            {/* Window chrome */}
            <div className="flex h-8 items-center gap-2 border-b bg-muted/50 px-4">
              <div className="h-3 w-3 rounded-full bg-red-400" />
              <div className="h-3 w-3 rounded-full bg-yellow-400" />
              <div className="h-3 w-3 rounded-full bg-green-400" />
              <div className="ml-4 h-4 w-48 rounded bg-muted" />
            </div>
            <div className="grid grid-cols-4 bg-background">
              {/* Mock sidebar */}
              <div className="border-r bg-muted/30 p-4 space-y-3 col-span-1">
                <div className="h-4 w-24 rounded-full bg-muted" />
                {["Home", "Projects", "Tasks", "Members"].map((item, i) => (
                  <div key={item} className={`flex items-center gap-2 rounded-md p-2 ${i === 1 ? "bg-primary/10" : ""}`}>
                    <div className={`h-3 w-3 rounded ${i === 1 ? "bg-primary" : "bg-muted"}`} />
                    <div className={`h-3 w-16 rounded-full ${i === 1 ? "bg-primary/40" : "bg-muted"}`} />
                  </div>
                ))}
                <div className="pt-3 border-t">
                  <div className="h-3 w-16 rounded-full bg-muted mb-2" />
                  {[["Design", "bg-purple-400"], ["Backend", "bg-blue-400"], ["Mobile", "bg-green-400"]].map(([p, c]) => (
                    <div key={p} className="flex items-center gap-2 p-2">
                      <div className={`h-3 w-3 rounded-full ${c}`} />
                      <div className="h-3 w-14 rounded-full bg-muted" />
                    </div>
                  ))}
                </div>
              </div>
              {/* Mock kanban board */}
              <div className="col-span-3 p-4">
                <div className="mb-4 flex items-center gap-2">
                  <div className="h-5 w-28 rounded-full bg-muted" />
                  <div className="ml-auto h-7 w-20 rounded-md bg-primary/20" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "To Do", color: "bg-slate-100 dark:bg-slate-800", count: 3 },
                    { label: "In Progress", color: "bg-blue-50 dark:bg-blue-900/20", count: 2 },
                    { label: "Done", color: "bg-green-50 dark:bg-green-900/20", count: 4 },
                  ].map((col) => (
                    <div key={col.label} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-16 rounded-full bg-muted" />
                        <span className="text-[10px] text-muted-foreground font-medium">{col.count}</span>
                      </div>
                      {Array.from({ length: Math.min(col.count, 2) }).map((_, i) => (
                        <div key={i} className={`rounded-lg p-2.5 ${col.color} border border-border/50 space-y-1.5`}>
                          <div className="h-3 w-full rounded-full bg-foreground/10" />
                          <div className="h-2 w-3/4 rounded-full bg-foreground/5" />
                          <div className="flex items-center gap-1 pt-1">
                            <div className="h-4 w-4 rounded-full bg-primary/20" />
                            <div className="h-2 w-8 rounded-full bg-foreground/10" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="border-y bg-muted/30 py-10 px-6">
        <div className="mx-auto max-w-5xl text-center">
          <p className="mb-8 text-sm font-medium text-muted-foreground uppercase tracking-widest">
            Trusted by teams at
          </p>
          <div className="flex flex-wrap items-center justify-center gap-10">
            {["Acme Corp", "Globex", "Initech", "Umbrella", "Stark Industries", "Wayne Enterprises"].map((co) => (
              <span key={co} className="text-base font-semibold text-muted-foreground/50">
                {co}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <Badge variant="secondary" className="mb-4 gap-1.5">
              <Star className="h-3 w-3 text-primary" />
              Features
            </Badge>
            <h2 className="mb-4 text-4xl font-bold tracking-tight">
              Everything your team needs
            </h2>
            <p className="mx-auto max-w-xl text-muted-foreground">
              Built for modern product teams who need speed, clarity, and collaboration without the overhead.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: <Kanban className="h-6 w-6" />,
                color: "text-purple-500 bg-purple-500/10",
                title: "Kanban Boards",
                desc: "Visualize work as it flows through your pipeline. Drag and drop tasks between columns with smooth animations.",
              },
              {
                icon: <LayoutDashboard className="h-6 w-6" />,
                color: "text-blue-500 bg-blue-500/10",
                title: "Multiple Workspaces",
                desc: "Organize clients and projects into separate workspaces, each with their own members and permissions.",
              },
              {
                icon: <Users className="h-6 w-6" />,
                color: "text-green-500 bg-green-500/10",
                title: "Team Collaboration",
                desc: "Invite teammates, assign tasks, and track who's working on what — all in real time.",
              },
              {
                icon: <Shield className="h-6 w-6" />,
                color: "text-orange-500 bg-orange-500/10",
                title: "Role-Based Access",
                desc: "Owner, admin, member roles keep sensitive data safe. Grant the right access to the right people.",
              },
              {
                icon: <Globe className="h-6 w-6" />,
                color: "text-rose-500 bg-rose-500/10",
                title: "AWS S3 File Storage",
                desc: "Attach files to tasks. Secure presigned URLs mean files go directly to S3 — no proxy overhead.",
              },
              {
                icon: <BarChart3 className="h-6 w-6" />,
                color: "text-teal-500 bg-teal-500/10",
                title: "Priority & Due Dates",
                desc: "Low, medium, high, urgent priorities with due-date tracking so nothing slips through the cracks.",
              },
              {
                icon: <ListTodo className="h-6 w-6" />,
                color: "text-indigo-500 bg-indigo-500/10",
                title: "Subtasks",
                desc: "Break large tasks into smaller pieces. Nested subtask support keeps complex projects manageable.",
              },
              {
                icon: <GitBranch className="h-6 w-6" />,
                color: "text-fuchsia-500 bg-fuchsia-500/10",
                title: "List & Board Views",
                desc: "Switch between a sortable table list and a visual Kanban board — whichever fits your workflow.",
              },
              {
                icon: <Zap className="h-6 w-6" />,
                color: "text-yellow-500 bg-yellow-500/10",
                title: "Instant Search & Filters",
                desc: "Filter tasks by status, priority, or assignee in seconds. Full-text search across all your projects.",
              },
            ].map((feat) => (
              <div
                key={feat.title}
                className="group rounded-2xl border bg-card p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
              >
                <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${feat.color}`}>
                  {feat.icon}
                </div>
                <h3 className="mb-2 text-lg font-semibold">{feat.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="workflow" className="bg-muted/30 py-24 px-6">
        <div className="mx-auto max-w-5xl">
          <div className="mb-16 text-center">
            <Badge variant="secondary" className="mb-4">How it works</Badge>
            <h2 className="mb-4 text-4xl font-bold tracking-tight">
              Up and running in minutes
            </h2>
            <p className="mx-auto max-w-xl text-muted-foreground">
              No complex setup. Just sign up, create a workspace, and start shipping.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Create a workspace",
                desc: "Sign up and create your first workspace. Invite your team and set roles to control who can do what.",
                color: "from-purple-500 to-violet-600",
              },
              {
                step: "02",
                title: "Set up projects",
                desc: "Add projects inside your workspace. Each project gets its own Kanban board, list view, and member settings.",
                color: "from-blue-500 to-cyan-600",
              },
              {
                step: "03",
                title: "Ship faster",
                desc: "Create tasks, assign teammates, attach files, track due dates. Move cards through the board as work progresses.",
                color: "from-green-500 to-emerald-600",
              },
            ].map((step, i) => (
              <div key={step.step} className="relative flex flex-col items-start">
                {i < 2 && (
                  <div className="absolute top-6 left-12 hidden h-0.5 w-full bg-gradient-to-r from-border to-transparent md:block" />
                )}
                <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${step.color} text-white font-bold text-lg shadow-lg`}>
                  {step.step}
                </div>
                <h3 className="mb-2 text-xl font-semibold">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold">What teams say</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                quote: "Finally a project tool that doesn't feel bloated. Our team adopted it in a day.",
                name: "Sarah K.",
                role: "Engineering Lead",
                stars: 5,
              },
              {
                quote: "The Kanban board with drag-and-drop is buttery smooth. Moving away from Jira was the right call.",
                name: "Marcus T.",
                role: "Product Manager",
                stars: 5,
              },
              {
                quote: "Self-hosted on our own AWS account means we control our data. That's a dealbreaker for us.",
                name: "Priya M.",
                role: "CTO",
                stars: 5,
              },
            ].map((t) => (
              <div key={t.name} className="flex flex-col rounded-2xl border bg-card p-6 shadow-sm">
                <div className="mb-3 flex gap-1">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="mb-4 flex-1 text-muted-foreground leading-relaxed">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div>
                  <p className="font-semibold">{t.name}</p>
                  <p className="text-sm text-muted-foreground">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="pricing" className="relative overflow-hidden py-24 px-6">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-chart-1/5 to-chart-2/5" />
          <div className="absolute top-0 left-1/4 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 h-64 w-64 rounded-full bg-chart-1/10 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-3xl rounded-3xl border bg-card p-12 text-center shadow-xl">
          <Badge variant="secondary" className="mb-4 bg-primary/10 text-primary border-primary/20">
            Free &amp; Open Source
          </Badge>
          <h2 className="mb-4 text-4xl font-bold tracking-tight">Ready to get started?</h2>
          <p className="mb-8 text-lg text-muted-foreground">
            Deploy ProjectSphere on your own AWS account in under 30 minutes.
            Full control. No per-seat fees. Open source forever.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" className="gap-2 px-10 shadow-lg shadow-primary/25" asChild>
              <Link href="/register">
                Create free account
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="gap-2" asChild>
              <Link href="/login">
                Sign in
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-10 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xs">
                PS
              </div>
              <span className="font-semibold">ProjectSphere</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Built with Next.js · AWS Cognito · DynamoDB · S3
            </p>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/login" className="hover:text-foreground transition-colors">Sign in</Link>
              <Link href="/register" className="hover:text-foreground transition-colors">Register</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

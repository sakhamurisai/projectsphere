"use client"

import { useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  FolderKanban,
  CheckSquare,
  Users,
  Plus,
  ArrowRight,
  Kanban,
  ListTodo,
  TrendingUp,
  Clock,
  Zap,
  Circle,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useWorkspaces } from "@/hooks/use-workspaces"
import { useProjects } from "@/hooks/use-projects"
import { useWorkspaceStore } from "@/stores/workspace-store"
import { useAuthStore } from "@/stores/auth-store"

/* colour per project deterministic */
const COLORS = [
  { bg: "bg-violet-500/10", text: "text-violet-600", dot: "bg-violet-500" },
  { bg: "bg-blue-500/10",   text: "text-blue-600",   dot: "bg-blue-500"   },
  { bg: "bg-green-500/10",  text: "text-green-600",  dot: "bg-green-500"  },
  { bg: "bg-orange-500/10", text: "text-orange-600", dot: "bg-orange-500" },
  { bg: "bg-rose-500/10",   text: "text-rose-600",   dot: "bg-rose-500"   },
  { bg: "bg-teal-500/10",   text: "text-teal-600",   dot: "bg-teal-500"   },
  { bg: "bg-fuchsia-500/10",text: "text-fuchsia-600",dot: "bg-fuchsia-500"},
  { bg: "bg-amber-500/10",  text: "text-amber-600",  dot: "bg-amber-500"  },
]
function color(id: string) {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return COLORS[h % COLORS.length]
}

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  archived: "Archived",
  planning: "Planning",
}

export default function DashboardPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { workspaces, isLoading: wsLoading } = useWorkspaces()
  const { currentWorkspace, setCurrentWorkspace } = useWorkspaceStore()

  const workspaceId = currentWorkspace?.id || workspaces[0]?.id || ""
  const { projects, isLoading: projLoading } = useProjects(workspaceId)

  useEffect(() => {
    if (!currentWorkspace && workspaces.length > 0) {
      setCurrentWorkspace(workspaces[0])
    }
    // Redirect new users with no workspaces to onboarding
    if (!wsLoading && workspaces.length === 0) {
      router.replace("/onboarding")
    }
  }, [workspaces, currentWorkspace, setCurrentWorkspace, wsLoading, router])

  const isLoading = wsLoading || projLoading

  const totalTasks = projects.reduce((sum, p) => sum + (p.taskCount ?? 0), 0)
  const firstName = user?.name?.split(" ")[0] ?? "there"

  const stats = [
    {
      label: "Workspaces",
      value: wsLoading ? "—" : workspaces.length,
      icon: <FolderKanban className="size-5" />,
      color: "text-violet-600 bg-violet-500/10",
      sub: "Total workspaces",
    },
    {
      label: "Projects",
      value: projLoading ? "—" : projects.length,
      icon: <Kanban className="size-5" />,
      color: "text-blue-600 bg-blue-500/10",
      sub: currentWorkspace?.name ?? "Current workspace",
    },
    {
      label: "Tasks",
      value: projLoading ? "—" : totalTasks,
      icon: <CheckSquare className="size-5" />,
      color: "text-green-600 bg-green-500/10",
      sub: "Across all projects",
    },
    {
      label: "Your role",
      value: currentWorkspace?.role ?? "—",
      icon: <Users className="size-5" />,
      color: "text-orange-600 bg-orange-500/10",
      sub: "In current workspace",
      capitalize: true,
    },
  ]

  return (
    <div className="space-y-8">
      {/* Welcome banner */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Good {getGreeting()}, {firstName} 👋
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {currentWorkspace
              ? `You're in ${currentWorkspace.name}. Here's what's happening.`
              : "Create or select a workspace to get started."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={workspaceId ? `/workspaces/${workspaceId}/projects/new` : "/workspaces/new"}>
              <Plus className="size-3.5 mr-1" />
              New project
            </Link>
          </Button>
          <Button size="sm" className="shadow-sm shadow-primary/20" asChild>
            <Link href="/workspaces/new">
              <Plus className="size-3.5 mr-1" />
              New workspace
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="border shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-5 pb-4 px-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{s.label}</p>
                  <p className={`mt-1 text-2xl font-bold ${s.capitalize ? "capitalize" : ""}`}>
                    {isLoading ? <Skeleton className="h-7 w-12 inline-block" /> : s.value}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 truncate">{s.sub}</p>
                </div>
                <div className={`p-2 rounded-xl ${s.color}`}>
                  {s.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* No workspace state */}
      {!wsLoading && workspaces.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4 text-center">
            <div className="p-4 rounded-2xl bg-primary/10">
              <FolderKanban className="size-10 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">Create your first workspace</h2>
              <p className="text-muted-foreground text-sm mt-1 max-w-xs">
                Workspaces keep your projects and teams organised. Start by creating one.
              </p>
            </div>
            <Button asChild className="shadow-sm shadow-primary/20">
              <Link href="/workspaces/new">
                <Plus className="size-4 mr-2" />
                Create workspace
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Two-column content */}
      {workspaceId && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recent projects – 2/3 */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Recent projects</h2>
              <Button variant="ghost" size="sm" asChild className="text-xs text-muted-foreground">
                <Link href={`/workspaces/${workspaceId}/projects`}>
                  View all <ArrowRight className="size-3 ml-1" />
                </Link>
              </Button>
            </div>

            {projLoading ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
              </div>
            ) : projects.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center py-12 gap-3 text-center">
                  <Kanban className="size-8 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">No projects yet in this workspace.</p>
                  <Button size="sm" asChild>
                    <Link href={`/workspaces/${workspaceId}/projects/new`}>
                      <Plus className="size-3.5 mr-1" />
                      Create project
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {projects.slice(0, 6).map((project) => {
                  const c = color(project.id)
                  return (
                    <Link
                      key={project.id}
                      href={`/workspaces/${workspaceId}/projects/${project.id}/board`}
                    >
                      <Card className="hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer border">
                        <CardContent className="pt-4 pb-4 px-4">
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg ${c.bg} shrink-0`}>
                              <FolderKanban className={`size-4 ${c.text}`} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-sm truncate">{project.name}</p>
                              <p className="text-xs text-muted-foreground font-mono">{project.key}</p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                            <div className="flex items-center gap-1.5">
                              <CheckSquare className="size-3.5 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {project.taskCount ?? 0} tasks
                              </span>
                            </div>
                            <Badge
                              variant="secondary"
                              className={`text-[10px] px-1.5 py-0 h-4 ${c.bg} ${c.text} border-0`}
                            >
                              {STATUS_LABELS[project.status] ?? project.status}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  )
                })}

                {/* New project card */}
                <Link href={`/workspaces/${workspaceId}/projects/new`}>
                  <Card className="border-dashed hover:border-primary/50 hover:bg-muted/40 transition-colors cursor-pointer h-full flex items-center justify-center min-h-[112px]">
                    <CardContent className="flex flex-col items-center gap-1.5 py-6">
                      <Plus className="size-5 text-muted-foreground/60" />
                      <p className="text-xs text-muted-foreground">New project</p>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            )}
          </div>

          {/* Quick actions – 1/3 */}
          <div className="space-y-4">
            <h2 className="text-base font-semibold">Quick actions</h2>
            <div className="space-y-2">
              {[
                {
                  label: "Kanban board",
                  desc: "Visual task management",
                  icon: <Kanban className="size-4" />,
                  href: projects[0] ? `/workspaces/${workspaceId}/projects/${projects[0].id}/board` : "#",
                  color: "text-violet-600 bg-violet-500/10",
                },
                {
                  label: "List view",
                  desc: "Tabular task overview",
                  icon: <ListTodo className="size-4" />,
                  href: projects[0] ? `/workspaces/${workspaceId}/projects/${projects[0].id}/list` : "#",
                  color: "text-blue-600 bg-blue-500/10",
                },
                {
                  label: "Team members",
                  desc: "Manage access & roles",
                  icon: <Users className="size-4" />,
                  href: `/workspaces/${workspaceId}/members`,
                  color: "text-green-600 bg-green-500/10",
                },
                {
                  label: "New project",
                  desc: "Start something new",
                  icon: <Plus className="size-4" />,
                  href: `/workspaces/${workspaceId}/projects/new`,
                  color: "text-orange-600 bg-orange-500/10",
                },
                {
                  label: "Workspace settings",
                  desc: "Configure workspace",
                  icon: <Zap className="size-4" />,
                  href: `/workspaces/${workspaceId}/settings`,
                  color: "text-teal-600 bg-teal-500/10",
                },
              ].map((action) => (
                <Link key={action.label} href={action.href}>
                  <div className="flex items-center gap-3 rounded-xl border bg-card p-3 hover:shadow-sm hover:bg-muted/40 transition-all cursor-pointer group">
                    <div className={`p-2 rounded-lg shrink-0 ${action.color}`}>
                      {action.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium leading-none">{action.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{action.desc}</p>
                    </div>
                    <ArrowRight className="size-3.5 text-muted-foreground/40 ml-auto group-hover:text-muted-foreground transition-colors" />
                  </div>
                </Link>
              ))}
            </div>

            {/* All workspaces */}
            {workspaces.length > 0 && (
              <div className="space-y-2 pt-2">
                <h2 className="text-base font-semibold">Your workspaces</h2>
                {workspaces.map((ws) => (
                  <Link key={ws.id} href={`/workspaces/${ws.id}`}>
                    <div className={`flex items-center gap-3 rounded-xl border p-3 transition-all hover:bg-muted/40 cursor-pointer ${ws.id === workspaceId ? "border-primary/40 bg-primary/5" : "bg-card"}`}>
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary text-[11px] font-bold">
                        {ws.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{ws.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{ws.role}</p>
                      </div>
                      {ws.id === currentWorkspace?.id && (
                        <Circle className="size-2 fill-primary text-primary shrink-0" />
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return "morning"
  if (h < 17) return "afternoon"
  return "evening"
}

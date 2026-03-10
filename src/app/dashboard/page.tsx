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
  Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useWorkspaces } from "@/hooks/use-workspaces"
import { useProjects } from "@/hooks/use-projects"
import { useWorkspaceStore } from "@/stores/workspace-store"
import { useAuthStore } from "@/stores/auth-store"

const COLORS = [
  { bg: "bg-violet-50",  text: "text-violet-700",  icon: "bg-violet-100"  },
  { bg: "bg-blue-50",    text: "text-blue-700",    icon: "bg-blue-100"    },
  { bg: "bg-emerald-50", text: "text-emerald-700", icon: "bg-emerald-100" },
  { bg: "bg-orange-50",  text: "text-orange-700",  icon: "bg-orange-100"  },
  { bg: "bg-rose-50",    text: "text-rose-700",    icon: "bg-rose-100"    },
  { bg: "bg-teal-50",    text: "text-teal-700",    icon: "bg-teal-100"    },
  { bg: "bg-fuchsia-50", text: "text-fuchsia-700", icon: "bg-fuchsia-100" },
  { bg: "bg-amber-50",   text: "text-amber-700",   icon: "bg-amber-100"   },
]
function pickColor(id: string) {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return COLORS[h % COLORS.length]
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return "Good morning"
  if (h < 17) return "Good afternoon"
  return "Good evening"
}

export default function DashboardPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { workspaces, isLoading: wsLoading } = useWorkspaces()
  const { currentWorkspace, setCurrentWorkspace } = useWorkspaceStore()

  const workspaceId = currentWorkspace?.id || workspaces[0]?.id || ""
  const { projects, isLoading: projLoading } = useProjects(workspaceId)

  useEffect(() => {
    if (!currentWorkspace && workspaces.length > 0) setCurrentWorkspace(workspaces[0])
    if (!wsLoading && workspaces.length === 0) router.replace("/onboarding")
  }, [workspaces, currentWorkspace, setCurrentWorkspace, wsLoading, router])

  const isLoading = wsLoading || projLoading
  const totalTasks = projects.reduce((sum, p) => sum + (p.taskCount ?? 0), 0)
  const firstName = user?.name?.split(" ")[0] ?? "there"

  return (
    <div className="min-h-full bg-slate-50/50">
      <div className="mx-auto max-w-6xl space-y-8 p-6">

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              {getGreeting()}, {firstName}
            </h1>
            <p className="mt-0.5 text-sm text-slate-500">
              {currentWorkspace ? currentWorkspace.name : "Set up your workspace to get started"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={workspaceId ? `/dashboard/workspaces/${workspaceId}/projects/new` : "/dashboard/workspaces/new"}>
                <Plus className="mr-1.5 size-3.5" />
                New project
              </Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/dashboard/workspaces/new">
                <Plus className="mr-1.5 size-3.5" />
                New workspace
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "Workspaces",
              value: wsLoading ? null : workspaces.length,
              icon: <FolderKanban className="size-4" />,
              color: "text-violet-600",
              iconBg: "bg-violet-100",
            },
            {
              label: "Projects",
              value: projLoading ? null : projects.length,
              icon: <Kanban className="size-4" />,
              color: "text-blue-600",
              iconBg: "bg-blue-100",
            },
            {
              label: "Tasks",
              value: projLoading ? null : totalTasks,
              icon: <CheckSquare className="size-4" />,
              color: "text-emerald-600",
              iconBg: "bg-emerald-100",
            },
            {
              label: "Role",
              value: currentWorkspace?.role ?? (wsLoading ? null : "—"),
              icon: <Users className="size-4" />,
              color: "text-orange-600",
              iconBg: "bg-orange-100",
              capitalize: true,
            },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wide text-slate-400">{s.label}</span>
                <div className={`rounded-lg p-1.5 ${s.iconBg} ${s.color}`}>{s.icon}</div>
              </div>
              <div className={`mt-3 text-2xl font-bold text-slate-900 ${s.capitalize ? "capitalize" : ""}`}>
                {s.value === null ? <Skeleton className="h-7 w-10" /> : s.value}
              </div>
            </div>
          ))}
        </div>

        {/* No workspace */}
        {!wsLoading && workspaces.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-slate-100">
              <FolderKanban className="size-6 text-slate-400" />
            </div>
            <h2 className="text-base font-semibold text-slate-900">No workspace yet</h2>
            <p className="mt-1 text-sm text-slate-500">Create a workspace to organise your projects and team.</p>
            <Button className="mt-5" asChild>
              <Link href="/dashboard/workspaces/new">
                <Plus className="mr-1.5 size-4" />
                Create workspace
              </Link>
            </Button>
          </div>
        )}

        {/* Main content */}
        {workspaceId && (
          <div className="grid gap-6 lg:grid-cols-3">

            {/* Projects — 2/3 */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-900">Projects</h2>
                <Link
                  href={`/dashboard/workspaces/${workspaceId}/projects`}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-700"
                >
                  View all <ArrowRight className="size-3" />
                </Link>
              </div>

              {projLoading ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
                </div>
              ) : projects.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
                  <Kanban className="mx-auto mb-3 size-7 text-slate-300" />
                  <p className="text-sm text-slate-500">No projects yet.</p>
                  <Button size="sm" className="mt-4" asChild>
                    <Link href={`/dashboard/workspaces/${workspaceId}/projects/new`}>
                      <Plus className="mr-1.5 size-3.5" />
                      Create project
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {projects.slice(0, 6).map((project) => {
                    const c = pickColor(project.id)
                    return (
                      <Link
                        key={project.id}
                        href={`/dashboard/workspaces/${workspaceId}/projects/${project.id}/board`}
                        className="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-slate-300 hover:shadow-md"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`rounded-lg p-2 ${c.icon} shrink-0`}>
                            <FolderKanban className={`size-4 ${c.text}`} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-slate-900 group-hover:text-indigo-600">
                              {project.name}
                            </p>
                            <p className="mt-0.5 font-mono text-xs text-slate-400">{project.key}</p>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                          <span className="flex items-center gap-1 text-xs text-slate-400">
                            <CheckSquare className="size-3" />
                            {project.taskCount ?? 0} tasks
                          </span>
                          <Badge variant="secondary" className={`border-0 text-[10px] ${c.bg} ${c.text}`}>
                            {project.status}
                          </Badge>
                        </div>
                      </Link>
                    )
                  })}

                  <Link
                    href={`/dashboard/workspaces/${workspaceId}/projects/new`}
                    className="flex min-h-[96px] items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white text-slate-400 transition-colors hover:border-indigo-300 hover:text-indigo-500"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <Plus className="size-5" />
                      <span className="text-xs">New project</span>
                    </div>
                  </Link>
                </div>
              )}
            </div>

            {/* Sidebar — 1/3 */}
            <div className="space-y-6">
              {/* Quick links */}
              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-slate-900">Quick links</h2>
                <div className="space-y-1.5">
                  {[
                    {
                      label: "Board",
                      icon: <Kanban className="size-4 text-violet-500" />,
                      href: projects[0] ? `/dashboard/workspaces/${workspaceId}/projects/${projects[0].id}/board` : "#",
                    },
                    {
                      label: "List",
                      icon: <ListTodo className="size-4 text-blue-500" />,
                      href: projects[0] ? `/dashboard/workspaces/${workspaceId}/projects/${projects[0].id}/list` : "#",
                    },
                    {
                      label: "Members",
                      icon: <Users className="size-4 text-emerald-500" />,
                      href: `/dashboard/workspaces/${workspaceId}/members`,
                    },
                    {
                      label: "Settings",
                      icon: <Zap className="size-4 text-orange-500" />,
                      href: `/dashboard/workspaces/${workspaceId}/settings`,
                    },
                  ].map((a) => (
                    <Link
                      key={a.label}
                      href={a.href}
                      className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900"
                    >
                      {a.icon}
                      {a.label}
                      <ArrowRight className="ml-auto size-3.5 text-slate-300" />
                    </Link>
                  ))}
                </div>
              </div>

              {/* Workspaces */}
              {workspaces.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-sm font-semibold text-slate-900">Workspaces</h2>
                  <div className="space-y-1.5">
                    {workspaces.map((ws) => {
                      const isActive = ws.id === workspaceId
                      return (
                        <Link
                          key={ws.id}
                          href={`/dashboard/workspaces/${ws.id}`}
                          className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors ${
                            isActive
                              ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-indigo-600 text-[10px] font-bold text-white">
                            {ws.name.slice(0, 2).toUpperCase()}
                          </div>
                          <span className="min-w-0 flex-1 truncate font-medium">{ws.name}</span>
                          <span className="shrink-0 text-xs capitalize text-slate-400">{ws.role}</span>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

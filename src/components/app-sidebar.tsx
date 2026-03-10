"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { useParams, usePathname, useRouter } from "next/navigation"
import {
  Users,
  Settings,
  Plus,
  CheckSquare,
  LayoutDashboard,
  ChevronsUpDown,
  LogOut,
  BadgeCheck,
  Bell,
  FolderKanban,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useWorkspaceStore } from "@/stores/workspace-store"
import { useWorkspaces } from "@/hooks/use-workspaces"
import { useProjects } from "@/hooks/use-projects"
import { useAuthStore } from "@/stores/auth-store"
import { useAuth } from "@/hooks/use-auth"
import type { WorkspaceWithRole } from "@/types/workspace"

/* ── project dot colours ── */
const PROJECT_COLORS = [
  "bg-violet-500", "bg-blue-500", "bg-green-500", "bg-orange-500",
  "bg-rose-500",   "bg-teal-500", "bg-fuchsia-500","bg-amber-500",
]
function projectColor(id: string) {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return PROJECT_COLORS[h % PROJECT_COLORS.length]
}

/* ── workspace avatar colours ── */
const WS_COLORS = [
  "bg-violet-600", "bg-blue-600", "bg-emerald-600", "bg-orange-600",
  "bg-rose-600",   "bg-teal-600", "bg-fuchsia-600", "bg-indigo-600",
]
function wsColor(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return WS_COLORS[h % WS_COLORS.length]
}

/* ── Workspace switcher ── */
function WorkspaceSwitcher({
  workspaces,
  current,
  onSelect,
}: {
  workspaces: WorkspaceWithRole[]
  current: WorkspaceWithRole | null
  onSelect: (ws: WorkspaceWithRole) => void
}) {
  const { isMobile } = useSidebar()
  const router = useRouter()

  const ws = current ?? workspaces[0]

  if (!ws) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" asChild>
            <Link href="/dashboard/workspaces/new">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-bold">
                <Plus className="size-4" />
              </div>
              <span className="font-medium">Create workspace</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  const initials = ws.name.slice(0, 2).toUpperCase()
  const bgColor  = wsColor(ws.name)

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${bgColor} text-white text-xs font-bold`}>
                {initials}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{ws.name}</span>
                <span className="truncate text-xs text-muted-foreground capitalize">{ws.role}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4 shrink-0 opacity-50" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">Workspaces</DropdownMenuLabel>
            {workspaces.map((w, i) => (
              <DropdownMenuItem
                key={w.id}
                onClick={() => { onSelect(w); router.push(`/dashboard/workspaces/${w.id}`) }}
                className="gap-2 p-2"
              >
                <div className={`flex size-6 shrink-0 items-center justify-center rounded-sm ${wsColor(w.name)} text-white text-[10px] font-bold`}>
                  {w.name.slice(0, 2).toUpperCase()}
                </div>
                <span className="flex-1 truncate">{w.name}</span>
                <DropdownMenuShortcut>⌘{i + 1}</DropdownMenuShortcut>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="gap-2 p-2">
              <Link href="/dashboard/workspaces/new">
                <div className="flex size-6 items-center justify-center rounded-md border border-dashed">
                  <Plus className="size-3.5" />
                </div>
                <span className="text-muted-foreground">New workspace</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

/* ── Main nav ── */
function NavMain({ workspaceId }: { workspaceId: string }) {
  const pathname = usePathname()

  const items = [
                                                      
    { label: "Overview", href: workspaceId ? `/dashboard/workspaces/${workspaceId}` : "/dashboard/workspaces", icon: LayoutDashboard },
    { label: "All Tasks",href: workspaceId ? `/dashboard/workspaces/${workspaceId}/tasks` : "#", icon: CheckSquare },
    { label: "Members",  href: workspaceId ? `/dashboard/workspaces/${workspaceId}/members` : "#", icon: Users },
    { label: "Settings", href: workspaceId ? `/dashboard/workspaces/${workspaceId}/settings` : "#", icon: Settings },
  ]

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Workspace</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/" &&
              item.href !== `/dashboard/workspaces/${workspaceId}` &&
              pathname.startsWith(item.href))
          return (
            <SidebarMenuItem key={item.label}>
              <SidebarMenuButton asChild isActive={active} tooltip={item.label}>
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}

/* ── Projects list ── */
function NavProjects({ workspaceId }: { workspaceId: string }) {
  const pathname = usePathname()
  const { projects, isLoading } = useProjects(workspaceId)

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <div className="flex items-center justify-between pr-2">
        <SidebarGroupLabel>Projects</SidebarGroupLabel>
        <Link
          href={`/dashboard/workspaces/${workspaceId}/projects/new`}
          title="New project"
          className="flex items-center justify-center rounded-md p-0.5 text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span className="sr-only">New project</span>
        </Link>
      </div>

      <SidebarMenu>
        {isLoading ? (
          <>
            {[70, 55, 80].map((w) => (
              <SidebarMenuItem key={w}>
                <div className="flex items-center gap-2 px-2 h-8">
                  <Skeleton className="size-2 rounded-full shrink-0" />
                  <Skeleton className="h-4" style={{ width: `${w}%` }} />
                </div>
              </SidebarMenuItem>
            ))}
          </>
        ) : projects.length === 0 ? (
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="text-muted-foreground">
              <Link href={`/dashboard/workspaces/${workspaceId}/projects/new`}>
                <Plus className="w-4 h-4 bg-primary text-primary-foreground" />
                <span>Create first project</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ) : (
          projects.map((project) => {
            const active = pathname.includes(`/projects/${project.id}`)
            return (
              <SidebarMenuItem key={project.id}>
                <SidebarMenuButton asChild isActive={active} tooltip={project.name}>
                  <Link href={`/dashboard/workspaces/${workspaceId}/projects/${project.id}/board`}>
                    <span className={`size-2 shrink-0 rounded-full ${projectColor(project.id)}`} />
                    <span className="truncate">{project.name}</span>
                    <span className="ml-auto font-mono text-[10px] text-muted-foreground/50">
                      {project.key}
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })
        )}
      </SidebarMenu>
    </SidebarGroup>
  )
}

/* ── User footer ── */
function NavUser() {
  const { isMobile } = useSidebar()
  const { user } = useAuthStore()
  const { logout } = useAuth()

  const initials = user?.name
    ? user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? "?"

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="size-8 rounded-lg">
                {user?.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name ?? ""} />}
                <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user?.name ?? "User"}</span>
                <span className="truncate text-xs text-muted-foreground">{user?.email ?? ""}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4 shrink-0 opacity-50" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-2 py-1.5">
                <Avatar className="size-8 rounded-lg">
                  {user?.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name ?? ""} />}
                  <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-xs font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user?.name ?? "User"}</span>
                  <span className="truncate text-xs text-muted-foreground">{user?.email ?? ""}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href="/settings/profile">
                  <BadgeCheck className="size-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Bell className="size-4" />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
              <LogOut className="size-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

/* ── Root AppSidebar ── */
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const params = useParams()
  const { workspaces, isLoading } = useWorkspaces()
  const { currentWorkspace, setCurrentWorkspace } = useWorkspaceStore()

  const workspaceId =
    (params?.workspaceId as string) || currentWorkspace?.id || workspaces[0]?.id || ""

  React.useEffect(() => {
    if (!currentWorkspace && workspaces.length > 0) {
      setCurrentWorkspace(workspaces[0])
    }
  }, [workspaces, currentWorkspace, setCurrentWorkspace])

  return (
    <Sidebar collapsible="icon" {...props}>
      {/* Header */}
      <SidebarHeader>
        {/* Logo */}
        <div className="flex h-12 items-center px-3 group-data-[collapsible=icon]:justify-center">
          <Image
            src="/logo.svg"
            alt="ProjectSphere"
            width={120}
            height={28}
            className="h-6 w-auto group-data-[collapsible=icon]:hidden"
          />
          <Image
            src="/logo-icon.svg"
            alt="ProjectSphere"
            width={28}
            height={28}
            className="hidden size-6 group-data-[collapsible=icon]:block"
          />
        </div>

        {/* Workspace switcher */}
        {isLoading ? (
          <div className="px-2 flex items-center gap-2 h-10">
            <Skeleton className="size-8 rounded-lg shrink-0" />
            <Skeleton className="h-4 flex-1" />
          </div>
        ) : (
          <WorkspaceSwitcher
            workspaces={workspaces}
            current={currentWorkspace}
            onSelect={setCurrentWorkspace}
          />
        )}
      </SidebarHeader>

      {/* Nav */}
      <SidebarContent>
        {workspaceId && <NavMain workspaceId={workspaceId} />}
        {workspaceId && <NavProjects workspaceId={workspaceId} />}
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}

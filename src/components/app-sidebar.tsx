"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, usePathname, useRouter } from "next/navigation"
import {
  Home,
  FolderKanban,
  Users,
  Settings,
  Plus,
  CheckSquare,
  LayoutDashboard,
  ChevronsUpDown,
  LogOut,
  BadgeCheck,
  Bell,
  Loader2,
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
  SidebarMenuSkeleton,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
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

/* ─── colour palette for project dots ─── */
const PROJECT_COLORS = [
  "bg-violet-500",
  "bg-blue-500",
  "bg-green-500",
  "bg-orange-500",
  "bg-rose-500",
  "bg-teal-500",
  "bg-fuchsia-500",
  "bg-amber-500",
  "bg-cyan-500",
  "bg-indigo-500",
]

function projectColor(id: string) {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return PROJECT_COLORS[h % PROJECT_COLORS.length]
}

/* ─── Workspace switcher ─── */
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

  if (!current && workspaces.length === 0) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" asChild>
            <Link href="/workspaces/new">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-bold">
                PS
              </div>
              <span className="font-medium">Create workspace</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  const ws = current ?? workspaces[0]
  const initials = ws?.name?.slice(0, 2).toUpperCase() ?? "WS"

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-bold shadow-sm">
                {initials}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{ws?.name}</span>
                <span className="truncate text-xs text-sidebar-foreground/60 capitalize">{ws?.role}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4 text-sidebar-foreground/50" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-60 rounded-xl"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">Workspaces</DropdownMenuLabel>
            {workspaces.map((w, i) => (
              <DropdownMenuItem
                key={w.id}
                onClick={() => {
                  onSelect(w)
                  router.push(`/workspaces/${w.id}`)
                }}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-md bg-primary/10 text-primary text-[10px] font-bold">
                  {w.name.slice(0, 2).toUpperCase()}
                </div>
                <span className="flex-1 truncate">{w.name}</span>
                <DropdownMenuShortcut>⌘{i + 1}</DropdownMenuShortcut>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="gap-2 p-2">
              <Link href="/workspaces/new">
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

/* ─── Main nav ─── */
function NavMain({ workspaceId }: { workspaceId: string }) {
  const pathname = usePathname()

  const items = [
    {
      label: "Home",
      href: "/",
      icon: <Home className="size-4" />,
    },
    {
      label: "Overview",
      href: workspaceId ? `/workspaces/${workspaceId}` : "/workspaces",
      icon: <LayoutDashboard className="size-4" />,
    },
    {
      label: "All Tasks",
      href: workspaceId ? `/workspaces/${workspaceId}/tasks` : "#",
      icon: <CheckSquare className="size-4" />,
    },
    {
      label: "Members",
      href: workspaceId ? `/workspaces/${workspaceId}/members` : "#",
      icon: <Users className="size-4" />,
    },
    {
      label: "Settings",
      href: workspaceId ? `/workspaces/${workspaceId}/settings` : "#",
      icon: <Settings className="size-4" />,
    },
  ]

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Workspace</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href) && item.href !== `/workspaces/${workspaceId}`)
          return (
            <SidebarMenuItem key={item.label}>
              <SidebarMenuButton asChild isActive={active} tooltip={item.label}>
                <Link href={item.href}>
                  {item.icon}
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

/* ─── Projects list ─── */
function NavProjects({ workspaceId }: { workspaceId: string }) {
  const pathname = usePathname()
  const { projects, isLoading } = useProjects(workspaceId)

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <div className="flex items-center justify-between px-1 py-1">
        <SidebarGroupLabel>Projects</SidebarGroupLabel>
        <SidebarMenuAction asChild showOnHover>
          <Link href={`/workspaces/${workspaceId}/projects/new`} title="New project">
            <Plus className="size-3.5" />
            <span className="sr-only">New project</span>
          </Link>
        </SidebarMenuAction>
      </div>

      <SidebarMenu>
        {isLoading ? (
          <>
            <SidebarMenuItem><SidebarMenuSkeleton /></SidebarMenuItem>
            <SidebarMenuItem><SidebarMenuSkeleton /></SidebarMenuItem>
            <SidebarMenuItem><SidebarMenuSkeleton /></SidebarMenuItem>
          </>
        ) : projects.length === 0 ? (
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="text-sidebar-foreground/50">
              <Link href={`/workspaces/${workspaceId}/projects/new`}>
                <Plus className="size-4" />
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
                  <Link href={`/workspaces/${workspaceId}/projects/${project.id}/board`}>
                    <span className={`size-2 rounded-full ${projectColor(project.id)} shrink-0`} />
                    <span className="truncate">{project.name}</span>
                    <span className="ml-auto text-[10px] text-sidebar-foreground/40 font-mono">
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

/* ─── User footer ─── */
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
                <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-semibold text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user?.name ?? "User"}</span>
                <span className="truncate text-xs text-sidebar-foreground/60">{user?.email ?? ""}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4 text-sidebar-foreground/50" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-xl"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-2 py-2">
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

/* ─── Root AppSidebar ─── */
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
      {/* Header – logo + workspace switcher */}
      <SidebarHeader className="gap-0 pb-0">
        {/* Logo row */}
        <div className="flex items-center gap-2 px-4 py-3 group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:justify-center">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-extrabold shadow-lg shadow-primary/30">
            PS
          </div>
          <span className="text-sm font-bold group-data-[collapsible=icon]:hidden">ProjectSphere</span>
        </div>

        {/* Workspace switcher */}
        {isLoading ? (
          <div className="px-2 py-1">
            <SidebarMenuSkeleton showIcon />
          </div>
        ) : (
          <WorkspaceSwitcher
            workspaces={workspaces}
            current={currentWorkspace}
            onSelect={setCurrentWorkspace}
          />
        )}
      </SidebarHeader>

      {/* Content */}
      <SidebarContent>
        {workspaceId && <NavMain workspaceId={workspaceId} />}
        {workspaceId && <NavProjects workspaceId={workspaceId} />}
      </SidebarContent>

      {/* Footer – user */}
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}

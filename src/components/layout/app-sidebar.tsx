"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useProjects } from "@/hooks/use-projects";
import { useWorkspaceStore } from "@/stores/workspace-store";
import {
  Home,
  FolderKanban,
  Settings,
  Users,
  Plus,
  LayoutDashboard,
} from "lucide-react";

export function AppSidebar() {
  const pathname = usePathname();
  const params = useParams();
  const { currentWorkspace } = useWorkspaceStore();

  const workspaceId = (params?.workspaceId as string) || currentWorkspace?.id;
  const { projects, isLoading: projectsLoading } = useProjects(workspaceId || "");

  const isActive = (path: string) => pathname === path;
  const isProjectActive = (projectId: string) =>
    pathname.includes(`/projects/${projectId}`);

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
            P
          </div>
          <span className="text-lg font-semibold">ProjectSphere</span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/")}>
                  <Link href="/">
                    <Home className="h-4 w-4" />
                    <span>Home</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/dashboard/workspaces")}>
                  <Link href="/dashboard/workspaces">
                    <LayoutDashboard className="h-4 w-4" />
                    <span>Workspaces</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {workspaceId && (
          <>
            <SidebarGroup>
              <div className="flex items-center justify-between px-2">
                <SidebarGroupLabel>Workspace</SidebarGroupLabel>
              </div>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(`/dashboard/workspaces/${workspaceId}`)}
                    >
                      <Link href={`/dashboard/workspaces/${workspaceId}`}>
                        <LayoutDashboard className="h-4 w-4" />
                        <span>Overview</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(`/dashboard/workspaces/${workspaceId}/members`)}
                    >
                      <Link href={`/dashboard/workspaces/${workspaceId}/members`}>
                        <Users className="h-4 w-4" />
                        <span>Members</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(`/dashboard/workspaces/${workspaceId}/settings`)}
                    >
                      <Link href={`/dashboard/workspaces/${workspaceId}/settings`}>
                        <Settings className="h-4 w-4" />
                        <span>Settings</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <div className="flex items-center justify-between px-2">
                <SidebarGroupLabel>Projects</SidebarGroupLabel>
                <Button variant="ghost" size="icon" className="h-6 w-6" asChild>
                  <Link href={`/dashboard/workspaces/${workspaceId}/projects/new`}>
                    <Plus className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <SidebarGroupContent>
                <SidebarMenu>
                  {projectsLoading ? (
                    <>
                      <SidebarMenuItem>
                        <Skeleton className="h-8 w-full" />
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <Skeleton className="h-8 w-full" />
                      </SidebarMenuItem>
                    </>
                  ) : projects.length === 0 ? (
                    <SidebarMenuItem>
                      <p className="px-2 py-1.5 text-sm text-muted-foreground">
                        No projects yet
                      </p>
                    </SidebarMenuItem>
                  ) : (
                    projects.map((project) => (
                      <SidebarMenuItem key={project.id}>
                        <SidebarMenuButton
                          asChild
                          isActive={isProjectActive(project.id)}
                        >
                          <Link
                            href={`/dashboard/workspaces/${workspaceId}/projects/${project.id}/board`}
                          >
                            <FolderKanban className="h-4 w-4" />
                            <span>{project.name}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t px-4 py-3">
        <p className="text-xs text-muted-foreground">
          ProjectSphere v0.1.0
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}

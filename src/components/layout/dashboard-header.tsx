"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Bell, Search, Plus } from "lucide-react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

function useBreadcrumbs() {
  const pathname = usePathname()
  const parts = pathname.split("/").filter(Boolean)

  const crumbs: { label: string; href: string }[] = []

  for (let i = 0; i < parts.length; i++) {
    const seg = parts[i]
    const href = "/" + parts.slice(0, i + 1).join("/")

    // Skip UUID-like slugs as labels – use the previous context label
    const isId = seg.length > 20 || /^[a-zA-Z0-9_-]{20,}$/.test(seg)

    if (seg === "workspaces") crumbs.push({ label: "Workspaces", href })
    else if (seg === "projects") crumbs.push({ label: "Projects", href })
    else if (seg === "tasks") crumbs.push({ label: "Tasks", href })
    else if (seg === "members") crumbs.push({ label: "Members", href })
    else if (seg === "settings") crumbs.push({ label: "Settings", href })
    else if (seg === "new") crumbs.push({ label: "New", href })
    else if (seg === "board") crumbs.push({ label: "Board", href })
    else if (seg === "list") crumbs.push({ label: "List", href })
    else if (!isId) crumbs.push({ label: seg.charAt(0).toUpperCase() + seg.slice(1), href })
  }

  if (crumbs.length === 0) crumbs.push({ label: "Home", href: "/" })

  return crumbs
}

export function DashboardHeader() {
  const crumbs = useBreadcrumbs()

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur-sm">
      {/* Sidebar toggle */}
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="h-5" />

      {/* Breadcrumb */}
      <Breadcrumb className="hidden sm:block">
        <BreadcrumbList>
          {crumbs.map((crumb, i) => (
            <BreadcrumbItem key={crumb.href}>
              {i < crumbs.length - 1 ? (
                <>
                  <BreadcrumbLink asChild>
                    <Link href={crumb.href} className="text-sm text-muted-foreground hover:text-foreground">
                      {crumb.label}
                    </Link>
                  </BreadcrumbLink>
                  <BreadcrumbSeparator />
                </>
              ) : (
                <BreadcrumbPage className="text-sm font-medium">{crumb.label}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
          ))}
        </BreadcrumbList>
      </Breadcrumb>

      {/* Right side */}
      <div className="ml-auto flex items-center gap-2">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Search tasks…"
            className="h-8 w-48 pl-8 text-sm bg-muted/50 border-transparent focus:border-input focus:bg-background focus:w-64 transition-all duration-200"
          />
        </div>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative h-8 w-8">
          <Bell className="size-4" />
          <Badge className="absolute -top-0.5 -right-0.5 h-4 w-4 p-0 text-[9px] flex items-center justify-center bg-primary">
            3
          </Badge>
        </Button>

        {/* Quick create */}
        <Button size="sm" className="h-8 gap-1.5 shadow-sm shadow-primary/20">
          <Plus className="size-3.5" />
          <span className="hidden sm:inline">New Task</span>
        </Button>
      </div>
    </header>
  )
}

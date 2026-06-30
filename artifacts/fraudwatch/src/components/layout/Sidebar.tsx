import { Link, useLocation } from "wouter"
import { useUser, useClerk } from "@clerk/react"
import { LayoutDashboard, Upload, FileText, Clock, Settings, MessageSquare, ShieldAlert, LogOut, FileSearch, Users, Activity } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "../ui/button"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/upload", label: "Upload & Analyze", icon: Upload },
  { href: "/history", label: "Analysis History", icon: Clock },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/chat", label: "AI Assistant", icon: MessageSquare },
]

const adminItems = [
  { href: "/admin", label: "System Stats", icon: ShieldAlert },
  { href: "/admin/users", label: "User Management", icon: Users },
  { href: "/admin/audit-logs", label: "Audit Logs", icon: Activity },
]

export function Sidebar() {
  const [location] = useLocation()
  const { user } = useUser()
  const { signOut } = useClerk()
  const isAdmin = user?.publicMetadata?.role === "admin"

  return (
    <div className="flex h-full w-64 flex-col border-r bg-card text-card-foreground">
      <div className="flex h-14 items-center border-b px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold text-primary">
          <img src="/logo.svg" alt="FraudWatch" className="h-6 w-6" />
          <span>FraudWatch</span>
        </Link>
      </div>

      <div className="flex-1 overflow-auto py-4">
        <nav className="space-y-1 px-3">
          <div className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Analysis
          </div>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                location.startsWith(item.href) && item.href !== "/"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}

          {isAdmin && (
            <>
              <div className="mt-8 mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Administration
              </div>
              {adminItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    location === item.href
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
            </>
          )}
        </nav>
      </div>

      <div className="border-t p-4">
        <div className="mb-4 flex items-center gap-3 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
            {user?.firstName?.[0] || user?.emailAddresses[0].emailAddress[0].toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium leading-none">{user?.fullName || "Analyst"}</span>
            <span className="text-xs text-muted-foreground truncate w-32">{user?.emailAddresses[0].emailAddress}</span>
          </div>
        </div>
        
        <div className="space-y-1">
          <Link
            href="/settings"
            className={cn(
              "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              location === "/settings"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>
          <button
            onClick={() => signOut({ redirectUrl: "/" })}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}

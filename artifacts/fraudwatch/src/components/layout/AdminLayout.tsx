import { ReactNode } from "react"
import { Sidebar } from "./Sidebar"
import { ShieldCheck } from "lucide-react"

interface AdminLayoutProps {
  children: ReactNode
  title: string
}

export function AdminLayout({ children, title }: AdminLayoutProps) {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 flex-shrink-0 items-center justify-between border-b bg-card px-6 border-b-primary/20">
          <div className="flex items-center gap-4">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold text-primary">{title}</h1>
          </div>
          <div className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            Admin Portal
          </div>
        </header>
        <main className="flex-1 overflow-auto bg-slate-50/50 p-6">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

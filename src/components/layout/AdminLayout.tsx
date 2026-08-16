import { ReactNode } from "react"
import { Header } from "./Header"
import { ShieldCheck } from "lucide-react"

interface AdminLayoutProps {
  children: ReactNode
  title: string
}

export function AdminLayout({ children, title }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 bg-slate-50/50 dark:bg-slate-950/40 py-8 px-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex items-center justify-between border-b pb-4 border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
            </div>
            <div className="text-xs font-semibold tracking-wider text-primary uppercase bg-primary/10 dark:bg-primary/20 px-2.5 py-1 rounded-full border border-primary/20 dark:border-primary/30">
              Admin Portal
            </div>
          </div>
          {children}
        </div>
      </main>
    </div>
  )
}


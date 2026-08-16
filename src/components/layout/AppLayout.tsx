import { ReactNode } from "react"
import { Header } from "./Header"

interface AppLayoutProps {
  children: ReactNode
  title: string
}

export function AppLayout({ children, title }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 bg-background text-foreground py-8 px-6">
        <div className="mx-auto max-w-6xl space-y-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          </div>
          {children}
        </div>
      </main>
    </div>
  )
}


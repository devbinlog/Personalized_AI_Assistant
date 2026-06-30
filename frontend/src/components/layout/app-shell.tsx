import { Navbar } from './navbar'

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="pt-14">{children}</main>
    </div>
  )
}

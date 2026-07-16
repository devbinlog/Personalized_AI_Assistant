import { AppShell } from '@/components/layout/app-shell'

export default function ExecutionLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>
}

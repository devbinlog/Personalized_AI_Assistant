import { AppShell } from '@/components/layout/app-shell'

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <div className="flex-1 overflow-auto" style={{ backgroundColor: '#f9f9fb' }}>
        {children}
      </div>
    </AppShell>
  )
}

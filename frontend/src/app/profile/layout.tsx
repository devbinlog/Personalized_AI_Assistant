import { Navbar } from '@/components/layout/navbar'

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col bg-white">
      <Navbar />
      <main className="flex flex-1 flex-col overflow-auto pt-14 bg-slate-50">
        {children}
      </main>
    </div>
  )
}

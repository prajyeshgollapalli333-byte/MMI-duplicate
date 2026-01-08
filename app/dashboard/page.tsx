'use client'

import { useRouter } from 'next/navigation'
import {
  LayoutGrid,
  Activity,
  Settings,
  UserPlus,
  GitBranch,
  List,
} from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()

  return (
    <div className="flex h-screen bg-slate-100">
      {/* ================= SIDEBAR ================= */}
      <aside className="w-[88px] fixed left-0 top-0 bottom-0 z-50 bg-gradient-to-b from-[#5C8F3E] via-teal-700 to-[#2E5C85] text-white flex flex-col items-center shadow-xl rounded-tr-[40px]">
        <nav className="flex-1 flex flex-col items-center gap-6 mt-10">
          <SidebarIcon icon={<LayoutGrid size={22} />} label="Dashboard" active />
          <SidebarIcon icon={<Activity size={22} />} label="Activity" />
          <SidebarIcon icon={<Settings size={22} />} label="Settings" />
        </nav>
      </aside>

      {/* ================= MAIN ================= */}
      <main className="flex-1 flex flex-col pl-[88px]">
        {/* ================= TOP BAR ================= */}
        <header className="h-20 bg-gradient-to-r from-[#5C8F3E] via-teal-700 to-[#2E5C85] flex items-center justify-between px-6 shadow-md">
          <input
            type="text"
            placeholder="Search clients, policies, or IDs..."
            className="w-[420px] rounded-xl px-4 py-2 text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-white/40"
          />

          <div className="flex items-center gap-4 text-white">
            <span className="text-sm font-medium">CSR-1</span>
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center font-semibold">
              P
            </div>
          </div>
        </header>

        {/* ================= CONTENT ================= */}
        <section className="p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            Quick Actions
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ActionCard
              title="New Client"
              icon={<UserPlus size={28} />}
              onClick={() => router.push('/leads/new')}
              primary
            />

            <ActionCard
              title="Pipeline"
              icon={<GitBranch size={28} />}
              onClick={() => router.push('/leads')}
            />

            <ActionCard
              title="Activity Log"
              icon={<List size={28} />}
              onClick={() => alert('Activity log coming soon')}
            />
          </div>
        </section>
      </main>
    </div>
  )
}

/* ================= COMPONENTS ================= */

function SidebarIcon({
  icon,
  label,
  active,
}: {
  icon: React.ReactNode
  label: string
  active?: boolean
}) {
  return (
    <div
      title={label}
      className={`w-[72px] h-[72px] flex flex-col items-center justify-center gap-1 rounded-xl cursor-pointer transition-all duration-200 ${
        active
          ? 'bg-white text-[#2E5C85]'
          : 'text-white/80 hover:bg-white/10 hover:text-white'
      }`}
    >
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
    </div>
  )
}

function ActionCard({
  title,
  icon,
  onClick,
  primary,
}: {
  title: string
  icon: React.ReactNode
  onClick: () => void
  primary?: boolean
}) {
  return (
    <div
      onClick={onClick}
      className={`
        cursor-pointer rounded-2xl p-8 flex items-center gap-5
        shadow-md transition-all duration-300
        ${
          primary
            ? 'bg-[#5C8F3E] text-white'
            : 'bg-white text-gray-800 hover:bg-[#5C8F3E] hover:text-white'
        }
        hover:scale-[1.02] hover:shadow-xl
      `}
    >
      <div
        className={`p-3 rounded-xl ${
          primary ? 'bg-white/20' : 'bg-gray-100'
        }`}
      >
        {icon}
      </div>

      <h3 className="text-lg font-semibold">{title}</h3>
    </div>
  )
}

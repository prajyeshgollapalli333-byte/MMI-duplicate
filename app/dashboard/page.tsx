'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  LayoutGrid,
  Activity,
  Settings,
  UserPlus,
  GitBranch,
  List,
  Bell,
} from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const [profileOpen, setProfileOpen] = useState(false)

  return (
    <div className="flex h-screen bg-slate-100">
      {/* ================= SIDEBAR ================= */}
      <aside className="w-[110px] fixed left-0 top-0 bottom-0 z-50 bg-gradient-to-b from-[#5C8F3E] via-teal-700 to-[#2E5C85] text-white flex flex-col items-center shadow-xl rounded-tr-[40px]">
        <nav className="flex-1 flex flex-col items-center gap-8 mt-24">
          <SidebarIcon icon={<LayoutGrid size={28} />} label="Dashboard" active />
          <SidebarIcon icon={<Activity size={28} />} label="Activity" />
          <SidebarIcon icon={<Settings size={28} />} label="Settings" />
        </nav>
      </aside>

      {/* ================= MAIN ================= */}
      <main className="flex-1 flex flex-col pl-[110px]">
        {/* ================= TOP BAR ================= */}
        <header className="h-24 bg-gradient-to-r from-[#5C8F3E] via-teal-700 to-[#2E5C85] flex items-center justify-between px-6 shadow-md relative z-40">
          <div className="flex-shrink-0">
            <img
              src="/Moonstarlogo.jpeg"
              alt="Moonstar Logo"
              className="h-20 w-48 rounded-lg object-contain bg-white shadow-sm"
            />
          </div>

          <div className="flex-1 flex justify-center px-8">
            <input
              type="text"
              placeholder="Search clients, policies, or IDs..."
              className="w-full max-w-2xl rounded-xl px-6 py-3 text-base bg-white shadow-lg focus:outline-none focus:ring-2 focus:ring-white/40"
            />
          </div>

          <div className="flex items-center gap-6 text-white flex-shrink-0">
            <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <Bell size={28} />
            </button>
            <div className="relative">
              <div
                className="flex items-center gap-3 cursor-pointer p-1 rounded-lg hover:bg-white/10 transition-colors"
                onClick={() => setProfileOpen(!profileOpen)}
              >
                <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center font-bold text-lg border-2 border-white/30">
                  P
                </div>
              </div>

              {profileOpen && (
                <div className="absolute right-0 top-14 w-56 bg-white rounded-xl shadow-xl py-2 text-gray-800 z-50 border border-gray-100 flex flex-col ring-1 ring-black/5">
                  <div className="px-5 py-3 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-600">Signed in as</p>
                    <p className="font-bold text-gray-900 text-lg">CSR-1</p>
                  </div>
                  <button
                    onClick={() => router.push('/login')}
                    className="m-2 px-4 py-2 bg-[#5C8F3E] hover:bg-[#4a7332] text-white font-medium rounded-lg transition-colors text-left shadow-sm"
                  >
                    Logout
                  </button>
                </div>
              )}
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
      className={`w-[84px] h-[84px] flex flex-col items-center justify-center gap-2 rounded-xl cursor-pointer transition-all duration-200 ${active
        ? 'bg-white text-[#2E5C85]'
        : 'text-white/80 hover:bg-white/10 hover:text-white'
        }`}
    >
      {icon}
      <span className="text-xs font-semibold tracking-wide">{label}</span>
    </div>
  )
}

function ActionCard({
  title,
  icon,
  onClick,
}: {
  title: string
  icon: React.ReactNode
  onClick: () => void
}) {
  return (
    <div
      onClick={onClick}
      className={`
        group
        cursor-pointer rounded-2xl p-8 flex items-center gap-5
        shadow-md transition-all duration-300
        bg-white text-gray-800 hover:bg-[#5C8F3E] hover:text-white
        border-2 border-[#5C8F3E]
        hover:scale-[1.05] hover:shadow-xl
      `}
    >
      <div
        className="p-3 rounded-xl bg-gray-100 group-hover:bg-white/20 transition-colors"
      >
        {icon}
      </div>

      <h3 className="text-lg font-semibold">{title}</h3>
    </div>
  )
}
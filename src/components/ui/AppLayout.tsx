import React from 'react'
import { Link } from 'react-router-dom'
import { LayoutDashboard, Users, LogOut, ShieldCheck } from 'lucide-react'
import { Logo } from '../auth/Logo'
import { Button } from './Button'
import { useAuth } from '../../context/useAuth'

interface AppLayoutProps {
  children: React.ReactNode
  activeMenu?: 'dashboard' | 'pacientes'
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children, activeMenu = 'pacientes' }) => {
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
  }

  return (
    <div className="min-h-screen bg-slate-50/70 flex flex-col md:flex-row text-slate-800">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200/80 flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-100">
          <Logo size="md" showSubtitle={true} />
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1.5 flex-1">
          <Link
            to="/dashboard"
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeMenu === 'dashboard'
                ? 'bg-emerald-50 text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <LayoutDashboard
              className={`w-4 h-4 ${
                activeMenu === 'dashboard' ? 'text-emerald-600' : 'text-slate-400'
              }`}
            />
            <span>Dashboard</span>
          </Link>

          <Link
            to="/pacientes"
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeMenu === 'pacientes'
                ? 'bg-emerald-50 text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Users
              className={`w-4 h-4 ${
                activeMenu === 'pacientes' ? 'text-emerald-600' : 'text-slate-400'
              }`}
            />
            <span>Pacientes</span>
          </Link>
        </nav>

        {/* User Card & Logout in Sidebar */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between gap-3 p-2 rounded-xl">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center shrink-0 text-sm ring-2 ring-emerald-500/20">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'N'}
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-slate-800 truncate">
                  {user?.name || 'Nutricionista'}
                </p>
                <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="Sair do sistema"
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
              aria-label="Sair"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200/80 px-6 sm:px-8 py-4 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-1 rounded-md">
              RMS-Nutri v1.0
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-700 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Sessão Ativa</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              leftIcon={<LogOut className="w-3.5 h-3.5" />}
              className="text-xs"
            >
              Sair
            </Button>
          </div>
        </header>

        {/* Content Body */}
        <div className="p-6 sm:p-8 max-w-7xl w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}

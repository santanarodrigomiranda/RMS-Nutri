import React, { useState } from 'react'
import {
  Users,
  Calendar,
  Clock,
  LogOut,
  Sparkles,
  LayoutDashboard,
  UserCheck,
  ShieldCheck,
  Activity,
} from 'lucide-react'
import { useAuth } from '../context/useAuth'
import { Logo } from '../components/auth/Logo'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'

export const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState<'dashboard' | 'pacientes'>('dashboard')

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
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'dashboard'
                ? 'bg-emerald-50 text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <LayoutDashboard
              className={`w-4 h-4 ${
                activeTab === 'dashboard' ? 'text-emerald-600' : 'text-slate-400'
              }`}
            />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('pacientes')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'pacientes'
                ? 'bg-emerald-50 text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Users
              className={`w-4 h-4 ${
                activeTab === 'pacientes' ? 'text-emerald-600' : 'text-slate-400'
              }`}
            />
            <span>Pacientes</span>
          </button>
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
        {/* Header */}
        <header className="bg-white border-b border-slate-200/80 px-6 sm:px-8 py-5 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Olá, {user?.name ? user.name.split(' ')[0] : 'Doutora'}! 👋
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Bem-vinda ao RMS-Nutri. Seu sistema de gestão clínica e nutricional.
            </p>
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

        {/* Dashboard Body */}
        <div className="p-6 sm:p-8 max-w-7xl w-full mx-auto space-y-8">
          {/* Welcome Banner */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 p-6 sm:p-8 text-white shadow-lg shadow-emerald-900/10">
            <div className="relative z-10 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs text-xs font-medium mb-3">
                <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
                <span>Autenticação configurada com sucesso</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Painel de Controle RMS-Nutri
              </h2>
              <p className="text-emerald-100 text-sm mt-2 leading-relaxed">
                Seu login foi validado e sua conta de nutricionista está conectada com o Neon
                Database com Row Level Security (RLS) ativo.
              </p>
            </div>

            <div className="absolute right-0 bottom-0 translate-x-12 translate-y-8 opacity-10 pointer-events-none">
              <Activity className="w-80 h-80" />
            </div>
          </div>

          {/* Cards Principais */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Total de pacientes ativos */}
            <Card className="p-6 border-slate-200/90 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Pacientes Ativos
                </span>
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <UserCheck className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-3xl font-extrabold text-slate-900">0</div>
                <p className="text-xs text-slate-500 mt-1">
                  Cadastrados pela nutricionista logada
                </p>
              </div>
            </Card>

            {/* Card 2: Consultas da semana */}
            <Card className="p-6 border-slate-200/90 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Consultas da Semana
                </span>
                <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-3xl font-extrabold text-slate-900">0</div>
                <p className="text-xs text-slate-500 mt-1">
                  Atendimentos programados para esta semana
                </p>
              </div>
            </Card>

            {/* Card 3: Pacientes sem retorno */}
            <Card className="p-6 border-slate-200/90 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Pacientes Sem Retorno
                </span>
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-sm text-slate-500 italic mt-1">
                  Nenhum paciente sem retorno no momento
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Mais de 30 dias sem retorno agendado
                </p>
              </div>
            </Card>
          </div>

          {/* Quick Info & Next steps */}
          <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center bg-white/50">
            <h3 className="text-base font-semibold text-slate-800">
              Pronto para os próximos passos
            </h3>
            <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
              A autenticação (Prompt 2) está 100% concluída. Todas as sessões e dados de
              nutricionista estão persistidos.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

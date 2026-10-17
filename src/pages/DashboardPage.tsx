import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
  ArrowRight,
  UserPlus,
} from 'lucide-react'
import { useAuth } from '../context/useAuth'
import { Logo } from '../components/auth/Logo'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { getPacientesByNutricionista } from '../lib/db'
import type { Paciente } from '../types/paciente'

export const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [isLoadingPacientes, setIsLoadingPacientes] = useState(true)

  const handleLogout = async () => {
    await logout()
  }

  useEffect(() => {
    async function loadData() {
      if (!user?.id) return
      setIsLoadingPacientes(true)
      try {
        const data = await getPacientesByNutricionista(user.id)
        setPacientes(data)
      } catch (err) {
        console.error('Erro ao buscar pacientes no dashboard:', err)
      } finally {
        setIsLoadingPacientes(false)
      }
    }
    loadData()
  }, [user?.id])

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
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all bg-emerald-50 text-emerald-700 shadow-xs"
          >
            <LayoutDashboard className="w-4 h-4 text-emerald-600" />
            <span>Dashboard</span>
          </Link>

          <Link
            to="/pacientes"
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          >
            <Users className="w-4 h-4 text-slate-400" />
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
        {/* Header */}
        <header className="bg-white border-b border-slate-200/80 px-6 sm:px-8 py-5 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Olá, {user?.name ? user.name.split(' ')[0] : 'Nutricionista'}! 👋
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
                <span>Gestão Nutricional Integrada</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Painel de Controle RMS-Nutri
              </h2>
              <p className="text-emerald-100 text-sm mt-2 leading-relaxed">
                Acompanhe o progresso dos seus pacientes, consulte dados clínicos e prescreva novos
                planos com segurança e alta performance no Neon.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button
                  onClick={() => navigate('/pacientes/novo')}
                  variant="secondary"
                  size="sm"
                  leftIcon={<UserPlus className="w-4 h-4 text-emerald-700" />}
                  className="bg-white text-emerald-800 hover:bg-emerald-50 border-0 font-bold"
                >
                  Novo Paciente
                </Button>
                <Button
                  onClick={() => navigate('/pacientes')}
                  variant="outline"
                  size="sm"
                  className="border-white/30 text-white hover:bg-white/10 hover:border-white font-semibold"
                >
                  Ver Lista de Pacientes
                </Button>
              </div>
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
                <div className="text-3xl font-extrabold text-slate-900">
                  {isLoadingPacientes ? '...' : pacientes.length}
                </div>
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

          {/* Atalho rápido para lista de pacientes cadastrados */}
          {pacientes.length > 0 && (
            <Card className="p-6 border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Pacientes Recentes
                  </h3>
                  <p className="text-xs text-slate-500">
                    Últimos pacientes cadastrados na plataforma
                  </p>
                </div>
                <Link
                  to="/pacientes"
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                >
                  Ver todos ({pacientes.length}) →
                </Link>
              </div>

              <div className="divide-y divide-slate-100">
                {pacientes.slice(0, 5).map((p) => (
                  <Link
                    key={p.id}
                    to={`/pacientes/${p.id}`}
                    className="py-3 flex items-center justify-between hover:bg-slate-50 px-2 rounded-lg transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-xs">
                        {p.nome.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800 group-hover:text-emerald-700 transition-colors">
                          {p.nome}
                        </p>
                        <p className="text-xs text-slate-400">
                          {p.objetivos?.join(', ') || p.objetivo_texto || 'Sem objetivo cadastrado'}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
                  </Link>
                ))}
              </div>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}

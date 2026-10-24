import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Calendar,
  Clock,
  Sparkles,
  UserCheck,
  Activity,
  ArrowRight,
  UserPlus,
} from 'lucide-react'
import { useAuth } from '../context/useAuth'
import { AppLayout } from '../components/ui/AppLayout'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { getPacientesByNutricionista } from '../lib/db'
import type { Paciente } from '../types/paciente'

export const DashboardPage: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [isLoadingPacientes, setIsLoadingPacientes] = useState(true)

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
    <AppLayout activeMenu="dashboard">
      <div className="space-y-6 sm:space-y-8">
        {/* Page Title & Greeting */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Olá, {user?.name ? user.name.split(' ')[0] : 'Nutricionista'}! 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Bem-vindo(a) ao RMS-Nutri. Seu sistema de gestão clínica e nutricional.
          </p>
        </div>

        {/* Welcome Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 p-6 sm:p-8 text-white shadow-lg shadow-emerald-900/10">
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs text-xs font-medium mb-3">
              <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
              <span>Gestão Nutricional Integrada</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
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
                variant="ghost"
                size="sm"
                className="bg-white/20 hover:bg-white/30 text-white border border-white/40 shadow-sm backdrop-blur-xs font-semibold"
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Card 1: Total de pacientes ativos */}
          <Card className="p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Pacientes Ativos
              </span>
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                <UserCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
                {isLoadingPacientes ? '...' : pacientes.length}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Cadastrados pela nutricionista logada
              </p>
            </div>
          </Card>

          {/* Card 2: Consultas da semana */}
          <Card className="p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Consultas da Semana
              </span>
              <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">0</div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Atendimentos programados para esta semana
              </p>
            </div>
          </Card>

          {/* Card 3: Pacientes sem retorno */}
          <Card className="p-6 hover:shadow-md transition-shadow sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Pacientes Sem Retorno
              </span>
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-sm text-slate-500 dark:text-slate-400 italic mt-1">
                Nenhum paciente sem retorno no momento
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                Mais de 30 dias sem retorno agendado
              </p>
            </div>
          </Card>
        </div>

        {/* Atalho rápido para lista de pacientes cadastrados */}
        {pacientes.length > 0 && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Pacientes Recentes
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Últimos pacientes cadastrados na plataforma
                </p>
              </div>
              <Link
                to="/pacientes"
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-1"
              >
                Ver todos ({pacientes.length}) →
              </Link>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {pacientes.slice(0, 5).map((p) => (
                <Link
                  key={p.id}
                  to={`/pacientes/${p.id}`}
                  className="py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 px-2 rounded-lg transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center text-xs">
                      {p.nome.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                        {p.nome}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        {p.objetivos?.join(', ') || p.objetivo_texto || 'Sem objetivo cadastrado'}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
                </Link>
              ))}
            </div>
          </Card>
        )}
      </div>
    </AppLayout>
  )
}

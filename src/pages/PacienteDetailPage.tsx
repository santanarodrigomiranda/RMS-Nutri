import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Phone,
  Mail,
  CheckCircle2,
  AlertCircle,
  HeartPulse,
  Coffee,
} from 'lucide-react'
import { useAuth } from '../context/useAuth'
import { AppLayout } from '../components/ui/AppLayout'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { getPacienteById } from '../lib/db'
import type { Paciente } from '../types/paciente'
import { calculateAge, calculateIMC, formatDateBR } from '../utils/nutrition'

export const PacienteDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { user, isLoading: isAuthLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [paciente, setPaciente] = useState<Paciente | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [flashMessage, setFlashMessage] = useState<string | null>(
    (location.state as any)?.message || null
  )

  useEffect(() => {
    let isMounted = true

    async function loadData() {
      if (isAuthLoading) return

      if (!id) {
        if (isMounted) {
          setError('Identificador do paciente não informado.')
          setIsLoading(false)
        }
        return
      }

      if (!user?.id) {
        if (isMounted) {
          setError('Sessão não identificada. Por favor, faça login novamente.')
          setIsLoading(false)
        }
        return
      }

      setIsLoading(true)
      setError('')

      try {
        const data = await getPacienteById(id, user.id)
        if (!isMounted) return

        if (!data) {
          setError('Paciente não encontrado ou não pertence à sua conta.')
        } else {
          setPaciente(data)
        }
      } catch (err: any) {
        if (!isMounted) return
        console.error('Erro ao buscar paciente:', err)
        setError('Ocorreu um erro ao carregar os dados do paciente. Verifique sua conexão com o Neon.')
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadData()

    return () => {
      isMounted = false
    }
  }, [id, user?.id, isAuthLoading])

  if (isLoading) {
    return (
      <AppLayout activeMenu="pacientes">
        <div className="py-24 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
          <p className="text-sm font-medium">Carregando dados do paciente...</p>
        </div>
      </AppLayout>
    )
  }

  if (error || !paciente) {
    return (
      <AppLayout activeMenu="pacientes">
        <div className="max-w-2xl mx-auto py-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            {error || 'Paciente não encontrado'}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            O paciente solicitado não existe ou você não possui permissão para acessá-lo.
          </p>
          <Button onClick={() => navigate('/pacientes')} variant="outline" size="sm">
            Voltar para lista de pacientes
          </Button>
        </div>
      </AppLayout>
    )
  }

  const nomeExibicao = paciente.nome || 'Paciente sem nome'
  const inicialNome = nomeExibicao.trim().charAt(0).toUpperCase() || 'P'
  const idade = paciente.data_nascimento ? calculateAge(paciente.data_nascimento) : null
  const { imc, classificacao } = calculateIMC(
    paciente.peso_inicial || 0,
    paciente.altura || 0
  )

  return (
    <AppLayout activeMenu="pacientes">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Banner de Mensagem Flash */}
        {flashMessage && (
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-sm flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="font-semibold">{flashMessage}</span>
            </div>
            <button
              onClick={() => setFlashMessage(null)}
              className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
            >
              Fechar
            </button>
          </div>
        )}

        {/* Botão Voltar */}
        <div className="flex items-center justify-between">
          <Link
            to="/pacientes"
            className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar para lista de pacientes</span>
          </Link>
        </div>

        {/* Card Principal de Identificação */}
        <Card className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-extrabold flex items-center justify-center text-2xl shadow-md shadow-emerald-500/20">
                {inicialNome}
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                    {nomeExibicao}
                  </h1>
                  {paciente.sexo && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {paciente.sexo}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {idade !== null && (
                    <span className="font-medium text-slate-700 dark:text-slate-300">{idade} anos</span>
                  )}
                  {paciente.data_nascimento && (
                    <span>Nasc: {formatDateBR(paciente.data_nascimento)}</span>
                  )}
                  {paciente.whatsapp && (
                    <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                      <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      {paciente.whatsapp}
                    </span>
                  )}
                  {paciente.email && (
                    <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                      <Mail className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      {paciente.email}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block tracking-wider">
                  Última Consulta
                </span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {paciente.ultima_consulta
                    ? formatDateBR(paciente.ultima_consulta)
                    : 'Nenhuma registrada'}
                </span>
              </div>
            </div>
          </div>

          {/* Destaques Clínicos: Peso, Altura, IMC, Nível de Atividade */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Peso Inicial</span>
              <p className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">
                {paciente.peso_inicial ? `${paciente.peso_inicial} kg` : '—'}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Altura</span>
              <p className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">
                {paciente.altura ? `${paciente.altura} cm` : '—'}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">IMC Inicial</span>
              <p className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">
                {imc ? `${imc}` : '—'}
              </p>
              {classificacao && (
                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 block mt-0.5">
                  {classificacao}
                </span>
              )}
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Nível de Atividade</span>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1 truncate">
                {paciente.nivel_atividade || 'Não informado'}
              </p>
            </div>
          </div>
        </Card>

        {/* Grid de Seções Clínicas e Hábitos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card: Objetivos e Quadro Clínico */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-bold border-b border-slate-100 dark:border-slate-800 pb-3">
              <HeartPulse className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h3>Objetivos & Condições Clínicas</h3>
            </div>

            {/* Objetivos */}
            <div>
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1.5">
                Objetivos
              </span>
              <div className="flex flex-wrap gap-1.5">
                {Array.isArray(paciente.objetivos) && paciente.objetivos.length > 0 ? (
                  paciente.objetivos.map((obj) => (
                    <span
                      key={obj}
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 text-xs font-semibold"
                    >
                      {obj}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400 dark:text-slate-500 italic">Nenhum selecionado</span>
                )}
              </div>
              {paciente.objetivo_texto && (
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                  {paciente.objetivo_texto}
                </p>
              )}
            </div>

            {/* Patologias */}
            <div>
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1.5">
                Patologias / Condições
              </span>
              <div className="flex flex-wrap gap-1.5">
                {Array.isArray(paciente.patologias) && paciente.patologias.length > 0 ? (
                  paciente.patologias.map((p) => (
                    <span
                      key={p}
                      className="px-2.5 py-1 rounded-lg bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border border-red-200/80 dark:border-red-900/60 text-xs font-medium"
                    >
                      {p}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400 dark:text-slate-500 italic">Nenhuma</span>
                )}
              </div>
            </div>

            {/* Restrições Alimentares */}
            <div>
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1.5">
                Restrições Alimentares
              </span>
              <div className="flex flex-wrap gap-1.5">
                {Array.isArray(paciente.restricoes_alimentares) && paciente.restricoes_alimentares.length > 0 ? (
                  paciente.restricoes_alimentares.map((r) => (
                    <span
                      key={r}
                      className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-900/60 text-xs font-medium"
                    >
                      {r}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400 dark:text-slate-500 italic">Nenhuma</span>
                )}
              </div>
            </div>

            {/* Alergias Alimentares */}
            <div>
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1.5">
                Alergias Alimentares
              </span>
              <div className="flex flex-wrap gap-1.5">
                {Array.isArray(paciente.alergias) && paciente.alergias.length > 0 ? (
                  paciente.alergias.map((a) => (
                    <span
                      key={a}
                      className="px-2.5 py-1 rounded-lg bg-orange-50 dark:bg-orange-950/50 text-orange-800 dark:text-orange-300 border border-orange-200/80 dark:border-orange-900/60 text-xs font-medium"
                    >
                      {a}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400 dark:text-slate-500 italic">Nenhuma</span>
                )}
              </div>
            </div>

            {/* Medicamentos & Suplementos */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Medicamentos:</span>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  {paciente.medicamentos || 'Nenhum medicamento informado'}
                </p>
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Suplementos:</span>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  {paciente.suplementos || 'Nenhum suplemento informado'}
                </p>
              </div>
            </div>
          </Card>

          {/* Card: Hábitos e Rotina */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-bold border-b border-slate-100 dark:border-slate-800 pb-3">
              <Coffee className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              <h3>Hábitos & Rotina Diária</h3>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 dark:text-slate-500 font-medium">Refeições ao dia</span>
                <p className="text-base font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                  {paciente.refeicoes_por_dia ? `${paciente.refeicoes_por_dia} refeições` : '—'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 dark:text-slate-500 font-medium">Consumo de água</span>
                <p className="text-base font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                  {paciente.litros_agua ? `${paciente.litros_agua} L / dia` : '—'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 dark:text-slate-500 font-medium">Horário que acorda</span>
                <p className="text-base font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                  {paciente.horario_acorda || '—'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 dark:text-slate-500 font-medium">Horário que dorme</span>
                <p className="text-base font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                  {paciente.horario_dorme || '—'}
                </p>
              </div>
            </div>

            {/* Atividade Física */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Prática de atividade física:
              </span>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                {paciente.atividade_fisica ? (
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                    Sim — {paciente.atividade_fisica_descricao || 'Sem descrição adicional'}
                  </span>
                ) : (
                  <span className="text-slate-500 dark:text-slate-400">Não pratica atividade física regularmente</span>
                )}
              </p>
            </div>

            {/* Observações gerais */}
            <div>
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                Observações Gerais
              </span>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800 min-h-[70px]">
                {paciente.observacoes || 'Nenhuma observação registrada.'}
              </p>
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}

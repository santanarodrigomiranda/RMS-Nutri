import React, { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  User,
  Activity,
  Coffee,
  Save,
  CheckCircle2,
  AlertCircle,
  Plus,
  X,
  CalendarDays,
  Scale,
  TrendingUp,
  Utensils,
  ClipboardList,
  Phone,
  Mail,
  Calendar,
  Clock,
} from 'lucide-react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { useAuth } from '../context/useAuth'
import { AppLayout } from '../components/ui/AppLayout'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { PlanoAlimentarManager } from '../components/planos/PlanoAlimentarManager'
import {
  getPacienteById,
  updatePaciente,
  getConsultasByPaciente,
  createConsulta,
  getPlanosByPaciente,
} from '../lib/db'
import type { Paciente, Consulta, PlanoAlimentar } from '../types/paciente'
import {
  calculateAge,
  calculateIMC,
  formatDateBR,
  formatPhone,
  formatTimeInput,
  toISODateString,
} from '../utils/nutrition'
import { cn } from '../utils/cn'

// Opções padrão para listas clínicas
const DEFAULT_OBJETIVOS = [
  'Emagrecer',
  'Ganhar massa',
  'Controlar diabetes',
  'Saúde geral',
  'Performance esportiva',
  'Reeducação alimentar',
]

const DEFAULT_NIVEIS_ATIVIDADE = [
  'Sedentário',
  'Levemente ativo',
  'Moderadamente ativo',
  'Muito ativo',
  'Extremamente ativo',
]

const DEFAULT_PATOLOGIAS = [
  'Diabetes',
  'Hipertensão',
  'Hipotireoidismo',
  'Hipertireoidismo',
  'Síndrome do ovário policístico',
  'Doença celíaca',
  'Colesterol alto',
]

const DEFAULT_RESTRICOES = [
  'Lactose',
  'Glúten',
  'Açúcar',
  'Carne vermelha',
  'Frutos do mar',
]

const DEFAULT_ALERGIAS = [
  'Amendoim',
  'Leite',
  'Ovo',
  'Soja',
  'Trigo',
  'Frutos do mar',
]

export const PacienteDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  // Navegação de abas principais
  const [mainTab, setMainTab] = useState<'dados' | 'consultas' | 'planos'>('dados')
  // Sub-abas de dados do paciente
  const [dadosTab, setDadosTab] = useState<'pessoal' | 'clinico' | 'habitos'>('pessoal')

  // Estados de dados principais
  const [paciente, setPaciente] = useState<Paciente | null>(null)
  const [consultas, setConsultas] = useState<Consulta[]>([])
  const [planos, setPlanos] = useState<PlanoAlimentar[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  // Estados de edição de dados do paciente
  const [formData, setFormData] = useState({
    nome: '',
    data_nascimento: '',
    sexo: 'Feminino',
    whatsapp: '',
    email: '',
    peso_inicial: '',
    altura: '',
    objetivos: [] as string[],
    objetivo_texto: '',
    nivel_atividade: '',
    patologias: [] as string[],
    patologia_custom: '',
    restricoes_alimentares: [] as string[],
    restricao_custom: '',
    alergias: [] as string[],
    alergia_custom: '',
    medicamentos: '',
    suplementos: '',
    refeicoes_por_dia: '',
    horario_acorda: '',
    horario_dorme: '',
    litros_agua: '',
    atividade_fisica: false,
    atividade_fisica_descricao: '',
    observacoes: '',
  })

  // Listas de opções personalizadas para patologias, restrições e alergias
  const [patologiasList, setPatologiasList] = useState<string[]>(DEFAULT_PATOLOGIAS)
  const [restricoesList, setRestricoesList] = useState<string[]>(DEFAULT_RESTRICOES)
  const [alergiasList, setAlergiasList] = useState<string[]>(DEFAULT_ALERGIAS)

  // Mensagens e feedbacks
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState('')
  const [saveError, setSaveError] = useState('')

  // Modal Nova Consulta
  const [isConsultaModalOpen, setIsConsultaModalOpen] = useState(false)
  const [isSavingConsulta, setIsSavingConsulta] = useState(false)
  const [consultaError, setConsultaError] = useState('')
  const [consultaForm, setConsultaForm] = useState({
    data_consulta: new Date().toISOString().split('T')[0],
    peso: '',
    cintura: '',
    quadril: '',
    percentual_gordura: '',
    observacoes: '',
    proximo_retorno: '',
  })

  // Carregamento de dados em tempo real do Neon
  const loadData = useCallback(async () => {
    if (!id || !user?.id) return
    setIsLoading(true)
    setNotFound(false)
    try {
      const pac = await getPacienteById(id, user.id)
      if (!pac) {
        setNotFound(true)
        setIsLoading(false)
        return
      }

      setPaciente(pac)

      // Preenche formData com os dados salvos no banco
      const birthStr = toISODateString(pac.data_nascimento)

      const patList = Array.isArray(pac.patologias) ? pac.patologias : []
      const restList = Array.isArray(pac.restricoes_alimentares) ? pac.restricoes_alimentares : []
      const alergList = Array.isArray(pac.alergias) ? pac.alergias : []

      // Sincroniza listas com itens existentes salvos do paciente
      setPatologiasList((prev) => Array.from(new Set([...prev, ...patList.filter((x) => x !== 'Nenhum')])))
      setRestricoesList((prev) => Array.from(new Set([...prev, ...restList.filter((x) => x !== 'Nenhum')])))
      setAlergiasList((prev) => Array.from(new Set([...prev, ...alergList.filter((x) => x !== 'Nenhum')])))

      setFormData({
        nome: pac.nome || '',
        data_nascimento: birthStr,
        sexo: pac.sexo || 'Feminino',
        whatsapp: pac.whatsapp || '',
        email: pac.email || '',
        peso_inicial: pac.peso_inicial != null ? String(pac.peso_inicial) : '',
        altura: pac.altura != null ? String(pac.altura) : '',
        objetivos: Array.isArray(pac.objetivos) ? pac.objetivos : [],
        objetivo_texto: pac.objetivo_texto || '',
        nivel_atividade: pac.nivel_atividade || '',
        patologias: patList,
        patologia_custom: '',
        restricoes_alimentares: restList,
        restricao_custom: '',
        alergias: alergList,
        alergia_custom: '',
        medicamentos: pac.medicamentos || '',
        suplementos: pac.suplementos || '',
        refeicoes_por_dia: pac.refeicoes_por_dia != null ? String(pac.refeicoes_por_dia) : '',
        horario_acorda: pac.horario_acorda || '',
        horario_dorme: pac.horario_dorme || '',
        litros_agua: pac.litros_agua != null ? String(pac.litros_agua) : '',
        atividade_fisica: Boolean(pac.atividade_fisica),
        atividade_fisica_descricao: pac.atividade_fisica_descricao || '',
        observacoes: pac.observacoes || '',
      })

      // Busca consultas e planos em tempo real
      const [consList, planList] = await Promise.all([
        getConsultasByPaciente(id, user.id),
        getPlanosByPaciente(id, user.id),
      ])

      setConsultas(consList)
      setPlanos(planList)
    } catch (err) {
      console.error('Erro ao carregar paciente:', err)
      setNotFound(true)
    } finally {
      setIsLoading(false)
    }
  }, [id, user?.id])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Manipuladores de edição
  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value)
    handleInputChange('whatsapp', formatted)
  }

  const handleTimeBlur = (field: 'horario_acorda' | 'horario_dorme') => {
    const raw = formData[field]
    if (raw) {
      const formatted = formatTimeInput(raw)
      handleInputChange(field, formatted)
    }
  }

  const toggleObjetivo = (obj: string) => {
    setFormData((prev) => {
      const exists = prev.objetivos.includes(obj)
      return {
        ...prev,
        objetivos: exists ? prev.objetivos.filter((x) => x !== obj) : [...prev.objetivos, obj],
      }
    })
  }

  const toggleMultiSelectWithNenhum = (
    field: 'patologias' | 'restricoes_alimentares' | 'alergias',
    item: string
  ) => {
    setFormData((prev) => {
      const current = prev[field]
      if (item === 'Nenhum') {
        return { ...prev, [field]: current.includes('Nenhum') ? [] : ['Nenhum'] }
      }
      const withoutNenhum = current.filter((x) => x !== 'Nenhum')
      if (withoutNenhum.includes(item)) {
        return { ...prev, [field]: withoutNenhum.filter((x) => x !== item) }
      }
      return { ...prev, [field]: [...withoutNenhum, item] }
    })
  }

  const handleAddOption = (
    field: 'patologias' | 'restricoes_alimentares' | 'alergias',
    customField: 'patologia_custom' | 'restricao_custom' | 'alergia_custom'
  ) => {
    const text = formData[customField]?.trim()
    if (!text) return

    if (field === 'patologias') {
      if (!patologiasList.some((x) => x.toLowerCase() === text.toLowerCase())) {
        setPatologiasList((prev) => [...prev, text])
      }
    } else if (field === 'restricoes_alimentares') {
      if (!restricoesList.some((x) => x.toLowerCase() === text.toLowerCase())) {
        setRestricoesList((prev) => [...prev, text])
      }
    } else if (field === 'alergias') {
      if (!alergiasList.some((x) => x.toLowerCase() === text.toLowerCase())) {
        setAlergiasList((prev) => [...prev, text])
      }
    }

    setFormData((prev) => {
      const listWithoutNenhum = prev[field].filter((x) => x !== 'Nenhum')
      return {
        ...prev,
        [field]: listWithoutNenhum.includes(text) ? listWithoutNenhum : [...listWithoutNenhum, text],
        [customField]: '',
      }
    })
  }

  const handleRemoveOption = (
    field: 'patologias' | 'restricoes_alimentares' | 'alergias',
    itemToRemove: string
  ) => {
    if (field === 'patologias') {
      setPatologiasList((prev) => prev.filter((x) => x !== itemToRemove))
    } else if (field === 'restricoes_alimentares') {
      setRestricoesList((prev) => prev.filter((x) => x !== itemToRemove))
    } else if (field === 'alergias') {
      setAlergiasList((prev) => prev.filter((x) => x !== itemToRemove))
    }

    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((x) => x !== itemToRemove),
    }))
  }

  // Salvar alterações de Dados do Paciente no Neon
  const handleSavePaciente = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!id || !user?.id) return

    setIsSaving(true)
    setSaveSuccess('')
    setSaveError('')

    try {
      const pesoNum = formData.peso_inicial ? parseFloat(formData.peso_inicial.replace(',', '.')) : null
      const altNum = formData.altura ? parseFloat(formData.altura.replace(',', '.')) : null
      const refeicoesNum = formData.refeicoes_por_dia ? parseInt(formData.refeicoes_por_dia, 10) : null
      const aguaNum = formData.litros_agua ? parseFloat(formData.litros_agua.replace(',', '.')) : null

      const updated = await updatePaciente(id, user.id, {
        nome: formData.nome,
        data_nascimento: toISODateString(formData.data_nascimento) || null,
        sexo: formData.sexo,
        whatsapp: formData.whatsapp,
        email: formData.email,
        peso_inicial: pesoNum,
        altura: altNum,
        objetivos: formData.objetivos,
        objetivo_texto: formData.objetivo_texto,
        nivel_atividade: formData.nivel_atividade,
        patologias: formData.patologias,
        restricoes_alimentares: formData.restricoes_alimentares,
        alergias: formData.alergias,
        medicamentos: formData.medicamentos,
        suplementos: formData.suplementos,
        refeicoes_por_dia: refeicoesNum,
        horario_acorda: formData.horario_acorda,
        horario_dorme: formData.horario_dorme,
        litros_agua: aguaNum,
        atividade_fisica: formData.atividade_fisica,
        atividade_fisica_descricao: formData.atividade_fisica_descricao,
        observacoes: formData.observacoes,
      })

      setPaciente(updated)
      setSaveSuccess('Alterações do paciente salvas com sucesso no banco de dados!')
      setTimeout(() => setSaveSuccess(''), 4500)
    } catch (err: any) {
      console.error('Erro ao salvar paciente:', err)
      setSaveError(err.message || 'Falha ao salvar alterações. Tente novamente.')
    } finally {
      setIsSaving(false)
    }
  }

  // Salvar Nova Consulta no Neon
  const handleSaveConsulta = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id || !user?.id) return

    if (!consultaForm.data_consulta) {
      setConsultaError('A data da consulta é obrigatória.')
      return
    }

    const pesoVal = parseFloat(consultaForm.peso.replace(',', '.'))
    if (isNaN(pesoVal) || pesoVal <= 0) {
      setConsultaError('Informe um peso atual válido em kg.')
      return
    }

    setIsSavingConsulta(true)
    setConsultaError('')

    try {
      const cinturaVal = consultaForm.cintura ? parseFloat(consultaForm.cintura.replace(',', '.')) : null
      const quadrilVal = consultaForm.quadril ? parseFloat(consultaForm.quadril.replace(',', '.')) : null
      const gorduraVal = consultaForm.percentual_gordura
        ? parseFloat(consultaForm.percentual_gordura.replace(',', '.'))
        : null

      await createConsulta({
        paciente_id: id,
        nutricionista_id: user.id,
        data_consulta: toISODateString(consultaForm.data_consulta) || consultaForm.data_consulta,
        peso: pesoVal,
        cintura: cinturaVal,
        quadril: quadrilVal,
        percentual_gordura: gorduraVal,
        observacoes: consultaForm.observacoes || null,
        proximo_retorno: toISODateString(consultaForm.proximo_retorno) || null,
      })

      // Recarrega consultas e paciente atualizados
      const [updatedConsList, updatedPac] = await Promise.all([
        getConsultasByPaciente(id, user.id),
        getPacienteById(id, user.id),
      ])

      setConsultas(updatedConsList)
      if (updatedPac) setPaciente(updatedPac)

      // Reseta e fecha modal
      setConsultaForm({
        data_consulta: new Date().toISOString().split('T')[0],
        peso: '',
        cintura: '',
        quadril: '',
        percentual_gordura: '',
        observacoes: '',
        proximo_retorno: '',
      })
      setIsConsultaModalOpen(false)
      setSaveSuccess('Nova consulta registrada com sucesso!')
      setTimeout(() => setSaveSuccess(''), 4500)
    } catch (err: any) {
      console.error('Erro ao registrar consulta:', err)
      setConsultaError(err.message || 'Não foi possível salvar a consulta.')
    } finally {
      setIsSavingConsulta(false)
    }
  }

  // Prepara dados para o gráfico de evolução de peso
  // Ordem cronológica ascendente para exibição temporal
  const chartData = React.useMemo(() => {
    const list: { data: string; peso: number; label: string }[] = []

    // Adiciona o peso inicial se cadastrado e sem consultas registradas antes
    if (paciente?.peso_inicial) {
      const dataCadastro = paciente.created_at
        ? formatDateBR(paciente.created_at)
        : 'Início'
      list.push({
        data: dataCadastro,
        peso: Number(paciente.peso_inicial),
        label: `Inicial: ${paciente.peso_inicial} kg`,
      })
    }

    // Ordena consultas da mais antiga para a mais recente
    const sorted = [...consultas].sort(
      (a, b) => new Date(a.data_consulta).getTime() - new Date(b.data_consulta).getTime()
    )

    sorted.forEach((c) => {
      if (c.peso != null) {
        list.push({
          data: formatDateBR(c.data_consulta),
          peso: Number(c.peso),
          label: `${c.peso} kg`,
        })
      }
    })

    return list
  }, [consultas, paciente])

  // Idade e IMC calculados em tempo real a partir dos formulários
  const idadeAtual = calculateAge(formData.data_nascimento)
  const { imc, classificacao: imcClass, cor: imcColor } = calculateIMC(formData.peso_inicial, formData.altura)

  // Último peso registrado (consulta mais recente ou peso inicial)
  const pesoAtualExibicao =
    consultas.length > 0 && consultas[0].peso != null
      ? consultas[0].peso
      : paciente?.peso_inicial || null

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Carregando prontuário do paciente...
          </p>
        </div>
      </AppLayout>
    )
  }

  if (notFound || !paciente) {
    return (
      <AppLayout>
        <div className="max-w-xl mx-auto py-16 text-center space-y-4">
          <div className="w-16 h-16 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            Paciente não encontrado
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            O paciente solicitado não existe ou você não tem permissão para acessá-lo.
          </p>
          <Button onClick={() => navigate('/pacientes')} className="mt-4">
            Voltar para Pacientes
          </Button>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl mx-auto pb-16">
        {/* Top Breadcrumb & Voltar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            to="/pacientes"
            className="inline-flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Pacientes
          </Link>

          {/* Feedback Global de Sucesso */}
          {saveSuccess && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-sm font-semibold animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <span>{saveSuccess}</span>
            </div>
          )}

          {saveError && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 text-sm font-semibold animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
              <span>{saveError}</span>
            </div>
          )}
        </div>

        {/* Header do Paciente com Cartão de Identificação Rápida */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white text-2xl font-black shadow-md shadow-emerald-500/20 flex-shrink-0">
                {paciente.nome ? paciente.nome.charAt(0).toUpperCase() : 'P'}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                    {paciente.nome}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    {paciente.sexo || 'Não informado'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-slate-500 dark:text-slate-400">
                  {idadeAtual !== null && (
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {idadeAtual} anos
                    </span>
                  )}
                  {paciente.whatsapp && (
                    <a
                      href={`https://wa.me/55${paciente.whatsapp.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      {paciente.whatsapp}
                    </a>
                  )}
                  {paciente.email && (
                    <span className="inline-flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5" />
                      {paciente.email}
                    </span>
                  )}
                  {paciente.created_at && (
                    <span className="inline-flex items-center gap-1 text-slate-400">
                      <Calendar className="w-3.5 h-3.5" />
                      Cadastrado em {formatDateBR(paciente.created_at)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-3 gap-3 border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 pt-4 md:pt-0 md:pl-6 text-center">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Peso Atual
                </span>
                <span className="text-base font-extrabold text-slate-800 dark:text-slate-200">
                  {pesoAtualExibicao ? `${pesoAtualExibicao} kg` : '—'}
                </span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  IMC
                </span>
                <span className="text-base font-extrabold text-slate-800 dark:text-slate-200">
                  {imc || '—'}
                </span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Consultas
                </span>
                <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                  {consultas.length}
                </span>
              </div>
            </div>
          </div>

          {/* Abas Principais do Perfil do Paciente */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 mt-6 pt-2 gap-2 overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => setMainTab('dados')}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 text-sm font-bold border-b-2 transition-all whitespace-nowrap',
                mainTab === 'dados'
                  ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 dark:border-emerald-500'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              )}
            >
              <User className="w-4 h-4" />
              1. Dados do Paciente
            </button>

            <button
              type="button"
              onClick={() => setMainTab('consultas')}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 text-sm font-bold border-b-2 transition-all whitespace-nowrap',
                mainTab === 'consultas'
                  ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 dark:border-emerald-500'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              )}
            >
              <Scale className="w-4 h-4" />
              2. Consultas
              <span className="ml-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {consultas.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setMainTab('planos')}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 text-sm font-bold border-b-2 transition-all whitespace-nowrap',
                mainTab === 'planos'
                  ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 dark:border-emerald-500'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              )}
            >
              <Utensils className="w-4 h-4" />
              3. Planos Alimentares
              <span className="ml-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {planos.length}
              </span>
            </button>
          </div>
        </div>

        {/* ========================================================
            SEÇÃO 1 — DADOS DO PACIENTE (EDITÁVEIS DIRETAMENTE)
            ======================================================== */}
        {mainTab === 'dados' && (
          <div className="space-y-6">
            <Card className="p-6">
              {/* Navegação entre as 3 abas de dados */}
              <div className="flex flex-wrap items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 gap-4">
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setDadosTab('pessoal')}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all',
                      dadosTab === 'pessoal'
                        ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    )}
                  >
                    <User className="w-4 h-4" />
                    Pessoal
                  </button>

                  <button
                    type="button"
                    onClick={() => setDadosTab('clinico')}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all',
                      dadosTab === 'clinico'
                        ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    )}
                  >
                    <Activity className="w-4 h-4" />
                    Clínico
                  </button>

                  <button
                    type="button"
                    onClick={() => setDadosTab('habitos')}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all',
                      dadosTab === 'habitos'
                        ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    )}
                  >
                    <Coffee className="w-4 h-4" />
                    Hábitos
                  </button>
                </div>

                {/* Botão Salvar no Topo da aba de dados */}
                <Button
                  onClick={() => handleSavePaciente()}
                  disabled={isSaving}
                  className="flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Salvando no Neon...' : 'Salvar alterações'}
                </Button>
              </div>

              {/* Conteúdo Aba Pessoal */}
              {dadosTab === 'pessoal' && (
                <div className="pt-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Nome Completo */}
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Nome Completo *
                      </label>
                      <input
                        type="text"
                        value={formData.nome}
                        onChange={(e) => handleInputChange('nome', e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                        placeholder="Nome completo do paciente"
                        required
                      />
                    </div>

                    {/* Data de Nascimento */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          Data de Nascimento
                        </label>
                        {idadeAtual !== null && (
                          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                            {idadeAtual} anos
                          </span>
                        )}
                      </div>
                      <input
                        type="date"
                        value={formData.data_nascimento}
                        onChange={(e) => handleInputChange('data_nascimento', e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>

                    {/* Sexo Biológico */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Sexo Biológico
                      </label>
                      <select
                        value={formData.sexo}
                        onChange={(e) => handleInputChange('sexo', e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                      >
                        <option value="Feminino">Feminino</option>
                        <option value="Masculino">Masculino</option>
                        <option value="Outro">Outro</option>
                      </select>
                    </div>

                    {/* WhatsApp */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        WhatsApp / Celular
                      </label>
                      <input
                        type="text"
                        value={formData.whatsapp}
                        onChange={handlePhoneChange}
                        placeholder="(99) 99999-9999"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>

                    {/* E-mail */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        E-mail
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="paciente@exemplo.com"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Conteúdo Aba Clínico */}
              {dadosTab === 'clinico' && (
                <div className="pt-6 space-y-6">
                  {/* Antropometria Básica & IMC Card */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Peso Inicial (kg)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.peso_inicial}
                        onChange={(e) => handleInputChange('peso_inicial', e.target.value)}
                        placeholder="Ex: 72.5"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Altura (cm)
                      </label>
                      <input
                        type="number"
                        step="1"
                        value={formData.altura}
                        onChange={(e) => handleInputChange('altura', e.target.value)}
                        placeholder="Ex: 168"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>

                    {/* Preview Dinâmico do IMC */}
                    <div className="p-3.5 rounded-xl border bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                          IMC Calculado
                        </span>
                        <div className="text-xl font-black text-slate-900 dark:text-slate-100 mt-0.5">
                          {imc ? `${imc}` : '—'}
                        </div>
                      </div>
                      {imcClass ? (
                        <span className={cn('px-2.5 py-1 rounded-lg text-xs font-bold border', imcColor)}>
                          {imcClass}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">Preencha peso e altura</span>
                      )}
                    </div>
                  </div>

                  {/* Nível de Atividade */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Nível de Atividade Física Geral
                    </label>
                    <select
                      value={formData.nivel_atividade}
                      onChange={(e) => handleInputChange('nivel_atividade', e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    >
                      <option value="">Selecione um nível...</option>
                      {DEFAULT_NIVEIS_ATIVIDADE.map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Objetivos */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Objetivos Nutricionais
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {DEFAULT_OBJETIVOS.map((obj) => {
                        const isSelected = formData.objetivos.includes(obj)
                        return (
                          <button
                            key={obj}
                            type="button"
                            onClick={() => toggleObjetivo(obj)}
                            className={cn(
                              'px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border',
                              isSelected
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-300'
                            )}
                          >
                            {obj}
                          </button>
                        )
                      })}
                    </div>
                    <input
                      type="text"
                      value={formData.objetivo_texto}
                      onChange={(e) => handleInputChange('objetivo_texto', e.target.value)}
                      placeholder="Outro objetivo específico ou detalhes..."
                      className="w-full mt-2 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>

                  {/* Patologias (com adicionar/excluir) */}
                  <div className="space-y-2 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      Patologias & Diagnósticos
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => toggleMultiSelectWithNenhum('patologias', 'Nenhum')}
                        className={cn(
                          'px-3 py-1 rounded-lg text-xs font-semibold border transition-all',
                          formData.patologias.includes('Nenhum')
                            ? 'bg-slate-800 text-white border-slate-800 dark:bg-slate-200 dark:text-slate-900'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                        )}
                      >
                        Nenhum
                      </button>
                      {patologiasList.map((item) => {
                        const isSelected = formData.patologias.includes(item)
                        return (
                          <div
                            key={item}
                            className={cn(
                              'inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border transition-all',
                              isSelected
                                ? 'bg-red-500 text-white border-red-500 shadow-sm'
                                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-red-300'
                            )}
                          >
                            <span
                              className="cursor-pointer"
                              onClick={() => toggleMultiSelectWithNenhum('patologias', item)}
                            >
                              {item}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleRemoveOption('patologias', item)
                              }}
                              title="Remover opção"
                              className="opacity-60 hover:opacity-100"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        )
                      })}
                    </div>
                    <div className="flex gap-2 pt-2">
                      <input
                        type="text"
                        value={formData.patologia_custom}
                        onChange={(e) => handleInputChange('patologia_custom', e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleAddOption('patologias', 'patologia_custom')
                          }
                        }}
                        placeholder="Adicionar nova patologia..."
                        className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs flex-1 outline-none"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => handleAddOption('patologias', 'patologia_custom')}
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar
                      </Button>
                    </div>
                  </div>

                  {/* Restrições Alimentares (com adicionar/excluir) */}
                  <div className="space-y-2 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      Restrições Alimentares
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => toggleMultiSelectWithNenhum('restricoes_alimentares', 'Nenhum')}
                        className={cn(
                          'px-3 py-1 rounded-lg text-xs font-semibold border transition-all',
                          formData.restricoes_alimentares.includes('Nenhum')
                            ? 'bg-slate-800 text-white border-slate-800 dark:bg-slate-200 dark:text-slate-900'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                        )}
                      >
                        Nenhum
                      </button>
                      {restricoesList.map((item) => {
                        const isSelected = formData.restricoes_alimentares.includes(item)
                        return (
                          <div
                            key={item}
                            className={cn(
                              'inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border transition-all',
                              isSelected
                                ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-300'
                            )}
                          >
                            <span
                              className="cursor-pointer"
                              onClick={() => toggleMultiSelectWithNenhum('restricoes_alimentares', item)}
                            >
                              {item}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleRemoveOption('restricoes_alimentares', item)
                              }}
                              title="Remover opção"
                              className="opacity-60 hover:opacity-100"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        )
                      })}
                    </div>
                    <div className="flex gap-2 pt-2">
                      <input
                        type="text"
                        value={formData.restricao_custom}
                        onChange={(e) => handleInputChange('restricao_custom', e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleAddOption('restricoes_alimentares', 'restricao_custom')
                          }
                        }}
                        placeholder="Adicionar nova restrição..."
                        className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs flex-1 outline-none"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => handleAddOption('restricoes_alimentares', 'restricao_custom')}
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar
                      </Button>
                    </div>
                  </div>

                  {/* Alergias Alimentares (com adicionar/excluir) */}
                  <div className="space-y-2 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      Alergias Alimentares
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => toggleMultiSelectWithNenhum('alergias', 'Nenhum')}
                        className={cn(
                          'px-3 py-1 rounded-lg text-xs font-semibold border transition-all',
                          formData.alergias.includes('Nenhum')
                            ? 'bg-slate-800 text-white border-slate-800 dark:bg-slate-200 dark:text-slate-900'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                        )}
                      >
                        Nenhum
                      </button>
                      {alergiasList.map((item) => {
                        const isSelected = formData.alergias.includes(item)
                        return (
                          <div
                            key={item}
                            className={cn(
                              'inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border transition-all',
                              isSelected
                                ? 'bg-orange-600 text-white border-orange-600 shadow-sm'
                                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-orange-300'
                            )}
                          >
                            <span
                              className="cursor-pointer"
                              onClick={() => toggleMultiSelectWithNenhum('alergias', item)}
                            >
                              {item}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleRemoveOption('alergias', item)
                              }}
                              title="Remover opção"
                              className="opacity-60 hover:opacity-100"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        )
                      })}
                    </div>
                    <div className="flex gap-2 pt-2">
                      <input
                        type="text"
                        value={formData.alergia_custom}
                        onChange={(e) => handleInputChange('alergia_custom', e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleAddOption('alergias', 'alergia_custom')
                          }
                        }}
                        placeholder="Adicionar nova alergia..."
                        className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs flex-1 outline-none"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => handleAddOption('alergias', 'alergia_custom')}
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar
                      </Button>
                    </div>
                  </div>

                  {/* Medicamentos & Suplementos */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Medicamentos em Uso
                      </label>
                      <textarea
                        rows={3}
                        value={formData.medicamentos}
                        onChange={(e) => handleInputChange('medicamentos', e.target.value)}
                        placeholder="Nome dos medicamentos, dosagens e horários..."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Suplementos Nutricionais
                      </label>
                      <textarea
                        rows={3}
                        value={formData.suplementos}
                        onChange={(e) => handleInputChange('suplementos', e.target.value)}
                        placeholder="Whey, creatina, polivitamínicos..."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Conteúdo Aba Hábitos */}
              {dadosTab === 'habitos' && (
                <div className="pt-6 space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Refeições ao dia
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="12"
                        value={formData.refeicoes_por_dia}
                        onChange={(e) => handleInputChange('refeicoes_por_dia', e.target.value)}
                        placeholder="Ex: 5"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Consumo de Água (L/dia)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.litros_agua}
                        onChange={(e) => handleInputChange('litros_agua', e.target.value)}
                        placeholder="Ex: 2.5"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Horário que Acorda
                      </label>
                      <input
                        type="text"
                        value={formData.horario_acorda}
                        onChange={(e) => handleInputChange('horario_acorda', e.target.value)}
                        onBlur={() => handleTimeBlur('horario_acorda')}
                        placeholder="07:00"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Horário que Dorme
                      </label>
                      <input
                        type="text"
                        value={formData.horario_dorme}
                        onChange={(e) => handleInputChange('horario_dorme', e.target.value)}
                        onBlur={() => handleTimeBlur('horario_dorme')}
                        placeholder="23:00"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Atividade Física */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.atividade_fisica}
                        onChange={(e) => handleInputChange('atividade_fisica', e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                      />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Pratica atividade física regularmente?
                      </span>
                    </label>

                    {formData.atividade_fisica && (
                      <input
                        type="text"
                        value={formData.atividade_fisica_descricao}
                        onChange={(e) => handleInputChange('atividade_fisica_descricao', e.target.value)}
                        placeholder="Descreva as atividades, frequência e intensidade (ex: Musculação 4x na semana)"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-emerald-500 outline-none animate-in fade-in"
                      />
                    )}
                  </div>

                  {/* Observações Gerais */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Observações Gerais & Rotina
                    </label>
                    <textarea
                      rows={4}
                      value={formData.observacoes}
                      onChange={(e) => handleInputChange('observacoes', e.target.value)}
                      placeholder="Informações adicionais sobre preferências, aversões ou rotina de trabalho..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Botão Salvar Rodapé */}
              <div className="flex justify-end pt-6 border-t border-slate-100 dark:border-slate-800 mt-8">
                <Button
                  onClick={() => handleSavePaciente()}
                  disabled={isSaving}
                  className="flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Salvando no Neon...' : 'Salvar alterações'}
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* ========================================================
            SEÇÃO 2 — CONSULTAS & EVOLUÇÃO
            ======================================================== */}
        {mainTab === 'consultas' && (
          <div className="space-y-6">
            {/* Header da seção com botão de Nova Consulta */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  Evolução do Paciente & Consultas
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Acompanhe a curva de peso e registre novas consultas de retorno
                </p>
              </div>

              <Button
                onClick={() => {
                  setConsultaError('')
                  setIsConsultaModalOpen(true)
                }}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20"
              >
                <Plus className="w-4 h-4" />
                Nova Consulta
              </Button>
            </div>

            {/* Gráfico de Evolução de Peso (Sempre visível em destaque) */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                    <Scale className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      Gráfico de Evolução de Peso (kg)
                    </h3>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Histórico ao longo do tempo
                    </span>
                  </div>
                </div>

                {chartData.length > 0 && (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    {chartData.length} ponto(s) registrado(s)
                  </span>
                )}
              </div>

              {chartData.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-800/20">
                  <Scale className="w-10 h-10 text-slate-400 dark:text-slate-600 mb-2" />
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    Nenhuma consulta registrada ainda
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                    Clique no botão "Nova Consulta" para registrar a primeira pesagem e acompanhar a curva de progresso.
                  </p>
                </div>
              ) : (
                <div className="w-full h-72 pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-800" />
                      <XAxis
                        dataKey="data"
                        stroke="#94a3b8"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="#94a3b8"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        domain={['dataMin - 2', 'dataMax + 2']}
                        tickFormatter={(v) => `${v}kg`}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload
                            return (
                              <div className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 text-xs">
                                <p className="font-bold text-slate-800 dark:text-slate-200">
                                  {data.data}
                                </p>
                                <p className="text-emerald-600 dark:text-emerald-400 font-extrabold text-sm mt-0.5">
                                  {data.peso} kg
                                </p>
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="peso"
                        stroke="#059669"
                        strokeWidth={3}
                        dot={{ r: 5, fill: '#059669', strokeWidth: 2, stroke: '#ffffff' }}
                        activeDot={{ r: 7, fill: '#10b981' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>

            {/* Lista de Consultas em Ordem Cronológica Decrescente */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Histórico de Consultas ({consultas.length})
                </h3>
              </div>

              {consultas.length === 0 ? (
                <Card className="p-8 text-center space-y-3">
                  <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                    <CalendarDays className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">
                    Nenhuma consulta registrada ainda
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                    As consultas realizadas pelo paciente aparecerão aqui em ordem decrescente com peso, medidas antropométricas e notas clínicas.
                  </p>
                  <Button
                    onClick={() => {
                      setConsultaError('')
                      setIsConsultaModalOpen(true)
                    }}
                    variant="secondary"
                    size="sm"
                    className="mt-2"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Registrar Primeira Consulta
                  </Button>
                </Card>
              ) : (
                <div className="space-y-3">
                  {consultas.map((c, idx) => {
                    // Diferença de peso com a consulta anterior (se houver)
                    const prevConsulta = consultas[idx + 1]
                    const pesoDiff =
                      c.peso != null && prevConsulta?.peso != null
                        ? Number((c.peso - prevConsulta.peso).toFixed(1))
                        : null

                    return (
                      <Card
                        key={c.id || idx}
                        className="p-5 hover:border-emerald-300 dark:hover:border-emerald-800 transition-all shadow-sm"
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          {/* Coluna 1: Data e badges */}
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center flex-shrink-0 font-bold">
                              <CalendarDays className="w-5 h-5" />
                            </div>

                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-base font-black text-slate-900 dark:text-slate-100">
                                  {formatDateBR(c.data_consulta)}
                                </span>
                                {idx === 0 && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                                    Mais recente
                                  </span>
                                )}
                              </div>
                              {c.proximo_retorno && (
                                <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1 mt-0.5">
                                  <Clock className="w-3 h-3" />
                                  Próximo retorno: {formatDateBR(c.proximo_retorno)}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Coluna 2: Métricas principais */}
                          <div className="flex flex-wrap items-center gap-3">
                            {/* Peso */}
                            <div className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-800">
                              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                                Peso
                              </span>
                              <div className="flex items-baseline gap-1.5">
                                <span className="text-base font-black text-slate-900 dark:text-slate-100">
                                  {c.peso != null ? `${c.peso} kg` : '—'}
                                </span>
                                {pesoDiff !== null && (
                                  <span
                                    className={cn(
                                      'text-xs font-bold',
                                      pesoDiff <= 0
                                        ? 'text-emerald-600 dark:text-emerald-400'
                                        : 'text-amber-600 dark:text-amber-400'
                                    )}
                                  >
                                    {pesoDiff > 0 ? `+${pesoDiff}` : pesoDiff} kg
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Cintura */}
                            <div className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-800">
                              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                                Cintura
                              </span>
                              <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                                {c.cintura != null ? `${c.cintura} cm` : '—'}
                              </span>
                            </div>

                            {/* Quadril */}
                            <div className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-800">
                              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                                Quadril
                              </span>
                              <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                                {c.quadril != null ? `${c.quadril} cm` : '—'}
                              </span>
                            </div>

                            {/* % Gordura */}
                            <div className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-800">
                              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                                % Gordura
                              </span>
                              <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                                {(c.percentual_gordura ?? c.gordura_percentual) != null
                                  ? `${c.percentual_gordura ?? c.gordura_percentual}%`
                                  : '—'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Observações da Consulta */}
                        {c.observacoes && (
                          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 bg-slate-50/60 dark:bg-slate-800/40 p-3 rounded-xl">
                            <span className="font-bold text-slate-700 dark:text-slate-300 block mb-0.5">
                              Observações clínicas:
                            </span>
                            <p className="whitespace-pre-wrap leading-relaxed">{c.observacoes}</p>
                          </div>
                        )}
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================
            SEÇÃO 3 — PLANOS ALIMENTARES
            ======================================================== */}
        {mainTab === 'planos' && (
          <PlanoAlimentarManager
            paciente={paciente}
            planos={planos}
            onPlanoSaved={loadData}
          />
        )}

        {/* ========================================================
            MODAL NOVA CONSULTA
            ======================================================== */}
        {isConsultaModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 animate-in zoom-in-95 duration-150">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                    <Scale className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      Nova Consulta
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {paciente.nome}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsConsultaModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Erro de validação da consulta */}
              {consultaError && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{consultaError}</span>
                </div>
              )}

              {/* Formulário da Consulta */}
              <form onSubmit={handleSaveConsulta} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Data da Consulta (default hoje, editável) */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Data da Consulta *
                    </label>
                    <input
                      type="date"
                      value={consultaForm.data_consulta}
                      onChange={(e) =>
                        setConsultaForm((p) => ({ ...p, data_consulta: e.target.value }))
                      }
                      required
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>

                  {/* Peso Atual em kg (obrigatório) */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Peso Atual (kg) *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={consultaForm.peso}
                      onChange={(e) =>
                        setConsultaForm((p) => ({ ...p, peso: e.target.value }))
                      }
                      placeholder="Ex: 70.5"
                      required
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>

                  {/* Cintura em cm (opcional) */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Cintura (cm) <span className="text-slate-400 font-normal">(opcional)</span>
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={consultaForm.cintura}
                      onChange={(e) =>
                        setConsultaForm((p) => ({ ...p, cintura: e.target.value }))
                      }
                      placeholder="Ex: 82"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>

                  {/* Quadril em cm (opcional) */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Quadril (cm) <span className="text-slate-400 font-normal">(opcional)</span>
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={consultaForm.quadril}
                      onChange={(e) =>
                        setConsultaForm((p) => ({ ...p, quadril: e.target.value }))
                      }
                      placeholder="Ex: 102"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>

                  {/* % Gordura (opcional) */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      % de Gordura <span className="text-slate-400 font-normal">(opcional)</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={consultaForm.percentual_gordura}
                      onChange={(e) =>
                        setConsultaForm((p) => ({ ...p, percentual_gordura: e.target.value }))
                      }
                      placeholder="Ex: 22.4"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>

                  {/* Próximo Retorno (seletor de data) */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Próximo Retorno <span className="text-slate-400 font-normal">(opcional)</span>
                    </label>
                    <input
                      type="date"
                      value={consultaForm.proximo_retorno}
                      onChange={(e) =>
                        setConsultaForm((p) => ({ ...p, proximo_retorno: e.target.value }))
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </div>

                {/* Observações */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Observações Clínicas
                  </label>
                  <textarea
                    rows={3}
                    value={consultaForm.observacoes}
                    onChange={(e) =>
                      setConsultaForm((p) => ({ ...p, observacoes: e.target.value }))
                    }
                    placeholder="Evolução, adesão à dieta, sintomas relatados..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                {/* Botões do Modal */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsConsultaModalOpen(false)}
                    disabled={isSavingConsulta}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSavingConsulta}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {isSavingConsulta ? 'Salvando consulta...' : 'Salvar consulta'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}

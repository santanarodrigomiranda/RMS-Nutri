import React, { useState, useEffect } from 'react'
import {
  Sparkles,
  Save,
  Plus,
  Calendar,
  Eye,
  AlertCircle,
  CheckCircle2,
  Utensils,
  RefreshCw,
  Edit3,
  X,
  FileText,
} from 'lucide-react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import type { Paciente, PlanoAlimentar, PlanoSemanalConteudo, DiaPlano } from '../../types/paciente'
import { createPlanoAlimentar } from '../../lib/db'
import {
  DIAS_DA_SEMANA,
  REFEICOES_LABELS,
  createDefaultManualWeeklyPlan,
} from '../../utils/mealPlanDefaults'
import { formatDateBR } from '../../utils/nutrition'
import { cn } from '../../utils/cn'

interface PlanoAlimentarManagerProps {
  paciente: Paciente
  planos: PlanoAlimentar[]
  onPlanoSaved: () => Promise<void>
}

const LOADING_MESSAGES = [
  'Buscando dados e metas do paciente...',
  'Analisando restrições e alergias alimentares...',
  'Conectando ao Gemini AI...',
  'Calculando cardápio e macronutrientes da semana...',
  'Estruturando opções balanceadas para os 7 dias...',
]

export const PlanoAlimentarManager: React.FC<PlanoAlimentarManagerProps> = ({
  paciente,
  planos,
  onPlanoSaved,
}) => {
  // Modo de visualização: 'historico' ou 'edicao'
  const [viewMode, setViewMode] = useState<'historico' | 'edicao'>('historico')

  // Plano em edição/carregado na tela
  const [planoEmEdicao, setPlanoEmEdicao] = useState<PlanoSemanalConteudo | null>(null)
  const [diaAtivo, setDiaAtivo] = useState<string>('Segunda-feira')

  // Estados de IA e Carregamento
  const [isGenerating, setIsGenerating] = useState(false)
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0)
  const [isSaving, setIsSaving] = useState(false)

  // Mensagens e feedbacks
  const [errorToast, setErrorToast] = useState<string | null>(null)
  const [showManualPrompt, setShowManualPrompt] = useState(false)
  const [successToast, setSuccessToast] = useState<string | null>(null)

  // Modal para inspecionar plano histórico
  const [selectedPlanoModal, setSelectedPlanoModal] = useState<PlanoAlimentar | null>(null)
  const [modalDiaAtivo, setModalDiaAtivo] = useState<string>('Segunda-feira')

  // Efeito para alternar mensagens durante o loading da IA
  useEffect(() => {
    let interval: any
    if (isGenerating) {
      interval = setInterval(() => {
        setLoadingMsgIdx((prev) => (prev + 1) % LOADING_MESSAGES.length)
      }, 2400)
    } else {
      setLoadingMsgIdx(0)
    }
    return () => clearInterval(interval)
  }, [isGenerating])

  // Ação: Gerar Plano com IA via Serverless Function
  const handleGerarPlanoComIA = async () => {
    setIsGenerating(true)
    setErrorToast(null)
    setShowManualPrompt(false)
    setSuccessToast(null)

    try {
      const response = await fetch('/api/gerar-plano', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paciente: {
            nome: paciente.nome,
            sexo: paciente.sexo,
            data_nascimento: paciente.data_nascimento,
            peso_inicial: paciente.peso_inicial,
            altura: paciente.altura,
            objetivos: paciente.objetivos,
            objetivo_texto: paciente.objetivo_texto,
            nivel_atividade: paciente.nivel_atividade,
            patologias: paciente.patologias,
            restricoes_alimentares: paciente.restricoes_alimentares,
            alergias: paciente.alergias,
            medicamentos: paciente.medicamentos,
            suplementos: paciente.suplementos,
            refeicoes_por_dia: paciente.refeicoes_por_dia,
            horario_acorda: paciente.horario_acorda,
            horario_dorme: paciente.horario_dorme,
            litros_agua: paciente.litros_agua,
            atividade_fisica: paciente.atividade_fisica,
            atividade_fisica_descricao: paciente.atividade_fisica_descricao,
            observacoes: paciente.observacoes,
          },
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Falha na resposta do servidor.')
      }

      const data = await response.json()

      if (!data || !Array.isArray(data.plano_semanal)) {
        throw new Error('Formato de plano alimentar inválido retornado pela IA.')
      }

      // Garante que todos os 7 dias e todas as refeições estejam bem estruturados
      const planoNormalizado: PlanoSemanalConteudo = {
        plano_semanal: DIAS_DA_SEMANA.map((diaNome) => {
          const diaEncontrado = data.plano_semanal.find(
            (d: any) => d.dia?.toLowerCase().trim() === diaNome.toLowerCase().trim()
          )

          const refeicoes = diaEncontrado?.refeicoes || {}
          return {
            dia: diaNome,
            refeicoes: {
              cafe_da_manha: ensure5Options(refeicoes.cafe_da_manha),
              lanche_manha: ensure5Options(refeicoes.lanche_manha),
              almoco: ensure5Options(refeicoes.almoco),
              lanche_tarde: ensure5Options(refeicoes.lanche_tarde),
              jantar: ensure5Options(refeicoes.jantar),
            },
          }
        }),
      }

      setPlanoEmEdicao(planoNormalizado)
      setDiaAtivo('Segunda-feira')
      setViewMode('edicao')
      setSuccessToast('Plano alimentar semanal gerado com IA! Você pode personalizá-lo abaixo.')
      setTimeout(() => setSuccessToast(null), 5000)
    } catch (err: any) {
      console.error('Erro ao gerar plano alimentar:', err)
      setErrorToast(
        'Não foi possível gerar o plano com IA no momento. Deseja tentar novamente ou criar um Plano Manual?'
      )
      setShowManualPrompt(true)
    } finally {
      setIsGenerating(false)
    }
  }

  // Criação de Plano Manual (Fallback ou Escolha Direta)
  const handleCriarPlanoManual = () => {
    const manual = createDefaultManualWeeklyPlan(paciente.nome)
    setPlanoEmEdicao(manual)
    setDiaAtivo('Segunda-feira')
    setViewMode('edicao')
    setShowManualPrompt(false)
    setErrorToast(null)
    setSuccessToast('Plano manual iniciado com modelo de sugestões! Edite os campos conforme necessário.')
    setTimeout(() => setSuccessToast(null), 5000)
  }

  // Atualização em tempo real de uma opção de refeição
  const handleOptionChange = (
    diaNome: string,
    refeicaoKey: 'cafe_da_manha' | 'lanche_manha' | 'almoco' | 'lanche_tarde' | 'jantar',
    index: number,
    value: string
  ) => {
    if (!planoEmEdicao) return

    setPlanoEmEdicao((prev) => {
      if (!prev) return null
      const updatedDias = prev.plano_semanal.map((d) => {
        if (d.dia !== diaNome) return d
        const currentRefeicao = [...d.refeicoes[refeicaoKey]]
        currentRefeicao[index] = value
        return {
          ...d,
          refeicoes: {
            ...d.refeicoes,
            [refeicaoKey]: currentRefeicao,
          },
        }
      })
      return { plano_semanal: updatedDias }
    })
  }

  // Salvar Plano Alimentar no Neon
  const handleSalvarPlanoAlimentar = async () => {
    if (!planoEmEdicao || !paciente.id) return

    setIsSaving(true)
    setErrorToast(null)

    try {
      await createPlanoAlimentar({
        paciente_id: paciente.id,
        conteudo: planoEmEdicao,
      })

      await onPlanoSaved()

      setSuccessToast('Plano alimentar salvo com sucesso no banco de dados!')
      setViewMode('historico')
      setPlanoEmEdicao(null)
      setTimeout(() => setSuccessToast(null), 5000)
    } catch (err: any) {
      console.error('Erro ao salvar plano:', err)
      setErrorToast('Erro ao salvar plano alimentar no banco de dados. Tente novamente.')
    } finally {
      setIsSaving(false)
    }
  }

  // Carregar um plano do histórico no editor
  const handleCarregarPlanoDoHistorico = (plano: PlanoAlimentar) => {
    let parsed: any = plano.conteudo
    if (typeof parsed === 'string') {
      try {
        parsed = JSON.parse(parsed)
      } catch {
        parsed = null
      }
    }

    if (parsed && Array.isArray(parsed.plano_semanal)) {
      setPlanoEmEdicao(parsed)
      setDiaAtivo('Segunda-feira')
      setViewMode('edicao')
      setSelectedPlanoModal(null)
      setSuccessToast('Plano carregado no editor! Você pode ajustar e salvar como nova versão.')
      setTimeout(() => setSuccessToast(null), 4000)
    } else {
      setErrorToast('Não foi possível carregar a estrutura deste plano para edição.')
    }
  }

  // Auxiliar para garantir 5 strings em cada refeição
  function ensure5Options(opts?: any[]): string[] {
    const list = Array.isArray(opts) ? [...opts] : []
    while (list.length < 5) {
      list.push('')
    }
    return list.slice(0, 5).map((x) => String(x || ''))
  }

  // Obter o dia atualmente ativo em modo de edição
  const diaPlanoAtual: DiaPlano | undefined = planoEmEdicao?.plano_semanal.find(
    (d) => d.dia === diaAtivo
  )

  // Obter o dia atualmente ativo na modal de histórico
  const getModalDiaPlano = (conteudo: any): DiaPlano | undefined => {
    let parsed = conteudo
    if (typeof parsed === 'string') {
      try {
        parsed = JSON.parse(parsed)
      } catch {
        return undefined
      }
    }
    if (parsed && Array.isArray(parsed.plano_semanal)) {
      return parsed.plano_semanal.find((d: DiaPlano) => d.dia === modalDiaAtivo)
    }
    return undefined
  }

  return (
    <div className="space-y-6">
      {/* Toast de Sucesso */}
      {successToast && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-sm font-semibold animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Toast de Erro e Prompt de Resiliência */}
      {errorToast && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/70 border border-red-200 dark:border-red-800 text-red-900 dark:text-red-200 space-y-3 animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm font-medium leading-relaxed">
              {errorToast}
            </div>
          </div>

          {showManualPrompt && (
            <div className="flex flex-wrap items-center gap-3 pt-1 pl-8">
              <Button
                size="sm"
                onClick={handleGerarPlanoComIA}
                disabled={isGenerating}
                className="bg-red-700 hover:bg-red-800 text-white text-xs"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1" />
                Tentar novamente com IA
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={handleCriarPlanoManual}
                className="text-xs"
              >
                <Edit3 className="w-3.5 h-3.5 mr-1" />
                Criar Plano Manual
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Barra de Ações do Topo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Utensils className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            Planos Alimentares & Prescrições
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Gere cardápios semanais personalizados com IA ou elabore manualmente
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Botão de Criação Manual Direta */}
          {viewMode === 'historico' && (
            <Button
              variant="secondary"
              onClick={handleCriarPlanoManual}
              disabled={isGenerating}
              className="text-xs font-bold"
            >
              <Plus className="w-4 h-4 mr-1 text-slate-600 dark:text-slate-300" />
              Plano Manual
            </Button>
          )}

          {/* Botão ✨ Gerar Plano com IA em Destaque */}
          <Button
            onClick={handleGerarPlanoComIA}
            disabled={isGenerating}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white shadow-md shadow-emerald-600/25 px-5 py-2.5 font-extrabold text-sm transition-all"
          >
            <Sparkles className={cn('w-4 h-4', isGenerating && 'animate-spin')} />
            {isGenerating ? 'Gerando Plano com IA...' : '✨ Gerar Plano com IA'}
          </Button>
        </div>
      </div>

      {/* Loading Visual com Mensagens Dinâmicas */}
      {isGenerating && (
        <Card className="p-8 text-center space-y-4 border-2 border-dashed border-emerald-300 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20 animate-in fade-in">
          <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <Sparkles className="w-7 h-7 animate-pulse text-emerald-600 dark:text-emerald-300" />
          </div>

          <div className="space-y-1.5 max-w-md mx-auto">
            <h4 className="text-base font-black text-slate-900 dark:text-slate-100">
              Elaborando Plano Alimentar com Inteligência Artificial
            </h4>
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 h-5 transition-all">
              {LOADING_MESSAGES[loadingMsgIdx]}
            </p>
          </div>

          <div className="w-48 h-1.5 bg-emerald-200 dark:bg-emerald-950 rounded-full mx-auto overflow-hidden">
            <div className="w-full h-full bg-emerald-600 rounded-full animate-pulse" />
          </div>
        </Card>
      )}

      {/* ========================================================
          INTERFACE DE EDIÇÃO (TABS POR DIAS DA SEMANA)
          ======================================================== */}
      {viewMode === 'edicao' && planoEmEdicao && (
        <Card className="p-6 space-y-6 border-2 border-emerald-500/40 dark:border-emerald-500/30 shadow-lg">
          {/* Header do Modo de Edição */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                <Edit3 className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                  Editar Plano Alimentar Semanal
                </h3>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Ajuste qualquer opção antes de salvar no prontuário do paciente
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setViewMode('historico')
                  setPlanoEmEdicao(null)
                }}
                disabled={isSaving}
              >
                Voltar ao Histórico
              </Button>

              {/* Botão Salvar Plano Alimentar (Visível quando houver plano na tela) */}
              <Button
                onClick={handleSalvarPlanoAlimentar}
                disabled={isSaving}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Salvando no Neon...' : 'Salvar Plano Alimentar'}
              </Button>
            </div>
          </div>

          {/* Abas dos 7 Dias da Semana */}
          <div className="flex gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto scrollbar-none">
            {DIAS_DA_SEMANA.map((dia) => {
              const isActive = diaAtivo === dia
              return (
                <button
                  key={dia}
                  type="button"
                  onClick={() => setDiaAtivo(dia)}
                  className={cn(
                    'px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap',
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  )}
                >
                  {dia}
                </button>
              )
            })}
          </div>

          {/* Refeições do Dia Ativo com os 5 Inputs Cada */}
          {diaPlanoAtual && (
            <div className="space-y-6 pt-2">
              {(
                ['cafe_da_manha', 'lanche_manha', 'almoco', 'lanche_tarde', 'jantar'] as const
              ).map((refeicaoKey) => {
                const label = REFEICOES_LABELS[refeicaoKey]
                const options = diaPlanoAtual.refeicoes[refeicaoKey] || []

                return (
                  <div
                    key={refeicaoKey}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                        <Utensils className="w-3.5 h-3.5" />
                        {label} ({diaAtivo})
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        5 opções configuradas
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-2.5">
                      {[0, 1, 2, 3, 4].map((idx) => {
                        const val = options[idx] || ''
                        return (
                          <div key={idx} className="flex items-center gap-2">
                            <span className="w-16 text-[11px] font-bold text-slate-400 flex-shrink-0">
                              Opção {idx + 1}:
                            </span>
                            <input
                              type="text"
                              value={val}
                              onChange={(e) =>
                                handleOptionChange(diaAtivo, refeicaoKey, idx, e.target.value)
                              }
                              placeholder={`Sugestão ${idx + 1} para ${label.toLowerCase()}...`}
                              className="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}

              {/* Botão Salvar Rodapé */}
              <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button
                  onClick={handleSalvarPlanoAlimentar}
                  disabled={isSaving}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Salvando no Neon...' : 'Salvar Plano Alimentar'}
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* ========================================================
          HISTÓRICO DE PLANOS ALIMENTARES
          ======================================================== */}
      {viewMode === 'historico' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Histórico de Planos Salvos ({planos.length})
            </h3>
          </div>

          {planos.length === 0 ? (
            <Card className="p-12 text-center space-y-4">
              <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                <Utensils className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">
                  Nenhum plano alimentar gerado ainda
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  Clique no botão "✨ Gerar Plano com IA" para gerar automaticamente um cardápio semanal adaptado aos objetivos e restrições de {paciente.nome}.
                </p>
              </div>
              <div className="flex justify-center gap-3 pt-2">
                <Button
                  onClick={handleGerarPlanoComIA}
                  disabled={isGenerating}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                  Gerar Primeiro Plano com IA
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleCriarPlanoManual}
                  className="text-xs font-bold"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Criar Manualmente
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {planos.map((plano, idx) => (
                <Card
                  key={plano.id || idx}
                  className="p-5 hover:border-emerald-400 dark:hover:border-emerald-700 transition-all shadow-sm space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                        <Calendar className="w-4 h-4" />
                        <span>Gerado em {formatDateBR(plano.created_at)}</span>
                      </div>
                      {idx === 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                          Mais recente
                        </span>
                      )}
                    </div>

                    {/* Preview resumido */}
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                      Plano alimentar semanal estruturado com opções para os 7 dias da semana.
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedPlanoModal(plano)}
                      className="text-xs"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1 text-slate-500" />
                      Visualizar
                    </Button>

                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleCarregarPlanoDoHistorico(plano)}
                      className="text-xs font-semibold text-emerald-700 dark:text-emerald-300"
                    >
                      <Edit3 className="w-3.5 h-3.5 mr-1" />
                      Editar / Reusar
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          MODAL DE VISUALIZAÇÃO DE PLANO DO HISTÓRICO
          ======================================================== */}
      {selectedPlanoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-150">
            {/* Header da Modal */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Utensils className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Plano Alimentar Semanal
                  </h3>
                  <span className="text-xs text-slate-500">
                    Gerado em {formatDateBR(selectedPlanoModal.created_at)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedPlanoModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Abas dos Dias na Modal */}
            <div className="flex gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto scrollbar-none">
              {DIAS_DA_SEMANA.map((dia) => (
                <button
                  key={dia}
                  type="button"
                  onClick={() => setModalDiaAtivo(dia)}
                  className={cn(
                    'px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap',
                    modalDiaAtivo === dia
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  )}
                >
                  {dia}
                </button>
              ))}
            </div>

            {/* Conteúdo do Dia Selecionado */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {(() => {
                const dia = getModalDiaPlano(selectedPlanoModal.conteudo)
                if (!dia) {
                  return (
                    <pre className="text-xs font-mono p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                      {typeof selectedPlanoModal.conteudo === 'string'
                        ? selectedPlanoModal.conteudo
                        : JSON.stringify(selectedPlanoModal.conteudo, null, 2)}
                    </pre>
                  )
                }

                return (
                  <div className="space-y-3">
                    {(
                      ['cafe_da_manha', 'lanche_manha', 'almoco', 'lanche_tarde', 'jantar'] as const
                    ).map((refeicaoKey) => {
                      const label = REFEICOES_LABELS[refeicaoKey]
                      const options = dia.refeicoes[refeicaoKey] || []
                      return (
                        <div
                          key={refeicaoKey}
                          className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-2"
                        >
                          <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400 block">
                            {label}
                          </span>
                          <ul className="space-y-1 pl-1">
                            {options.map((opt, i) => (
                              <li
                                key={i}
                                className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2"
                              >
                                <span className="text-emerald-600 font-bold">•</span>
                                <span>{opt || '—'}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )
                    })}
                  </div>
                )
              })()}
            </div>

            {/* Rodapé da Modal com Opção de Editar */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleCarregarPlanoDoHistorico(selectedPlanoModal)}
                className="text-xs font-bold"
              >
                <Edit3 className="w-3.5 h-3.5 mr-1" />
                Carregar este Plano para Edição
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedPlanoModal(null)}
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

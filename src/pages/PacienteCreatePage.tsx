import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  User,
  Activity,
  Coffee,
  ArrowLeft,
  Save,
  CheckCircle2,
  AlertCircle,
  Plus,
  Phone,
  Mail,
} from 'lucide-react'
import { useAuth } from '../context/useAuth'
import { AppLayout } from '../components/ui/AppLayout'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { createPaciente } from '../lib/db'
import type { PacienteFormData } from '../types/paciente'
import {
  calculateAge,
  calculateIMC,
  formatPhone,
  formatTimeInput,
} from '../utils/nutrition'

// Constantes de opções
const OBJETIVOS_OPCOES = [
  'Emagrecer',
  'Ganhar massa',
  'Controlar diabetes',
  'Saúde geral',
  'Performance esportiva',
  'Reeducação alimentar',
]

const NIVEIS_ATIVIDADE = [
  'Sedentário',
  'Levemente ativo',
  'Moderadamente ativo',
  'Muito ativo',
  'Extremamente ativo',
]

const PATOLOGIAS_OPCOES = [
  'Diabetes',
  'Hipertensão',
  'Hipotireoidismo',
  'Hipertireoidismo',
  'Síndrome do ovário policístico',
  'Doença celíaca',
  'Colesterol alto',
]

const RESTRICOES_OPCOES = [
  'Lactose',
  'Glúten',
  'Açúcar',
  'Carne vermelha',
  'Frutos do mar',
]

const ALERGIAS_OPCOES = [
  'Amendoim',
  'Leite',
  'Ovo',
  'Soja',
  'Trigo',
  'Frutos do mar',
]

export const PacienteCreatePage: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'pessoal' | 'clinico' | 'habitos'>('pessoal')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Estado do formulário
  const [formData, setFormData] = useState<PacienteFormData>({
    nome: '',
    data_nascimento: '',
    sexo: 'Feminino',
    whatsapp: '',
    email: '',
    peso_inicial: '',
    altura: '',
    objetivos: [],
    objetivo_texto: '',
    nivel_atividade: '',
    patologias: [],
    patologia_custom: '',
    restricoes_alimentares: [],
    restricao_custom: '',
    alergias: [],
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

  // Cálculos dinâmicos
  const idade = calculateAge(formData.data_nascimento)
  const { imc, classificacao, cor: imcCor } = calculateIMC(formData.peso_inicial, formData.altura)

  // Manipuladores de inputs simples
  const handleInputChange = (field: keyof PacienteFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  // Manipulador de WhatsApp com máscara
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value)
    handleInputChange('whatsapp', formatted)
  }

  // Manipulador de horários no blur
  const handleTimeBlur = (field: 'horario_acorda' | 'horario_dorme') => {
    const raw = formData[field]
    if (raw) {
      const formatted = formatTimeInput(raw)
      handleInputChange(field, formatted)
    }
  }

  // Manipulador de seleção múltipla com suporte a opção "Nenhum"
  const toggleMultiSelectWithNenhum = (
    field: 'patologias' | 'restricoes_alimentares' | 'alergias',
    item: string
  ) => {
    setFormData((prev) => {
      const currentList = prev[field]
      if (item === 'Nenhum') {
        // Se clicar em Nenhum, limpa os outros e deixa apenas Nenhum (ou desmarca Nenhum)
        return {
          ...prev,
          [field]: currentList.includes('Nenhum') ? [] : ['Nenhum'],
        }
      } else {
        // Se selecionar outra opção, remove Nenhum se estava marcado
        const withoutNenhum = currentList.filter((x) => x !== 'Nenhum')
        if (withoutNenhum.includes(item)) {
          return { ...prev, [field]: withoutNenhum.filter((x) => x !== item) }
        } else {
          return { ...prev, [field]: [...withoutNenhum, item] }
        }
      }
    })
  }

  // Adicionar item customizado em múltipla escolha
  const handleAddCustomItem = (
    field: 'patologias' | 'restricoes_alimentares' | 'alergias',
    customField: 'patologia_custom' | 'restricao_custom' | 'alergia_custom'
  ) => {
    const text = formData[customField]?.trim()
    if (!text) return

    setFormData((prev) => {
      const listWithoutNenhum = prev[field].filter((x) => x !== 'Nenhum')
      if (!listWithoutNenhum.includes(text)) {
        return {
          ...prev,
          [field]: [...listWithoutNenhum, text],
          [customField]: '',
        }
      }
      return { ...prev, [customField]: '' }
    })
  }

  // Toggle objetivo
  const toggleObjetivo = (obj: string) => {
    setFormData((prev) => {
      const exists = prev.objetivos.includes(obj)
      return {
        ...prev,
        objetivos: exists ? prev.objetivos.filter((x) => x !== obj) : [...prev.objetivos, obj],
      }
    })
  }

  // Submissão do Formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    // Regra: Nome completo é o único campo obrigatório
    if (!formData.nome.trim()) {
      setActiveTab('pessoal')
      setErrorMessage('O campo Nome Completo é obrigatório.')
      return
    }

    if (!user?.id) {
      setErrorMessage('Sessão expirada. Por favor, faça login novamente.')
      return
    }

    setIsSubmitting(true)

    try {
      // Formata dados para envio ao Neon
      const pesoNum = formData.peso_inicial
        ? parseFloat(formData.peso_inicial.replace(',', '.'))
        : null
      const alturaNum = formData.altura
        ? parseFloat(formData.altura.replace(',', '.'))
        : null
      const refeicoesNum = formData.refeicoes_por_dia
        ? parseInt(formData.refeicoes_por_dia, 10)
        : null
      const litrosNum = formData.litros_agua
        ? parseFloat(formData.litros_agua.replace(',', '.'))
        : null

      // Se houver item customizado digitado mas não adicionado pelo botão +, inclui
      const finalPatologias = [...formData.patologias]
      if (formData.patologia_custom.trim() && !finalPatologias.includes(formData.patologia_custom.trim())) {
        finalPatologias.push(formData.patologia_custom.trim())
      }

      const finalRestricoes = [...formData.restricoes_alimentares]
      if (formData.restricao_custom.trim() && !finalRestricoes.includes(formData.restricao_custom.trim())) {
        finalRestricoes.push(formData.restricao_custom.trim())
      }

      const finalAlergias = [...formData.alergias]
      if (formData.alergia_custom.trim() && !finalAlergias.includes(formData.alergia_custom.trim())) {
        finalAlergias.push(formData.alergia_custom.trim())
      }

      const novoPaciente = await createPaciente({
        nutricionista_id: user.id,
        nome: formData.nome.trim(),
        data_nascimento: formData.data_nascimento || null,
        sexo: formData.sexo || null,
        whatsapp: formData.whatsapp.trim() || null,
        email: formData.email.trim() || null,
        peso_inicial: isNaN(pesoNum as number) ? null : pesoNum,
        altura: isNaN(alturaNum as number) ? null : alturaNum,
        objetivos: formData.objetivos,
        objetivo_texto: formData.objetivo_texto.trim() || null,
        nivel_atividade: formData.nivel_atividade || null,
        patologias: finalPatologias,
        restricoes_alimentares: finalRestricoes,
        alergias: finalAlergias,
        medicamentos: formData.medicamentos.trim() || null,
        suplementos: formData.suplementos.trim() || null,
        refeicoes_por_dia: isNaN(refeicoesNum as number) ? null : refeicoesNum,
        horario_acorda: formData.horario_acorda.trim() || null,
        horario_dorme: formData.horario_dorme.trim() || null,
        litros_agua: isNaN(litrosNum as number) ? null : litrosNum,
        atividade_fisica: formData.atividade_fisica,
        atividade_fisica_descricao: formData.atividade_fisica
          ? formData.atividade_fisica_descricao.trim() || null
          : null,
        observacoes: formData.observacoes.trim() || null,
      })

      setSuccessMessage('Paciente cadastrado com sucesso!')

      // Redireciona para o perfil do paciente recém-cadastrado
      setTimeout(() => {
        navigate(`/pacientes/${novoPaciente.id}`, {
          state: { message: 'Paciente cadastrado com sucesso!' },
        })
      }, 1000)
    } catch (err: any) {
      console.error('Erro ao cadastrar paciente:', err)
      setErrorMessage(
        err.message || 'Ocorreu um erro ao cadastrar o paciente no Neon. Tente novamente.'
      )
      setIsSubmitting(false)
    }
  }

  return (
    <AppLayout activeMenu="pacientes">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Header com Voltar */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/pacientes')}
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-emerald-700 font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar para lista de pacientes</span>
          </button>
        </div>

        {/* Título */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Cadastro de Novo Paciente
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Preencha os dados pessoais, clínicos e hábitos alimentares do seu paciente.
          </p>
        </div>

        {/* Notificações de Sucesso ou Erro */}
        {successMessage && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-3 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-medium">{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-3 animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <span className="font-medium">{errorMessage}</span>
          </div>
        )}

        {/* Navegação por Abas (Pessoal, Clínico, Hábitos) */}
        <div className="flex border-b border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('pessoal')}
            className={`flex items-center gap-2.5 px-6 py-3.5 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'pessoal'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <User className="w-4 h-4" />
            <span>1. Pessoal</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('clinico')}
            className={`flex items-center gap-2.5 px-6 py-3.5 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'clinico'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>2. Clínico</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('habitos')}
            className={`flex items-center gap-2.5 px-6 py-3.5 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'habitos'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <Coffee className="w-4 h-4" />
            <span>3. Hábitos</span>
          </button>
        </div>

        {/* Formulário Principal */}
        <form onSubmit={handleSubmit}>
          <Card className="p-6 sm:p-8 space-y-6">
            {/* ======================================================== */}
            {/* ABA 1: PESSOAL */}
            {/* ======================================================== */}
            {activeTab === 'pessoal' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="border-b border-slate-100 pb-3">
                  <h2 className="text-base font-bold text-slate-800">
                    Dados Pessoais do Paciente
                  </h2>
                  <p className="text-xs text-slate-500">
                    Identificação básica e dados de contato.
                  </p>
                </div>

                {/* Nome Completo (Obrigatório) */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-slate-700">
                    Nome completo <span className="text-emerald-600 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nome}
                    onChange={(e) => handleInputChange('nome', e.target.value)}
                    placeholder="Ex: Maria Eduarda Silva"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-3 focus:ring-emerald-500/10 outline-none transition-all"
                  />
                  <p className="text-xs text-slate-400">
                    Único campo de preenchimento obrigatório.
                  </p>
                </div>

                {/* Data de Nascimento & Idade Calculada */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-slate-700">
                      Data de nascimento
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={formData.data_nascimento}
                        onChange={(e) => handleInputChange('data_nascimento', e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:ring-3 focus:ring-emerald-500/10 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-slate-700">
                      Idade (calculada automaticamente)
                    </label>
                    <div className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700 flex items-center justify-between">
                      <span className="font-semibold">
                        {idade !== null ? `${idade} anos` : 'Aguardando data'}
                      </span>
                      {idade !== null && (
                        <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-medium">
                          Calculado
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sexo */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    Sexo
                  </label>
                  <div className="flex flex-wrap gap-4">
                    {['Feminino', 'Masculino', 'Outro'].map((opcao) => (
                      <label
                        key={opcao}
                        className={`inline-flex items-center gap-2.5 px-4 py-2 rounded-xl border cursor-pointer text-sm font-medium transition-all ${
                          formData.sexo === opcao
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="sexo"
                          value={opcao}
                          checked={formData.sexo === opcao}
                          onChange={(e) => handleInputChange('sexo', e.target.value)}
                          className="accent-emerald-600"
                        />
                        <span>{opcao}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* WhatsApp & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <span>WhatsApp</span>
                    </label>
                    <input
                      type="text"
                      value={formData.whatsapp}
                      onChange={handlePhoneChange}
                      placeholder="(99) 99999-9999"
                      maxLength={15}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-3 focus:ring-emerald-500/10 outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <span>Email</span>
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="paciente@exemplo.com"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-3 focus:ring-emerald-500/10 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button
                    type="button"
                    onClick={() => setActiveTab('clinico')}
                    variant="primary"
                  >
                    Avançar para Clínico →
                  </Button>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* ABA 2: CLÍNICO */}
            {/* ======================================================== */}
            {activeTab === 'clinico' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="border-b border-slate-100 pb-3">
                  <h2 className="text-base font-bold text-slate-800">
                    Dados Clínicos & Antropometria
                  </h2>
                  <p className="text-xs text-slate-500">
                    Medidas corporais, metas de saúde, patologias e alergias.
                  </p>
                </div>

                {/* Peso, Altura e IMC Automático */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Peso */}
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-slate-700">
                      Peso atual
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={formData.peso_inicial}
                        onChange={(e) => handleInputChange('peso_inicial', e.target.value)}
                        placeholder="Ex: 72.5"
                        className="w-full rounded-xl border border-slate-200 bg-white pl-3.5 pr-12 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-3 focus:ring-emerald-500/10 outline-none transition-all"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                        kg
                      </span>
                    </div>
                  </div>

                  {/* Altura */}
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-slate-700">
                      Altura
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={formData.altura}
                        onChange={(e) => handleInputChange('altura', e.target.value)}
                        placeholder="Ex: 175"
                        className="w-full rounded-xl border border-slate-200 bg-white pl-3.5 pr-12 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-3 focus:ring-emerald-500/10 outline-none transition-all"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                        cm
                      </span>
                    </div>
                  </div>

                  {/* IMC Somente Leitura */}
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-slate-700 flex items-center justify-between">
                      <span>IMC</span>
                      <span className="text-[11px] text-slate-400 font-normal">Somente leitura</span>
                    </label>
                    <div
                      className={`w-full rounded-xl border px-3.5 py-2 text-sm flex items-center justify-between ${
                        imc ? imcCor : 'bg-slate-50 border-slate-200 text-slate-500'
                      }`}
                    >
                      <span className="font-extrabold text-base">
                        {imc ? `${imc} kg/m²` : '—'}
                      </span>
                      {classificacao && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-white/70 shadow-2xs">
                          {classificacao}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Objetivo (Múltipla Escolha + Campo de Texto Livre Adicional) */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    Objetivo(s) principal(is)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {OBJETIVOS_OPCOES.map((obj) => {
                      const isSelected = formData.objetivos.includes(obj)
                      return (
                        <button
                          key={obj}
                          type="button"
                          onClick={() => toggleObjetivo(obj)}
                          className={`text-left px-3.5 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                            isSelected
                              ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {isSelected ? '✓ ' : '+ '}
                          {obj}
                        </button>
                      )
                    })}
                  </div>

                  <input
                    type="text"
                    value={formData.objetivo_texto}
                    onChange={(e) => handleInputChange('objetivo_texto', e.target.value)}
                    placeholder="Outro objetivo específico ou detalhes adicionais..."
                    className="w-full mt-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-3 focus:ring-emerald-500/10 outline-none transition-all"
                  />
                </div>

                {/* Nível de Atividade Física (Seleção Única) */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    Nível de atividade física
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {NIVEIS_ATIVIDADE.map((nivel) => (
                      <label
                        key={nivel}
                        className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border cursor-pointer text-xs font-semibold transition-all ${
                          formData.nivel_atividade === nivel
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="nivel_atividade"
                          value={nivel}
                          checked={formData.nivel_atividade === nivel}
                          onChange={(e) => handleInputChange('nivel_atividade', e.target.value)}
                          className="accent-emerald-600"
                        />
                        <span>{nivel}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Patologias ou Condições de Saúde */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    Patologias ou condições de saúde
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['Nenhum', ...PATOLOGIAS_OPCOES].map((pat) => {
                      const isSelected = formData.patologias.includes(pat)
                      return (
                        <button
                          key={pat}
                          type="button"
                          onClick={() => toggleMultiSelectWithNenhum('patologias', pat)}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                            isSelected
                              ? pat === 'Nenhum'
                                ? 'bg-slate-700 border-slate-700 text-white'
                                : 'bg-emerald-600 border-emerald-600 text-white shadow-2xs'
                              : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          {isSelected ? '✓ ' : ''}
                          {pat}
                        </button>
                      )
                    })}
                  </div>

                  <div className="flex gap-2 mt-2">
                    <input
                      type="text"
                      value={formData.patologia_custom}
                      onChange={(e) => handleInputChange('patologia_custom', e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddCustomItem('patologias', 'patologia_custom')
                        }
                      }}
                      placeholder="Adicionar outra patologia..."
                      className="flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 outline-none"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddCustomItem('patologias', 'patologia_custom')}
                      leftIcon={<Plus className="w-3.5 h-3.5" />}
                    >
                      Adicionar
                    </Button>
                  </div>
                </div>

                {/* Restrições Alimentares */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    Restrições alimentares
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['Nenhum', ...RESTRICOES_OPCOES].map((rest) => {
                      const isSelected = formData.restricoes_alimentares.includes(rest)
                      return (
                        <button
                          key={rest}
                          type="button"
                          onClick={() => toggleMultiSelectWithNenhum('restricoes_alimentares', rest)}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                            isSelected
                              ? rest === 'Nenhum'
                                ? 'bg-slate-700 border-slate-700 text-white'
                                : 'bg-emerald-600 border-emerald-600 text-white shadow-2xs'
                              : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          {isSelected ? '✓ ' : ''}
                          {rest}
                        </button>
                      )
                    })}
                  </div>

                  <div className="flex gap-2 mt-2">
                    <input
                      type="text"
                      value={formData.restricao_custom}
                      onChange={(e) => handleInputChange('restricao_custom', e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddCustomItem('restricoes_alimentares', 'restricao_custom')
                        }
                      }}
                      placeholder="Adicionar outra restrição alimentar..."
                      className="flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 outline-none"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleAddCustomItem('restricoes_alimentares', 'restricao_custom')
                      }
                      leftIcon={<Plus className="w-3.5 h-3.5" />}
                    >
                      Adicionar
                    </Button>
                  </div>
                </div>

                {/* Alergias Alimentares */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    Alergias alimentares
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['Nenhum', ...ALERGIAS_OPCOES].map((alerg) => {
                      const isSelected = formData.alergias.includes(alerg)
                      return (
                        <button
                          key={alerg}
                          type="button"
                          onClick={() => toggleMultiSelectWithNenhum('alergias', alerg)}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                            isSelected
                              ? alerg === 'Nenhum'
                                ? 'bg-slate-700 border-slate-700 text-white'
                                : 'bg-emerald-600 border-emerald-600 text-white shadow-2xs'
                              : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          {isSelected ? '✓ ' : ''}
                          {alerg}
                        </button>
                      )
                    })}
                  </div>

                  <div className="flex gap-2 mt-2">
                    <input
                      type="text"
                      value={formData.alergia_custom}
                      onChange={(e) => handleInputChange('alergia_custom', e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddCustomItem('alergias', 'alergia_custom')
                        }
                      }}
                      placeholder="Adicionar outra alergia alimentar..."
                      className="flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 outline-none"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddCustomItem('alergias', 'alergia_custom')}
                      leftIcon={<Plus className="w-3.5 h-3.5" />}
                    >
                      Adicionar
                    </Button>
                  </div>
                </div>

                {/* Medicamentos contínuos & Suplementos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-slate-700">
                      Medicamentos contínuos
                    </label>
                    <textarea
                      rows={2}
                      value={formData.medicamentos}
                      onChange={(e) => handleInputChange('medicamentos', e.target.value)}
                      placeholder="Ex: Levotiroxina 50mcg em jejum..."
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 outline-none transition-all resize-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-slate-700">
                      Suplementos em uso
                    </label>
                    <textarea
                      rows={2}
                      value={formData.suplementos}
                      onChange={(e) => handleInputChange('suplementos', e.target.value)}
                      placeholder="Ex: Whey protein, Creatina 5g, Vitamina D..."
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 outline-none transition-all resize-none"
                    />
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveTab('pessoal')}
                  >
                    ← Voltar para Pessoal
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    onClick={() => setActiveTab('habitos')}
                  >
                    Avançar para Hábitos →
                  </Button>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* ABA 3: HÁBITOS */}
            {/* ======================================================== */}
            {activeTab === 'habitos' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="border-b border-slate-100 pb-3">
                  <h2 className="text-base font-bold text-slate-800">
                    Hábitos Diários & Rotina
                  </h2>
                  <p className="text-xs text-slate-500">
                    Rotina de sono, hidratação, exercícios físicos e refeições diárias.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Refeições por dia */}
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-slate-700">
                      Refeições / dia
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={12}
                      value={formData.refeicoes_por_dia}
                      onChange={(e) => handleInputChange('refeicoes_por_dia', e.target.value)}
                      placeholder="Ex: 4"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 outline-none transition-all"
                    />
                  </div>

                  {/* Horário que acorda */}
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-slate-700">
                      Horário acorda
                    </label>
                    <input
                      type="text"
                      value={formData.horario_acorda}
                      onChange={(e) => handleInputChange('horario_acorda', e.target.value)}
                      onBlur={() => handleTimeBlur('horario_acorda')}
                      placeholder="Ex: 6 ou 06:30"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 outline-none transition-all"
                    />
                    <p className="text-[11px] text-slate-400">Ex: 6 → 06:00, 630 → 06:30</p>
                  </div>

                  {/* Horário que dorme */}
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-slate-700">
                      Horário dorme
                    </label>
                    <input
                      type="text"
                      value={formData.horario_dorme}
                      onChange={(e) => handleInputChange('horario_dorme', e.target.value)}
                      onBlur={() => handleTimeBlur('horario_dorme')}
                      placeholder="Ex: 23 ou 22:30"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 outline-none transition-all"
                    />
                    <p className="text-[11px] text-slate-400">Ex: 23 → 23:00, 2230 → 22:30</p>
                  </div>

                  {/* Água por dia */}
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-slate-700">
                      Água / dia
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={formData.litros_agua}
                        onChange={(e) => handleInputChange('litros_agua', e.target.value)}
                        placeholder="Ex: 2.5"
                        className="w-full rounded-xl border border-slate-200 bg-white pl-3.5 pr-14 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 outline-none transition-all"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                        litros
                      </span>
                    </div>
                  </div>
                </div>

                {/* Pratica atividade física (Sim/Não) */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-semibold text-slate-800">
                        Pratica atividade física?
                      </span>
                      <p className="text-xs text-slate-500">
                        Indique se o paciente realiza exercícios rotineiramente.
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleInputChange('atividade_fisica', false)}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          !formData.atividade_fisica
                            ? 'bg-slate-700 text-white shadow-2xs'
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        Não
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInputChange('atividade_fisica', true)}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          formData.atividade_fisica
                            ? 'bg-emerald-600 text-white shadow-2xs'
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        Sim
                      </button>
                    </div>
                  </div>

                  {formData.atividade_fisica && (
                    <div className="pt-2 animate-in fade-in duration-150">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Qual atividade e frequência semanal?
                      </label>
                      <input
                        type="text"
                        value={formData.atividade_fisica_descricao}
                        onChange={(e) =>
                          handleInputChange('atividade_fisica_descricao', e.target.value)
                        }
                        placeholder="Ex: Musculação 4x na semana + Corrida aos sábados"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 outline-none transition-all"
                      />
                    </div>
                  )}
                </div>

                {/* Observações Gerais */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-slate-700">
                    Observações gerais
                  </label>
                  <textarea
                    rows={4}
                    value={formData.observacoes}
                    onChange={(e) => handleInputChange('observacoes', e.target.value)}
                    placeholder="Anotações adicionais, preferências, aversões ou contexto relevante..."
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 outline-none transition-all"
                  />
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveTab('clinico')}
                  >
                    ← Voltar para Clínico
                  </Button>

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    isLoading={isSubmitting}
                    leftIcon={<Save className="w-4 h-4" />}
                  >
                    Salvar Paciente
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </form>
      </div>
    </AppLayout>
  )
}

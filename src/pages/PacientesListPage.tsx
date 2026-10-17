import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Users,
  UserPlus,
  Search,
  Calendar,
  Target,
  ArrowRight,
  AlertCircle,
} from 'lucide-react'
import { useAuth } from '../context/useAuth'
import { AppLayout } from '../components/ui/AppLayout'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { getPacientesByNutricionista } from '../lib/db'
import type { Paciente } from '../types/paciente'
import { formatDateBR } from '../utils/nutrition'

export const PacientesListPage: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const fetchPacientes = async () => {
    if (!user?.id) return
    setIsLoading(true)
    setErrorMessage('')
    try {
      const data = await getPacientesByNutricionista(user.id)
      setPacientes(data)
    } catch (err) {
      console.error('Falha ao carregar pacientes:', err)
      setErrorMessage('Não foi possível carregar a lista de pacientes. Verifique sua conexão.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPacientes()
  }, [user?.id])

  // Filtragem local por nome do paciente
  const filteredPacientes = pacientes.filter((p) =>
    p.nome.toLowerCase().includes(searchTerm.trim().toLowerCase())
  )

  return (
    <AppLayout activeMenu="pacientes">
      <div className="space-y-6">
        {/* Cabeçalho da Seção */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
              <Users className="w-7 h-7 text-emerald-600" />
              Pacientes
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Gerencie seus pacientes cadastrados, histórico clínico e planos alimentares.
            </p>
          </div>

          <Button
            onClick={() => navigate('/pacientes/novo')}
            leftIcon={<UserPlus className="w-4 h-4" />}
            size="md"
            className="shadow-sm hover:shadow-emerald-600/20"
          >
            Novo Paciente
          </Button>
        </div>

        {/* Barra de Pesquisa */}
        <Card className="p-3 sm:p-4 border-slate-200">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar paciente por nome completo..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-emerald-500 rounded-xl outline-none transition-all placeholder:text-slate-400 focus:ring-3 focus:ring-emerald-500/10"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 bg-slate-200/60 hover:bg-slate-200 px-2 py-0.5 rounded-md"
              >
                Limpar
              </button>
            )}
          </div>
        </Card>

        {/* Mensagem de Erro */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
            <span className="flex-1">{errorMessage}</span>
            <Button variant="outline" size="sm" onClick={fetchPacientes} className="text-xs">
              Tentar novamente
            </Button>
          </div>
        )}

        {/* Estado de Carregamento */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
            <p className="text-sm font-medium">Buscando pacientes no Neon...</p>
          </div>
        ) : pacientes.length === 0 ? (
          /* Estado Vazio: Nenhum paciente cadastrado ainda */
          <Card className="p-12 text-center border-dashed border-2 border-slate-300 bg-white/60">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 stroke-[1.8]" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">
              Nenhum paciente cadastrado ainda
            </h3>
            <p className="text-sm text-slate-500 mt-1.5 max-w-sm mx-auto">
              Comece agora registrando os dados do seu primeiro paciente para acompanhar consultas e planos alimentares.
            </p>
            <div className="mt-6">
              <Button
                onClick={() => navigate('/pacientes/novo')}
                leftIcon={<UserPlus className="w-4 h-4" />}
                size="md"
              >
                Cadastrar Primeiro Paciente
              </Button>
            </div>
          </Card>
        ) : filteredPacientes.length === 0 ? (
          /* Nenhum resultado para a busca */
          <Card className="p-12 text-center border-slate-200">
            <Search className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-base font-semibold text-slate-700">
              Nenhum paciente encontrado para "{searchTerm}"
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Verifique a digitação ou limpe a busca para ver todos os pacientes.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSearchTerm('')}
              className="mt-4"
            >
              Ver todos os pacientes
            </Button>
          </Card>
        ) : (
          /* Lista de Pacientes */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPacientes.map((paciente) => {
              // Objetivos formatados
              const objetivosList = [
                ...(paciente.objetivos || []),
                paciente.objetivo_texto,
              ].filter(Boolean)
              const objetivoExibicao =
                objetivosList.length > 0 ? objetivosList.join(', ') : 'Não informado'

              return (
                <Link
                  key={paciente.id}
                  to={`/pacientes/${paciente.id}`}
                  className="group block focus:outline-none"
                >
                  <Card className="p-5 h-full flex flex-col justify-between border-slate-200/90 hover:border-emerald-500/50 hover:shadow-md transition-all group-hover:-translate-y-0.5">
                    <div className="space-y-3">
                      {/* Topo do Card com Nome e Avatar */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center shrink-0 text-sm group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                            {paciente.nome.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
                              {paciente.nome}
                            </h3>
                            <span className="text-xs text-slate-400">
                              {paciente.whatsapp || paciente.email || 'Sem contato'}
                            </span>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all shrink-0 mt-1" />
                      </div>

                      {/* Informações: Objetivo */}
                      <div className="pt-2 border-t border-slate-100 space-y-2">
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          <Target className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="font-semibold text-slate-700">Objetivo:</span>
                          <span className="truncate text-slate-600" title={objetivoExibicao}>
                            {objetivoExibicao}
                          </span>
                        </div>

                        {/* Data da Última Consulta */}
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          <Calendar className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                          <span className="font-semibold text-slate-700">Última consulta:</span>
                          <span className="text-slate-600">
                            {paciente.ultima_consulta
                              ? formatDateBR(paciente.ultima_consulta)
                              : 'Nenhuma consulta ainda'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Rodapé do Card */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Ver perfil completo</span>
                      <span className="text-emerald-600 font-medium group-hover:underline">
                        Acessar →
                      </span>
                    </div>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </AppLayout>
  )
}

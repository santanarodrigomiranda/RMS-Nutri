export interface Consulta {
  id: string
  paciente_id: string
  nutricionista_id?: string
  data_consulta: string
  peso?: number | null
  cintura?: number | null
  quadril?: number | null
  percentual_gordura?: number | null
  gordura_percentual?: number | null
  observacoes?: string | null
  proximo_retorno?: string | null
  created_at?: string
}

export interface RefeicoesDia {
  cafe_da_manha: string[]
  lanche_manha: string[]
  almoco: string[]
  lanche_tarde: string[]
  jantar: string[]
}

export interface DiaPlano {
  dia: string
  refeicoes: RefeicoesDia
}

export interface PlanoSemanalConteudo {
  plano_semanal: DiaPlano[]
}

export interface PlanoAlimentar {
  id: string
  paciente_id: string
  nutricionista_id?: string
  conteudo: PlanoSemanalConteudo | string | any
  created_at: string
}

export interface Paciente {
  id: string
  nutricionista_id: string
  nome: string
  data_nascimento?: Date | string | null
  sexo?: string | null
  whatsapp?: string | null
  email?: string | null
  peso_inicial?: number | null
  altura?: number | null
  objetivos?: string[] | null
  objetivo_texto?: string | null
  nivel_atividade?: string | null
  patologias?: string[] | null
  restricoes_alimentares?: string[] | null
  alergias?: string[] | null
  medicamentos?: string | null
  suplementos?: string | null
  refeicoes_por_dia?: number | null
  horario_acorda?: string | null
  horario_dorme?: string | null
  litros_agua?: number | null
  atividade_fisica?: boolean | null
  atividade_fisica_descricao?: string | null
  observacoes?: string | null
  created_at?: Date | string
  // Dados derivados ou agregados
  ultima_consulta?: Date | string | null
}

export interface PacienteFormData {
  nome: string
  data_nascimento: string
  sexo: string
  whatsapp: string
  email: string
  // Clínico
  peso_inicial: string
  altura: string
  objetivos: string[]
  objetivo_texto: string
  nivel_atividade: string
  patologias: string[]
  patologia_custom: string
  restricoes_alimentares: string[]
  restricao_custom: string
  alergias: string[]
  alergia_custom: string
  medicamentos: string
  suplementos: string
  // Hábitos
  refeicoes_por_dia: string
  horario_acorda: string
  horario_dorme: string
  litros_agua: string
  atividade_fisica: boolean
  atividade_fisica_descricao: string
  observacoes: string
}

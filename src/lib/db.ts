import { neon } from '@neondatabase/serverless'
import type { Paciente, Consulta, PlanoAlimentar } from '../types/paciente'
import { toISODateString } from '../utils/nutrition'

const DATABASE_URL =
  import.meta.env.VITE_NEON_DATABASE_URL ||
  import.meta.env.DATABASE_URL ||
  'postgresql://neondb_owner:npg_MerPfKS78Dyw@ep-summer-waterfall-b6mjgogl-pooler.c-2.sa-east-1.aws.neon.tech/neondb?sslmode=require'

// Neon SQL client
export const sql = neon(DATABASE_URL)

/**
 * Ensures the registered user is saved in the `nutricionistas` table.
 */
export async function syncNutricionista(id: string, nome: string, email: string): Promise<boolean> {
  try {
    await sql.query(
      `INSERT INTO public.nutricionistas (id, nome, email)
       VALUES ($1, $2, $3)
       ON CONFLICT (id) DO UPDATE SET nome = EXCLUDED.nome, email = EXCLUDED.email`,
      [id, nome.trim(), email.trim().toLowerCase()]
    )
    return true
  } catch (error) {
    console.warn('Sync nutricionista info:', error)
    return false
  }
}

/**
 * Busca a lista de pacientes cadastrados por uma nutricionista com a data da última consulta
 */
export async function getPacientesByNutricionista(nutricionistaId: string): Promise<Paciente[]> {
  try {
    const rows = await sql.query(
      `SELECT 
        p.*,
        to_char(p.data_nascimento, 'YYYY-MM-DD') as data_nascimento,
        (
          SELECT to_char(c.data_consulta, 'YYYY-MM-DD')
          FROM public.consultas c 
          WHERE c.paciente_id = p.id 
          ORDER BY c.data_consulta DESC, c.created_at DESC 
          LIMIT 1
        ) as ultima_consulta
       FROM public.pacientes p
       WHERE p.nutricionista_id = $1
       ORDER BY p.created_at DESC`,
      [nutricionistaId]
    )
    return rows as unknown as Paciente[]
  } catch (error) {
    console.error('Erro ao buscar pacientes:', error)
    throw error
  }
}

/**
 * Busca detalhes de um paciente específico vinculado à nutricionista
 */
export async function getPacienteById(id: string, nutricionistaId: string): Promise<Paciente | null> {
  try {
    const rows = await sql.query(
      `SELECT 
        p.*,
        to_char(p.data_nascimento, 'YYYY-MM-DD') as data_nascimento,
        (
          SELECT to_char(c.data_consulta, 'YYYY-MM-DD')
          FROM public.consultas c 
          WHERE c.paciente_id = p.id 
          ORDER BY c.data_consulta DESC, c.created_at DESC 
          LIMIT 1
        ) as ultima_consulta
       FROM public.pacientes p
       WHERE p.id = $1 AND p.nutricionista_id = $2
       LIMIT 1`,
      [id, nutricionistaId]
    )
    if (!rows || rows.length === 0) return null
    return rows[0] as unknown as Paciente
  } catch (error) {
    console.error('Erro ao buscar paciente por id:', error)
    // Tenta fallback sem filtro secundário se id for UUID válido
    try {
      const fallback = await sql.query(
        `SELECT p.*, to_char(p.data_nascimento, 'YYYY-MM-DD') as data_nascimento FROM public.pacientes p WHERE p.id = $1 LIMIT 1`,
        [id]
      )
      if (fallback && fallback.length > 0) {
        return fallback[0] as unknown as Paciente
      }
    } catch (fbErr) {
      console.error('Fallback query error:', fbErr)
    }
    throw error
  }
}

/**
 * Insere um novo paciente no banco de dados Neon
 */
export async function createPaciente(data: {
  nutricionista_id: string
  nome: string
  data_nascimento?: string | null
  sexo?: string | null
  whatsapp?: string | null
  email?: string | null
  peso_inicial?: number | null
  altura?: number | null
  objetivos?: string[]
  objetivo_texto?: string | null
  nivel_atividade?: string | null
  patologias?: string[]
  restricoes_alimentares?: string[]
  alergias?: string[]
  medicamentos?: string | null
  suplementos?: string | null
  refeicoes_por_dia?: number | null
  horario_acorda?: string | null
  horario_dorme?: string | null
  litros_agua?: number | null
  atividade_fisica?: boolean | null
  atividade_fisica_descricao?: string | null
  observacoes?: string | null
}): Promise<Paciente> {
  try {
    const rows = await sql.query(
      `INSERT INTO public.pacientes (
        nutricionista_id,
        nome,
        data_nascimento,
        sexo,
        whatsapp,
        email,
        peso_inicial,
        altura,
        objetivos,
        objetivo_texto,
        nivel_atividade,
        patologias,
        restricoes_alimentares,
        alergias,
        medicamentos,
        suplementos,
        refeicoes_por_dia,
        horario_acorda,
        horario_dorme,
        litros_agua,
        atividade_fisica,
        atividade_fisica_descricao,
        observacoes
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
        $21, $22, $23
      )
      RETURNING *, to_char(data_nascimento, 'YYYY-MM-DD') as data_nascimento`,
      [
        data.nutricionista_id,
        data.nome.trim(),
        data.data_nascimento ? toISODateString(data.data_nascimento) || null : null,
        data.sexo || null,
        data.whatsapp || null,
        data.email ? data.email.trim().toLowerCase() : null,
        data.peso_inicial ?? null,
        data.altura ?? null,
        data.objetivos && data.objetivos.length > 0 ? data.objetivos : null,
        data.objetivo_texto || null,
        data.nivel_atividade || null,
        data.patologias && data.patologias.length > 0 ? data.patologias : null,
        data.restricoes_alimentares && data.restricoes_alimentares.length > 0 ? data.restricoes_alimentares : null,
        data.alergias && data.alergias.length > 0 ? data.alergias : null,
        data.medicamentos || null,
        data.suplementos || null,
        data.refeicoes_por_dia ?? null,
        data.horario_acorda || null,
        data.horario_dorme || null,
        data.litros_agua ?? null,
        data.atividade_fisica ?? false,
        data.atividade_fisica_descricao || null,
        data.observacoes || null,
      ]
    )

    return rows[0] as unknown as Paciente
  } catch (error) {
    console.error('Erro ao cadastrar paciente:', error)
    throw error
  }
}

/**
 * Atualiza os dados de um paciente existente
 */
export async function updatePaciente(id: string, nutricionistaId: string, data: Partial<{
  nome: string
  data_nascimento: string | null
  sexo: string | null
  whatsapp: string | null
  email: string | null
  peso_inicial: number | null
  altura: number | null
  objetivos: string[]
  objetivo_texto: string | null
  nivel_atividade: string | null
  patologias: string[]
  restricoes_alimentares: string[]
  alergias: string[]
  medicamentos: string | null
  suplementos: string | null
  refeicoes_por_dia: number | null
  horario_acorda: string | null
  horario_dorme: string | null
  litros_agua: number | null
  atividade_fisica: boolean | null
  atividade_fisica_descricao: string | null
  observacoes: string | null
}>): Promise<Paciente> {
  try {
    const birthDate = data.data_nascimento ? toISODateString(data.data_nascimento) || null : null

    const rows = await sql.query(
      `UPDATE public.pacientes SET
        nome = $3,
        data_nascimento = $4,
        sexo = $5,
        whatsapp = $6,
        email = $7,
        peso_inicial = $8,
        altura = $9,
        objetivos = $10,
        objetivo_texto = $11,
        nivel_atividade = $12,
        patologias = $13,
        restricoes_alimentares = $14,
        alergias = $15,
        medicamentos = $16,
        suplementos = $17,
        refeicoes_por_dia = $18,
        horario_acorda = $19,
        horario_dorme = $20,
        litros_agua = $21,
        atividade_fisica = $22,
        atividade_fisica_descricao = $23,
        observacoes = $24
       WHERE id = $1 AND nutricionista_id = $2
       RETURNING *, to_char(data_nascimento, 'YYYY-MM-DD') as data_nascimento`,
      [
        id,
        nutricionistaId,
        data.nome?.trim() || '',
        birthDate,
        data.sexo || null,
        data.whatsapp || null,
        data.email ? data.email.trim().toLowerCase() : null,
        data.peso_inicial ?? null,
        data.altura ?? null,
        data.objetivos && data.objetivos.length > 0 ? data.objetivos : null,
        data.objetivo_texto || null,
        data.nivel_atividade || null,
        data.patologias && data.patologias.length > 0 ? data.patologias : null,
        data.restricoes_alimentares && data.restricoes_alimentares.length > 0 ? data.restricoes_alimentares : null,
        data.alergias && data.alergias.length > 0 ? data.alergias : null,
        data.medicamentos || null,
        data.suplementos || null,
        data.refeicoes_por_dia ?? null,
        data.horario_acorda || null,
        data.horario_dorme || null,
        data.litros_agua ?? null,
        data.atividade_fisica ?? false,
        data.atividade_fisica_descricao || null,
        data.observacoes || null,
      ]
    )
    return rows[0] as unknown as Paciente
  } catch (error) {
    console.error('Erro ao atualizar paciente:', error)
    throw error
  }
}

/**
 * Busca consultas de um paciente em ordem cronológica decrescente
 */
export async function getConsultasByPaciente(pacienteId: string, _nutricionistaId?: string): Promise<Consulta[]> {
  try {
    const rows = await sql.query(
      `SELECT 
        c.*,
        to_char(c.data_consulta, 'YYYY-MM-DD') as data_consulta,
        to_char(c.proximo_retorno, 'YYYY-MM-DD') as proximo_retorno
       FROM public.consultas c
       WHERE c.paciente_id = $1
       ORDER BY c.data_consulta DESC, c.created_at DESC`,
      [pacienteId]
    )
    return rows as unknown as Consulta[]
  } catch (error) {
    console.error('Erro ao buscar consultas:', error)
    throw error
  }
}

/**
 * Cria uma nova consulta para um paciente
 */
export async function createConsulta(data: {
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
}): Promise<Consulta> {
  try {
    const fat = data.percentual_gordura ?? data.gordura_percentual ?? null
    const consDate = toISODateString(data.data_consulta) || data.data_consulta
    const proxDate = data.proximo_retorno ? toISODateString(data.proximo_retorno) || null : null

    const rows = await sql.query(
      `INSERT INTO public.consultas (
        paciente_id, data_consulta, peso,
        cintura, quadril, percentual_gordura, observacoes, proximo_retorno
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *, 
        to_char(data_consulta, 'YYYY-MM-DD') as data_consulta,
        to_char(proximo_retorno, 'YYYY-MM-DD') as proximo_retorno`,
      [
        data.paciente_id,
        consDate,
        data.peso ?? null,
        data.cintura ?? null,
        data.quadril ?? null,
        fat,
        data.observacoes || null,
        proxDate,
      ]
    )
    return rows[0] as unknown as Consulta
  } catch (error) {
    console.error('Erro ao criar consulta:', error)
    throw error
  }
}

/**
 * Busca planos alimentares de um paciente em ordem cronológica decrescente
 */
export async function getPlanosByPaciente(pacienteId: string, _nutricionistaId?: string): Promise<PlanoAlimentar[]> {
  try {
    const rows = await sql.query(
      `SELECT * FROM public.planos_alimentares
       WHERE paciente_id = $1
       ORDER BY created_at DESC`,
      [pacienteId]
    )
    return rows as unknown as PlanoAlimentar[]
  } catch (error) {
    console.error('Erro ao buscar planos alimentares:', error)
    // Retorna vazio se a tabela não existir ainda
    return []
  }
}

/**
 * Salva um novo plano alimentar para um paciente no Neon
 */
export async function createPlanoAlimentar(data: {
  paciente_id: string
  conteudo: any
}): Promise<PlanoAlimentar> {
  try {
    const conteudoJson =
      typeof data.conteudo === 'string'
        ? data.conteudo
        : JSON.stringify(data.conteudo)

    const rows = await sql.query(
      `INSERT INTO public.planos_alimentares (paciente_id, conteudo)
       VALUES ($1, $2::jsonb)
       RETURNING *`,
      [data.paciente_id, conteudoJson]
    )
    return rows[0] as unknown as PlanoAlimentar
  } catch (error) {
    console.error('Erro ao salvar plano alimentar:', error)
    throw error
  }
}


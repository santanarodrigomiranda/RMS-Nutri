import { neon } from '@neondatabase/serverless'
import type { Paciente } from '../types/paciente'

const DATABASE_URL =
  import.meta.env.VITE_NEON_DATABASE_URL ||
  import.meta.env.DATABASE_URL ||
  ''

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
        `SELECT p.* FROM public.pacientes p WHERE p.id = $1 LIMIT 1`,
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
      RETURNING *`,
      [
        data.nutricionista_id,
        data.nome.trim(),
        data.data_nascimento || null,
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

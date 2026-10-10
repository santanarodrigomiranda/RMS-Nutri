import { neon } from '@neondatabase/serverless'

const DATABASE_URL =
  import.meta.env.VITE_NEON_DATABASE_URL ||
  import.meta.env.DATABASE_URL ||
  ''

// Neon SQL client
export const sql = neon(DATABASE_URL)


/**
 * Ensures the registered user is saved in the `nutricionistas` table.
 * Note: A database trigger (on_neon_auth_user_created) also automatically handles this
 * when a user is inserted in neon_auth."user". This provides client-side certainty.
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

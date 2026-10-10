import { createAuthClient } from 'better-auth/react'

const NEON_AUTH_URL =
  import.meta.env.VITE_NEON_AUTH_URL ||
  'https://ep-summer-waterfall-b6mjgogl.neonauth.c-2.sa-east-1.aws.neon.tech/neondb/auth'

export const authClient = createAuthClient({
  baseURL: NEON_AUTH_URL,
})

export const { useSession, signIn, signUp, signOut, getSession } = authClient

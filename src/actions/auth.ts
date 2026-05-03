'use server'

import { signIn } from '@/lib/auth'
import { AuthError } from 'next-auth'

function isNextRedirect(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'digest' in error &&
    typeof (error as { digest?: unknown }).digest === 'string' &&
    (error as { digest: string }).digest.startsWith('NEXT_REDIRECT')
  )
}

export async function loginAction(email: string, password: string) {
  try {
    await signIn('credentials', {
      email,
      password,
      redirectTo: '/pipelines',
    })
  } catch (error) {
    if (isNextRedirect(error)) throw error
    if (error instanceof AuthError) {
      return { error: 'Email ou senha incorretos' }
    }
    console.error('[loginAction]', error)
    return { error: 'Erro ao fazer login. Verifique o servidor.' }
  }
}

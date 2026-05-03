'use server'

import { signIn } from '@/lib/auth'
import { AuthError } from 'next-auth'

export async function loginAction(email: string, password: string) {
  try {
    await signIn('credentials', {
      email,
      password,
      redirectTo: '/pipelines',
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: 'Email ou senha incorretos' }
    }
    throw error
  }
}

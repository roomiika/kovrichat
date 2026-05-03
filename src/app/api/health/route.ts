import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const checks: Record<string, string> = {
    status: 'ok',
    auth_secret: process.env.AUTH_SECRET
      ? 'set'
      : process.env.NEXTAUTH_SECRET
        ? 'set (NEXTAUTH_SECRET)'
        : 'MISSING',
  }

  try {
    const userCount = await prisma.user.count()
    checks.database = `ok (${userCount} users)`
  } catch (err) {
    checks.database = `error: ${err instanceof Error ? err.message : String(err)}`
  }

  const allOk = !Object.values(checks).some((v) => v.startsWith('error') || v === 'MISSING')

  return NextResponse.json(checks, { status: allOk ? 200 : 500 })
}

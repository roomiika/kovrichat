import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { execSync } from 'child_process'

export async function GET() {
  const checks: Record<string, string> = {
    status: 'ok',
    build: 'v6',
    auth_secret: process.env.AUTH_SECRET
      ? 'set'
      : process.env.NEXTAUTH_SECRET
        ? 'set (NEXTAUTH_SECRET)'
        : 'MISSING',
    db_url: process.env.DATABASE_URL
      ? process.env.DATABASE_URL.replace(/:([^:@]+)@/, ':***@')
      : 'MISSING',
  }

  try {
    const userCount = await prisma.user.count()
    checks.database = `ok (${userCount} users)`
  } catch (err) {
    checks.database = `error: ${err instanceof Error ? err.message : String(err)}`

    // Try to push schema and report what happens
    try {
      const out = execSync(
        'node ./node_modules/prisma/build/index.js db push --skip-generate --accept-data-loss',
        { encoding: 'utf8', timeout: 30000 },
      )
      checks.db_push = `ok: ${out.slice(0, 200)}`
    } catch (pushErr) {
      checks.db_push = `failed: ${pushErr instanceof Error ? pushErr.message.slice(0, 300) : String(pushErr)}`
    }
  }

  const allOk = !Object.values(checks).some((v) => v.startsWith('error') || v === 'MISSING')

  return NextResponse.json(checks, { status: allOk ? 200 : 500 })
}

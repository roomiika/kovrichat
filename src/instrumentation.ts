import { readFileSync } from 'fs'
import { join } from 'path'

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { prisma } = await import('@/lib/prisma')

    try {
      await prisma.$queryRawUnsafe('SELECT 1 FROM "User" LIMIT 1')
      console.log('[startup] Database schema OK')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : ''
      if (!message.includes('does not exist')) return

      console.log('[startup] Tables missing — running initial migration...')
      try {
        const sqlPath = join(
          process.cwd(),
          'prisma/migrations/20240101000000_init/migration.sql',
        )
        const sql = readFileSync(sqlPath, 'utf8')

        const statements = sql
          .replace(/--[^\n]*/g, '')
          .split(';')
          .map((s) => s.trim())
          .filter(Boolean)

        for (const stmt of statements) {
          try {
            await prisma.$executeRawUnsafe(stmt)
          } catch (stmtErr: unknown) {
            const msg = stmtErr instanceof Error ? stmtErr.message : ''
            if (!msg.includes('already exists')) {
              console.error('[startup] stmt failed:', msg)
            }
          }
        }
        console.log('[startup] Migration complete')
      } catch (migErr) {
        console.error('[startup] Migration error:', migErr)
      }
    }
  }
}

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { readFileSync, readdirSync, existsSync } = await import('fs')
    const { join } = await import('path')
    const { prisma } = await import('@/lib/prisma')

    async function runSql(sql: string) {
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
    }

    try {
      await prisma.$queryRawUnsafe('SELECT 1 FROM "User" LIMIT 1')
      console.log('[startup] Database schema OK')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : ''
      if (!message.includes('does not exist')) return

      console.log('[startup] Tables missing — running initial migration...')
      try {
        const migrationsDir = join(process.cwd(), 'prisma/migrations')
        const dirs = readdirSync(migrationsDir)
          .filter((d: string) => /^\d{14}_/.test(d))
          .sort()

        for (const dir of dirs) {
          const sqlPath = join(migrationsDir, dir, 'migration.sql')
          if (!existsSync(sqlPath)) continue
          await runSql(readFileSync(sqlPath, 'utf8'))
        }
        console.log('[startup] Migration complete')
      } catch (migErr) {
        console.error('[startup] Migration error:', migErr)
      }
      return
    }

    // Apply any additive migrations for existing DBs (idempotent)
    try {
      const migrationsDir = join(process.cwd(), 'prisma/migrations')
      const dirs = readdirSync(migrationsDir)
        .filter((d: string) => /^\d{14}_/.test(d) && d !== '20240101000000_init')
        .sort()

      for (const dir of dirs) {
        const sqlPath = join(migrationsDir, dir, 'migration.sql')
        if (!existsSync(sqlPath)) continue
        await runSql(readFileSync(sqlPath, 'utf8'))
      }
    } catch (e) {
      console.error('[startup] Additive migration error:', e)
    }
  }
}

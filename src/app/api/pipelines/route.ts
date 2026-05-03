import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { pipelineSchema } from '@/lib/validations/pipeline'
import { rateLimit } from '@/lib/middleware/rate-limit'

export async function GET(req: NextRequest) {
  const limited = await rateLimit(req, 'api')
  if (limited) return limited

  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const pipelines = await prisma.pipeline.findMany({
    where: { organizationId: (session.user as any).organizationId },
    include: { _count: { select: { stages: true, opportunities: true } } },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json(pipelines)
}

export async function POST(req: NextRequest) {
  const limited = await rateLimit(req, 'api')
  if (limited) return limited

  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = pipelineSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos' }, { status: 422 })

  const pipeline = await prisma.pipeline.create({
    data: {
      name: parsed.data.name,
      organizationId: (session.user as any).organizationId,
      stages: {
        createMany: {
          data: [
            { name: 'Prospecção', color: '#6366f1', order: 0 },
            { name: 'Qualificação', color: '#8b5cf6', order: 1 },
            { name: 'Proposta', color: '#f59e0b', order: 2 },
            { name: 'Fechado', color: '#10b981', order: 3 },
          ],
        },
      },
    },
    include: { _count: { select: { stages: true, opportunities: true } } },
  })

  return NextResponse.json(pipeline, { status: 201 })
}

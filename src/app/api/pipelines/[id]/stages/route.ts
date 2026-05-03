import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createStageSchema = z.object({
  name: z.string().min(1).max(60),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#6366f1'),
})

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const pipeline = await prisma.pipeline.findFirst({
    where: { id, organizationId: (session.user as any).organizationId },
    include: { _count: { select: { stages: true } } },
  })
  if (!pipeline) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const parsed = createStageSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos' }, { status: 422 })

  const stage = await prisma.stage.create({
    data: { ...parsed.data, order: pipeline._count.stages, pipelineId: id },
  })

  return NextResponse.json(stage, { status: 201 })
}

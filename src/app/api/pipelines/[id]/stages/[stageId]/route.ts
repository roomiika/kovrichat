import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(1).max(60).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; stageId: string }> },
) {
  const { id, stageId } = await params
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const pipeline = await prisma.pipeline.findFirst({
    where: { id, organizationId: (session.user as any).organizationId },
  })
  if (!pipeline) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos' }, { status: 422 })

  await prisma.stage.updateMany({ where: { id: stageId, pipelineId: id }, data: parsed.data })
  return NextResponse.json({ success: true })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; stageId: string }> },
) {
  const { id, stageId } = await params
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const pipeline = await prisma.pipeline.findFirst({
    where: { id, organizationId: (session.user as any).organizationId },
  })
  if (!pipeline) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.stage.deleteMany({ where: { id: stageId, pipelineId: id } })
  return NextResponse.json({ success: true })
}

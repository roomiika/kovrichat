import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { pipelineSchema } from '@/lib/validations/pipeline'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const pipeline = await prisma.pipeline.findFirst({
    where: { id, organizationId: (session.user as any).organizationId },
    include: {
      stages: {
        orderBy: { order: 'asc' },
        include: {
          opportunities: {
            where: { status: 'OPEN' },
            orderBy: { order: 'asc' },
            include: { contact: { select: { id: true, name: true, phone: true } } },
          },
        },
      },
    },
  })

  if (!pipeline) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(pipeline)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = pipelineSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos' }, { status: 422 })

  const result = await prisma.pipeline.updateMany({
    where: { id, organizationId: (session.user as any).organizationId },
    data: { name: parsed.data.name },
  })

  if (result.count === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await prisma.pipeline.deleteMany({
    where: { id, organizationId: (session.user as any).organizationId },
  })

  return NextResponse.json({ success: true })
}

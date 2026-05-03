import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateSchema = z.object({
  stageId: z.string().optional(),
  order: z.number().int().min(0).optional(),
  title: z.string().min(1).max(120).optional(),
  value: z.coerce.number().min(0).nullable().optional(),
  status: z.enum(['OPEN', 'WON', 'LOST']).optional(),
  lostReason: z.string().optional(),
})

async function getOppOrFail(id: string, orgId: string) {
  const opp = await prisma.opportunity.findFirst({
    where: { id },
    include: { pipeline: { select: { organizationId: true } } },
  })
  if (!opp || opp.pipeline.organizationId !== orgId) return null
  return opp
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const orgId = (session.user as any).organizationId
  const opp = await getOppOrFail(id, orgId)
  if (!opp) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos' }, { status: 422 })

  const { status, ...rest } = parsed.data
  const updated = await prisma.opportunity.update({
    where: { id },
    data: {
      ...rest,
      ...(status && { status }),
      ...(status === 'WON' && { wonAt: new Date() }),
      ...(status === 'LOST' && { lostAt: new Date() }),
    },
    include: { contact: { select: { id: true, name: true, phone: true } } },
  })

  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const orgId = (session.user as any).organizationId
  const opp = await getOppOrFail(id, orgId)
  if (!opp) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.opportunity.delete({ where: { id } })
  return NextResponse.json({ success: true })
}

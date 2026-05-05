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
  contactName: z.string().min(1).max(100).optional(),
  contactPhone: z.string().optional(),
  note: z.string().min(1).max(2000).optional(),
})

async function getOppOrFail(id: string, orgId: string) {
  const opp = await prisma.opportunity.findFirst({
    where: { id },
    include: { pipeline: { select: { organizationId: true } } },
  })
  if (!opp || opp.pipeline.organizationId !== orgId) return null
  return opp
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const orgId = (session.user as any).organizationId

  const opp = await prisma.opportunity.findFirst({
    where: { id, pipeline: { organizationId: orgId } },
    include: {
      contact: true,
      stage: { select: { id: true, name: true, color: true } },
      activities: {
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, name: true } } },
      },
    },
  })

  if (!opp) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(opp)
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

  const userId = (session.user as any).id as string
  const { status, contactName, contactPhone, note, ...rest } = parsed.data

  await prisma.$transaction(async (tx) => {
    // Update opportunity
    await tx.opportunity.update({
      where: { id },
      data: {
        ...rest,
        ...(status && { status }),
        ...(status === 'WON' && { wonAt: new Date(), lostAt: null }),
        ...(status === 'LOST' && { lostAt: new Date(), wonAt: null }),
        ...(status === 'OPEN' && { wonAt: null, lostAt: null }),
        ...(rest.stageId && rest.stageId !== opp.stageId && { stageEnteredAt: new Date() }),
      },
    })

    // Update contact if provided
    if (contactName || contactPhone !== undefined) {
      await tx.contact.update({
        where: { id: opp.contactId },
        data: {
          ...(contactName && { name: contactName }),
          ...(contactPhone !== undefined && { phone: contactPhone || null }),
        },
      })
    }

    // Log stage change
    if (rest.stageId && rest.stageId !== opp.stageId) {
      const newStage = await tx.stage.findUnique({ where: { id: rest.stageId } })
      await tx.activity.create({
        data: {
          type: 'STAGE_CHANGED',
          content: `Movido para ${newStage?.name ?? rest.stageId}`,
          opportunityId: id,
          userId,
        },
      })
    }

    // Log status change
    if (status && status !== opp.status) {
      await tx.activity.create({
        data: {
          type: 'STATUS_CHANGED',
          content:
            status === 'WON'
              ? 'Marcado como Ganho'
              : `Marcado como Perdido${parsed.data.lostReason ? ': ' + parsed.data.lostReason : ''}`,
          opportunityId: id,
          userId,
        },
      })
    }

    // Add note
    if (note) {
      await tx.activity.create({
        data: { type: 'NOTE_ADDED', content: note, opportunityId: id, userId },
      })
    }
  })

  const updated = await prisma.opportunity.findUnique({
    where: { id },
    include: {
      contact: true,
      stage: { select: { id: true, name: true, color: true } },
      activities: {
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, name: true } } },
      },
    },
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

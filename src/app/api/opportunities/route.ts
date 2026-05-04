import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/middleware/rate-limit'
import { z } from 'zod'

const createSchema = z.object({
  title: z.string().min(1).max(120),
  value: z.coerce.number().min(0).optional(),
  stageId: z.string(),
  pipelineId: z.string(),
  contactName: z.string().min(1).max(100),
  contactPhone: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const limited = await rateLimit(req, 'api')
  if (limited) return limited

  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const orgId = (session.user as any).organizationId

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success)
    return NextResponse.json({ error: 'Dados inválidos', issues: parsed.error.flatten() }, { status: 422 })

  const stage = await prisma.stage.findFirst({
    where: { id: parsed.data.stageId, pipelineId: parsed.data.pipelineId },
    include: { pipeline: { select: { organizationId: true } } },
  })
  if (!stage || stage.pipeline.organizationId !== orgId)
    return NextResponse.json({ error: 'Stage not found' }, { status: 404 })

  const { _max } = await prisma.opportunity.aggregate({
    where: { stageId: parsed.data.stageId },
    _max: { order: true },
  })
  const order = (_max.order ?? -1) + 1

  const opportunity = await prisma.$transaction(async (tx) => {
    const contact = await tx.contact.create({
      data: { name: parsed.data.contactName, phone: parsed.data.contactPhone ?? null, organizationId: orgId },
    })
    return tx.opportunity.create({
      data: {
        title: parsed.data.title,
        value: parsed.data.value,
        stageId: parsed.data.stageId,
        pipelineId: parsed.data.pipelineId,
        contactId: contact.id,
        order,
        stageEnteredAt: new Date(),
      },
      include: { contact: { select: { id: true, name: true, phone: true } } },
    })
  })

  return NextResponse.json(opportunity, { status: 201 })
}

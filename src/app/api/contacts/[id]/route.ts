import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  company: z.string().optional().nullable(),
})

async function getContactOrFail(id: string, orgId: string) {
  return prisma.contact.findFirst({ where: { id, organizationId: orgId } })
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const orgId = (session.user as any).organizationId
  const contact = await prisma.contact.findFirst({
    where: { id, organizationId: orgId },
    include: {
      opportunities: {
        orderBy: { createdAt: 'desc' },
        include: {
          stage: { select: { name: true, color: true } },
          pipeline: { select: { id: true, name: true } },
        },
      },
    },
  })

  if (!contact) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(contact)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const orgId = (session.user as any).organizationId
  const contact = await getContactOrFail(id, orgId)
  if (!contact) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos' }, { status: 422 })

  const updated = await prisma.contact.update({
    where: { id },
    data: {
      ...(parsed.data.name && { name: parsed.data.name }),
      ...(parsed.data.phone !== undefined && { phone: parsed.data.phone || null }),
      ...(parsed.data.email !== undefined && { email: parsed.data.email || null }),
      ...(parsed.data.company !== undefined && { company: parsed.data.company || null }),
    },
    include: { _count: { select: { opportunities: true } } },
  })

  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const orgId = (session.user as any).organizationId
  const contact = await getContactOrFail(id, orgId)
  if (!contact) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.contact.delete({ where: { id } })
  return NextResponse.json({ success: true })
}

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  metaPixelId: z.string().optional().nullable(),
  metaAccessToken: z.string().optional().nullable(),
  googleAdsConversionId: z.string().optional().nullable(),
  googleAdsConvLabel: z.string().optional().nullable(),
  evolutionApiUrl: z.string().url().optional().nullable().or(z.literal('')),
  evolutionApiKey: z.string().optional().nullable(),
})

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const orgId = (session.user as any).organizationId
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: {
      id: true,
      name: true,
      slug: true,
      metaPixelId: true,
      metaAccessToken: true,
      googleAdsConversionId: true,
      googleAdsConvLabel: true,
      evolutionApiUrl: true,
      evolutionApiKey: true,
    },
  })

  if (!org) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(org)
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const orgId = (session.user as any).organizationId
  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos' }, { status: 422 })

  const updated = await prisma.organization.update({
    where: { id: orgId },
    data: parsed.data,
    select: {
      id: true,
      name: true,
      slug: true,
      metaPixelId: true,
      metaAccessToken: true,
      googleAdsConversionId: true,
      googleAdsConvLabel: true,
      evolutionApiUrl: true,
      evolutionApiKey: true,
    },
  })

  return NextResponse.json(updated)
}

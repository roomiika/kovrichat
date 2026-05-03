import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const orgId = (session.user as any).organizationId
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [openAgg, wonMonthAgg, lostMonthCount, allWonCount, allLostCount, pipelines, recentActivities] =
    await Promise.all([
      prisma.opportunity.aggregate({
        where: { status: 'OPEN', pipeline: { organizationId: orgId } },
        _count: true,
        _sum: { value: true },
      }),
      prisma.opportunity.aggregate({
        where: {
          status: 'WON',
          pipeline: { organizationId: orgId },
          wonAt: { gte: startOfMonth },
        },
        _count: true,
        _sum: { value: true },
      }),
      prisma.opportunity.count({
        where: {
          status: 'LOST',
          pipeline: { organizationId: orgId },
          lostAt: { gte: startOfMonth },
        },
      }),
      prisma.opportunity.count({
        where: { status: 'WON', pipeline: { organizationId: orgId } },
      }),
      prisma.opportunity.count({
        where: { status: 'LOST', pipeline: { organizationId: orgId } },
      }),
      prisma.pipeline.findMany({
        where: { organizationId: orgId },
        select: {
          id: true,
          name: true,
          opportunities: {
            select: { status: true, value: true, wonAt: true },
          },
        },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.activity.findMany({
        where: { opportunity: { pipeline: { organizationId: orgId } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          user: { select: { name: true } },
          opportunity: { select: { id: true, title: true } },
        },
      }),
    ])

  const pipelineStats = pipelines.map((p) => {
    const open = p.opportunities.filter((o) => o.status === 'OPEN')
    const wonMonth = p.opportunities.filter(
      (o) => o.status === 'WON' && o.wonAt && o.wonAt >= startOfMonth,
    )
    return {
      id: p.id,
      name: p.name,
      open: {
        count: open.length,
        value: open.reduce((s, o) => s + Number(o.value ?? 0), 0),
      },
      wonMonth: {
        count: wonMonth.length,
        value: wonMonth.reduce((s, o) => s + Number(o.value ?? 0), 0),
      },
    }
  })

  const totalClosed = allWonCount + allLostCount
  const conversionRate = totalClosed > 0 ? Math.round((allWonCount / totalClosed) * 100) : null

  return NextResponse.json({
    summary: {
      open: {
        count: openAgg._count,
        value: Number(openAgg._sum.value ?? 0),
      },
      wonMonth: {
        count: wonMonthAgg._count,
        value: Number(wonMonthAgg._sum.value ?? 0),
      },
      lostMonth: { count: lostMonthCount },
      conversionRate,
    },
    pipelines: pipelineStats,
    recentActivities,
  })
}

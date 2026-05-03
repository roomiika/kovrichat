'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import {
  TrendingUp,
  CheckCircle2,
  XCircle,
  Target,
  ArrowRight,
  MessageSquare,
  CheckCircle,
  Plus,
} from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'

type DashboardData = {
  summary: {
    open: { count: number; value: number }
    wonMonth: { count: number; value: number }
    lostMonth: { count: number }
    conversionRate: number | null
  }
  pipelines: Array<{
    id: string
    name: string
    open: { count: number; value: number }
    wonMonth: { count: number; value: number }
  }>
  recentActivities: Array<{
    id: string
    type: string
    content: string
    createdAt: string
    user: { name: string } | null
    opportunity: { id: string; title: string }
  }>
}

export default function DashboardPage() {
  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: () => fetch('/api/dashboard').then((r) => r.json()),
    refetchInterval: 60_000,
  })

  const month = new Date().toLocaleString('pt-BR', { month: 'long' })

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1 capitalize">{month} de {new Date().getFullYear()}</p>
      </div>

      {isLoading ? (
        <LoadingSkeleton />
      ) : !data ? null : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <KpiCard
              label="Em aberto"
              value={data.summary.open.count}
              sub={formatCurrency(data.summary.open.value)}
              icon={<TrendingUp className="h-4 w-4" />}
              color="text-primary bg-primary/10"
            />
            <KpiCard
              label="Ganhos este mês"
              value={data.summary.wonMonth.count}
              sub={data.summary.wonMonth.value > 0 ? formatCurrency(data.summary.wonMonth.value) : undefined}
              icon={<CheckCircle2 className="h-4 w-4" />}
              color="text-emerald-400 bg-emerald-400/10"
            />
            <KpiCard
              label="Perdidos este mês"
              value={data.summary.lostMonth.count}
              icon={<XCircle className="h-4 w-4" />}
              color="text-red-400 bg-red-400/10"
            />
            <KpiCard
              label="Taxa de conversão"
              value={data.summary.conversionRate !== null ? `${data.summary.conversionRate}%` : '—'}
              sub="ganhos / total fechados"
              icon={<Target className="h-4 w-4" />}
              color="text-violet-400 bg-violet-400/10"
            />
          </div>

          {/* Bottom section */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Pipelines */}
            <div className="lg:col-span-3">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-foreground">Pipelines</h2>
                <Link href="/pipelines" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors">
                  Ver todos <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              {data.pipelines.length === 0 ? (
                <div className="rounded-xl border border-border bg-card p-8 text-center">
                  <p className="text-sm text-muted-foreground">Nenhum pipeline criado.</p>
                  <Link href="/pipelines" className="text-xs text-primary hover:underline mt-2 inline-block">
                    Criar pipeline
                  </Link>
                </div>
              ) : (
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Pipeline</th>
                        <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Abertas</th>
                        <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Valor aberto</th>
                        <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Ganhas/mês</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.pipelines.map((p, i) => (
                        <tr
                          key={p.id}
                          className={cn(
                            'transition-colors hover:bg-muted/30',
                            i < data.pipelines.length - 1 && 'border-b border-border',
                          )}
                        >
                          <td className="px-4 py-3">
                            <Link
                              href={`/pipelines/${p.id}`}
                              className="font-medium text-foreground hover:text-primary transition-colors"
                            >
                              {p.name}
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-right text-muted-foreground">{p.open.count}</td>
                          <td className="px-4 py-3 text-right font-medium text-foreground">
                            {p.open.value > 0 ? formatCurrency(p.open.value) : '—'}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {p.wonMonth.count > 0 ? (
                              <span className="text-emerald-400 font-medium">{p.wonMonth.count}</span>
                            ) : (
                              <span className="text-muted-foreground">0</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Recent activity */}
            <div className="lg:col-span-2">
              <h2 className="text-sm font-semibold text-foreground mb-4">Atividade recente</h2>

              {data.recentActivities.length === 0 ? (
                <div className="rounded-xl border border-border bg-card p-8 text-center">
                  <p className="text-sm text-muted-foreground">Nenhuma atividade ainda.</p>
                </div>
              ) : (
                <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
                  {data.recentActivities.map((act) => (
                    <ActivityRow key={act.id} activity={act} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function KpiCard({
  label,
  value,
  sub,
  icon,
  color,
}: {
  label: string
  value: string | number
  sub?: string
  icon: React.ReactNode
  color: string
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-muted-foreground">{label}</span>
        <div className={cn('flex h-7 w-7 items-center justify-center rounded-lg', color)}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  )
}

function ActivityRow({
  activity,
}: {
  activity: {
    type: string
    content: string
    createdAt: string
    user: { name: string } | null
    opportunity: { id: string; title: string }
  }
}) {
  const icons: Record<string, React.ReactNode> = {
    STAGE_CHANGED: <ArrowRight className="h-3 w-3" />,
    STATUS_CHANGED: <CheckCircle className="h-3 w-3" />,
    NOTE_ADDED: <MessageSquare className="h-3 w-3" />,
    CREATED: <Plus className="h-3 w-3" />,
  }

  const colors: Record<string, string> = {
    STAGE_CHANGED: 'bg-blue-500/15 text-blue-400',
    STATUS_CHANGED: 'bg-emerald-500/15 text-emerald-400',
    NOTE_ADDED: 'bg-zinc-700 text-zinc-300',
    CREATED: 'bg-primary/15 text-primary',
  }

  const icon = icons[activity.type] ?? <MessageSquare className="h-3 w-3" />
  const color = colors[activity.type] ?? 'bg-zinc-700 text-zinc-300'

  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <div className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded-full mt-0.5', color)}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-foreground truncate font-medium">{activity.opportunity.title}</p>
        <p className="text-xs text-muted-foreground truncate mt-0.5">{activity.content}</p>
      </div>
      <span className="text-xs text-muted-foreground shrink-0 mt-0.5">
        {formatRelativeTime(activity.createdAt)}
      </span>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-muted" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 h-48 rounded-xl bg-muted" />
        <div className="lg:col-span-2 h-48 rounded-xl bg-muted" />
      </div>
    </div>
  )
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d`
  return date.toLocaleDateString('pt-BR')
}

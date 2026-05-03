'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  X,
  CheckCircle2,
  XCircle,
  Trash2,
  MessageSquare,
  ArrowRight,
  Plus,
  Loader2,
} from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import type { KanbanStage } from './KanbanColumn'

type Activity = {
  id: string
  type: string
  content: string
  createdAt: string
  user: { id: string; name: string } | null
}

type OppDetail = {
  id: string
  title: string
  value: string | null
  status: 'OPEN' | 'WON' | 'LOST'
  stageId: string
  stage: { id: string; name: string; color: string }
  contact: { id: string; name: string; phone: string | null }
  activities: Activity[]
  createdAt: string
}

interface Props {
  opportunityId: string
  pipelineId: string
  stages: KanbanStage[]
  onClose: () => void
  onDeleted: (id: string) => void
}

export default function OpportunityDetailModal({
  opportunityId,
  pipelineId,
  stages,
  onClose,
  onDeleted,
}: Props) {
  const qc = useQueryClient()
  const [note, setNote] = useState('')
  const [showLostInput, setShowLostInput] = useState(false)
  const [lostReason, setLostReason] = useState('')

  const { data: opp, isLoading } = useQuery<OppDetail>({
    queryKey: ['opportunity', opportunityId],
    queryFn: () => fetch(`/api/opportunities/${opportunityId}`).then((r) => r.json()),
  })

  const patch = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      fetch(`/api/opportunities/${opportunityId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then((r) => r.json()),
    onSuccess: (updated) => {
      qc.setQueryData(['opportunity', opportunityId], updated)
      qc.invalidateQueries({ queryKey: ['pipeline', pipelineId] })
    },
  })

  const del = useMutation({
    mutationFn: () =>
      fetch(`/api/opportunities/${opportunityId}`, { method: 'DELETE' }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pipeline', pipelineId] })
      onDeleted(opportunityId)
      onClose()
    },
  })

  function save(field: string, value: unknown) {
    patch.mutate({ [field]: value })
  }

  function addNote() {
    if (!note.trim()) return
    patch.mutate({ note: note.trim() })
    setNote('')
  }

  function confirmLost() {
    patch.mutate({ status: 'LOST', lostReason: lostReason.trim() || undefined })
    setShowLostInput(false)
    setLostReason('')
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 flex flex-col w-full max-w-lg bg-zinc-950 border-l border-white/10 h-full">
        {isLoading || !opp ? (
          <div className="flex items-center justify-center flex-1">
            <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-start gap-3 p-5 border-b border-white/10 shrink-0">
              <button
                onClick={onClose}
                className="mt-0.5 shrink-0 text-zinc-500 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              <EditableText
                value={opp.title}
                onSave={(v) => save('title', v)}
                className="flex-1 text-base font-semibold text-white"
              />

              <div className="flex items-center gap-1.5 shrink-0">
                {opp.status === 'OPEN' && (
                  <>
                    <button
                      onClick={() => patch.mutate({ status: 'WON' })}
                      disabled={patch.isPending}
                      className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-2.5 py-1.5 text-xs font-medium text-emerald-400 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Ganho
                    </button>
                    <button
                      onClick={() => setShowLostInput(true)}
                      disabled={patch.isPending}
                      className="flex items-center gap-1.5 rounded-lg bg-red-500/10 px-2.5 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Perdido
                    </button>
                  </>
                )}

                {opp.status !== 'OPEN' && (
                  <span
                    className={cn(
                      'rounded-full px-2.5 py-1 text-xs font-medium',
                      opp.status === 'WON'
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : 'bg-red-500/15 text-red-400',
                    )}
                  >
                    {opp.status === 'WON' ? 'Ganho' : 'Perdido'}
                  </span>
                )}

                <button
                  onClick={() => {
                    if (confirm('Deletar esta oportunidade?')) del.mutate()
                  }}
                  disabled={del.isPending}
                  className="p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Lost reason */}
            {showLostInput && (
              <div className="p-4 border-b border-white/10 bg-red-500/5 shrink-0">
                <p className="text-xs text-zinc-400 mb-2">Motivo da perda (opcional)</p>
                <div className="flex gap-2">
                  <input
                    autoFocus
                    value={lostReason}
                    onChange={(e) => setLostReason(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') confirmLost()
                      if (e.key === 'Escape') setShowLostInput(false)
                    }}
                    placeholder="Ex: Preço, prazo, concorrente..."
                    className="flex-1 rounded-lg bg-zinc-800 border border-white/10 px-3 py-1.5 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-primary"
                  />
                  <button
                    onClick={confirmLost}
                    className="rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/30"
                  >
                    Confirmar
                  </button>
                  <button
                    onClick={() => setShowLostInput(false)}
                    className="text-zinc-500 hover:text-zinc-300 text-xs px-2"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto">
              {/* Fields */}
              <div className="p-5 space-y-3.5 border-b border-white/10">
                <FieldRow label="Etapa">
                  <select
                    value={opp.stageId}
                    onChange={(e) => save('stageId', e.target.value)}
                    className="flex-1 rounded-lg bg-zinc-800 border border-white/10 px-2.5 py-1.5 text-sm text-white outline-none focus:border-primary"
                  >
                    {stages.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </FieldRow>

                <FieldRow label="Valor">
                  <EditableNumber
                    value={opp.value !== null ? Number(opp.value) : null}
                    onSave={(v) => save('value', v)}
                  />
                </FieldRow>

                <FieldRow label="Contato">
                  <EditableText
                    value={opp.contact.name}
                    onSave={(v) => save('contactName', v)}
                    className="flex-1 text-sm text-white"
                  />
                </FieldRow>

                <FieldRow label="Telefone">
                  <EditableText
                    value={opp.contact.phone ?? ''}
                    placeholder="Adicionar telefone"
                    onSave={(v) => save('contactPhone', v)}
                    className="flex-1 text-sm text-white"
                  />
                </FieldRow>
              </div>

              {/* Add note */}
              <div className="p-5 border-b border-white/10">
                <p className="text-xs font-medium text-zinc-400 mb-2">Adicionar nota</p>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) addNote()
                  }}
                  placeholder="Escreva uma observação... (Ctrl+Enter para salvar)"
                  rows={3}
                  className="w-full rounded-lg bg-zinc-800 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-primary resize-none"
                />
                <div className="flex justify-end mt-2">
                  <button
                    onClick={addNote}
                    disabled={!note.trim() || patch.isPending}
                    className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40 hover:bg-primary/90 transition-colors"
                  >
                    Salvar nota
                  </button>
                </div>
              </div>

              {/* Activity log */}
              <div className="p-5">
                <p className="text-xs font-medium text-zinc-400 mb-4">Atividade</p>
                <div className="space-y-3">
                  {opp.activities.map((act) => (
                    <ActivityItem key={act.id} activity={act} />
                  ))}

                  {/* Creation entry */}
                  <div className="flex items-start gap-2.5">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary mt-0.5">
                      <Plus className="h-3 w-3" />
                    </div>
                    <div>
                      <p className="text-xs text-zinc-300">Oportunidade criada</p>
                      <p className="text-xs text-zinc-600 mt-0.5">{formatRelativeTime(opp.createdAt)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-20 text-xs text-zinc-500 shrink-0">{label}</span>
      {children}
    </div>
  )
}

function EditableText({
  value,
  placeholder = '',
  onSave,
  className = '',
}: {
  value: string
  placeholder?: string
  onSave: (v: string) => void
  className?: string
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  function commit() {
    setEditing(false)
    const trimmed = draft.trim()
    if (trimmed && trimmed !== value) onSave(trimmed)
    else setDraft(value)
  }

  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit()
          if (e.key === 'Escape') {
            setEditing(false)
            setDraft(value)
          }
        }}
        className={cn(className, 'bg-zinc-800 border border-primary/50 rounded px-2 py-0.5 outline-none w-full')}
      />
    )
  }

  return (
    <button
      onClick={() => {
        setDraft(value)
        setEditing(true)
      }}
      className={cn(
        className,
        'text-left hover:bg-white/5 rounded px-2 py-0.5 transition-colors w-full',
        !value && 'text-zinc-600',
      )}
    >
      {value || placeholder}
    </button>
  )
}

function EditableNumber({
  value,
  onSave,
}: {
  value: number | null
  onSave: (v: number | null) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value !== null ? String(value) : '')

  function commit() {
    setEditing(false)
    if (draft.trim() === '') {
      onSave(null)
    } else {
      const num = parseFloat(draft.replace(',', '.'))
      if (!isNaN(num)) onSave(num)
      else setDraft(value !== null ? String(value) : '')
    }
  }

  if (editing) {
    return (
      <input
        autoFocus
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit()
          if (e.key === 'Escape') setEditing(false)
        }}
        placeholder="0,00"
        className="flex-1 bg-zinc-800 border border-primary/50 rounded px-2 py-0.5 text-sm text-white outline-none"
      />
    )
  }

  return (
    <button
      onClick={() => {
        setDraft(value !== null ? String(value) : '')
        setEditing(true)
      }}
      className="flex-1 text-left text-sm hover:bg-white/5 rounded px-2 py-0.5 transition-colors"
    >
      {value !== null && value > 0 ? (
        <span className="text-emerald-400 font-medium">{formatCurrency(value)}</span>
      ) : (
        <span className="text-zinc-600">Adicionar valor</span>
      )}
    </button>
  )
}

function ActivityItem({ activity }: { activity: Activity }) {
  const config: Record<string, { icon: React.ReactNode; color: string }> = {
    STAGE_CHANGED: {
      icon: <ArrowRight className="h-3 w-3" />,
      color: 'bg-blue-500/20 text-blue-400',
    },
    STATUS_CHANGED: {
      icon: <CheckCircle2 className="h-3 w-3" />,
      color: 'bg-emerald-500/20 text-emerald-400',
    },
    NOTE_ADDED: {
      icon: <MessageSquare className="h-3 w-3" />,
      color: 'bg-zinc-700 text-zinc-300',
    },
  }

  const { icon, color } = config[activity.type] ?? {
    icon: <MessageSquare className="h-3 w-3" />,
    color: 'bg-zinc-700 text-zinc-300',
  }

  return (
    <div className="flex items-start gap-2.5">
      <div
        className={cn(
          'flex h-5 w-5 shrink-0 items-center justify-center rounded-full mt-0.5',
          color,
        )}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-zinc-300 leading-snug">{activity.content}</p>
        <p className="text-xs text-zinc-600 mt-0.5">
          {activity.user?.name && <span>{activity.user.name} · </span>}
          {formatRelativeTime(activity.createdAt)}
        </p>
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
  if (mins < 60) return `${mins}m atrás`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h atrás`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d atrás`
  return date.toLocaleDateString('pt-BR')
}

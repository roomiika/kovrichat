'use client'

import { useState, useRef, useEffect } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import KanbanCard, { type KanbanOpportunity } from './KanbanCard'

export type KanbanStage = {
  id: string
  name: string
  color: string
  order: number
  opportunities: KanbanOpportunity[]
}

interface Props {
  stage: KanbanStage
  pipelineId: string
  onAddCard: (stageId: string) => void
  onCardClick: (id: string) => void
  onStageRenamed: (stageId: string, name: string) => void
  onStageDeleted: (stageId: string) => void
}

export default function KanbanColumn({
  stage, pipelineId, onAddCard, onCardClick, onStageRenamed, onStageDeleted,
}: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id })
  const [menuOpen, setMenuOpen] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [draft, setDraft] = useState(stage.name)
  const menuRef = useRef<HTMLDivElement>(null)

  const ids = stage.opportunities.map((o) => o.id)
  const total = stage.opportunities.reduce((s, o) => s + Number(o.value ?? 0), 0)

  useEffect(() => {
    if (!menuOpen) return
    function handle(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [menuOpen])

  async function commitRename() {
    const trimmed = draft.trim()
    if (!trimmed) { setDraft(stage.name); setRenaming(false); return }
    if (trimmed === stage.name) { setRenaming(false); return }
    setRenaming(false)
    onStageRenamed(stage.id, trimmed)
    await fetch(`/api/pipelines/${pipelineId}/stages/${stage.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: trimmed }),
    })
  }

  async function handleDelete() {
    const hasCards = stage.opportunities.length > 0
    const msg = hasCards
      ? `Deletar "${stage.name}"? Os ${stage.opportunities.length} cards desta etapa também serão removidos.`
      : `Deletar etapa "${stage.name}"?`
    if (!confirm(msg)) return
    onStageDeleted(stage.id)
    await fetch(`/api/pipelines/${pipelineId}/stages/${stage.id}`, { method: 'DELETE' })
  }

  return (
    <div className="flex flex-col w-72 shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-2 px-0.5">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: stage.color }} />

          {renaming ? (
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitRename()
                if (e.key === 'Escape') { setRenaming(false); setDraft(stage.name) }
              }}
              className="flex-1 bg-transparent border-b border-primary text-sm font-medium text-foreground outline-none min-w-0"
            />
          ) : (
            <span className="text-sm font-medium text-foreground truncate">{stage.name}</span>
          )}

          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full leading-none shrink-0">
            {stage.opportunities.length}
          </span>
        </div>

        <div className="flex items-center gap-0.5 shrink-0">
          <button
            onClick={() => onAddCard(stage.id)}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            title="Adicionar card"
          >
            <Plus className="h-4 w-4" />
          </button>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-7 z-20 w-36 rounded-lg border border-border bg-card shadow-xl py-1">
                <button
                  onClick={() => { setMenuOpen(false); setDraft(stage.name); setRenaming(true) }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                >
                  <Pencil className="h-3.5 w-3.5" /> Renomear
                </button>
                <button
                  onClick={() => { setMenuOpen(false); handleDelete() }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-500 dark:text-red-400 hover:bg-red-400/10 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Deletar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={cn(
            'flex flex-col gap-2 min-h-24 rounded-xl p-2 transition-colors',
            'bg-muted/40',
            isOver && 'bg-primary/5 ring-1 ring-primary/30',
          )}
        >
          {stage.opportunities.map((opp) => (
            <KanbanCard key={opp.id} opportunity={opp} onClick={() => onCardClick(opp.id)} />
          ))}

          {stage.opportunities.length === 0 && (
            <div className="flex items-center justify-center h-16 text-xs text-muted-foreground/60">
              Arraste cards aqui
            </div>
          )}
        </div>
      </SortableContext>

      {total > 0 && (
        <p className="text-xs text-muted-foreground mt-1.5 px-0.5 text-right">
          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}
        </p>
      )}
    </div>
  )
}

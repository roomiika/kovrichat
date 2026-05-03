'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus } from 'lucide-react'
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
  onAddCard: (stageId: string) => void
  onCardClick: (id: string) => void
}

export default function KanbanColumn({ stage, onAddCard, onCardClick }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id })

  const ids = stage.opportunities.map((o) => o.id)
  const total = stage.opportunities.reduce((s, o) => s + Number(o.value ?? 0), 0)

  return (
    <div className="flex flex-col w-72 shrink-0">
      <div className="flex items-center justify-between mb-2 px-0.5">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: stage.color }} />
          <span className="text-sm font-medium text-zinc-100">{stage.name}</span>
          <span className="text-xs text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded-full leading-none">
            {stage.opportunities.length}
          </span>
        </div>
        <button
          onClick={() => onAddCard(stage.id)}
          className="p-1 rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-white/5 transition-colors"
          title="Adicionar card"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={cn(
            'flex flex-col gap-2 min-h-24 rounded-xl p-2 transition-colors',
            'bg-zinc-800/50',
            isOver && 'bg-primary/5 ring-1 ring-primary/30',
          )}
        >
          {stage.opportunities.map((opp) => (
            <KanbanCard key={opp.id} opportunity={opp} onClick={() => onCardClick(opp.id)} />
          ))}

          {stage.opportunities.length === 0 && (
            <div className="flex items-center justify-center h-16 text-xs text-zinc-600">
              Arraste cards aqui
            </div>
          )}
        </div>
      </SortableContext>

      {total > 0 && (
        <p className="text-xs text-zinc-500 mt-1.5 px-0.5 text-right">
          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}
        </p>
      )}
    </div>
  )
}

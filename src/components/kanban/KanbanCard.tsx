'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn, formatCurrency } from '@/lib/utils'
import { User } from 'lucide-react'

export type KanbanOpportunity = {
  id: string
  title: string
  value: string | null
  order: number
  stageId: string
  status: string
  contact: { id: string; name: string; phone?: string | null }
}

interface Props {
  opportunity: KanbanOpportunity
  overlay?: boolean
}

export default function KanbanCard({ opportunity, overlay }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: opportunity.id,
    data: { type: 'card', opportunity },
  })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      className={cn(
        'rounded-lg border border-white/10 bg-zinc-900 p-3',
        'cursor-grab active:cursor-grabbing select-none touch-none',
        isDragging && !overlay && 'opacity-30',
        overlay && 'shadow-2xl rotate-1 border-primary/40',
      )}
    >
      <p className="text-sm font-medium text-white leading-snug mb-2 line-clamp-2">
        {opportunity.title}
      </p>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs text-zinc-400 min-w-0">
          <User className="h-3 w-3 shrink-0" />
          <span className="truncate">{opportunity.contact.name}</span>
        </div>
        {opportunity.value && Number(opportunity.value) > 0 && (
          <span className="text-xs font-semibold text-emerald-400 shrink-0">
            {formatCurrency(Number(opportunity.value))}
          </span>
        )}
      </div>
    </div>
  )
}

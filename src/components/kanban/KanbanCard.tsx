'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, User } from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'

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
  onClick?: () => void
}

export default function KanbanCard({ opportunity, overlay, onClick }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: opportunity.id,
    data: { type: 'card', opportunity },
  })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      onClick={onClick}
      className={cn(
        'group rounded-lg border border-white/10 bg-zinc-900 p-3',
        'cursor-pointer select-none touch-none',
        isDragging && !overlay && 'opacity-30',
        overlay && 'shadow-2xl rotate-1 border-primary/40',
      )}
    >
      <div className="flex items-start gap-1.5">
        {/* Drag handle — only activates DnD */}
        <div
          ref={setActivatorNodeRef}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          className="mt-0.5 shrink-0 text-zinc-700 hover:text-zinc-400 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </div>

        <div className="flex-1 min-w-0">
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
      </div>
    </div>
  )
}

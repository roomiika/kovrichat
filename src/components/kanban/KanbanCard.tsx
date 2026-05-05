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
  stageEnteredAt: string | null
  createdAt: string
  contact: { id: string; name: string; phone?: string | null }
}

interface Props {
  opportunity: KanbanOpportunity
  overlay?: boolean
  onClick?: () => void
}

function daysAgo(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
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

  const days = daysAgo(opportunity.stageEnteredAt ?? opportunity.createdAt)
  const daysColor =
    days >= 15 ? 'text-red-400' : days >= 8 ? 'text-amber-400' : 'text-muted-foreground'

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      onClick={onClick}
      className={cn(
        'group rounded-lg border border-border bg-card p-3',
        'cursor-pointer select-none touch-none',
        isDragging && !overlay && 'opacity-30',
        overlay && 'shadow-2xl rotate-1 border-primary/40',
      )}
    >
      <div className="flex items-start gap-1.5">
        {/* Drag handle */}
        <div
          ref={setActivatorNodeRef}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          className="mt-0.5 shrink-0 text-muted-foreground/30 hover:text-muted-foreground cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </div>

        <div className="flex-1 min-w-0">
          {/* Title row with days badge */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <p className="text-sm font-medium text-foreground leading-snug line-clamp-2 flex-1">
              {opportunity.title}
            </p>
            {days > 0 && (
              <span className={cn('text-xs shrink-0 mt-0.5 tabular-nums', daysColor)}>
                {days}d
              </span>
            )}
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
              <User className="h-3 w-3 shrink-0" />
              <span className="truncate">{opportunity.contact.name}</span>
            </div>
            {opportunity.value && Number(opportunity.value) > 0 && (
              <span className="text-xs font-semibold text-emerald-500 dark:text-emerald-400 shrink-0">
                {formatCurrency(Number(opportunity.value))}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

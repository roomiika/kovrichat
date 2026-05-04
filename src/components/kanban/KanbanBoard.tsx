'use client'

import { useState, useRef, useEffect } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import KanbanColumn, { type KanbanStage } from './KanbanColumn'
import KanbanCard, { type KanbanOpportunity } from './KanbanCard'
import CreateOpportunityModal from './CreateOpportunityModal'
import OpportunityDetailModal from './OpportunityDetailModal'

interface Props {
  pipelineId: string
}

export default function KanbanBoard({ pipelineId }: Props) {
  const qc = useQueryClient()
  const [stages, setStages] = useState<KanbanStage[]>([])
  const stagesRef = useRef(stages)
  const [activeOp, setActiveOp] = useState<KanbanOpportunity | null>(null)
  const [modal, setModal] = useState<{ stageId: string } | null>(null)
  const [detailId, setDetailId] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['pipeline', pipelineId],
    queryFn: () => fetch(`/api/pipelines/${pipelineId}`).then((r) => r.json()),
  })

  useEffect(() => {
    if (data?.stages) setStages(data.stages)
  }, [data])

  useEffect(() => {
    stagesRef.current = stages
  }, [stages])

  const moveMutation = useMutation({
    mutationFn: ({ id, stageId, order }: { id: string; stageId: string; order: number }) =>
      fetch(`/api/opportunities/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stageId, order }),
      }).then((r) => r.json()),
    onError: () => {
      // Revert on error by re-fetching
      qc.invalidateQueries({ queryKey: ['pipeline', pipelineId] })
    },
  })

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  )

  function findStageOf(opId: string) {
    return stagesRef.current.find((s) => s.opportunities.some((o) => o.id === opId))
  }

  function onDragStart({ active }: DragStartEvent) {
    const op = findStageOf(active.id as string)?.opportunities.find(
      (o) => o.id === active.id,
    )
    if (op) setActiveOp(op)
  }

  function onDragOver({ active, over }: DragOverEvent) {
    if (!over) return
    const activeId = active.id as string
    const overId = over.id as string

    const activeStage = findStageOf(activeId)
    const overStage =
      stagesRef.current.find((s) => s.id === overId) ?? findStageOf(overId)

    if (!activeStage || !overStage || activeStage.id === overStage.id) return

    setStages((prev) => {
      const srcStage = prev.find((s) => s.id === activeStage.id)!
      const dstStage = prev.find((s) => s.id === overStage.id)!
      const movedOp = { ...srcStage.opportunities.find((o) => o.id === activeId)!, stageId: overStage.id }
      const overIdx = dstStage.opportunities.findIndex((o) => o.id === overId)
      const insertAt = overIdx >= 0 ? overIdx : dstStage.opportunities.length

      return prev.map((s) => {
        if (s.id === srcStage.id)
          return { ...s, opportunities: s.opportunities.filter((o) => o.id !== activeId) }
        if (s.id === dstStage.id) {
          const opps = [...s.opportunities]
          opps.splice(insertAt, 0, movedOp)
          return { ...s, opportunities: opps }
        }
        return s
      })
    })
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    setActiveOp(null)
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    // Find where the card ended up (after onDragOver moves)
    const currentStages = stagesRef.current
    let finalStageId = ''
    let finalOrder = 0

    for (const stage of currentStages) {
      const idx = stage.opportunities.findIndex((o) => o.id === activeId)
      if (idx >= 0) {
        finalStageId = stage.id
        finalOrder = idx

        // Reorder within same stage if needed
        const overIdx = stage.opportunities.findIndex((o) => o.id === overId)
        if (overIdx >= 0 && overIdx !== idx) {
          const reordered = arrayMove(stage.opportunities, idx, overIdx)
          finalOrder = overIdx
          setStages((prev) =>
            prev.map((s) => (s.id === stage.id ? { ...s, opportunities: reordered } : s)),
          )
        }
        break
      }
    }

    if (!finalStageId) return

    const originalStageId = (active.data.current as any)?.opportunity?.stageId
    const originalOrder = (active.data.current as any)?.opportunity?.order
    if (finalStageId === originalStageId && finalOrder === originalOrder) return

    moveMutation.mutate({ id: activeId, stageId: finalStageId, order: finalOrder })
  }

  function handleOpCreated(op: KanbanOpportunity) {
    setStages((prev) =>
      prev.map((s) =>
        s.id === op.stageId ? { ...s, opportunities: [...s.opportunities, op] } : s,
      ),
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-white/5 shrink-0">
        <Link href="/pipelines" className="text-zinc-400 hover:text-white transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-lg font-semibold text-white">{data?.name}</h1>
        <span className="text-xs text-zinc-500">
          {stages.reduce((acc, s) => acc + s.opportunities.length, 0)} cards
        </span>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDragEnd={onDragEnd}
        >
          <div className="flex gap-4 p-6 h-full items-start">
            {stages.map((stage) => (
              <KanbanColumn
                key={stage.id}
                stage={stage}
                pipelineId={pipelineId}
                onAddCard={(stageId) => setModal({ stageId })}
                onCardClick={(id) => setDetailId(id)}
                onStageRenamed={(stageId, name) =>
                  setStages((prev) =>
                    prev.map((s) => (s.id === stageId ? { ...s, name } : s)),
                  )
                }
                onStageDeleted={(stageId) =>
                  setStages((prev) => prev.filter((s) => s.id !== stageId))
                }
              />
            ))}

            {/* Add stage */}
            <AddStageButton pipelineId={pipelineId} onCreated={(s) => setStages((p) => [...p, { ...s, opportunities: [] }])} />
          </div>

          <DragOverlay>
            {activeOp && <KanbanCard opportunity={activeOp} overlay />}
          </DragOverlay>
        </DndContext>
      </div>

      {modal && (
        <CreateOpportunityModal
          stageId={modal.stageId}
          pipelineId={pipelineId}
          onClose={() => setModal(null)}
          onCreated={handleOpCreated}
        />
      )}

      {detailId && (
        <OpportunityDetailModal
          opportunityId={detailId}
          pipelineId={pipelineId}
          stages={stages}
          onClose={() => setDetailId(null)}
          onDeleted={() => setDetailId(null)}
        />
      )}
    </div>
  )
}

function AddStageButton({
  pipelineId,
  onCreated,
}: {
  pipelineId: string
  onCreated: (stage: KanbanStage) => void
}) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleCreate() {
    if (!name.trim()) return
    setLoading(true)
    const res = await fetch(`/api/pipelines/${pipelineId}/stages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim() }),
    })
    if (res.ok) {
      const stage = await res.json()
      onCreated(stage)
      setName('')
      setEditing(false)
    }
    setLoading(false)
  }

  if (editing) {
    return (
      <div className="w-72 shrink-0">
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleCreate()
            if (e.key === 'Escape') { setEditing(false); setName('') }
          }}
          placeholder="Nome da etapa"
          className="w-full rounded-lg bg-zinc-800 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-primary mb-2"
        />
        <div className="flex gap-2">
          <button
            onClick={handleCreate}
            disabled={loading || !name.trim()}
            className="flex-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
          >
            {loading ? '...' : 'Criar'}
          </button>
          <button
            onClick={() => { setEditing(false); setName('') }}
            className="flex-1 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-400 hover:text-white"
          >
            Cancelar
          </button>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="flex items-center gap-2 w-72 shrink-0 rounded-xl border border-dashed border-white/10 px-4 py-3 text-sm text-zinc-500 hover:text-zinc-300 hover:border-white/20 transition-colors"
    >
      <Plus className="h-4 w-4" />
      Nova etapa
    </button>
  )
}

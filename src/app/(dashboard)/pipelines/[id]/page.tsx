import KanbanBoard from '@/components/kanban/KanbanBoard'

export default async function PipelinePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <KanbanBoard pipelineId={id} />
}

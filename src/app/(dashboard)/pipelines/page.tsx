import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Plus, GitBranch } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default async function PipelinesPage() {
  const session = await auth()
  const pipelines = await prisma.pipeline.findMany({
    where: { organizationId: (session?.user as any).organizationId },
    include: { _count: { select: { opportunities: true, stages: true } } },
    orderBy: { createdAt: 'asc' },
  })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Pipelines</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie seus funis de vendas</p>
        </div>
        <Link href="/pipelines/new">
          <Button size="sm">
            <Plus className="h-4 w-4" />
            Novo pipeline
          </Button>
        </Link>
      </div>

      {pipelines.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
            <GitBranch className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-medium text-foreground">Nenhum pipeline criado</h2>
          <p className="text-sm text-muted-foreground mt-1 mb-6">Crie seu primeiro funil de vendas</p>
          <Link href="/pipelines/new">
            <Button>
              <Plus className="h-4 w-4" />
              Criar pipeline
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {pipelines.map((pipeline) => (
            <Link key={pipeline.id} href={`/pipelines/${pipeline.id}`}>
              <div className="group rounded-lg border border-border bg-card p-5 hover:border-primary transition-colors cursor-pointer">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
                    <GitBranch className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                    {pipeline.name}
                  </h3>
                </div>
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span>{pipeline._count.stages} etapas</span>
                  <span>{pipeline._count.opportunities} oportunidades</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { Plus, GitBranch, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Pipeline = {
  id: string
  name: string
  _count: { stages: number; opportunities: number }
}

export default function PipelinesPage() {
  const qc = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  const { data: pipelines = [], isLoading } = useQuery<Pipeline[]>({
    queryKey: ['pipelines'],
    queryFn: () => fetch('/api/pipelines').then((r) => r.json()),
  })

  const createMutation = useMutation({
    mutationFn: (name: string) =>
      fetch('/api/pipelines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      }).then((r) => r.json()),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['pipelines'] })
      setShowModal(false)
      setName('')
    },
    onError: () => setError('Erro ao criar pipeline'),
  })

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!name.trim()) return
    createMutation.mutate(name.trim())
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Pipelines</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie seus funis de vendas</p>
        </div>
        <Button size="sm" onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4" />
          Novo pipeline
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-24">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : pipelines.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
            <GitBranch className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-medium text-foreground">Nenhum pipeline criado</h2>
          <p className="text-sm text-muted-foreground mt-1 mb-6">Crie seu primeiro funil de vendas</p>
          <Button onClick={() => setShowModal(true)}>
            <Plus className="h-4 w-4" />
            Criar pipeline
          </Button>
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

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div className="w-full max-w-sm rounded-xl bg-zinc-900 border border-white/10 shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <h2 className="text-base font-semibold text-white">Novo pipeline</h2>
              <button onClick={() => setShowModal(false)} className="text-zinc-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-zinc-300">Nome do pipeline</Label>
                <Input
                  autoFocus
                  placeholder="Ex: Vendas B2B"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="bg-zinc-800 border-white/10 text-white placeholder:text-zinc-500"
                />
              </div>
              <p className="text-xs text-zinc-500">
                Criado com 4 etapas padrão: Prospecção, Qualificação, Proposta e Fechado.
              </p>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 border-white/10 text-zinc-300 hover:bg-white/5"
                  onClick={() => setShowModal(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1" loading={createMutation.isPending}>
                  Criar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

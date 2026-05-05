'use client'

import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { Plus, GitBranch, X, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
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
    onSuccess: () => {
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
            <PipelineCard
              key={pipeline.id}
              pipeline={pipeline}
              onRenamed={(newName) =>
                qc.setQueryData<Pipeline[]>(['pipelines'], (prev = []) =>
                  prev.map((p) => (p.id === pipeline.id ? { ...p, name: newName } : p)),
                )
              }
              onDeleted={() =>
                qc.setQueryData<Pipeline[]>(['pipelines'], (prev = []) =>
                  prev.filter((p) => p.id !== pipeline.id),
                )
              }
            />
          ))}
        </div>
      )}

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div className="w-full max-w-sm rounded-xl bg-card border border-border shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-base font-semibold text-foreground">Novo pipeline</h2>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-foreground">Nome do pipeline</Label>
                <Input
                  autoFocus
                  placeholder="Ex: Vendas B2B"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Criado com 4 etapas padrão: Prospecção, Qualificação, Proposta e Fechado.
              </p>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 border-border text-muted-foreground hover:bg-muted"
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

function PipelineCard({
  pipeline,
  onRenamed,
  onDeleted,
}: {
  pipeline: Pipeline
  onRenamed: (name: string) => void
  onDeleted: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [draft, setDraft] = useState(pipeline.name)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    function handle(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [menuOpen])

  const renameMutation = useMutation({
    mutationFn: (name: string) =>
      fetch(`/api/pipelines/${pipeline.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      }).then((r) => r.json()),
    onSuccess: (_, name) => {
      onRenamed(name)
      setRenaming(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () =>
      fetch(`/api/pipelines/${pipeline.id}`, { method: 'DELETE' }).then((r) => r.json()),
    onSuccess: onDeleted,
  })

  function commitRename() {
    const trimmed = draft.trim()
    if (!trimmed) { setDraft(pipeline.name); setRenaming(false); return }
    if (trimmed === pipeline.name) { setRenaming(false); return }
    renameMutation.mutate(trimmed)
  }

  return (
    <div className="group relative rounded-lg border border-border bg-card p-5 hover:border-primary transition-colors">
      {/* Actions menu */}
      <div className="absolute top-3 right-3" ref={menuRef}>
        <button
          onClick={(e) => { e.preventDefault(); setMenuOpen((o) => !o) }}
          className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-7 z-10 w-36 rounded-lg border border-border bg-card shadow-xl py-1">
            <button
              onClick={() => { setMenuOpen(false); setRenaming(true); setDraft(pipeline.name) }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
            >
              <Pencil className="h-3.5 w-3.5" /> Renomear
            </button>
            <button
              onClick={() => {
                setMenuOpen(false)
                if (confirm(`Deletar "${pipeline.name}"? Todas as etapas e oportunidades serão removidas.`))
                  deleteMutation.mutate()
              }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-red-400/10 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" /> Deletar
            </button>
          </div>
        )}
      </div>

      <Link href={`/pipelines/${pipeline.id}`} className="block">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
            <GitBranch className="h-4 w-4 text-primary" />
          </div>
          {renaming ? (
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitRename()
                if (e.key === 'Escape') { setRenaming(false); setDraft(pipeline.name) }
                e.stopPropagation()
              }}
              onClick={(e) => e.preventDefault()}
              className="flex-1 bg-transparent border-b border-primary text-sm font-medium text-foreground outline-none"
            />
          ) : (
            <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
              {pipeline.name}
            </h3>
          )}
        </div>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>{pipeline._count.stages} etapas</span>
          <span>{pipeline._count.opportunities} oportunidades</span>
        </div>
      </Link>
    </div>
  )
}

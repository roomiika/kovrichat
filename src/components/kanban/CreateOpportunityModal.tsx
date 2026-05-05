'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Props {
  stageId: string
  pipelineId: string
  onClose: () => void
  onCreated: (opportunity: any) => void
}

export default function CreateOpportunityModal({ stageId, pipelineId, onClose, onCreated }: Props) {
  const [form, setForm] = useState({ title: '', contactName: '', contactPhone: '', value: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/opportunities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          contactName: form.contactName,
          contactPhone: form.contactPhone || undefined,
          value: form.value ? Number(form.value) : undefined,
          stageId,
          pipelineId,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Erro ao criar card')
        setLoading(false)
        return
      }

      onCreated(data)
      onClose()
    } catch {
      setError('Erro de conexão')
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md rounded-xl bg-card border border-border shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">Novo card</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-foreground">Título *</Label>
            <Input
              name="title"
              placeholder="Ex: Reunião com cliente"
              value={form.title}
              onChange={handleChange}
              required
              className="bg-background border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-foreground">Nome do contato *</Label>
            <Input
              name="contactName"
              placeholder="Ex: João Silva"
              value={form.contactName}
              onChange={handleChange}
              required
              className="bg-background border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-foreground">Telefone</Label>
              <Input
                name="contactPhone"
                placeholder="(11) 99999-9999"
                value={form.contactPhone}
                onChange={handleChange}
                className="bg-background border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-foreground">Valor (R$)</Label>
              <Input
                name="value"
                type="number"
                min="0"
                step="0.01"
                placeholder="0,00"
                value={form.value}
                onChange={handleChange}
                className="bg-background border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              className="flex-1 border-border text-muted-foreground hover:bg-muted"
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" loading={loading}>
              Criar card
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

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
      <div className="w-full max-w-md rounded-xl bg-zinc-900 border border-white/10 shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h2 className="text-base font-semibold text-white">Novo card</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-zinc-300">Título *</Label>
            <Input
              name="title"
              placeholder="Ex: Reunião com cliente"
              value={form.title}
              onChange={handleChange}
              required
              className="bg-zinc-800 border-white/10 text-white placeholder:text-zinc-500"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-zinc-300">Nome do contato *</Label>
            <Input
              name="contactName"
              placeholder="Ex: João Silva"
              value={form.contactName}
              onChange={handleChange}
              required
              className="bg-zinc-800 border-white/10 text-white placeholder:text-zinc-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-zinc-300">Telefone</Label>
              <Input
                name="contactPhone"
                placeholder="(11) 99999-9999"
                value={form.contactPhone}
                onChange={handleChange}
                className="bg-zinc-800 border-white/10 text-white placeholder:text-zinc-500"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-zinc-300">Valor (R$)</Label>
              <Input
                name="value"
                type="number"
                min="0"
                step="0.01"
                placeholder="0,00"
                value={form.value}
                onChange={handleChange}
                className="bg-zinc-800 border-white/10 text-white placeholder:text-zinc-500"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              className="flex-1 border-white/10 text-zinc-300 hover:bg-white/5"
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

'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus, Users, Search, X, Phone, Mail, Building2,
  ChevronRight, Loader2, Trash2, CheckCircle2, XCircle, Circle,
} from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'

type Contact = {
  id: string
  name: string
  email: string | null
  phone: string | null
  company: string | null
  createdAt: string
  _count: { opportunities: number }
}

type Opportunity = {
  id: string
  title: string
  value: string | null
  status: 'OPEN' | 'WON' | 'LOST'
  stage: { name: string; color: string }
  pipeline: { id: string; name: string }
}

type ContactDetail = Contact & { opportunities: Opportunity[] }

export default function ContactsPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)

  const { data: contacts = [], isLoading } = useQuery<Contact[]>({
    queryKey: ['contacts'],
    queryFn: () => fetch('/api/contacts').then((r) => r.json()),
  })

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return contacts
    return contacts.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone?.includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.company?.toLowerCase().includes(q),
    )
  }, [contacts, search])

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Contatos</h1>
          <p className="text-sm text-muted-foreground mt-1">{contacts.length} contatos</p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" />
          Novo contato
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-5 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome, telefone, email..."
          className="w-full rounded-lg border border-border bg-card pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : contacts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-medium text-foreground">Nenhum contato</h2>
          <p className="text-sm text-muted-foreground mt-1 mb-6">Adicione seu primeiro lead ou cliente</p>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4" />
            Adicionar contato
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground py-12 text-center">Nenhum resultado para "{search}"</p>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Nome</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden sm:table-cell">Telefone</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden md:table-cell">Empresa</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Oportunidades</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((contact, i) => (
                <tr
                  key={contact.id}
                  onClick={() => setDetailId(contact.id)}
                  className={cn(
                    'hover:bg-muted/30 transition-colors cursor-pointer',
                    i < filtered.length - 1 && 'border-b border-border',
                  )}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {contact.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{contact.name}</p>
                        {contact.email && (
                          <p className="text-xs text-muted-foreground">{contact.email}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                    {contact.phone || '—'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                    {contact.company || '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={cn(
                      'text-xs font-medium',
                      contact._count.opportunities > 0 ? 'text-foreground' : 'text-muted-foreground',
                    )}>
                      {contact._count.opportunities}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <CreateContactModal
          onClose={() => setShowCreate(false)}
          onCreated={(c) => {
            qc.setQueryData<Contact[]>(['contacts'], (prev = []) => [c, ...prev])
            setShowCreate(false)
          }}
        />
      )}

      {detailId && (
        <ContactDetailPanel
          contactId={detailId}
          onClose={() => setDetailId(null)}
          onUpdated={(updated) => {
            qc.setQueryData<Contact[]>(['contacts'], (prev = []) =>
              prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)),
            )
          }}
          onDeleted={(id) => {
            qc.setQueryData<Contact[]>(['contacts'], (prev = []) => prev.filter((c) => c.id !== id))
            setDetailId(null)
          }}
        />
      )}
    </div>
  )
}

// ─── Create modal ─────────────────────────────────────────────────────────────

function CreateContactModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (c: Contact) => void
}) {
  const [form, setForm] = useState({ name: '', phone: '', email: '', company: '' })
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: () =>
      fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      }).then((r) => r.json()),
    onSuccess: (data) => {
      if (data.error) { setError(data.error); return }
      onCreated(data)
    },
    onError: () => setError('Erro ao criar contato'),
  })

  function field(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [key]: e.target.value }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-sm rounded-xl bg-zinc-900 border border-white/10 shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h2 className="text-base font-semibold text-white">Novo contato</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-5 space-y-3">
          <div className="space-y-1.5">
            <Label className="text-zinc-300">Nome *</Label>
            <Input autoFocus value={form.name} onChange={field('name')} placeholder="Nome completo" className="bg-zinc-800 border-white/10 text-white placeholder:text-zinc-500" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-zinc-300">Telefone</Label>
            <Input value={form.phone} onChange={field('phone')} placeholder="(11) 99999-9999" className="bg-zinc-800 border-white/10 text-white placeholder:text-zinc-500" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-zinc-300">Email</Label>
            <Input type="email" value={form.email} onChange={field('email')} placeholder="email@exemplo.com" className="bg-zinc-800 border-white/10 text-white placeholder:text-zinc-500" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-zinc-300">Empresa</Label>
            <Input value={form.company} onChange={field('company')} placeholder="Nome da empresa" className="bg-zinc-800 border-white/10 text-white placeholder:text-zinc-500" />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" className="flex-1 border-white/10 text-zinc-300 hover:bg-white/5" onClick={onClose}>Cancelar</Button>
            <Button className="flex-1" loading={mutation.isPending} onClick={() => { if (!form.name.trim()) { setError('Nome obrigatório'); return } setError(''); mutation.mutate() }}>Criar</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Contact detail panel ──────────────────────────────────────────────────────

function ContactDetailPanel({
  contactId,
  onClose,
  onUpdated,
  onDeleted,
}: {
  contactId: string
  onClose: () => void
  onUpdated: (c: Partial<Contact> & { id: string }) => void
  onDeleted: (id: string) => void
}) {
  const qc = useQueryClient()

  const { data, isLoading } = useQuery<ContactDetail>({
    queryKey: ['contact', contactId],
    queryFn: () => fetch(`/api/contacts/${contactId}`).then((r) => r.json()),
  })

  const patch = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      fetch(`/api/contacts/${contactId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then((r) => r.json()),
    onSuccess: (updated) => {
      qc.setQueryData(['contact', contactId], (prev: any) => ({ ...prev, ...updated }))
      onUpdated(updated)
    },
  })

  const del = useMutation({
    mutationFn: () => fetch(`/api/contacts/${contactId}`, { method: 'DELETE' }).then((r) => r.json()),
    onSuccess: () => onDeleted(contactId),
  })

  function save(field: string, value: unknown) {
    patch.mutate({ [field]: value })
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative z-10 flex flex-col w-full max-w-md bg-zinc-950 border-l border-white/10 h-full">
        {isLoading || !data ? (
          <div className="flex items-center justify-center flex-1">
            <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 p-5 border-b border-white/10 shrink-0">
              <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
                <X className="h-5 w-5" />
              </button>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary shrink-0">
                {data.name.charAt(0).toUpperCase()}
              </div>
              <EditableText value={data.name} onSave={(v) => save('name', v)} className="flex-1 text-base font-semibold text-white" />
              <button
                onClick={() => { if (confirm('Deletar este contato? As oportunidades serão mantidas.')) del.mutate() }}
                disabled={del.isPending}
                className="p-1.5 text-zinc-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Fields */}
              <div className="p-5 space-y-3.5 border-b border-white/10">
                <FieldRow icon={<Phone className="h-3.5 w-3.5" />} label="Telefone">
                  <EditableText value={data.phone ?? ''} placeholder="Adicionar telefone" onSave={(v) => save('phone', v)} className="flex-1 text-sm text-white" />
                </FieldRow>
                <FieldRow icon={<Mail className="h-3.5 w-3.5" />} label="Email">
                  <EditableText value={data.email ?? ''} placeholder="Adicionar email" onSave={(v) => save('email', v)} className="flex-1 text-sm text-white" />
                </FieldRow>
                <FieldRow icon={<Building2 className="h-3.5 w-3.5" />} label="Empresa">
                  <EditableText value={data.company ?? ''} placeholder="Adicionar empresa" onSave={(v) => save('company', v)} className="flex-1 text-sm text-white" />
                </FieldRow>
              </div>

              {/* Opportunities */}
              <div className="p-5">
                <p className="text-xs font-medium text-zinc-400 mb-3">
                  Oportunidades ({data.opportunities.length})
                </p>
                {data.opportunities.length === 0 ? (
                  <p className="text-xs text-zinc-600">Nenhuma oportunidade.</p>
                ) : (
                  <div className="space-y-2">
                    {data.opportunities.map((opp) => (
                      <Link key={opp.id} href={`/pipelines/${opp.pipeline.id}`}>
                        <div className="flex items-center gap-3 rounded-lg bg-zinc-900 border border-white/5 px-3 py-2.5 hover:border-white/15 transition-colors">
                          <StatusIcon status={opp.status} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{opp.title}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: opp.stage.color }} />
                              <span className="text-xs text-zinc-500 truncate">{opp.pipeline.name} · {opp.stage.name}</span>
                            </div>
                          </div>
                          {opp.value && Number(opp.value) > 0 && (
                            <span className="text-xs font-semibold text-emerald-400 shrink-0">
                              {formatCurrency(Number(opp.value))}
                            </span>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'WON') return <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
  if (status === 'LOST') return <XCircle className="h-4 w-4 text-red-400 shrink-0" />
  return <Circle className="h-4 w-4 text-zinc-500 shrink-0" />
}

function FieldRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5 w-24 shrink-0 text-zinc-500">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      {children}
    </div>
  )
}

function EditableText({
  value, placeholder = '', onSave, className = '',
}: {
  value: string; placeholder?: string; onSave: (v: string) => void; className?: string
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  function commit() {
    setEditing(false)
    const trimmed = draft.trim()
    if (trimmed !== value) onSave(trimmed)
    else setDraft(value)
  }

  if (editing) {
    return (
      <input
        autoFocus value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setEditing(false); setDraft(value) } }}
        className={cn(className, 'bg-zinc-800 border border-primary/50 rounded px-2 py-0.5 outline-none w-full')}
      />
    )
  }

  return (
    <button
      onClick={() => { setDraft(value); setEditing(true) }}
      className={cn(className, 'text-left hover:bg-white/5 rounded px-2 py-0.5 transition-colors w-full', !value && 'text-zinc-600')}
    >
      {value || placeholder}
    </button>
  )
}

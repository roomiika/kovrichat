'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Building2, Megaphone, BarChart3, MessageCircle, Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

type OrgSettings = {
  id: string
  name: string
  slug: string
  metaPixelId: string | null
  metaAccessToken: string | null
  googleAdsConversionId: string | null
  googleAdsConvLabel: string | null
  evolutionApiUrl: string | null
  evolutionApiKey: string | null
}

export default function SettingsPage() {
  const { data, isLoading } = useQuery<OrgSettings>({
    queryKey: ['settings'],
    queryFn: () => fetch('/api/settings').then((r) => r.json()),
  })

  if (isLoading || !data) {
    return (
      <div className="p-8 flex justify-center pt-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground">Configurações</h1>
        <p className="text-sm text-muted-foreground mt-1">Gerencie sua organização e integrações</p>
      </div>

      <div className="space-y-6">
        <SettingsSection
          icon={<Building2 className="h-4 w-4" />}
          title="Organização"
          description="Nome da sua empresa no sistema"
        >
          <OrgForm initial={data} />
        </SettingsSection>

        <SettingsSection
          icon={<Megaphone className="h-4 w-4" />}
          title="Meta Ads (CAPI)"
          description="Dispara eventos de conversão para o Meta Pixel via Conversions API"
        >
          <IntegrationForm
            fields={[
              { key: 'metaPixelId', label: 'ID do Pixel', placeholder: '123456789012345' },
              { key: 'metaAccessToken', label: 'Access Token', placeholder: 'EAAxxxxx...', secret: true },
            ]}
            initial={data}
          />
        </SettingsSection>

        <SettingsSection
          icon={<BarChart3 className="h-4 w-4" />}
          title="Google Ads"
          description="Envia conversões offline quando uma oportunidade é marcada como Ganha"
        >
          <IntegrationForm
            fields={[
              { key: 'googleAdsConversionId', label: 'ID de Conversão', placeholder: 'AW-123456789' },
              { key: 'googleAdsConvLabel', label: 'Label da Conversão', placeholder: 'AbC-D_efG-h12_34-567' },
            ]}
            initial={data}
          />
        </SettingsSection>

        <SettingsSection
          icon={<MessageCircle className="h-4 w-4" />}
          title="WhatsApp (Evolution API)"
          description="Conecta ao Evolution API para envio e recebimento de mensagens WhatsApp"
        >
          <IntegrationForm
            fields={[
              { key: 'evolutionApiUrl', label: 'URL da API', placeholder: 'https://evolution.seudominio.com' },
              { key: 'evolutionApiKey', label: 'Chave da API', placeholder: 'sua-chave-aqui', secret: true },
            ]}
            initial={data}
          />
        </SettingsSection>
      </div>
    </div>
  )
}

function SettingsSection({
  icon, title, description, children,
}: {
  icon: React.ReactNode
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

function OrgForm({ initial }: { initial: OrgSettings }) {
  const qc = useQueryClient()
  const [name, setName] = useState(initial.name)
  const [saved, setSaved] = useState(false)

  const mutation = useMutation({
    mutationFn: () =>
      fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      }).then((r) => r.json()),
    onSuccess: (data) => {
      qc.setQueryData(['settings'], data)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    },
  })

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>Nome da organização</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Minha Empresa"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-muted-foreground">Slug</Label>
        <Input value={initial.slug} disabled className="opacity-50 cursor-not-allowed" />
        <p className="text-xs text-muted-foreground">O slug não pode ser alterado após a criação.</p>
      </div>
      <SaveButton loading={mutation.isPending} saved={saved} onClick={() => mutation.mutate()} disabled={!name.trim() || name === initial.name} />
    </div>
  )
}

function IntegrationForm({
  fields,
  initial,
}: {
  fields: { key: keyof OrgSettings; label: string; placeholder: string; secret?: boolean }[]
  initial: OrgSettings
}) {
  const qc = useQueryClient()
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(fields.map((f) => [f.key, (initial[f.key] as string | null) ?? ''])),
  )
  const [saved, setSaved] = useState(false)

  const mutation = useMutation({
    mutationFn: () =>
      fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          Object.fromEntries(fields.map((f) => [f.key, values[f.key] || null])),
        ),
      }).then((r) => r.json()),
    onSuccess: (data) => {
      qc.setQueryData(['settings'], data)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    },
  })

  const isDirty = fields.some((f) => values[f.key] !== ((initial[f.key] as string | null) ?? ''))

  return (
    <div className="space-y-4">
      {fields.map((f) => (
        <div key={f.key} className="space-y-1.5">
          <Label>{f.label}</Label>
          <Input
            type={f.secret ? 'password' : 'text'}
            value={values[f.key]}
            onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
            placeholder={f.placeholder}
          />
        </div>
      ))}
      <SaveButton loading={mutation.isPending} saved={saved} onClick={() => mutation.mutate()} disabled={!isDirty} />
    </div>
  )
}

function SaveButton({
  loading, saved, onClick, disabled,
}: {
  loading: boolean; saved: boolean; onClick: () => void; disabled: boolean
}) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled || loading}
      size="sm"
      className={cn('transition-colors', saved && 'bg-emerald-600 hover:bg-emerald-600')}
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : saved ? (
        <><Check className="h-3.5 w-3.5" /> Salvo</>
      ) : (
        'Salvar'
      )}
    </Button>
  )
}

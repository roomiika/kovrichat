import { Settings } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground">Configurações</h1>
        <p className="text-sm text-muted-foreground mt-1">Gerencie sua conta e integrações</p>
      </div>

      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
          <Settings className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-medium text-foreground">Em breve</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Configurações de conta, integrações e organização.
        </p>
      </div>
    </div>
  )
}

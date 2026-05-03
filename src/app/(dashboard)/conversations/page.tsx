import { MessageSquare } from 'lucide-react'

export default function ConversationsPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground">Conversas</h1>
        <p className="text-sm text-muted-foreground mt-1">WhatsApp, Instagram e Telegram</p>
      </div>

      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
          <MessageSquare className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-medium text-foreground">Em breve</h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-xs">
          Integração com WhatsApp via Evolution API, Instagram e Telegram será disponibilizada em breve.
        </p>
      </div>
    </div>
  )
}

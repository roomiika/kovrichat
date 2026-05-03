import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Plus, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default async function ContactsPage() {
  const session = await auth()
  const contacts = await prisma.contact.findMany({
    where: { organizationId: (session?.user as any).organizationId },
    include: { _count: { select: { opportunities: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Contatos</h1>
          <p className="text-sm text-muted-foreground mt-1">{contacts.length} contatos</p>
        </div>
        <Button size="sm">
          <Plus className="h-4 w-4" />
          Novo contato
        </Button>
      </div>

      {contacts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-medium text-foreground">Nenhum contato</h2>
          <p className="text-sm text-muted-foreground mt-1 mb-6">Adicione seu primeiro lead ou cliente</p>
          <Button>
            <Plus className="h-4 w-4" />
            Adicionar contato
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nome</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Email</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Telefone</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Oportunidades</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Criado</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((contact, i) => (
                <tr
                  key={contact.id}
                  className={`border-b border-border hover:bg-muted/30 transition-colors cursor-pointer ${i === contacts.length - 1 ? 'border-0' : ''}`}
                >
                  <td className="px-4 py-3 font-medium text-foreground">{contact.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{contact.email || '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{contact.phone || '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{contact._count.opportunities}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDistanceToNow(contact.createdAt, { locale: ptBR, addSuffix: true })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

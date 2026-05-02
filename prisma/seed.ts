import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const password = await bcrypt.hash('admin123', 12)

  const org = await prisma.organization.upsert({
    where: { slug: 'demo' },
    update: {},
    create: {
      name: 'Demo Company',
      slug: 'demo',
      users: {
        create: {
          name: 'Admin',
          email: 'admin@demo.com',
          password,
          role: 'OWNER',
        },
      },
    },
    include: { users: true },
  })

  const pipeline = await prisma.pipeline.upsert({
    where: { id: 'seed-pipeline' },
    update: {},
    create: {
      id: 'seed-pipeline',
      name: 'Pipeline Principal',
      organizationId: org.id,
      stages: {
        create: [
          { name: 'Prospecção', order: 0, color: '#6366f1' },
          { name: 'Qualificação', order: 1, color: '#f59e0b' },
          { name: 'Proposta', order: 2, color: '#3b82f6' },
          { name: 'Negociação', order: 3, color: '#8b5cf6' },
          { name: 'Fechado Ganho', order: 4, color: '#10b981' },
        ],
      },
    },
  })

  console.log(`✅ Seed concluído: org=${org.slug}, pipeline=${pipeline.name}`)
  console.log(`   Login: admin@demo.com / admin123`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

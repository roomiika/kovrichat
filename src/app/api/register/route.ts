import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { registerSchema } from '@/lib/validations/auth'
import { rateLimit } from '@/lib/middleware/rate-limit'
import { slugify } from '@/lib/utils'

export async function POST(req: NextRequest) {
  const limited = await rateLimit(req, 'auth')
  if (limited) return limited

  const body = await req.json()
  const parsed = registerSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos', issues: parsed.error.flatten().fieldErrors },
      { status: 422 }
    )
  }

  const { name, email, password, organizationName } = parsed.data

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: 'Email já cadastrado' }, { status: 409 })
  }

  const hashed = await bcrypt.hash(password, 12)
  const slug = slugify(organizationName)

  const org = await prisma.organization.findUnique({ where: { slug } })
  const orgSlug = org ? `${slug}-${Date.now()}` : slug

  const user = await prisma.organization
    .create({
      data: {
        name: organizationName,
        slug: orgSlug,
        users: {
          create: {
            name,
            email,
            password: hashed,
            role: 'OWNER',
          },
        },
      },
      include: { users: true },
    })
    .then((o) => o.users[0])

  return NextResponse.json({ id: user.id, email: user.email }, { status: 201 })
}

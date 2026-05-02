import { z } from 'zod'

export const contactSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório').max(100),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z
    .string()
    .regex(/^\+?[\d\s\-()]{8,20}$/, 'Telefone inválido')
    .optional()
    .or(z.literal('')),
  company: z.string().max(100).optional().or(z.literal('')),
  notes: z.string().max(2000).optional().or(z.literal('')),
})

export type ContactInput = z.infer<typeof contactSchema>

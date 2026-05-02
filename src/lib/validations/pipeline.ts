import { z } from 'zod'

export const pipelineSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório').max(80),
})

export const stageSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório').max(60),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Cor inválida').default('#6366f1'),
  order: z.number().int().min(0),
})

export const opportunitySchema = z.object({
  title: z.string().min(1, 'Título obrigatório').max(120),
  value: z.coerce.number().min(0).optional(),
  stageId: z.string().cuid(),
  contactId: z.string().cuid(),
  pipelineId: z.string().cuid(),
})

export const moveOpportunitySchema = z.object({
  stageId: z.string().cuid(),
  order: z.number().int().min(0),
})

export type PipelineInput = z.infer<typeof pipelineSchema>
export type StageInput = z.infer<typeof stageSchema>
export type OpportunityInput = z.infer<typeof opportunitySchema>
export type MoveOpportunityInput = z.infer<typeof moveOpportunitySchema>

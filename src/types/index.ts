import type { User, Contact, Pipeline, Stage, Opportunity, Activity, Organization } from '@prisma/client'

export type { UserRole, OpportunityStatus, ActivityType, Channel } from '@prisma/client'

export type OpportunityWithRelations = Opportunity & {
  contact: Contact
  stage: Stage
  activities: Activity[]
}

export type StageWithOpportunities = Stage & {
  opportunities: OpportunityWithRelations[]
}

export type PipelineWithStages = Pipeline & {
  stages: StageWithOpportunities[]
}

export type SessionUser = {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
  organizationId: string
  role: import('@prisma/client').UserRole
}

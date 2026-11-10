import { supabase } from '../../../lib/supabase'
import type { Lead, LeadStatus, OutreachStatus } from '../types'

const leadStatuses = [
  'New',
  'Contacted',
  'Qualified',
  'Proposal Sent',
  'Negotiation',
] as const satisfies readonly LeadStatus[]

const leadSources = ['Website', 'LinkedIn', 'Referral', 'Inbound'] as const satisfies readonly Lead['source'][]

const outreachStatuses = [
  'Not Started',
  'Sequence Live',
  'Replied',
  'Meeting Booked',
] as const satisfies readonly OutreachStatus[]

export type WorkspaceLeadsResult =
  | {
      status: 'ready'
      workspaceId: string
      leads: Lead[]
    }
  | {
      status: 'empty-workspace'
      message: string
    }
  | {
      status: 'error'
      message: string
    }

type MappedLead =
  | { ok: true; lead: Lead }
  | { ok: false; message: string }

const leadColumns =
  'id, company, industry, status, score, source, date_added, contact_name, contact_role, website, employee_range, outreach_status, tags, notes, timeline'

export async function fetchOwnerWorkspaceLeads(userId: string): Promise<WorkspaceLeadsResult> {
  if (typeof userId !== 'string' || !userId.trim()) {
    return {
      status: 'error',
      message: 'A signed-in user is required to load leads.',
    }
  }

  const normalizedUserId = userId.trim()

  const { data: memberships, error: membershipError } = await supabase
    .from('workspace_members')
    .select('workspace_id, joined_at')
    .eq('user_id', normalizedUserId)
    .eq('role', 'owner')
    .order('joined_at', { ascending: true })
    .order('workspace_id', { ascending: true })
    .limit(1)

  if (membershipError) {
    return {
      status: 'error',
      message: `Could not resolve the owner workspace: ${membershipError.message}`,
    }
  }

  if (!Array.isArray(memberships) || memberships.length === 0) {
    return {
      status: 'empty-workspace',
      message: 'No owner workspace is available for this account.',
    }
  }

  const workspaceId = readWorkspaceId(memberships[0])
  if (!workspaceId) {
    return {
      status: 'error',
      message: 'Could not resolve the owner workspace: the membership row did not include a workspace id.',
    }
  }

  const { data: rows, error: leadsError } = await supabase
    .from('leads')
    .select(leadColumns)
    .eq('workspace_id', workspaceId)
    .order('date_added', { ascending: false })

  if (leadsError) {
    return {
      status: 'error',
      message: `Could not load leads: ${leadsError.message}`,
    }
  }

  if (!Array.isArray(rows)) {
    return {
      status: 'error',
      message: 'Could not load leads: the response was not a list of leads.',
    }
  }

  const leads: Lead[] = []
  for (const row of rows) {
    const mapped = mapLeadRow(row)
    if (!mapped.ok) {
      return {
        status: 'error',
        message: mapped.message,
      }
    }
    leads.push(mapped.lead)
  }

  return {
    status: 'ready',
    workspaceId,
    leads,
  }
}

export function mapLeadRow(row: unknown): MappedLead {
  if (!isRecord(row)) {
    return { ok: false, message: 'Could not load leads: a lead row was not an object.' }
  }

  const id = readPresentText(row.id)
  if (!id) {
    return { ok: false, message: 'Could not load leads: a lead row is missing a valid id.' }
  }

  const company = readText(row.company)
  const industry = readText(row.industry)
  const dateAdded = readText(row.date_added)
  const contactName = readText(row.contact_name)
  const contactRole = readText(row.contact_role)
  const website = readText(row.website)
  const employeeRange = readText(row.employee_range)
  const status = toLeadStatus(row.status)
  const source = toLeadSource(row.source)
  const outreachStatus = toOutreachStatus(row.outreach_status)
  const notes = readNotes(row.notes)
  const tags = readTags(row.tags)

  const invalidField = firstInvalidField([
    ['company', company],
    ['industry', industry],
    ['date_added', dateAdded],
    ['contact_name', contactName],
    ['contact_role', contactRole],
    ['website', website],
    ['employee_range', employeeRange],
    ['status', status],
    ['source', source],
    ['outreach_status', outreachStatus],
    ['notes', notes],
    ['tags', tags],
  ])

  if (invalidField) {
    return {
      ok: false,
      message: `Could not load leads: lead ${id} has an invalid ${invalidField}.`,
    }
  }

  return {
    ok: true,
    lead: {
      id,
      company: company as string,
      industry: industry as string,
      status: status as LeadStatus,
      score: typeof row.score === 'number' && Number.isFinite(row.score) ? row.score : 0,
      source: source as Lead['source'],
      dateAdded: dateAdded as string,
      contactName: contactName as string,
      contactRole: contactRole as string,
      website: website as string,
      employeeRange: employeeRange as string,
      outreachStatus: outreachStatus as OutreachStatus,
      tags: tags as string[],
      notes: notes as string,
      timeline: mapTimeline(row.timeline),
    },
  }
}

function readWorkspaceId(membership: unknown): string | null {
  if (!isRecord(membership)) return null
  return readPresentText(membership.workspace_id)
}

function readText(value: unknown): string | null {
  return typeof value === 'string' ? value : null
}

function readPresentText(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function readNotes(value: unknown): string | null {
  if (value == null) return ''
  return typeof value === 'string' ? value : null
}

function readTags(value: unknown): string[] | null {
  if (value == null) return []
  if (!Array.isArray(value)) return null
  if (!value.every((tag): tag is string => typeof tag === 'string')) return null
  return value
}

function toLeadStatus(value: unknown): LeadStatus | null {
  if (typeof value !== 'string') return null
  if (isListed(leadStatuses, value)) return value
  return value.trim() ? (value as LeadStatus) : 'New'
}

function toLeadSource(value: unknown): Lead['source'] | null {
  if (typeof value !== 'string') return null
  if (isListed(leadSources, value)) return value
  return value.trim() ? (value as Lead['source']) : 'Website'
}

function toOutreachStatus(value: unknown): OutreachStatus | null {
  if (typeof value !== 'string') return null
  if (isListed(outreachStatuses, value)) return value
  return value.trim() ? (value as OutreachStatus) : 'Not Started'
}

function firstInvalidField(fields: Array<[string, unknown]>): string | null {
  const invalid = fields.find(([, value]) => value === null)
  return invalid ? invalid[0] : null
}

function isListed<T extends string>(values: readonly T[], value: string): value is T {
  return values.some((item) => item === value)
}

function mapTimeline(value: unknown): Lead['timeline'] {
  if (!Array.isArray(value)) return []

  return value.flatMap((entry) => {
    if (!isRecord(entry)) return []
    const label = entry.label
    const time = entry.time
    if (!isPresentText(label) || !isPresentText(time)) return []
    return [{ label: label.trim(), time: time.trim() }]
  })
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isPresentText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

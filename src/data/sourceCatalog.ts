import { tickets } from './tickets'

export interface CatalogSource {
  id: string
  title: string
  items: number
  updated: string
  kind: 'procedure' | 'guideline'
}

const PROCEDURE_UPDATES = [
  '1 day ago',
  '2 days ago',
  '3 days ago',
  '4 days ago',
  '1 week ago',
  '2 weeks ago',
  '1 month ago',
] as const

export const PROCEDURES: CatalogSource[] = Array.from(
  new Set(tickets.map((ticket) => ticket.intent)),
).map((intent, index) => ({
  id: `procedure-${intent.toLowerCase().replace(/\s+/g, '-')}`,
  title: `${intent} procedure`,
  items: 1,
  updated: PROCEDURE_UPDATES[index % PROCEDURE_UPDATES.length],
  kind: 'procedure' as const,
}))

export const COMMUNICATION_GUIDELINES: CatalogSource[] = [
  {
    id: 'guideline-automatic',
    title: 'Automatic',
    items: 1,
    updated: '1 day ago',
    kind: 'guideline',
  },
  {
    id: 'guideline-brand-voice',
    title: 'Brand voice',
    items: 1,
    updated: '3 days ago',
    kind: 'guideline',
  },
  {
    id: 'guideline-empathy-first',
    title: 'Empathy first',
    items: 1,
    updated: '1 week ago',
    kind: 'guideline',
  },
  {
    id: 'guideline-escalation-tone',
    title: 'Escalation tone',
    items: 1,
    updated: '2 weeks ago',
    kind: 'guideline',
  },
  {
    id: 'guideline-concise-replies',
    title: 'Concise replies',
    items: 1,
    updated: '1 month ago',
    kind: 'guideline',
  },
]

export const ACTIVE_GUIDELINE_ID = 'guideline-automatic'

export const TIP_SOURCE_CATALOG: CatalogSource[] = [...PROCEDURES, ...COMMUNICATION_GUIDELINES]

export function procedureIdForTitle(title: string): string | null {
  return PROCEDURES.find((procedure) => procedure.title === title)?.id ?? null
}

export function isTipSourceId(id: string): boolean {
  return TIP_SOURCE_CATALOG.some((source) => source.id === id)
}

export interface TipSourceItem {
  id: string
  title: string
  kind: 'procedure' | 'guideline'
  active: boolean
}

export function buildTipSources(
  selectedIds: string[],
  removedIds: string[],
): TipSourceItem[] {
  const byId = new Map(TIP_SOURCE_CATALOG.map((source) => [source.id, source]))
  const items: TipSourceItem[] = []

  selectedIds.forEach((id) => {
    const source = byId.get(id)
    if (source) {
      items.push({
        id: source.id,
        title: source.title,
        kind: source.kind,
        active: true,
      })
    }
  })

  removedIds.forEach((id) => {
    if (selectedIds.includes(id)) return
    const source = byId.get(id)
    if (source) {
      items.push({
        id: source.id,
        title: source.title,
        kind: source.kind,
        active: false,
      })
    }
  })

  return items
}

export function applySourceSelection(
  previousSelected: string[],
  previousRemoved: string[],
  nextSelected: string[],
): { selected: string[]; removed: string[] } {
  const tipNext = nextSelected.filter(isTipSourceId)
  const previouslyShown = new Set([...previousSelected, ...previousRemoved])
  const removed = [...previouslyShown].filter((id) => !tipNext.includes(id))
  return { selected: tipNext, removed }
}

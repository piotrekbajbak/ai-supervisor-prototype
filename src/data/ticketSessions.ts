import type { AaAction, AaSuggestionData } from './aaSuggestions'

export type PersistedAaPhase = 'composer' | 'ready'

export interface TicketReply {
  id: string
  role: 'customer' | 'agent'
  name: string
  avatar: string
  /** Primary / first bubble text. */
  body: string
  /** All speech bubbles in this message group (includes `body` as first). */
  bodies: string[]
  timestamp: string
  /** Last time a bubble was added to this group (ms). */
  updatedAt: number
  events?: AaAction[]
  /** True when the reply came from approving an Auto Assist suggestion. */
  assisted?: boolean
}

export interface TicketSession {
  phase: PersistedAaPhase
  answerReady: boolean
  answerLoading: boolean
  bannerPhase: 'hidden' | 'open'
  readyBranchConsumed: boolean
  composerHtml: string
  composerEmpty: boolean
  replies: TicketReply[]
  /** Extra customer bubbles attached to the ticket’s original message. */
  seedFollowUps: string[]
  seedUpdatedAt: number
  suggestionDraft: AaSuggestionData | null
}

const sessions = new Map<string, TicketSession>()

export function getTicketSession(ticketId: string): TicketSession | undefined {
  return sessions.get(ticketId)
}

export function setTicketSession(ticketId: string, session: TicketSession) {
  sessions.set(ticketId, session)
}

export function createFreshTicketSession(hasSuggestion: boolean): TicketSession {
  const now = Date.now()
  return {
    phase: 'composer',
    answerReady: false,
    answerLoading: hasSuggestion,
    bannerPhase: 'hidden',
    readyBranchConsumed: false,
    composerHtml: '',
    composerEmpty: true,
    replies: [],
    seedFollowUps: [],
    seedUpdatedAt: now,
    suggestionDraft: null,
  }
}

/** Normalize older persisted replies that only had `body`. */
export function normalizeTicketReply(reply: TicketReply | (Omit<TicketReply, 'bodies' | 'updatedAt'> & {
  bodies?: string[]
  updatedAt?: number
})): TicketReply {
  const bodies =
    reply.bodies && reply.bodies.length > 0 ? reply.bodies : [reply.body]
  return {
    ...reply,
    body: bodies[0] ?? reply.body,
    bodies,
    updatedAt: reply.updatedAt ?? Date.now(),
  }
}

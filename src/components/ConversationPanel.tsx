import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from 'react'
import { useAvatarBubbleColor } from '../hooks/useAvatarBubbleColor'
import { agentAvatar } from '../data/animalAvatars'
import styled, { keyframes, css } from 'styled-components'
import { Avatar, Button, Tag, TooltipDialog } from '@zendesk-ui/react-components'
import { IconButton, SmallButton } from './IconButton'
import AaSuggestion from './AaSuggestion'
import AaComposerBanner from './AaComposerBanner'
import AaFeedbackTip from './AaFeedbackTip'
import AddKnowledgeModal from './AddKnowledgeModal'
import TipSourcesList from './TipSourcesList'
import MessageEvents from './MessageEvents'
import SliderIcon from '@zendesk-ui/assets/icons/20px/slider-stroke.svg?react'
import DotsVerticalIcon from '@zendesk-ui/assets/icons/20px/dots-vertical.svg?react'
import NotePencilIcon from '@zendesk-ui/assets/icons/20px/note-pencil-stroke.svg?react'
import EmojiHappyIcon from '@zendesk-ui/assets/icons/20px/emoji-happy-stroke.svg?react'
import PaperclipIcon from '@zendesk-ui/assets/icons/20px/paperclip.svg?react'
import PencilSparkleIcon from '@zendesk-ui/assets/icons/20px/pencil-sparkle-stroke.svg?react'
import PlusIcon from '@zendesk-ui/assets/icons/20px/plus.svg?react'
import ChevronDownIcon from '@zendesk-ui/assets/icons/20px/chevron-down.svg?react'
import SparkleFillIcon from '@zendesk-ui/assets/icons/20px/sparkle-fill.svg?react'
import { flora } from '../flora/tokens'
import { typeStyle } from '../flora/typography'
import {
  getAaSuggestion,
  regenerateSuggestionFromSources,
} from '../data/aaSuggestions'
import {
  ACTIVE_GUIDELINE_ID,
  applySourceSelection,
  buildTipSources,
  procedureIdForTitle,
} from '../data/sourceCatalog'
import type { AaAction, AaSuggestionData } from '../data/aaSuggestions'
import type { TicketItem } from '../data/tickets'
import { generateCustomerReply } from '../data/customerReplies'
import {
  createFreshTicketSession,
  getTicketSession,
  normalizeTicketReply,
  setTicketSession,
  type TicketSession,
} from '../data/ticketSessions'

const AA_PURPLE = '#9256b1'
const AA_PLANNING_MS = 2200
const AA_GENERATING_MS = 2800
const AA_LOAD_MS = AA_PLANNING_MS + AA_GENERATING_MS
const AA_POST_SEND_MS = 1600
const POST_THINKING_MS = 2000
const CLIENT_TYPING_MS = 3000
const CLIENT_REVEAL_MS = 520
/** Customer follow-ups within this window stack under the same message group. */
const CUSTOMER_GROUP_MS = 3 * 60 * 1000
const INSET_MS = 380
const INSET_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'
const MESSAGE_ENTER_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'
const AGENT_NAME = 'Alex Morgan'

type AaPhase = 'composer' | 'ready' | 'loading'
type PostAssistPhase =
  | 'idle'
  | 'thinking'
  | 'waiting'
  | 'waitingTucking'
  | 'peek'
  | 'deactivated'
  | 'deactivatedTucking'
  | 'deactivatedPeek'
type BannerSlotState = 'hidden' | 'raised' | 'tucking' | 'peek'

const BANNER_PEEK_PX = 12
const BANNER_RAISED_GAP_PX = 8
/** Slow crawl, then a short snap under the composer (linear timing + keyframe split). */
const BANNER_TUCK_MS = 2200

/* Stays in flow while tucking so the convo doesn't jump until peek. */
const bannerTuck = keyframes`
  0% {
    transform: translateY(0);
  }
  /* ~85% of time: barely drift down */
  85% {
    transform: translateY(12px);
  }
  /* last ~15%: jump straight to peek */
  100% {
    transform: translateY(calc(100% + ${BANNER_RAISED_GAP_PX}px - ${BANNER_PEEK_PX}px));
  }
`

interface LogMessage {
  id: string
  role: 'customer' | 'agent'
  name: string
  avatar: string
  body: string
  bodies: string[]
  timestamp: string
  updatedAt: number
  events?: AaAction[]
  assisted?: boolean
}

const dotBounce = keyframes`
  0%, 80%, 100% {
    transform: translateY(0);
    opacity: 0.35;
  }
  40% {
    transform: translateY(-3px);
    opacity: 1;
  }
`

const revealSuggestion = keyframes`
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.92);
    transform-origin: top right;
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
    transform-origin: top right;
  }
`

const revealMessageCustomer = keyframes`
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`

const Root = styled.section`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #ffffff;
  container-type: size;
  container-name: conversation-panel;
`

const Header = styled.header`
  display: flex;
  align-items: flex-start;
  gap: 20px;
  padding: 12px 12px 0 20px;
  flex-shrink: 0;
`

const HeaderText = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
`

const Title = styled.h1`
  margin: 0;
  ${typeStyle('mediumBold')}
  color: ${flora.fg.strong};
`

const Meta = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
`

const Divider = styled.span`
  width: 1px;
  height: 12px;
  background: #dcdcda;
  flex-shrink: 0;
`

const MetaText = styled.span`
  ${typeStyle('smallDefault')}
  color: ${flora.fg.subtle};
`

const Status = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  ${typeStyle('smallDefault')}
  color: ${flora.fg.default};
`

const StatusDot = styled.span<{ $color: string }>`
  width: 8px;
  height: 8px;
  border-radius: 100px;
  background: ${({ $color }) => $color};
`

const IntentLabel = styled.span`
  ${typeStyle('smallDefault')}
  color: ${flora.fg.muted};
`

const IntentValue = styled.a`
  ${typeStyle('smallDefault')}
  color: ${flora.fg.primary};
  text-decoration: none;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
`

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  flex-shrink: 0;
  padding-top: 5px;
`

const Conversation = styled.div`
  flex: 1;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  padding: 12px 20px;
  scroll-behavior: auto;
`

const ConversationStack = styled.div`
  min-height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
`

const ConversationInner = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 28px;
`

const ConversationInset = styled.div<{ $height: number; $animate: boolean }>`
  flex-shrink: 0;
  width: 100%;
  height: ${({ $height }) => `${$height}px`};
  pointer-events: none;
  transition: ${({ $animate }) => ($animate ? `height ${INSET_MS}ms ${INSET_EASE}` : 'none')};
`

const Message = styled.article<{ $animateEnter?: boolean; $enterMs?: number }>`
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 720px;
  align-self: flex-start;
  width: min(100%, 720px);

  ${({ $animateEnter, $enterMs = 560 }) =>
    $animateEnter &&
    css`
      animation: ${revealMessageCustomer} ${$enterMs}ms ${MESSAGE_ENTER_EASE} both;
    `}
`

const ActorRow = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  padding-left: 2px;
`

const ActorName = styled.span`
  ${typeStyle('smallBold')}
  color: #151a1e;
`

const AssistedTagButton = styled.button`
  appearance: none;
  border: none;
  background: transparent;
  padding: 0;
  margin: 0;
  cursor: pointer;
  flex-shrink: 0;
  border-radius: 100px;

  &:focus-visible {
    outline: 2px solid ${AA_PURPLE};
    outline-offset: 2px;
  }
`

const AssistedTag = styled(Tag)`
  flex-shrink: 0;
  pointer-events: none;

  /* Garden hides Tag.Avatar on size="small"; Figma keeps the icon. */
  && [data-garden-id='tags.avatar'] {
    display: inline-flex !important;
    width: 12px !important;
    min-width: 12px !important;
    height: 12px !important;
    margin-inline-end: 4px;
    border-radius: 0;
    overflow: visible;
  }

  && [data-garden-id='tags.avatar'] svg,
  && svg {
    width: 12px;
    height: 12px;
  }
`

const AssistedTipBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 360px;
`

const AssistedTipRationale = styled.p`
  margin: 0;
  ${typeStyle('smallDefault')}
  color: ${flora.fg.default};
`


const Timestamp = styled.span`
  margin-left: auto;
  ${typeStyle('smallDefault')}
  color: ${flora.fg.muted};
`

const BubbleStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`

const Bubble = styled.div<{ $background: string }>`
  background: ${({ $background }) => $background};
  border-radius: 0 16px 16px 16px;
  padding: 12px 16px;
  ${typeStyle('mediumDefault')}
  color: #000000;
  white-space: pre-wrap;
  transition: background-color 220ms ease;
`

function SpeechBubble({
  agent,
  avatar,
  children,
}: {
  agent?: boolean
  avatar: string
  children: ReactNode
}) {
  const background = useAvatarBubbleColor(avatar, agent ? 'agent' : 'customer')
  return <Bubble $background={background}>{children}</Bubble>
}

const TypingDots = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-height: 1.2em;
  padding: 2px 2px;
`

const TypingDot = styled.span<{ $delay: number }>`
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: rgba(21, 26, 30, 0.35);
  animation: ${dotBounce} 1.1s ease-in-out infinite;
  animation-delay: ${({ $delay }) => `${$delay}ms`};
`

const PendingBubbleStack = styled.div`
  display: grid;
  align-items: center;
`

const PendingBubbleLayer = styled.div<{ $active: boolean }>`
  grid-area: 1 / 1;
  opacity: ${({ $active }) => ($active ? 1 : 0)};
  transform: ${({ $active }) => ($active ? 'translateY(0)' : 'translateY(3px)')};
  transition:
    opacity ${CLIENT_REVEAL_MS}ms ${MESSAGE_ENTER_EASE},
    transform ${CLIENT_REVEAL_MS}ms ${MESSAGE_ENTER_EASE};
  pointer-events: ${({ $active }) => ($active ? 'auto' : 'none')};
`

const ComposerWrap = styled.div<{
  $covered?: boolean
  $peekBanner?: boolean
  $shortcuts?: boolean
}>`
  padding: 8px;
  flex-shrink: 0;
  max-height: min(50%, 50cqh);
  min-height: 0;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0;
  overflow: ${({ $covered, $peekBanner, $shortcuts }) =>
    $covered || $peekBanner || $shortcuts ? 'visible' : 'hidden'};
`

const ComposerStack = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 0;
`

const BannerSlot = styled.div<{ $state: BannerSlotState; $animate: boolean }>`
  width: 100%;
  box-sizing: border-box;

  ${({ $state, $animate }) => {
    if ($state === 'hidden') {
      return css`
        position: relative;
        max-height: 0;
        margin-bottom: 0;
        opacity: 0;
        overflow: hidden;
        pointer-events: none;
        transform: none;
        transition: ${$animate
          ? `max-height ${INSET_MS}ms ${INSET_EASE}, margin-bottom ${INSET_MS}ms ${INSET_EASE}, opacity ${INSET_MS}ms ${INSET_EASE}`
          : 'none'};
      `
    }

    if ($state === 'tucking') {
      return css`
        position: relative;
        z-index: 0;
        max-height: 40px;
        margin-bottom: ${BANNER_RAISED_GAP_PX}px;
        opacity: 1;
        overflow: visible;
        pointer-events: none;
        transform: translateY(0);
        animation: ${bannerTuck} ${BANNER_TUCK_MS}ms linear forwards;
      `
    }

    if ($state === 'peek') {
      return css`
        position: absolute;
        left: 0;
        right: 0;
        bottom: 100%;
        z-index: 0;
        max-height: 40px;
        margin-bottom: 0;
        opacity: 1;
        overflow: visible;
        pointer-events: auto;
        transform: translateY(calc(100% - ${BANNER_PEEK_PX}px));
        transition: ${$animate
          ? `transform ${INSET_MS}ms ${INSET_EASE}`
          : 'none'};

        &:hover,
        &:focus-within {
          /* Same gap above the composer as the raised loading banner. */
          transform: translateY(-${BANNER_RAISED_GAP_PX}px);
        }
      `
    }

    return css`
      position: relative;
      z-index: 2;
      max-height: 40px;
      margin-bottom: ${BANNER_RAISED_GAP_PX}px;
      opacity: 1;
      /* Keep visible so shortcut key badges aren't clipped at the top/left. */
      overflow: visible;
      transform: none;
      transition: ${$animate
        ? `max-height ${INSET_MS}ms ${INSET_EASE}, margin-bottom ${INSET_MS}ms ${INSET_EASE}, opacity ${INSET_MS}ms ${INSET_EASE}`
        : 'none'};
    `
  }}
`

const Composer = styled.div<{ $covered?: boolean }>`
  position: relative;
  z-index: 1;
  background: #ffffff;
  border: 1px solid #b7b7b3;
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: opacity 220ms ease, filter 220ms ease;

  ${({ $covered }) =>
    $covered &&
    css`
      opacity: 0.4;
      filter: grayscale(0.2);
      pointer-events: none;
      user-select: none;
    `}
`

const SuggestionOverlay = styled.div<{ $exiting?: boolean }>`
  position: absolute;
  left: 8px;
  right: 8px;
  /* Keep 8px of the composer card visible under the AA card */
  bottom: calc(8px + 8px);
  z-index: 2;
  display: flex;
  flex-direction: column;
  min-height: 0;
  width: calc(100% - 16px);
  max-height: 50cqh;
  animation: ${revealSuggestion} 380ms cubic-bezier(0.22, 1, 0.36, 1) both;

  ${({ $exiting }) =>
    $exiting &&
    css`
      opacity: 0;
      pointer-events: none;
      animation: none;
    `}
`

const ChannelRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 20px;
`

const Channel = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: none;
  background: transparent;
  padding: 0;
  cursor: pointer;
  ${typeStyle('mediumDefault')}
  color: ${flora.fg.strong};
  flex: 1;
  text-align: left;

  svg {
    width: 12px;
    height: 12px;
  }
`

const ComposerTextWrap = styled.div`
  width: 100%;
  padding: 0 10px;
  box-sizing: border-box;
`

const COMPOSER_FOCUS_BORDER = '#406cc4'

const ComposerInput = styled.div<{ $focused?: boolean }>`
  min-height: 60px;
  padding: 4px 10px;
  border: 2px solid ${({ $focused }) => ($focused ? COMPOSER_FOCUS_BORDER : 'transparent')};
  border-radius: 8px;
  outline: none;
  box-sizing: border-box;
  ${typeStyle('mediumDefault')}
  color: ${flora.fg.strong};

  &:empty::before {
    content: attr(data-placeholder);
    color: ${flora.fg.placeholder};
  }
`

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px 7px;
`

const ToolbarIcons = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
`

interface ConversationPanelProps {
  ticket: TicketItem
  showShortcuts?: boolean
  activeShortcut?: string | null
  /** Increment to request a customer reply on the open ticket (Option+R). */
  customerReplyRequest?: number
  /** Increment to run Auto Assist’s primary shortcut (Cmd+\). */
  aaShortcutRequest?: number
}

export default function ConversationPanel({
  ticket,
  showShortcuts = false,
  activeShortcut = null,
  customerReplyRequest = 0,
  aaShortcutRequest = 0,
}: ConversationPanelProps) {
  const { profile } = ticket
  const channelLabel = ticket.channel.replace(/^Via\s+/i, '')
  const [phase, setPhase] = useState<AaPhase>('composer')
  const [answerReady, setAnswerReady] = useState(false)
  const [answerLoading, setAnswerLoading] = useState(() => Boolean(getAaSuggestion(ticket.id, 0)))
  const [bannerPhase, setBannerPhase] = useState<'hidden' | 'morphing' | 'open'>('hidden')
  const [bannerMorphFrom, setBannerMorphFrom] = useState<DOMRect | null>(null)
  const [suggestionExiting, setSuggestionExiting] = useState(false)
  const suggestionExitingRef = useRef(false)
  const stoppingSuggestionsRef = useRef(false)
  const readyBranchConsumedRef = useRef(false)
  const [postSendLoading, setPostSendLoading] = useState(false)
  const [postAssistPhase, setPostAssistPhase] = useState<PostAssistPhase>('idle')
  const [aaDisabled, setAaDisabled] = useState(false)
  const [assistedTipOpen, setAssistedTipOpen] = useState(false)
  const [assistedTipAnchor, setAssistedTipAnchor] = useState<HTMLElement | null>(null)
  const [feedbackTipOpen, setFeedbackTipOpen] = useState(false)
  const [feedbackTipAnchor, setFeedbackTipAnchor] = useState<HTMLElement | null>(null)
  const feedbackButtonRef = useRef<HTMLButtonElement>(null)
  const [sourcesModalOpen, setSourcesModalOpen] = useState(false)
  const [replies, setReplies] = useState<LogMessage[]>([])
  const [seedFollowUps, setSeedFollowUps] = useState<string[]>([])
  const [seedUpdatedAt, setSeedUpdatedAt] = useState(() => Date.now())
  /** null = idle; body null = typing dots; body string = crossfading into text */
  const [customerPending, setCustomerPending] = useState<{ body: string | null } | null>(null)
  const [composerEmpty, setComposerEmpty] = useState(true)
  const [composerFocused, setComposerFocused] = useState(false)
  const [suggestionDraft, setSuggestionDraft] = useState<AaSuggestionData | null>(null)
  const [sourceSuggestionOverride, setSourceSuggestionOverride] =
    useState<AaSuggestionData | null>(null)
  const [suggestionRevision, setSuggestionRevision] = useState(0)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [loadStage, setLoadStage] = useState<'planning' | 'generating'>('planning')
  const customerFollowUpCount =
    seedFollowUps.length +
    replies.reduce(
      (count, message) =>
        message.role === 'customer' ? count + message.bodies.length : count,
      0,
    )
  const baseSuggestion = getAaSuggestion(ticket.id, customerFollowUpCount)
  const suggestion = aaDisabled
    ? undefined
    : (sourceSuggestionOverride ?? baseSuggestion)
  const composerRef = useRef<HTMLDivElement>(null)
  const conversationRef = useRef<HTMLDivElement>(null)
  const composerWrapRef = useRef<HTMLDivElement>(null)
  const suggestionCardRef = useRef<HTMLDivElement>(null)
  const stickBottomRafRef = useRef(0)
  const lastWrapHeightRef = useRef(0)
  const lastInsetRef = useRef(0)
  const insetAnimateRef = useRef(true)
  const [chromeMotion, setChromeMotion] = useState(true)
  const [composerInset, setComposerInset] = useState(0)
  const activeTicketIdRef = useRef(ticket.id)
  const skipEnterAnimationIdsRef = useRef(new Set<string>())
  const repliesRef = useRef(replies)
  const seedUpdatedAtRef = useRef(seedUpdatedAt)
  repliesRef.current = replies
  seedUpdatedAtRef.current = seedUpdatedAt
  const sessionSnapshotRef = useRef({
    phase,
    answerReady,
    answerLoading,
    bannerPhase,
    suggestionExiting,
    composerEmpty,
    replies,
    seedFollowUps,
    seedUpdatedAt,
    suggestionDraft,
  })
  sessionSnapshotRef.current = {
    phase,
    answerReady,
    answerLoading,
    bannerPhase,
    suggestionExiting,
    composerEmpty,
    replies,
    seedFollowUps,
    seedUpdatedAt,
    suggestionDraft,
  }

  const applySession = (session: TicketSession) => {
    setPhase(session.phase)
    setAnswerReady(session.answerReady)
    setAnswerLoading(session.answerLoading)
    setBannerPhase(session.bannerPhase)
    setBannerMorphFrom(null)
    setSuggestionExiting(false)
    suggestionExitingRef.current = false
    readyBranchConsumedRef.current = session.readyBranchConsumed
    setPostSendLoading(false)
    setPostAssistPhase('idle')
    setAaDisabled(false)
    setAssistedTipOpen(false)
    setAssistedTipAnchor(null)
    setReplies(session.replies.map((reply) => normalizeTicketReply(reply)))
    setSeedFollowUps(session.seedFollowUps ?? [])
    setSeedUpdatedAt(session.seedUpdatedAt ?? Date.now())
    setCustomerPending(null)
    setComposerEmpty(session.composerEmpty)
    setComposerFocused(false)
    setSuggestionDraft(session.suggestionDraft)
    setIsRegenerating(false)
    setLoadStage('planning')
    if (composerRef.current) composerRef.current.innerHTML = session.composerHtml
  }

  const captureSession = (): TicketSession => {
    const snap = sessionSnapshotRef.current
    const exiting = suggestionExitingRef.current || snap.suggestionExiting
    const phase: TicketSession['phase'] =
      snap.phase === 'ready' && !exiting ? 'ready' : 'composer'
    let bannerPhase: TicketSession['bannerPhase'] = 'hidden'
    if (exiting) {
      bannerPhase = 'open'
    } else if (snap.bannerPhase === 'open' || snap.bannerPhase === 'morphing') {
      bannerPhase = 'open'
    } else if (snap.phase === 'ready') {
      bannerPhase = 'hidden'
    } else {
      bannerPhase = snap.bannerPhase === 'hidden' ? 'hidden' : 'open'
    }

    return {
      phase,
      answerReady: snap.answerLoading || snap.answerReady,
      answerLoading: false,
      bannerPhase,
      readyBranchConsumed: readyBranchConsumedRef.current,
      composerHtml: composerRef.current?.innerHTML ?? '',
      composerEmpty: snap.composerEmpty,
      replies: snap.replies,
      seedFollowUps: snap.seedFollowUps,
      seedUpdatedAt: snap.seedUpdatedAt,
      suggestionDraft: snap.suggestionDraft,
    }
  }

  useLayoutEffect(() => {
    const previousId = activeTicketIdRef.current
    if (previousId !== ticket.id) {
      setTicketSession(previousId, captureSession())
      activeTicketIdRef.current = ticket.id
      insetAnimateRef.current = false
      lastInsetRef.current = 0
      setComposerInset(0)
      setChromeMotion(false)

      const saved = getTicketSession(ticket.id)
      if (saved) {
        applySession(saved)
      } else {
        const fresh = createFreshTicketSession(Boolean(getAaSuggestion(ticket.id)))
        applySession(fresh)
      }

      // Restored messages are already in the log — don't replay enter motion.
      const skipIds = new Set<string>([`customer-${ticket.id}`])
      for (const reply of saved?.replies ?? []) skipIds.add(reply.id)
      skipEnterAnimationIdsRef.current = skipIds
    }
  }, [ticket.id])

  const shouldAnimateMessageEnter = (id: string) => !skipEnterAnimationIdsRef.current.has(id)

  useEffect(() => {
    const next = getAaSuggestion(ticket.id, customerFollowUpCount)
    if (!next) return
    if (answerReady || !answerLoading) return

    if (isRegenerating) {
      setLoadStage('generating')
      const readyTimer = window.setTimeout(() => {
        setAnswerReady(true)
        setAnswerLoading(false)
        setIsRegenerating(false)
      }, AA_LOAD_MS)
      return () => window.clearTimeout(readyTimer)
    }

    setLoadStage('planning')
    const generatingTimer = window.setTimeout(() => {
      setLoadStage('generating')
    }, AA_PLANNING_MS)
    const readyTimer = window.setTimeout(() => {
      setAnswerReady(true)
      setAnswerLoading(false)
      setIsRegenerating(false)
    }, AA_LOAD_MS)
    return () => {
      window.clearTimeout(generatingTimer)
      window.clearTimeout(readyTimer)
    }
  }, [ticket.id, customerFollowUpCount, answerReady, answerLoading, isRegenerating])

  useEffect(() => {
    return () => {
      setTicketSession(activeTicketIdRef.current, captureSession())
    }
  }, [])

  useEffect(() => {
    if (!postSendLoading) return
    const timer = window.setTimeout(() => setPostSendLoading(false), AA_POST_SEND_MS)
    return () => window.clearTimeout(timer)
  }, [postSendLoading])

  useEffect(() => {
    if (postAssistPhase === 'thinking') {
      const timer = window.setTimeout(() => setPostAssistPhase('waiting'), POST_THINKING_MS)
      return () => window.clearTimeout(timer)
    }
    // Same as deactivate: start tucking as soon as the muted banner appears.
    if (postAssistPhase === 'waiting') {
      const timer = window.setTimeout(() => setPostAssistPhase('waitingTucking'), 0)
      return () => window.clearTimeout(timer)
    }
    if (postAssistPhase === 'waitingTucking') {
      const timer = window.setTimeout(() => setPostAssistPhase('peek'), BANNER_TUCK_MS)
      return () => window.clearTimeout(timer)
    }
    if (postAssistPhase === 'deactivatedTucking') {
      const timer = window.setTimeout(() => {
        setPostAssistPhase('deactivatedPeek')
      }, BANNER_TUCK_MS)
      return () => window.clearTimeout(timer)
    }
  }, [postAssistPhase])

  useLayoutEffect(() => {
    if (phase === 'ready') return

    const focusComposer = () => {
      const node = composerRef.current
      if (!node || node.getAttribute('contenteditable') === 'false') return
      node.focus({ preventScroll: true })
      const selection = window.getSelection()
      if (!selection) return
      const range = document.createRange()
      range.selectNodeContents(node)
      range.collapse(false)
      selection.removeAllRanges()
      selection.addRange(range)
    }

    focusComposer()
    let timeoutId = 0
    const frame = window.requestAnimationFrame(() => {
      focusComposer()
      timeoutId = window.setTimeout(focusComposer, 0)
    })
    return () => {
      window.cancelAnimationFrame(frame)
      window.clearTimeout(timeoutId)
    }
  }, [ticket.id, phase])

  const appendAgentReply = (
    body: string,
    events?: AaAction[],
    options?: { assisted?: boolean },
  ) => {
    const text = body.trim()
    if (!text) return
    const now = Date.now()
    setReplies((current) => [
      ...current,
      {
        id: `agent-${now}-${current.length}`,
        role: 'agent',
        name: AGENT_NAME,
        avatar: agentAvatar,
        body: text,
        bodies: [text],
        timestamp: 'Just now',
        updatedAt: now,
        events: events && events.length > 0 ? events.map((event) => ({ ...event })) : undefined,
        assisted: options?.assisted,
      },
    ])
  }

  const appendCustomerReply = (body: string, options?: { skipEnter?: boolean }) => {
    const text = body.trim()
    if (!text) return
    const now = Date.now()
    const current = repliesRef.current
    const last = current[current.length - 1]

    // Stack under the latest customer group when still inside the 3-minute window.
    if (last?.role === 'customer' && now - last.updatedAt < CUSTOMER_GROUP_MS) {
      if (options?.skipEnter) {
        skipEnterAnimationIdsRef.current.add(`${last.id}-b${last.bodies.length}`)
      }
      setReplies((repliesNow) =>
        repliesNow.map((message, index) =>
          index === repliesNow.length - 1 && message.role === 'customer'
            ? {
                ...message,
                bodies: [...message.bodies, text],
                body: message.bodies[0] ?? text,
                updatedAt: now,
                timestamp: 'Just now',
              }
            : message,
        ),
      )
      return
    }

    // No agent reply yet — stack under the ticket’s original customer message.
    if (current.length === 0 && now - seedUpdatedAtRef.current < CUSTOMER_GROUP_MS) {
      setSeedFollowUps((followUps) => [...followUps, text])
      setSeedUpdatedAt(now)
      seedUpdatedAtRef.current = now
      return
    }

    const id = `customer-${ticket.id}-${now}-${current.length}`
    if (options?.skipEnter) skipEnterAnimationIdsRef.current.add(id)
    setReplies((repliesNow) => [
      ...repliesNow,
      {
        id,
        role: 'customer',
        name: profile.name,
        avatar: profile.avatar,
        body: text,
        bodies: [text],
        timestamp: 'Just now',
        updatedAt: now,
      },
    ])
  }

  const customerGroupIsOpen = (updatedAt: number) =>
    Date.now() - updatedAt < CUSTOMER_GROUP_MS

  const afterAgentSend = (options?: { assistBanner?: boolean }) => {
    setAnswerReady(false)
    setAnswerLoading(false)
    setPhase('composer')
    setSuggestionDraft(null)
    readyBranchConsumedRef.current = true
    setBannerMorphFrom(null)

    if (options?.assistBanner) {
      setPostAssistPhase('thinking')
      setBannerPhase('open')
      setPostSendLoading(false)
      return
    }

    setPostAssistPhase('idle')
    setBannerPhase('hidden')
    setPostSendLoading(true)
  }

  const approveSuggestion = ({ answer, actions }: { answer: string; actions: AaAction[] }) => {
    appendAgentReply(answer, actions, { assisted: true })
    afterAgentSend({ assistBanner: true })
  }

  const syncComposerEmpty = () => {
    const text = composerRef.current?.innerText.replace(/\u00a0/g, ' ').trim() ?? ''
    setComposerEmpty(text.length === 0)
  }

  const sendComposer = () => {
    const text = composerRef.current?.innerText.replace(/\u00a0/g, ' ') ?? ''
    if (!text.trim()) return
    appendAgentReply(text)
    if (composerRef.current) composerRef.current.textContent = ''
    setComposerEmpty(true)
    afterAgentSend()
  }

  const onComposerKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      sendComposer()
    }
  }

  const customerMessage: LogMessage = {
    id: `customer-${ticket.id}`,
    role: 'customer',
    name: profile.name,
    avatar: profile.avatar,
    body: ticket.messageBody,
    bodies: [ticket.messageBody, ...seedFollowUps],
    timestamp: seedFollowUps.length > 0 ? 'Just now' : ticket.messageTimestamp,
    updatedAt: seedUpdatedAt,
  }

  const messages = [customerMessage, ...replies]
  const lastMessage = messages[messages.length - 1]
  const pendingAttachesToLast =
    Boolean(customerPending) &&
    lastMessage?.role === 'customer' &&
    customerGroupIsOpen(lastMessage.updatedAt)
  const postSendBusy =
    postSendLoading ||
    postAssistPhase === 'thinking' ||
    postAssistPhase === 'waiting' ||
    postAssistPhase === 'waitingTucking'
  const waitingForClient =
    !postSendBusy && messages[messages.length - 1]?.role === 'agent'

  const customerReplyTimersRef = useRef<{ typing: number; commit: number }>({
    typing: 0,
    commit: 0,
  })

  const clearCustomerReplyTimers = () => {
    window.clearTimeout(customerReplyTimersRef.current.typing)
    window.clearTimeout(customerReplyTimersRef.current.commit)
    customerReplyTimersRef.current = { typing: 0, commit: 0 }
  }

  useEffect(() => {
    if (!postSendBusy) return
    clearCustomerReplyTimers()
    setCustomerPending(null)
  }, [postSendBusy])

  useEffect(() => () => clearCustomerReplyTimers(), [])

  // Customer replies are manual (Option+R) for the currently open ticket only.
  // Always generate a follow-up from the current thread — even if the customer already wrote.
  useEffect(() => {
    if (!customerReplyRequest) return

    let followUpCount =
      seedFollowUps.length +
      replies.reduce(
        (count, message) =>
          message.role === 'customer' ? count + message.bodies.length : count,
        0,
      )
    clearCustomerReplyTimers()
    if (customerPending?.body) {
      appendCustomerReply(customerPending.body, { skipEnter: true })
      followUpCount += 1
    }

    const lastAgentMessage = [...replies]
      .reverse()
      .find((message) => message.role === 'agent')?.body
    const lastCustomerGroup = [...replies]
      .reverse()
      .find((message) => message.role === 'customer')
    const lastCustomerMessage =
      customerPending?.body ??
      lastCustomerGroup?.bodies[lastCustomerGroup.bodies.length - 1] ??
      seedFollowUps[seedFollowUps.length - 1] ??
      ticket.messageBody

    const replyBody = generateCustomerReply({
      ticketId: ticket.id,
      intent: ticket.intent,
      subject: ticket.subject,
      originalMessage: ticket.messageBody,
      lastAgentMessage,
      lastCustomerMessage,
      followUpIndex: followUpCount,
    })

    setCustomerPending({ body: null })
    customerReplyTimersRef.current.typing = window.setTimeout(() => {
      setCustomerPending({ body: replyBody })
      customerReplyTimersRef.current.commit = window.setTimeout(() => {
        setCustomerPending(null)
        appendCustomerReply(replyBody, { skipEnter: true })
        const nextSuggestion = getAaSuggestion(ticket.id, followUpCount + 1)
        if (nextSuggestion && !aaDisabled) {
          readyBranchConsumedRef.current = false
          setPostAssistPhase('idle')
          setSourceSuggestionOverride(null)
          setSuggestionDraft(null)
          setSuggestionRevision((revision) => revision + 1)
          setIsRegenerating(false)
          setAnswerReady(false)
          setAnswerLoading(true)
          setPhase('composer')
          setBannerPhase('hidden')
          setBannerMorphFrom(null)
        }
      }, CLIENT_REVEAL_MS)
    }, CLIENT_TYPING_MS)
  }, [customerReplyRequest])

  const covered =
    Boolean(suggestion) &&
    !waitingForClient &&
    (phase === 'ready' || suggestionExiting)
  const bannerLoading = answerLoading || postAssistPhase === 'thinking'
  const wantComposerBanner =
    postAssistPhase === 'thinking' ||
    postAssistPhase === 'waiting' ||
    postAssistPhase === 'waitingTucking' ||
    postAssistPhase === 'deactivated' ||
    (Boolean(suggestion) &&
      phase === 'composer' &&
      !waitingForClient &&
      !postSendBusy &&
      (answerLoading || answerReady))

  useLayoutEffect(() => {
    if (suggestionExitingRef.current) return
    if (
      postAssistPhase === 'thinking' ||
      postAssistPhase === 'waiting' ||
      postAssistPhase === 'waitingTucking' ||
      postAssistPhase === 'peek' ||
      postAssistPhase === 'deactivated' ||
      postAssistPhase === 'deactivatedTucking' ||
      postAssistPhase === 'deactivatedPeek'
    ) {
      return
    }

    if (!wantComposerBanner) {
      if (bannerPhase !== 'hidden') {
        setBannerPhase('hidden')
      }
      return
    }

    if (bannerPhase === 'morphing' || bannerPhase === 'open') return
    // After the first load flow for this ticket, don't auto-reshow the banner.
    if (readyBranchConsumedRef.current) return

    setBannerMorphFrom(null)
    setBannerPhase('open')
  }, [wantComposerBanner, bannerPhase, suggestionExiting, postAssistPhase])

  // When the answer finishes loading: open the card if composer is empty,
  // otherwise keep the ready banner in place. Only once per answer load.
  useEffect(() => {
    if (!suggestion || !answerReady || answerLoading) return
    if (phase !== 'composer' || waitingForClient || postSendBusy) return
    if (readyBranchConsumedRef.current) return

    readyBranchConsumedRef.current = true
    const hasDraft = Boolean(composerRef.current?.innerText.replace(/\u00a0/g, ' ').trim())
    if (!hasDraft) {
      setBannerMorphFrom(null)
      setBannerPhase('hidden')
      setPhase('ready')
    }
  }, [suggestion, answerReady, answerLoading, phase, waitingForClient, postSendBusy])

  const bannerSlotState: BannerSlotState =
    postAssistPhase === 'thinking' ||
    postAssistPhase === 'waiting' ||
    postAssistPhase === 'deactivated'
      ? 'raised'
      : postAssistPhase === 'waitingTucking' ||
          postAssistPhase === 'deactivatedTucking'
        ? 'tucking'
        : postAssistPhase === 'peek' || postAssistPhase === 'deactivatedPeek'
          ? 'peek'
          : bannerPhase !== 'hidden' && Boolean(suggestion)
            ? 'raised'
            : 'hidden'
  const bannerOpen = bannerSlotState !== 'hidden'
  const showSuggestionCard = covered
  const [bannerRendered, setBannerRendered] = useState(bannerOpen)

  useLayoutEffect(() => {
    if (bannerOpen) {
      setBannerRendered(true)
      return
    }
    if (!bannerRendered) return
    if (!chromeMotion) {
      setBannerRendered(false)
      return
    }
    const timer = window.setTimeout(() => setBannerRendered(false), INSET_MS)
    return () => window.clearTimeout(timer)
  }, [bannerOpen, bannerRendered, chromeMotion])

  useLayoutEffect(() => {
    if (chromeMotion) return
    const frame = requestAnimationFrame(() => setChromeMotion(true))
    return () => cancelAnimationFrame(frame)
  }, [chromeMotion, ticket.id])

  const scrollConversationToBottom = (behavior: ScrollBehavior = 'auto') => {
    const node = conversationRef.current
    if (!node) return
    node.scrollTo({ top: node.scrollHeight, behavior })
  }

  const pinConversationToBottom = () => {
    const node = conversationRef.current
    if (!node) return
    node.scrollTop = node.scrollHeight - node.clientHeight
  }

  const runStickBottomAnimation = (durationMs = INSET_MS) => {
    const start = performance.now()
    cancelAnimationFrame(stickBottomRafRef.current)
    const tick = (now: number) => {
      pinConversationToBottom()
      if (now - start < durationMs + 48) {
        stickBottomRafRef.current = requestAnimationFrame(tick)
      }
    }
    stickBottomRafRef.current = requestAnimationFrame(tick)
  }

  const syncConversationInset = () => {
    const conv = conversationRef.current
    const wrap = composerWrapRef.current
    if (!conv || !wrap) return

    let inset = 0
    const overlay = suggestionCardRef.current
    if (overlay) {
      const wrapRect = wrap.getBoundingClientRect()
      // Prefer layout box so transform-based enter animations don't jitter inset.
      const overlayTop = wrapRect.bottom - 16 - overlay.offsetHeight
      inset = Math.max(0, Math.round(wrapRect.top - overlayTop))
    }

    const prev = lastInsetRef.current
    const wrapHeight = wrap.getBoundingClientRect().height
    const wrapDelta = Math.abs(wrapHeight - lastWrapHeightRef.current)
    const insetDelta = Math.abs(prev - inset)
    lastWrapHeightRef.current = wrapHeight
    lastInsetRef.current = inset

    const animate = insetAnimateRef.current
    if (insetDelta > 0) setComposerInset(inset)

    if (!animate) {
      insetAnimateRef.current = true
      setChromeMotion(true)
      pinConversationToBottom()
      return
    }

    if (insetDelta > 1 || wrapDelta > 1) {
      runStickBottomAnimation(INSET_MS)
    } else {
      pinConversationToBottom()
    }
  }

  useLayoutEffect(() => {
    syncConversationInset()
  }, [
    replies,
    customerPending,
    ticket.id,
    covered,
    bannerOpen,
    bannerPhase,
    bannerLoading,
    phase,
    suggestionExiting,
    composerEmpty,
  ])

  useEffect(() => {
    const wrap = composerWrapRef.current
    const conv = conversationRef.current
    if (!wrap || !conv) return

    const observer = new ResizeObserver(() => {
      syncConversationInset()
    })
    observer.observe(wrap)
    observer.observe(conv)
    return () => observer.disconnect()
  }, [ticket.id, covered, bannerOpen])

  useEffect(() => {
    const overlay = suggestionCardRef.current
    if (!overlay || !covered) {
      syncConversationInset()
      return
    }
    const observer = new ResizeObserver(() => {
      syncConversationInset()
    })
    observer.observe(overlay)
    syncConversationInset()
    return () => observer.disconnect()
  }, [covered, ticket.id, suggestionExiting])

  useEffect(() => {
    return () => cancelAnimationFrame(stickBottomRafRef.current)
  }, [])

  useEffect(() => {
    scrollConversationToBottom('smooth')
  }, [replies, customerPending, ticket.id])

  const openSuggestion = () => {
    if (bannerLoading || !answerReady) return
    setBannerMorphFrom(null)
    setBannerPhase('hidden')
    suggestionExitingRef.current = false
    setSuggestionExiting(false)
    setPhase('ready')
  }

  const closeSuggestionToBanner = () => {
    if (suggestionExitingRef.current || phase !== 'ready') return
    const rect = suggestionCardRef.current?.getBoundingClientRect() ?? null
    if (rect && rect.width > 0) {
      setBannerMorphFrom(DOMRect.fromRect(rect))
      suggestionExitingRef.current = true
      setSuggestionExiting(true)
      setBannerPhase('morphing')
    } else {
      setBannerMorphFrom(null)
      suggestionExitingRef.current = false
      setSuggestionExiting(false)
      setBannerPhase('open')
      setPhase('composer')
    }
  }

  const stopSuggestions = () => {
    if (suggestionExitingRef.current) return

    // Instantly show deactivated copy/colors, then morph with the same
    // geometry as dismissing to the suggestion banner.
    stoppingSuggestionsRef.current = true
    setPostAssistPhase('deactivated')
    setAnswerLoading(false)
    setSuggestionDraft(null)
    readyBranchConsumedRef.current = true

    if (phase !== 'ready') {
      stoppingSuggestionsRef.current = false
      setAaDisabled(true)
      setAnswerReady(false)
      setBannerMorphFrom(null)
      setBannerPhase('open')
      setPhase('composer')
      setPostAssistPhase('deactivatedTucking')
      return
    }

    const rect = suggestionCardRef.current?.getBoundingClientRect() ?? null
    if (rect && rect.width > 0) {
      setBannerMorphFrom(DOMRect.fromRect(rect))
      suggestionExitingRef.current = true
      setSuggestionExiting(true)
      setBannerPhase('morphing')
    } else {
      stoppingSuggestionsRef.current = false
      setAaDisabled(true)
      setAnswerReady(false)
      setBannerMorphFrom(null)
      setSuggestionExiting(false)
      setBannerPhase('open')
      setPhase('composer')
      setPostAssistPhase('deactivatedTucking')
    }
  }

  const activateSuggestions = () => {
    stoppingSuggestionsRef.current = false
    setAaDisabled(false)
    setPostAssistPhase('idle')
    setSuggestionDraft(null)
    setSourceSuggestionOverride(null)
    setSuggestionRevision((revision) => revision + 1)
    setIsRegenerating(false)
    readyBranchConsumedRef.current = false
    setAnswerReady(false)
    setAnswerLoading(true)
    setPhase('composer')
    setBannerPhase('hidden')
    setBannerMorphFrom(null)
    setSuggestionExiting(false)
    suggestionExitingRef.current = false
    setFeedbackTipOpen(false)
    setFeedbackTipAnchor(null)
  }

  const closeFeedbackTip = () => {
    setFeedbackTipOpen(false)
    setFeedbackTipAnchor(null)
    // Keep the peek strip collapsed; Feedback must not retain focus.
    feedbackButtonRef.current?.blur()
    const active = document.activeElement
    if (active instanceof HTMLElement && feedbackButtonRef.current?.contains(active)) {
      active.blur()
    }
  }

  const openFeedbackTip = () => {
    const anchor = feedbackButtonRef.current
    if (!anchor) return
    if (feedbackTipOpen) {
      closeFeedbackTip()
      return
    }
    setFeedbackTipAnchor(anchor)
    setFeedbackTipOpen(true)
  }

  /** After feedback is sent, park the muted banner in peek under the composer. */
  const onFeedbackSubmitted = () => {
    setPostAssistPhase((current) => {
      if (
        current === 'waiting' ||
        current === 'waitingTucking' ||
        current === 'peek'
      ) {
        return 'peek'
      }
      if (
        current === 'deactivated' ||
        current === 'deactivatedTucking' ||
        current === 'deactivatedPeek'
      ) {
        return 'deactivatedPeek'
      }
      return current
    })
    feedbackButtonRef.current?.blur()
  }

  const mutedBanner =
    postAssistPhase === 'waiting' ||
    postAssistPhase === 'waitingTucking' ||
    postAssistPhase === 'peek' ||
    postAssistPhase === 'deactivated' ||
    postAssistPhase === 'deactivatedTucking' ||
    postAssistPhase === 'deactivatedPeek'

  const deactivatedBanner =
    postAssistPhase === 'deactivated' ||
    postAssistPhase === 'deactivatedTucking' ||
    postAssistPhase === 'deactivatedPeek'

  useEffect(() => {
    if (mutedBanner) return
    setFeedbackTipOpen(false)
    setFeedbackTipAnchor(null)
  }, [mutedBanner])

  // Cmd+\ — Activate / open suggestion / Approve based on current AA state.
  useEffect(() => {
    if (!aaShortcutRequest) return

    const isDeactivated =
      postAssistPhase === 'deactivated' ||
      postAssistPhase === 'deactivatedTucking' ||
      postAssistPhase === 'deactivatedPeek'

    if (isDeactivated) {
      activateSuggestions()
      return
    }

    if (phase === 'ready' && !suggestionExiting && suggestion) {
      const draft = suggestionDraft ?? suggestion
      approveSuggestion({ answer: draft.answer, actions: draft.actions })
      return
    }

    if (
      suggestion &&
      answerReady &&
      !answerLoading &&
      phase === 'composer' &&
      !suggestionExiting &&
      !waitingForClient &&
      !postSendBusy
    ) {
      openSuggestion()
    }
  }, [aaShortcutRequest])

  useEffect(() => {
    if (phase !== 'ready' || suggestionExiting) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      closeSuggestionToBanner()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [phase, suggestionExiting])

  const finishBannerMorph = () => {
    setBannerPhase((current) => (current === 'morphing' ? 'open' : current))
    setBannerMorphFrom(null)
    if (suggestionExitingRef.current) {
      suggestionExitingRef.current = false
      setSuggestionExiting(false)
      setPhase('composer')
      if (stoppingSuggestionsRef.current) {
        stoppingSuggestionsRef.current = false
        setAaDisabled(true)
        setAnswerReady(false)
        setPostAssistPhase('deactivatedTucking')
      }
    }
  }

  useEffect(() => {
    if (bannerPhase !== 'morphing') return
    const timer = window.setTimeout(() => finishBannerMorph(), 560)
    return () => window.clearTimeout(timer)
  }, [bannerPhase])

  const closeAssistedTip = () => {
    setAssistedTipOpen(false)
    setAssistedTipAnchor(null)
  }

  const openAssistedTip = (anchor: HTMLElement) => {
    setAssistedTipAnchor(anchor)
    setAssistedTipOpen(true)
  }

  const openSourcesModal = () => {
    closeAssistedTip()
    setSourcesModalOpen(true)
  }

  const assistedProcedureName = `${ticket.intent} procedure`
  const activeProcedureId = procedureIdForTitle(assistedProcedureName)

  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>(() =>
    [activeProcedureId, ACTIVE_GUIDELINE_ID].filter(Boolean) as string[],
  )
  const [removedSourceIds, setRemovedSourceIds] = useState<string[]>([])

  const originalSourceIds = useMemo(
    () => [activeProcedureId, ACTIVE_GUIDELINE_ID].filter(Boolean) as string[],
    [activeProcedureId],
  )

  useEffect(() => {
    setSelectedSourceIds(originalSourceIds)
    setRemovedSourceIds([])
    setSourceSuggestionOverride(null)
    setSuggestionRevision(0)
    setIsRegenerating(false)
    setLoadStage('planning')
    setAaDisabled(false)
    stoppingSuggestionsRef.current = false
  }, [ticket.id, originalSourceIds])

  const tipSources = useMemo(
    () => buildTipSources(selectedSourceIds, removedSourceIds),
    [selectedSourceIds, removedSourceIds],
  )

  const sameSourceIds = (a: string[], b: string[]) => {
    if (a.length !== b.length) return false
    const set = new Set(a)
    return b.every((id) => set.has(id))
  }

  const startSuggestionRegeneration = (nextSelectedIds: string[]) => {
    const base = getAaSuggestion(ticket.id, customerFollowUpCount)
    if (!base) return

    setSourceSuggestionOverride(regenerateSuggestionFromSources(base, nextSelectedIds))
    setSuggestionDraft(null)
    setSuggestionRevision((revision) => revision + 1)
    setIsRegenerating(true)

    suggestionExitingRef.current = false
    setSuggestionExiting(false)
    readyBranchConsumedRef.current = false
    setAnswerReady(false)
    setAnswerLoading(true)
    setPhase('composer')
    setBannerPhase('hidden')
    setBannerMorphFrom(null)
  }

  const handleApplySources = (nextSelectedIds: string[], _scope: 'ticket' | 'topic') => {
    const next = applySourceSelection(selectedSourceIds, removedSourceIds, nextSelectedIds)
    const selectionChanged = !sameSourceIds(next.selected, selectedSourceIds)
    setSelectedSourceIds(next.selected)
    setRemovedSourceIds(next.removed)

    if (!selectionChanged) return

    if (!sameSourceIds(next.selected, originalSourceIds)) {
      startSuggestionRegeneration(next.selected)
      return
    }

    setSourceSuggestionOverride(null)
    setSuggestionDraft(null)
    setSuggestionRevision((revision) => revision + 1)
  }

  const assistedRationale = `Auto Assist drafted this reply from the customer’s latest message, the “${ticket.intent}” intent, and your team’s linked procedure so the suggested answer and actions stay consistent with how similar tickets are handled.`

  return (
    <Root>
      <Header>
        <HeaderText>
          <Title>{ticket.subject}</Title>
          <Meta>
            <Tag size="small" hue={ticket.headerSlaHue}>
              {ticket.headerSla}
            </Tag>
            <Divider />
            <MetaText>{ticket.channel}</MetaText>
            <Divider />
            <Status>
              <StatusDot $color={ticket.statusColor} />
              {ticket.status}
            </Status>
            <Divider />
            <IntentLabel>Topic</IntentLabel>
            <IntentValue href="#">{ticket.intent}</IntentValue>
          </Meta>
        </HeaderText>
        <HeaderActions>
          <IconButton aria-label="Customize" size="small">
            <SliderIcon />
          </IconButton>
          <IconButton aria-label="More actions" size="small">
            <DotsVerticalIcon />
          </IconButton>
        </HeaderActions>
      </Header>

      <Conversation ref={conversationRef}>
        <ConversationStack>
          <ConversationInner>
            {messages.map((message, messageIndex) => {
              const isAgent = message.role === 'agent'
              const isLast = messageIndex === messages.length - 1
              const showPendingHere = Boolean(customerPending) && isLast && pendingAttachesToLast
              const bubbles = message.bodies.length > 0 ? message.bodies : [message.body]
              return (
                <Message
                  key={message.id}
                  $animateEnter={shouldAnimateMessageEnter(message.id)}
                  $enterMs={isAgent ? 360 : 560}
                >
                  <ActorRow>
                    <Avatar size="extrasmall">
                      <img src={message.avatar} alt={message.name} />
                    </Avatar>
                    <ActorName>{message.name}</ActorName>
                    {message.assisted ? (
                      <AssistedTagButton
                        type="button"
                        aria-label="About this assisted reply"
                        aria-expanded={assistedTipOpen}
                        aria-haspopup="dialog"
                        onClick={(event) => openAssistedTip(event.currentTarget)}
                      >
                        <AssistedTag size="small" hue="purple">
                          <Tag.Avatar>
                            <SparkleFillIcon aria-hidden />
                          </Tag.Avatar>
                          Assisted
                        </AssistedTag>
                      </AssistedTagButton>
                    ) : null}
                    <Timestamp>{message.timestamp}</Timestamp>
                  </ActorRow>
                  <BubbleStack>
                    {bubbles.map((bubble, bubbleIndex) => (
                      <SpeechBubble
                        key={`${message.id}-${bubbleIndex}`}
                        agent={isAgent}
                        avatar={message.avatar}
                      >
                        {bubble}
                      </SpeechBubble>
                    ))}
                    {showPendingHere && customerPending ? (
                      <SpeechBubble avatar={profile.avatar}>
                        <PendingBubbleStack>
                          <PendingBubbleLayer
                            $active={customerPending.body === null}
                            aria-hidden={customerPending.body !== null}
                          >
                            <TypingDots aria-label={`${profile.name} is typing`}>
                              <TypingDot $delay={0} />
                              <TypingDot $delay={160} />
                              <TypingDot $delay={320} />
                            </TypingDots>
                          </PendingBubbleLayer>
                          <PendingBubbleLayer
                            $active={customerPending.body !== null}
                            aria-hidden={customerPending.body === null}
                          >
                            {customerPending.body ?? ''}
                          </PendingBubbleLayer>
                        </PendingBubbleStack>
                      </SpeechBubble>
                    ) : null}
                  </BubbleStack>
                  {message.events && message.events.length > 0 ? (
                    <MessageEvents events={message.events} />
                  ) : null}
                </Message>
              )
            })}
            {customerPending && !pendingAttachesToLast ? (
              <Message key={`pending-${ticket.id}`} $animateEnter>
                <ActorRow>
                  <Avatar size="extrasmall">
                    <img src={profile.avatar} alt={profile.name} />
                  </Avatar>
                  <ActorName>{profile.name}</ActorName>
                  <Timestamp>Just now</Timestamp>
                </ActorRow>
                <SpeechBubble avatar={profile.avatar}>
                  <PendingBubbleStack>
                    <PendingBubbleLayer
                      $active={customerPending.body === null}
                      aria-hidden={customerPending.body !== null}
                    >
                      <TypingDots aria-label={`${profile.name} is typing`}>
                        <TypingDot $delay={0} />
                        <TypingDot $delay={160} />
                        <TypingDot $delay={320} />
                      </TypingDots>
                    </PendingBubbleLayer>
                    <PendingBubbleLayer
                      $active={customerPending.body !== null}
                      aria-hidden={customerPending.body === null}
                    >
                      {customerPending.body ?? ''}
                    </PendingBubbleLayer>
                  </PendingBubbleStack>
                </SpeechBubble>
              </Message>
            ) : null}
          </ConversationInner>
          <ConversationInset $height={composerInset} $animate={chromeMotion} aria-hidden />
        </ConversationStack>
      </Conversation>

      <ComposerWrap
        ref={composerWrapRef}
        $covered={covered}
        $shortcuts={showShortcuts || activeShortcut === 'meta+backslash'}
        $peekBanner={
          postAssistPhase === 'peek' ||
          postAssistPhase === 'waitingTucking' ||
          postAssistPhase === 'deactivatedTucking' ||
          postAssistPhase === 'deactivatedPeek'
        }
      >
        <ComposerStack>
          <BannerSlot
            $state={bannerSlotState}
            $animate={chromeMotion && bannerPhase !== 'morphing'}
          >
            {bannerRendered &&
            (postAssistPhase !== 'idle' || suggestion) ? (
              <AaComposerBanner
                preview={suggestion?.answer ?? ''}
                count={suggestion?.actions.length}
                loading={bannerLoading}
                loadingLabel={
                  postAssistPhase === 'thinking'
                    ? 'Thinking'
                    : isRegenerating
                      ? 'Regenerating suggestions'
                      : loadStage === 'planning'
                        ? 'Planning assistance'
                        : 'Generating suggestion'
                }
                muted={mutedBanner}
                statusLabel={
                  deactivatedBanner
                    ? 'Auto Assist deactivated'
                    : 'Waiting for customer reply'
                }
                actionLabel={deactivatedBanner ? 'Activate' : undefined}
                onAction={deactivatedBanner ? activateSuggestions : undefined}
                feedbackLabel={mutedBanner ? 'Feedback' : undefined}
                onFeedback={mutedBanner ? openFeedbackTip : undefined}
                feedbackButtonRef={feedbackButtonRef}
                morphFrom={bannerMorphFrom}
                isMorphing={bannerPhase === 'morphing'}
                onMorphComplete={finishBannerMorph}
                onView={openSuggestion}
                showShortcut={
                  (showShortcuts || activeShortcut === 'meta+backslash') &&
                  (deactivatedBanner ||
                    (!bannerLoading &&
                      answerReady &&
                      Boolean(suggestion) &&
                      phase === 'composer'))
                }
                shortcutPressed={activeShortcut === 'meta+backslash'}
                shortcutModLabel="⌘"
              />
            ) : null}
          </BannerSlot>
          <AaFeedbackTip
            open={feedbackTipOpen}
            anchor={feedbackTipAnchor}
            onClose={closeFeedbackTip}
            onSubmitted={onFeedbackSubmitted}
          />
          <Composer $covered={covered} aria-hidden={covered}>
          <ChannelRow>
            <Channel type="button">
              {channelLabel.charAt(0).toUpperCase() + channelLabel.slice(1)}
              <ChevronDownIcon />
            </Channel>
            <TooltipDialog
              referenceElement={assistedTipOpen ? assistedTipAnchor : null}
              onClose={closeAssistedTip}
              placement="top"
              hasArrow
              isAnimated
              focusOnMount
              restoreFocus
              appendToNode={document.body}
              zIndex={1000}
            >
              <TooltipDialog.Title tag="h2">Why this suggestion was generated?</TooltipDialog.Title>
              <TooltipDialog.Body>
                <AssistedTipBody>
                  <AssistedTipRationale>{assistedRationale}</AssistedTipRationale>
                  <TipSourcesList sources={tipSources} />
                </AssistedTipBody>
              </TooltipDialog.Body>
              <TooltipDialog.Footer>
                <TooltipDialog.FooterItem>
                  <Button size="small" isPrimary onClick={closeAssistedTip}>
                    Show edits
                  </Button>
                </TooltipDialog.FooterItem>
              </TooltipDialog.Footer>
              <TooltipDialog.Close aria-label="Close" />
            </TooltipDialog>
          </ChannelRow>
          <ComposerTextWrap>
            <ComposerInput
              ref={composerRef}
              aria-label="Message composer"
              contentEditable={!covered}
              suppressContentEditableWarning
              data-placeholder="Type a message…"
              $focused={composerFocused && !covered}
              onFocus={() => setComposerFocused(true)}
              onBlur={() => setComposerFocused(false)}
              onInput={syncComposerEmpty}
              onKeyDown={onComposerKeyDown}
            />
          </ComposerTextWrap>
          <Toolbar>
            <ToolbarIcons>
              <IconButton aria-label="Templates" size="small">
                <NotePencilIcon />
              </IconButton>
              <IconButton aria-label="Emoji" size="small">
                <EmojiHappyIcon />
              </IconButton>
              <IconButton aria-label="Attach" size="small">
                <PaperclipIcon />
              </IconButton>
              <IconButton aria-label="Enhance writing" size="small">
                <PencilSparkleIcon />
              </IconButton>
              <IconButton aria-label="More" size="small">
                <PlusIcon />
              </IconButton>
            </ToolbarIcons>
            <SmallButton size="small" isBasic disabled={composerEmpty || covered} onClick={sendComposer}>
              Send
            </SmallButton>
          </Toolbar>
          </Composer>
        </ComposerStack>

        {showSuggestionCard && suggestion ? (
          <SuggestionOverlay ref={suggestionCardRef} $exiting={suggestionExiting}>
            <AaSuggestion
              key={`${ticket.id}-${customerFollowUpCount}-${suggestionRevision}`}
              suggestion={suggestion}
              initialDraft={suggestionDraft}
              onDraftChange={setSuggestionDraft}
              onDismiss={closeSuggestionToBanner}
              onStopSuggestions={stopSuggestions}
              onApprove={approveSuggestion}
              deactivating={
                postAssistPhase === 'deactivated' ||
                postAssistPhase === 'deactivatedTucking'
              }
              tipRationale={assistedRationale}
              tipSources={tipSources}
              onEditSources={openSourcesModal}
              showShortcuts={showShortcuts}
              activeShortcut={activeShortcut}
              showAaShortcut={
                (showShortcuts || activeShortcut === 'meta+backslash') &&
                phase === 'ready' &&
                !suggestionExiting
              }
              aaShortcutPressed={activeShortcut === 'meta+backslash'}
              aaShortcutModLabel="⌘"
            />
          </SuggestionOverlay>
        ) : null}

        <AddKnowledgeModal
          isOpen={sourcesModalOpen}
          onClose={() => setSourcesModalOpen(false)}
          topic={ticket.intent}
          initialSelectedIds={selectedSourceIds}
          onApply={handleApplySources}
        />
      </ComposerWrap>
    </Root>
  )
}

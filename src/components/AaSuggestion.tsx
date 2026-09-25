import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import styled, { css } from 'styled-components'
import {
  Button,
  ChevronButton,
  Item,
  Menu,
  SplitButton,
  TooltipDialog,
} from '@zendesk-ui/react-components'
import { IconButton, SmallButton } from './IconButton'
import ShortcutKey from './ShortcutKey'
import TipSourcesList from './TipSourcesList'
import SparkleFillIcon from '@zendesk-ui/assets/icons/20px/sparkle-fill.svg?react'
import InfoCircleIcon from '@zendesk-ui/assets/icons/20px/info-circle-stroke.svg?react'
import XIcon from '@zendesk-ui/assets/icons/20px/x.svg?react'
import XSmallIcon from '@zendesk-ui/assets/icons/20px/x-small.svg?react'
import TextIcon from '@zendesk-ui/assets/icons/20px/text.svg?react'
import EmojiHappyIcon from '@zendesk-ui/assets/icons/20px/emoji-happy-stroke.svg?react'
import PaperclipIcon from '@zendesk-ui/assets/icons/20px/paperclip.svg?react'
import ChainIcon from '@zendesk-ui/assets/icons/20px/chain.svg?react'
import PencilSparkleIcon from '@zendesk-ui/assets/icons/20px/pencil-sparkle-stroke.svg?react'
import DotsHorizontalIcon from '@zendesk-ui/assets/icons/20px/dots-horizontal.svg?react'
import { flora } from '../flora/tokens'
import { typeStyle } from '../flora/typography'
import type { AaAction, AaSuggestionData } from '../data/aaSuggestions'
import type { TipSourceItem } from '../data/sourceCatalog'

const TOOLBAR_ITEMS = [
  { value: 'formatting', label: 'Formatting', Icon: TextIcon },
  { value: 'emoji', label: 'Emoji', Icon: EmojiHappyIcon },
  { value: 'attach', label: 'Attach', Icon: PaperclipIcon },
  { value: 'link', label: 'Insert link', Icon: ChainIcon },
  { value: 'enhance', label: 'Enhance writing', Icon: PencilSparkleIcon },
] as const

const ICON_SIZE = 32
const ICON_GAP = 4
const ICON_STEP = ICON_SIZE + ICON_GAP
const EXPANDED_WIDTH = TOOLBAR_ITEMS.length * ICON_SIZE + (TOOLBAR_ITEMS.length - 1) * ICON_GAP
const TOOLBAR_GAP = 12
/** Extra room required before expanding again (avoids collapse flicker). */
const EXPAND_SLACK_PX = 28
const COLLAPSE_MS = 420
const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'

type ToolbarPhase = 'expanded' | 'collapsing' | 'collapsed' | 'expanding'

const MUTED_BG = '#f3f3f2'
const MUTED_FG = '#68737d'

const Card = styled.div<{ $deactivating?: boolean; $shortcuts?: boolean }>`
  width: 100%;
  max-height: 100%;
  height: fit-content;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: ${({ $shortcuts }) => ($shortcuts ? 'visible' : 'hidden')};
  border: 1px solid ${({ $deactivating }) => ($deactivating ? 'transparent' : '#d8dcde')};
  border-radius: 16px;
  box-shadow: ${({ $deactivating }) =>
    $deactivating ? 'none' : '0 0 4px 0 rgba(10, 13, 14, 0.16)'};
  background: ${({ $deactivating }) =>
    $deactivating
      ? MUTED_BG
      : `linear-gradient(160deg, rgb(251, 243, 248) 2.66%, rgb(255, 255, 255) 28.2%), #ffffff`};
  transition:
    background 160ms ease,
    border-color 160ms ease,
    box-shadow 160ms ease;
`

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 12px 12px 20px;
  flex-shrink: 0;
`

const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
  min-width: 0;
`

const BrandIcon = styled(SparkleFillIcon)<{ $muted?: boolean }>`
  width: 14px;
  height: 14px;
  color: ${({ $muted }) => ($muted ? MUTED_FG : '#9256b1')};
  flex-shrink: 0;
  transition: color 160ms ease;
`

const BrandLabel = styled.span<{ $muted?: boolean }>`
  ${typeStyle('smallBold')}
  letter-spacing: -0.25px;
  color: ${({ $muted }) => ($muted ? MUTED_FG : '#9256b1')};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color 160ms ease;
`

const DismissControl = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`

const DismissShortcut = styled(ShortcutKey)`
  position: absolute;
  left: 0;
  top: 0;
  transform: translate(-35%, -35%);
  z-index: 2;
`

const InfoButton = styled.button`
  appearance: none;
  border: none;
  background: transparent;
  padding: 0;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 14px;
  height: 14px;
  line-height: 0;
  cursor: pointer;
  color: #9256b1;
  border-radius: 50%;

  &:focus-visible {
    outline: 2px solid #9256b1;
    outline-offset: 2px;
  }
`

const InfoIcon = styled(InfoCircleIcon)`
  display: block;
  width: 14px;
  height: 14px;
`

const TipBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 360px;
`

const TipRationale = styled.p`
  margin: 0;
  ${typeStyle('smallDefault')}
  color: ${flora.fg.default};
`

const Body = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 0 20px 8px;
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
`

const AnswerInput = styled.textarea`
  margin: 0;
  width: 100%;
  border: none;
  outline: none;
  resize: none;
  background: transparent;
  padding: 0;
  field-sizing: content;
  min-height: 40px;
  ${typeStyle('mediumDefault')}
  color: ${flora.fg.strong};
  font-family: inherit;

  &:focus {
    outline: none;
  }
`

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: flex-start;
`

const ActionChip = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-height: 20px;
  padding: 2px 4px 2px 8px;
  border-radius: 99px;
  background: #eae9e8;
  ${typeStyle('smallDefault')}
  color: ${flora.fg.default};
`

const ActionLabel = styled.span`
  ${typeStyle('smallBold')}
  color: ${flora.fg.default};
`

const ActionValue = styled.span`
  ${typeStyle('smallDefault')}
  color: ${flora.fg.default};
`

const RemoveTag = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  padding: 0;
  border: none;
  border-radius: 99px;
  background: transparent;
  color: ${flora.fg.default};
  cursor: pointer;
  opacity: 0.7;
  flex-shrink: 0;

  svg {
    width: 12px;
    height: 12px;
  }

  &:hover {
    opacity: 1;
    background: rgba(47, 49, 48, 0.08);
  }
`

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  gap: ${TOOLBAR_GAP}px;
  padding: 8px 16px;
  flex-shrink: 0;
`

const ToolbarIcons = styled.div`
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
`

const IconsTrack = styled.div<{ $collapsed: boolean }>`
  position: relative;
  display: flex;
  align-items: center;
  height: ${ICON_SIZE}px;
  width: ${({ $collapsed }) => ($collapsed ? ICON_SIZE : EXPANDED_WIDTH)}px;
  overflow: hidden;
  transition: width ${COLLAPSE_MS}ms ${EASE};
`

const IconSlot = styled.div<{ $index: number; $collapsed: boolean }>`
  position: absolute;
  top: 0;
  left: ${({ $index }) => $index * ICON_STEP}px;
  width: ${ICON_SIZE}px;
  height: ${ICON_SIZE}px;
  display: flex;
  align-items: center;
  justify-content: center;
  transform-origin: center center;
  transition:
    transform ${COLLAPSE_MS}ms ${EASE},
    opacity ${Math.round(COLLAPSE_MS * 0.7)}ms ease;
  transition-delay: ${({ $index, $collapsed }) =>
    $collapsed
      ? `${(TOOLBAR_ITEMS.length - 1 - $index) * 28}ms`
      : `${$index * 28}ms`};
  ${({ $index, $collapsed }) =>
    $collapsed
      ? css`
          transform: translateX(${-$index * ICON_STEP}px) scale(0.35);
          opacity: 0;
          pointer-events: none;
        `
      : css`
          transform: translateX(0) scale(1);
          opacity: 1;
          pointer-events: auto;
        `}
`

const DotsSlot = styled.div<{ $visible: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  width: ${ICON_SIZE}px;
  height: ${ICON_SIZE}px;
  display: flex;
  align-items: center;
  justify-content: center;
  transform-origin: center center;
  transition:
    opacity 240ms ease,
    transform 320ms ${EASE};
  transition-delay: ${({ $visible }) => ($visible ? '160ms' : '0ms')};
  ${({ $visible }) =>
    $visible
      ? css`
          opacity: 1;
          transform: scale(1);
          pointer-events: auto;
        `
      : css`
          opacity: 0;
          transform: scale(0.7);
          pointer-events: none;
        `}
`

const ToolbarActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
`

const ResetSlot = styled.div<{ $open: boolean }>`
  display: grid;
  grid-template-columns: ${({ $open }) => ($open ? '1fr' : '0fr')};
  transition: grid-template-columns ${COLLAPSE_MS}ms ${EASE};
`

const ResetInner = styled.div<{ $open: boolean }>`
  overflow: hidden;
  min-width: 0;

  > button {
    white-space: nowrap;
    opacity: ${({ $open }) => ($open ? 1 : 0)};
    transform: ${({ $open }) => ($open ? 'translateX(0)' : 'translateX(10px)')};
    transition:
      opacity 260ms ease,
      transform ${COLLAPSE_MS}ms ${EASE};
    transition-delay: ${({ $open }) => ($open ? '140ms' : '0ms')};
  }
`

const ApproveKeys = styled.span`
  position: absolute;
  left: 0;
  top: 0;
  transform: translate(-35%, -35%);
  z-index: 2;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  pointer-events: none;
`

const ApproveButtonWrap = styled.div`
  position: relative;
  display: inline-flex;
`

const ApproveSplit = styled(SplitButton)`
  && {
    height: 32px;
  }
`

const approveControlStyles = css`
  && {
    height: 32px;
    min-height: 32px;
    background: ${flora.fg.default};
    color: #ffffff;
  }

  &&:hover {
    background: #1a1c1b;
  }
`

const ApproveButton = styled(Button)`
  ${approveControlStyles}

  && {
    padding: 8px 12px;
  }
`

const ApproveChevron = styled(ChevronButton)`
  ${approveControlStyles}
`

const OverflowMenu = styled(Menu)`
  && {
    min-width: 0;
    width: max-content;
  }

  && [data-garden-id='dropdowns.menu.item'] {
    padding-left: 8px;
    padding-right: 12px;
  }

  && [data-garden-id='dropdowns.menu.item.type_icon'] {
    display: none;
  }

  && [data-garden-id='dropdowns.menu.item.icon'] {
    margin-inline-end: 8px;
  }
`

function cloneSuggestion(suggestion: AaSuggestionData): AaSuggestionData {
  return {
    answer: suggestion.answer,
    actions: suggestion.actions.map((action) => ({ ...action })),
  }
}

function sameActions(a: AaAction[], b: AaAction[]) {
  if (a.length !== b.length) return false
  return a.every(
    (action, index) => action.label === b[index]?.label && action.value === b[index]?.value,
  )
}

interface AaSuggestionProps {
  suggestion: AaSuggestionData
  initialDraft?: AaSuggestionData | null
  onDraftChange?: (draft: AaSuggestionData) => void
  onDismiss?: () => void
  onStopSuggestions?: () => void
  onApprove?: (payload: { answer: string; actions: AaAction[] }) => void
  /** Instantly show deactivated styling before morphing away. */
  deactivating?: boolean
  tipRationale: string
  tipSources: TipSourceItem[]
  onEditSources?: () => void
  showShortcuts?: boolean
  activeShortcut?: string | null
  showAaShortcut?: boolean
  aaShortcutPressed?: boolean
  aaShortcutModLabel?: string
}

export default function AaSuggestion({
  suggestion,
  initialDraft,
  onDraftChange,
  onDismiss,
  onStopSuggestions,
  onApprove,
  deactivating = false,
  tipRationale,
  tipSources,
  onEditSources,
  showShortcuts = false,
  activeShortcut = null,
  showAaShortcut = false,
  aaShortcutPressed = false,
  aaShortcutModLabel = '⌘',
}: AaSuggestionProps) {
  const [draft, setDraft] = useState(() => cloneSuggestion(initialDraft ?? suggestion))
  const [phase, setPhase] = useState<ToolbarPhase>('expanded')
  const [needsCollapse, setNeedsCollapse] = useState(false)
  const [tipOpen, setTipOpen] = useState(false)
  const [tipAnchor, setTipAnchor] = useState<HTMLElement | null>(null)
  const toolbarRef = useRef<HTMLDivElement>(null)
  const actionsRef = useRef<HTMLDivElement>(null)
  const resetButtonRef = useRef<HTMLButtonElement>(null)
  const needsCollapseRef = useRef(false)
  needsCollapseRef.current = needsCollapse

  const closeTip = () => {
    setTipOpen(false)
    setTipAnchor(null)
  }

  const openTip = (anchor: HTMLElement) => {
    setTipAnchor(anchor)
    setTipOpen(true)
  }

  const updateDraft = (next: AaSuggestionData | ((current: AaSuggestionData) => AaSuggestionData)) => {
    setDraft((current) => {
      const resolved = typeof next === 'function' ? next(current) : next
      onDraftChange?.(resolved)
      return resolved
    })
  }

  const isDirty = useMemo(
    () => draft.answer !== suggestion.answer || !sameActions(draft.actions, suggestion.actions),
    [draft, suggestion],
  )

  // Collapse left icons only when Reset/Approve would overlap them at this width.
  useLayoutEffect(() => {
    const toolbar = toolbarRef.current
    const actions = actionsRef.current
    if (!toolbar || !actions) return

    const measure = () => {
      const toolbarWidth = toolbar.clientWidth
      const approveWidth =
        (actions.querySelector('[data-approve-wrap]') as HTMLElement | null)?.offsetWidth ?? 0
      // Natural Reset width (button itself isn’t clipped the way the slot is).
      const resetWidth = isDirty ? (resetButtonRef.current?.scrollWidth ?? 0) : 0
      const actionsGap = resetWidth > 0 ? 8 : 0
      const projectedActionsWidth = resetWidth + actionsGap + approveWidth
      const actionsWidth = Math.max(
        actions.getBoundingClientRect().width,
        projectedActionsWidth,
      )
      const available = toolbarWidth - actionsWidth - TOOLBAR_GAP
      const shouldCollapse = needsCollapseRef.current
        ? available < EXPANDED_WIDTH + EXPAND_SLACK_PX
        : available < EXPANDED_WIDTH
      setNeedsCollapse(shouldCollapse)
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(toolbar)
    observer.observe(actions)
    window.addEventListener('resize', measure)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [isDirty, showAaShortcut, draft.answer, draft.actions.length])

  useEffect(() => {
    if (needsCollapse && (phase === 'expanded' || phase === 'expanding')) {
      setPhase('collapsing')
      return
    }
    if (!needsCollapse && (phase === 'collapsed' || phase === 'collapsing')) {
      setPhase('expanding')
    }
  }, [needsCollapse, phase])

  useEffect(() => {
    if (phase !== 'collapsing' && phase !== 'expanding') return
    const timer = window.setTimeout(() => {
      setPhase(phase === 'collapsing' ? 'collapsed' : 'expanded')
    }, COLLAPSE_MS + TOOLBAR_ITEMS.length * 28)
    return () => window.clearTimeout(timer)
  }, [phase])

  const collapsed = phase === 'collapsing' || phase === 'collapsed'
  const showReset = isDirty
  const showDots = collapsed

  const reset = () => updateDraft(cloneSuggestion(suggestion))

  const handleApprove = () => {
    onApprove?.({ answer: draft.answer, actions: draft.actions })
  }

  const removeAction = (index: number) => {
    updateDraft((current) => ({
      ...current,
      actions: current.actions.filter((_, i) => i !== index),
    }))
  }

  const escPressed = activeShortcut === 'Escape'
  const showEscKey = showShortcuts || escPressed

  return (
    <Card $deactivating={deactivating} $shortcuts={showEscKey}>
      <Header>
        <Brand>
          <BrandIcon $muted={deactivating} aria-hidden />
          <BrandLabel $muted={deactivating}>
            {deactivating ? 'Auto Assist deactivated' : 'Suggestion'}
          </BrandLabel>
          {!deactivating ? (
            <InfoButton
              type="button"
              aria-label="Why this suggestion was generated"
              aria-expanded={tipOpen}
              onClick={(event) => openTip(event.currentTarget)}
            >
              <InfoIcon aria-hidden />
            </InfoButton>
          ) : null}
        </Brand>
        {!deactivating ? (
          <DismissControl>
            {showEscKey ? (
              <DismissShortcut label="esc" pressed={escPressed} />
            ) : null}
            <IconButton
              aria-label="Dismiss suggestion"
              aria-keyshortcuts="Escape"
              size="small"
              onClick={onDismiss}
            >
              <XIcon />
            </IconButton>
          </DismissControl>
        ) : null}
      </Header>

      <TooltipDialog
        referenceElement={tipOpen ? tipAnchor : null}
        onClose={closeTip}
        placement="top"
        hasArrow
        isAnimated
        fallbackPlacements={['top']}
        focusOnMount
        restoreFocus
        appendToNode={document.body}
        zIndex={1000}
      >
        <TooltipDialog.Title tag="h2">Why this suggestion was generated?</TooltipDialog.Title>
        <TooltipDialog.Body>
          <TipBody>
            <TipRationale>{tipRationale}</TipRationale>
            <TipSourcesList
              sources={tipSources}
              onEdit={() => {
                closeTip()
                onEditSources?.()
              }}
            />
          </TipBody>
        </TooltipDialog.Body>
        <TooltipDialog.Close aria-label="Close" />
      </TooltipDialog>

      <Body>
        <AnswerInput
          aria-label="Auto assist suggestion"
          value={draft.answer}
          rows={3}
          onChange={(event) =>
            updateDraft((current) => ({
              ...current,
              answer: event.target.value,
            }))
          }
        />
        {draft.actions.length > 0 ? (
          <Actions>
            {draft.actions.map((action, index) => (
              <ActionChip key={`${action.label}-${action.value}-${index}`}>
                <ActionLabel>{action.label}</ActionLabel>
                <ActionValue>{action.value}</ActionValue>
                <RemoveTag
                  type="button"
                  aria-label={`Remove ${action.value}`}
                  onClick={() => removeAction(index)}
                >
                  <XSmallIcon />
                </RemoveTag>
              </ActionChip>
            ))}
          </Actions>
        ) : null}
      </Body>

      <Toolbar ref={toolbarRef}>
        <ToolbarIcons>
          <IconsTrack $collapsed={collapsed}>
            {TOOLBAR_ITEMS.map(({ value, label, Icon }, index) => (
              <IconSlot key={value} $index={index} $collapsed={collapsed}>
                <IconButton aria-label={label} size="small" tabIndex={collapsed ? -1 : undefined}>
                  <Icon />
                </IconButton>
              </IconSlot>
            ))}
            <DotsSlot $visible={showDots}>
              {phase === 'collapsed' ? (
                <OverflowMenu
                  isCompact
                  placement="top-start"
                  fallbackPlacements={['top', 'top-end', 'bottom-start']}
                  appendToNode={document.body}
                  zIndex={1000}
                  button={(props) => (
                    <IconButton {...props} aria-label="More actions" size="small">
                      <DotsHorizontalIcon />
                    </IconButton>
                  )}
                >
                  {TOOLBAR_ITEMS.map(({ value, label, Icon }) => (
                    <Item key={value} value={value} label={label} icon={<Icon />} />
                  ))}
                </OverflowMenu>
              ) : (
                <IconButton aria-label="More actions" size="small" tabIndex={-1}>
                  <DotsHorizontalIcon />
                </IconButton>
              )}
            </DotsSlot>
          </IconsTrack>
        </ToolbarIcons>
        <ToolbarActions ref={actionsRef}>
          <ResetSlot $open={showReset}>
            <ResetInner $open={showReset}>
              <SmallButton
                ref={resetButtonRef}
                size="small"
                isBasic
                onClick={reset}
                tabIndex={showReset ? undefined : -1}
              >
                Reset
              </SmallButton>
            </ResetInner>
          </ResetSlot>
          <ApproveButtonWrap data-approve-wrap>
            {showAaShortcut ? (
              <ApproveKeys>
                <ShortcutKey label={aaShortcutModLabel} pressed={aaShortcutPressed} />
                <ShortcutKey label="\\" pressed={aaShortcutPressed} />
              </ApproveKeys>
            ) : null}
            <ApproveSplit>
              <ApproveButton
                size="small"
                onClick={handleApprove}
                aria-keyshortcuts="Meta+\\"
              >
                Approve
              </ApproveButton>
              <Menu
                button={(props) => (
                  <ApproveChevron
                    {...props}
                    size="small"
                    aria-label="More approve options"
                  />
                )}
                placement="top-end"
                appendToNode={document.body}
                zIndex={1100}
                onChange={({ value }) => {
                  if (value === 'auto-approve') {
                    handleApprove()
                    return
                  }
                  if (value === 'stop-suggestions') {
                    onStopSuggestions?.()
                  }
                }}
              >
                <Item
                  value="stop-suggestions"
                  label="Deactivate suggestions for this ticket"
                  type="danger"
                />
                <Item value="auto-approve" label="Auto approve for this ticket" />
              </Menu>
            </ApproveSplit>
          </ApproveButtonWrap>
        </ToolbarActions>
      </Toolbar>
    </Card>
  )
}

import { useLayoutEffect, useRef, type Ref } from 'react'
import { createPortal } from 'react-dom'
import styled, { css, keyframes } from 'styled-components'
import SparkleFillIcon from '@zendesk-ui/assets/icons/20px/sparkle-fill.svg?react'
import { Tag } from '@zendesk-ui/react-components'
import { typeStyle } from '../flora/typography'
import ShortcutKey from './ShortcutKey'

const AA_PURPLE = '#9256b1'
const AA_BORDER = '#e9d8f1'
const MUTED_FG = '#68737d'
const MUTED_BG = '#f3f3f2'
const AA_GRADIENT = 'linear-gradient(99.33deg, rgb(251, 243, 248) 0.79%, rgb(255, 255, 255) 25.11%)'
const AA_SHADOW = '0 1px 4px rgba(146, 86, 177, 0.2)'
const MORPH_MS = 560
const MORPH_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'
const DISSOLVE_MS = 640
const DISSOLVE_EASE = 'cubic-bezier(0.4, 0, 0.2, 1)'
const BANNER_GAP = 8
const ROW_GAP = 4
const BANNER_PAD_X = 12
const ICON_SIZE = 14
const SPARKLE_CYCLE_MS = 4800
const SPARKLE_EASE = 'cubic-bezier(0.4, 0, 0.2, 1)'
const SMALL_CORNER = 4
const MAIN_AVOID = 2.25

const dissolveFg = keyframes`
  from {
    color: ${AA_PURPLE};
  }
  to {
    color: ${MUTED_FG};
  }
`

/* Big star shifts opposite the small one so they don’t touch. */
const sparkleMainMove = keyframes`
  0%,
  6% {
    transform: translate(0, 0) scale(1);
  }
  14%,
  20% {
    transform: translate(-${MAIN_AVOID}px, ${MAIN_AVOID}px) scale(0.9);
  }
  28%,
  34% {
    transform: translate(-${MAIN_AVOID}px, -${MAIN_AVOID}px) scale(0.9);
  }
  48%,
  54% {
    transform: translate(${MAIN_AVOID}px, -${MAIN_AVOID}px) scale(0.9);
  }
  68%,
  74% {
    transform: translate(${MAIN_AVOID}px, ${MAIN_AVOID}px) scale(0.9);
  }
  88% {
    transform: translate(-${MAIN_AVOID}px, ${MAIN_AVOID}px) scale(0.9);
  }
  96%,
  100% {
    transform: translate(0, 0) scale(1);
  }
`

/* Small star slips out, visits each corner, then tucks back behind. */
const sparkleSmallMove = keyframes`
  0%,
  6% {
    opacity: 0;
    transform: translate(0, 0) scale(0.3);
  }
  14%,
  20% {
    opacity: 1;
    transform: translate(${SMALL_CORNER}px, -${SMALL_CORNER}px) scale(0.5);
  }
  28%,
  34% {
    opacity: 1;
    transform: translate(${SMALL_CORNER}px, ${SMALL_CORNER}px) scale(0.5);
  }
  48%,
  54% {
    opacity: 1;
    transform: translate(-${SMALL_CORNER}px, ${SMALL_CORNER}px) scale(0.5);
  }
  68%,
  74% {
    opacity: 1;
    transform: translate(-${SMALL_CORNER}px, -${SMALL_CORNER}px) scale(0.5);
  }
  88% {
    opacity: 1;
    transform: translate(${SMALL_CORNER}px, -${SMALL_CORNER}px) scale(0.5);
  }
  96%,
  100% {
    opacity: 0;
    transform: translate(0, 0) scale(0.3);
  }
`

const sparkleShimmer = keyframes`
  0%,
  100% {
    filter: brightness(1) drop-shadow(0 0 0 transparent);
  }
  45% {
    filter: brightness(1.35) drop-shadow(0 0 2px rgba(255, 255, 255, 0.65));
  }
  60% {
    filter: brightness(1.1) drop-shadow(0 0 1.5px rgba(146, 86, 177, 0.4));
  }
`

/* Appear, hold, then clear together for a clean loop. */
const textDotAppear = keyframes`
  0%,
  8% {
    opacity: 0;
  }
  14%,
  78% {
    opacity: 1;
  }
  88%,
  100% {
    opacity: 0;
  }
`

const Banner = styled.div<{ $settled?: boolean; $loading?: boolean; $muted?: boolean }>`
  position: relative;
  display: flex;
  align-items: center;
  gap: ${BANNER_GAP}px;
  width: 100%;
  height: 32px;
  padding: 0 ${BANNER_PAD_X}px;
  border: 1px solid ${({ $muted }) => ($muted ? 'transparent' : AA_BORDER)};
  border-radius: 16px;
  background: ${({ $muted }) => ($muted ? MUTED_BG : AA_GRADIENT)};
  box-shadow: ${({ $muted }) => ($muted ? 'none' : AA_SHADOW)};
  box-sizing: border-box;
  overflow: visible;
  transition:
    background ${DISSOLVE_MS}ms ${DISSOLVE_EASE},
    border-color ${DISSOLVE_MS}ms ${DISSOLVE_EASE},
    box-shadow ${DISSOLVE_MS}ms ${DISSOLVE_EASE};

  ${({ $settled }) =>
    !$settled &&
    css`
      visibility: hidden;
      pointer-events: none;
    `}

  ${({ $loading, $muted }) =>
    $loading &&
    !$muted &&
    css`
      background:
        linear-gradient(160deg, rgb(251, 243, 248) 2.66%, rgb(255, 255, 255) 28.2%),
        #ffffff;
    `}
`

const MorphShell = styled.div<{ $muted?: boolean }>`
  position: fixed;
  z-index: 40;
  display: flex;
  align-items: center;
  gap: ${BANNER_GAP}px;
  padding: 0 ${BANNER_PAD_X}px;
  border: 1px solid ${({ $muted }) => ($muted ? 'transparent' : AA_BORDER)};
  background: ${({ $muted }) => ($muted ? MUTED_BG : AA_GRADIENT)};
  box-shadow: ${({ $muted }) => ($muted ? 'none' : AA_SHADOW)};
  box-sizing: border-box;
  overflow: hidden;
  pointer-events: none;
  will-change: left, top, width, height, border-radius, background, border-color, box-shadow;
`

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: ${ROW_GAP}px;
  flex: 1;
  min-width: 0;
  height: 100%;
`

const OpenArea = styled.button<{ $loading?: boolean }>`
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: ${ROW_GAP}px;
  flex: 1;
  min-width: 0;
  height: 100%;
  margin: 0;
  padding: 0;
  border: none;
  background: transparent;
  text-align: left;
  overflow: visible;
  cursor: ${({ $loading }) => ($loading ? 'default' : 'pointer')};
`

const BrandIconWrap = styled.span`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: ${ICON_SIZE}px;
  height: ${ICON_SIZE}px;
  flex-shrink: 0;
  overflow: visible;
`

const BrandIcon = styled(SparkleFillIcon)<{
  $loading?: boolean
  $muted?: boolean
  $dissolve?: boolean
}>`
  width: ${ICON_SIZE}px;
  height: ${ICON_SIZE}px;
  color: ${({ $muted, $dissolve }) => ($muted && !$dissolve ? MUTED_FG : AA_PURPLE)};
  flex-shrink: 0;
  transition: color ${DISSOLVE_MS}ms ${DISSOLVE_EASE};

  ${({ $dissolve }) =>
    $dissolve &&
    css`
      animation: ${dissolveFg} ${DISSOLVE_MS}ms ${DISSOLVE_EASE} forwards;
    `}

  ${({ $loading, $muted, $dissolve }) =>
    $loading &&
    !$muted &&
    !$dissolve &&
    css`
      position: absolute;
      inset: 0;
      z-index: 1;
      transform-origin: center;
      will-change: transform, filter;
      animation:
        ${sparkleMainMove} ${SPARKLE_CYCLE_MS}ms ${SPARKLE_EASE} infinite,
        ${sparkleShimmer} ${SPARKLE_CYCLE_MS}ms ease-in-out infinite;
    `}
`

const BrandIconSmall = styled(SparkleFillIcon)`
  position: absolute;
  inset: 0;
  z-index: 0;
  width: ${ICON_SIZE}px;
  height: ${ICON_SIZE}px;
  color: ${AA_PURPLE};
  opacity: 0;
  transform-origin: center;
  will-change: transform, opacity, filter;
  pointer-events: none;
  animation:
    ${sparkleSmallMove} ${SPARKLE_CYCLE_MS}ms ${SPARKLE_EASE} infinite,
    ${sparkleShimmer} ${SPARKLE_CYCLE_MS}ms ease-in-out infinite;
  animation-delay: 0ms, ${Math.round(SPARKLE_CYCLE_MS * 0.35)}ms;
`

const BrandLabel = styled.span<{ $muted?: boolean; $dissolve?: boolean }>`
  ${typeStyle('smallBold')}
  letter-spacing: -0.25px;
  color: ${({ $muted, $dissolve }) => ($muted && !$dissolve ? MUTED_FG : AA_PURPLE)};
  white-space: nowrap;
  flex-shrink: 0;
  transition: color ${DISSOLVE_MS}ms ${DISSOLVE_EASE};

  ${({ $dissolve }) =>
    $dissolve &&
    css`
      animation: ${dissolveFg} ${DISSOLVE_MS}ms ${DISSOLVE_EASE} forwards;
    `}
`

const Preview = styled.span`
  ${typeStyle('smallDefault')}
  color: #000000;
  min-width: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const LoadingDots = styled.span`
  display: inline-flex;
  align-items: baseline;
  flex-shrink: 0;
  min-width: 1.1em;
  ${typeStyle('smallBold')}
  letter-spacing: -0.25px;
  color: ${AA_PURPLE};
`

const LoadingDot = styled.span<{ $delay: number }>`
  opacity: 0;
  animation: ${textDotAppear} 1.5s linear infinite;
  animation-delay: ${({ $delay }) => `${$delay}ms`};
`

const CountTag = styled(Tag)`
  && {
    position: relative;
    z-index: 1;
    flex-shrink: 0;
  }
`

const ShortcutBadge = styled.span`
  position: absolute;
  left: 0;
  top: 0;
  transform: translate(-35%, -45%);
  z-index: 5;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  pointer-events: none;
`

const ActionButton = styled.button`
  position: relative;
  z-index: 2;
  flex-shrink: 0;
  margin: 0;
  padding: 2px 8px;
  min-height: 24px;
  border: none;
  border-radius: 99px;
  background: transparent;
  ${typeStyle('smallBold')}
  letter-spacing: -0.25px;
  color: ${MUTED_FG};
  cursor: pointer;
  white-space: nowrap;
  pointer-events: auto;

  &:hover {
    background: rgba(47, 49, 48, 0.08);
    color: #2f3130;
  }

  &:active {
    background: rgba(47, 49, 48, 0.12);
    color: #2f3130;
  }

  &:focus-visible {
    outline: 2px solid ${AA_PURPLE};
    outline-offset: 1px;
  }
`

interface AaComposerBannerProps {
  preview: string
  count?: number
  loading?: boolean
  /** Shown while loading (ellipsis dots append after this label). */
  loadingLabel?: string
  /** Gray static status banner (e.g. waiting for customer). */
  muted?: boolean
  statusLabel?: string
  /** Optional action (e.g. Activate). Feedback sits to its right when present. */
  actionLabel?: string
  onAction?: () => void
  /** Muted-banner Feedback control (waiting or deactivated). */
  feedbackLabel?: string
  onFeedback?: () => void
  feedbackButtonRef?: Ref<HTMLButtonElement>
  onView: () => void
  morphFrom?: DOMRect | null
  isMorphing?: boolean
  onMorphComplete?: () => void
  showShortcut?: boolean
  shortcutPressed?: boolean
  shortcutModLabel?: string
}

function BannerBody({
  loading,
  loadingLabel = 'Generating suggestion',
  muted = false,
  dissolving = false,
  statusLabel,
  actionLabel,
  onAction,
  feedbackLabel,
  onFeedback,
  feedbackButtonRef,
  preview,
  count,
  asButton,
  onView,
  tabIndex,
  showShortcut = false,
  shortcutPressed = false,
  shortcutModLabel = '⌘',
}: {
  loading: boolean
  loadingLabel?: string
  muted?: boolean
  dissolving?: boolean
  statusLabel?: string
  actionLabel?: string
  onAction?: () => void
  feedbackLabel?: string
  onFeedback?: () => void
  feedbackButtonRef?: Ref<HTMLButtonElement>
  preview: string
  count?: number
  asButton?: boolean
  onView?: () => void
  tabIndex?: number
  showShortcut?: boolean
  shortcutPressed?: boolean
  shortcutModLabel?: string
}) {
  const label = muted
    ? (statusLabel ?? 'Waiting for customer reply')
    : loading
      ? loadingLabel
      : 'Suggestion'
  const interactive = !loading && !muted
  const dissolve = muted && dissolving
  const inner = (
    <>
      <BrandIconWrap>
        <BrandIcon $loading={loading} $muted={muted} $dissolve={dissolve} aria-hidden />
        {loading && !muted && !dissolve ? <BrandIconSmall aria-hidden /> : null}
      </BrandIconWrap>
      {muted ? (
        <BrandLabel $muted $dissolve={dissolve}>
          {label}
        </BrandLabel>
      ) : loading ? (
        <>
          <BrandLabel>{label}</BrandLabel>
          <LoadingDots aria-hidden>
            <LoadingDot $delay={0}>.</LoadingDot>
            <LoadingDot $delay={250}>.</LoadingDot>
            <LoadingDot $delay={500}>.</LoadingDot>
          </LoadingDots>
        </>
      ) : (
        <>
          <BrandLabel>{label}</BrandLabel>
          <Preview>{preview}</Preview>
        </>
      )}
    </>
  )

  const shortcut = showShortcut ? (
    <ShortcutBadge>
      <ShortcutKey label={shortcutModLabel} pressed={shortcutPressed} />
      <ShortcutKey label="\\" pressed={shortcutPressed} />
    </ShortcutBadge>
  ) : null
  const showOpenShortcut = Boolean(shortcut && interactive && !(actionLabel && onAction))
  const showActionShortcut = Boolean(shortcut && actionLabel && onAction)

  return (
    <>
      {asButton ? (
        <OpenArea
          type="button"
          $loading={!interactive}
          onClick={interactive ? onView : undefined}
          disabled={!interactive}
          aria-label={label}
          aria-keyshortcuts={showOpenShortcut ? 'Meta+\\' : undefined}
          tabIndex={tabIndex}
        >
          {showOpenShortcut ? shortcut : null}
          {inner}
        </OpenArea>
      ) : (
        <Row>{inner}</Row>
      )}
      {actionLabel && onAction ? (
        <ActionButton
          type="button"
          aria-keyshortcuts={showActionShortcut ? 'Meta+\\' : undefined}
          onClick={(event) => {
            event.stopPropagation()
            onAction()
          }}
        >
          {showActionShortcut ? shortcut : null}
          {actionLabel}
        </ActionButton>
      ) : null}
      {feedbackLabel && onFeedback ? (
        <ActionButton
          ref={feedbackButtonRef}
          type="button"
          aria-haspopup="dialog"
          onClick={(event) => {
            event.stopPropagation()
            onFeedback()
          }}
        >
          {feedbackLabel}
        </ActionButton>
      ) : null}
      {!actionLabel &&
      !feedbackLabel &&
      !loading &&
      !muted &&
      typeof count === 'number' &&
      count > 0 ? (
        <CountTag size="small" isRound>
          {count}
        </CountTag>
      ) : null}
    </>
  )
}

export default function AaComposerBanner({
  preview,
  count,
  loading = false,
  loadingLabel = 'Generating suggestion',
  muted = false,
  statusLabel,
  actionLabel,
  onAction,
  feedbackLabel,
  onFeedback,
  feedbackButtonRef,
  onView,
  morphFrom = null,
  isMorphing = false,
  onMorphComplete,
  showShortcut = false,
  shortcutPressed = false,
  shortcutModLabel = '⌘',
}: AaComposerBannerProps) {
  const slotRef = useRef<HTMLDivElement>(null)
  const shellRef = useRef<HTMLDivElement>(null)
  const onMorphCompleteRef = useRef(onMorphComplete)
  onMorphCompleteRef.current = onMorphComplete
  const settled = !isMorphing

  useLayoutEffect(() => {
    if (!isMorphing || !morphFrom || !slotRef.current || !shellRef.current) return

    const to = slotRef.current.getBoundingClientRect()
    const shell = shellRef.current
    const collapsing = morphFrom.width > to.width + 8

    const surfaceBg = muted ? MUTED_BG : AA_GRADIENT
    const surfaceBorder = muted ? 'transparent' : AA_BORDER
    const surfaceShadow = muted ? 'none' : AA_SHADOW

    const fromStyle: Keyframe = {
      left: `${morphFrom.left}px`,
      top: `${morphFrom.top}px`,
      width: `${morphFrom.width}px`,
      height: `${morphFrom.height}px`,
      borderRadius: collapsing ? '16px' : '99px',
      background: surfaceBg,
      borderColor: surfaceBorder,
      boxShadow: surfaceShadow,
    }
    const toStyle: Keyframe = {
      left: `${to.left}px`,
      top: `${to.top}px`,
      width: `${to.width}px`,
      height: `${to.height}px`,
      borderRadius: '16px',
      background: surfaceBg,
      borderColor: surfaceBorder,
      boxShadow: surfaceShadow,
    }

    Object.assign(shell.style, {
      left: fromStyle.left as string,
      top: fromStyle.top as string,
      width: fromStyle.width as string,
      height: fromStyle.height as string,
      borderRadius: fromStyle.borderRadius as string,
      background: fromStyle.background as string,
      borderColor: fromStyle.borderColor as string,
      boxShadow: fromStyle.boxShadow as string,
      paddingLeft: `${BANNER_PAD_X}px`,
      paddingRight: `${BANNER_PAD_X}px`,
    })

    let animation: Animation | null = null
    const frame = requestAnimationFrame(() => {
      animation = shell.animate([fromStyle, toStyle], {
        duration: MORPH_MS,
        easing: MORPH_EASE,
        fill: 'forwards',
      })
      animation.onfinish = () => onMorphCompleteRef.current?.()
    })

    return () => {
      cancelAnimationFrame(frame)
      animation?.cancel()
    }
  }, [isMorphing, morphFrom, muted])

  const morphLayer =
    isMorphing && morphFrom
      ? createPortal(
          <MorphShell ref={shellRef} $muted={muted} aria-hidden>
            <BannerBody
              loading={loading}
              loadingLabel={loadingLabel}
              muted={muted}
              statusLabel={statusLabel}
              actionLabel={actionLabel}
              onAction={onAction}
              feedbackLabel={feedbackLabel}
              onFeedback={onFeedback}
              preview={preview}
              count={count}
            />
          </MorphShell>,
          document.body,
        )
      : null

  return (
    <>
      <Banner
        ref={slotRef}
        $settled={settled}
        $loading={loading}
        $muted={muted}
        data-settled={settled ? 'true' : 'false'}
        aria-busy={loading || undefined}
      >
        <BannerBody
          loading={loading}
          loadingLabel={loadingLabel}
          muted={muted}
          statusLabel={statusLabel}
          actionLabel={settled ? actionLabel : undefined}
          onAction={settled ? onAction : undefined}
          feedbackLabel={settled ? feedbackLabel : undefined}
          onFeedback={settled ? onFeedback : undefined}
          feedbackButtonRef={feedbackButtonRef}
          preview={preview}
          count={count}
          asButton
          onView={onView}
          tabIndex={settled && !loading && !muted ? 0 : -1}
          showShortcut={showShortcut}
          shortcutPressed={shortcutPressed}
          shortcutModLabel={shortcutModLabel}
        />
      </Banner>
      {morphLayer}
    </>
  )
}

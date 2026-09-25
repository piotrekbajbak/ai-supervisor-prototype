import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react'
import styled, { css, keyframes } from 'styled-components'
import { Button, Textarea, TooltipDialog } from '@zendesk-ui/react-components'
import { flora } from '../flora/tokens'
import { typeStyle } from '../flora/typography'

const FEEDBACK_CLOSE_MS = 3000
const FEEDBACK_TEXTAREA_HEIGHT = 72
/** Match Flora TooltipDialog `isAnimated` exit timeout. */
const TIP_EXIT_MS = 220

const FEEDBACK_SUGGESTIONS = [
  'This message needs follow up',
  'I never get suggestions from Auto assist here',
  "Suggestion wasn't relevant",
] as const

type FeedbackMode = 'compose' | 'sent'

const TipBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: min(360px, 80vw);
`

const FeedbackForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
`

const FeedbackSuggestions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  flex-shrink: 0;
`

const FeedbackChip = styled.button<{ $selected?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  max-width: 100%;
  margin: 0;
  padding: 2px 8px;
  min-height: 20px;
  border: none;
  border-radius: 99px;
  background: ${({ $selected }) => ($selected ? '#d8d6d4' : '#eae9e8')};
  color: ${flora.fg.default};
  ${typeStyle('smallDefault')}
  text-align: left;
  cursor: pointer;
  box-shadow: ${({ $selected }) => ($selected ? 'inset 0 0 0 1px #b7b7b3' : 'none')};
  transition:
    background 160ms ease,
    box-shadow 160ms ease;

  &:hover {
    background: ${({ $selected }) => ($selected ? '#d0cecc' : '#e3e1df')};
  }
`

const FeedbackTextarea = styled(Textarea)`
  && {
    width: 100%;
    min-height: ${FEEDBACK_TEXTAREA_HEIGHT}px !important;
    height: ${FEEDBACK_TEXTAREA_HEIGHT}px !important;
    max-height: ${FEEDBACK_TEXTAREA_HEIGHT}px !important;
    resize: none;
  }
`

const SentCopy = styled.p`
  margin: 0;
  ${typeStyle('mediumDefault')}
  color: ${flora.fg.default};
`

const FooterRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  width: 100%;
`

const progressFill = keyframes`
  from {
    transform: scaleX(0);
  }
  to {
    transform: scaleX(1);
  }
`

const CloseProgressButton = styled(Button)<{ $animating?: boolean }>`
  position: relative;
  overflow: hidden;

  ${({ $animating }) =>
    $animating &&
    css`
      &::before {
        content: '';
        position: absolute;
        inset: 0;
        transform-origin: left center;
        background: rgba(255, 255, 255, 0.22);
        animation: ${progressFill} ${FEEDBACK_CLOSE_MS}ms linear forwards;
        pointer-events: none;
      }

      > span {
        position: relative;
        z-index: 1;
      }
    `}
`

interface AaFeedbackTipProps {
  open: boolean
  anchor: HTMLElement | null
  onClose: () => void
  /** Fired once when the tip finishes closing after a successful send. */
  onSubmitted?: () => void
}

export default function AaFeedbackTip({
  open,
  anchor,
  onClose,
  onSubmitted,
}: AaFeedbackTipProps) {
  const [mode, setMode] = useState<FeedbackMode>('compose')
  const [feedbackText, setFeedbackText] = useState('')
  const [selectedFeedback, setSelectedFeedback] = useState<string[]>([])
  const [closing, setClosing] = useState(false)
  const [closeSeconds, setCloseSeconds] = useState(3)
  const fieldWrapRef = useRef<HTMLDivElement>(null)
  const submittedRef = useRef(false)
  const onCloseRef = useRef(onClose)
  const onSubmittedRef = useRef(onSubmitted)
  onCloseRef.current = onClose
  onSubmittedRef.current = onSubmitted

  const handleClose = () => {
    const wasSubmitted = submittedRef.current
    onCloseRef.current()
    if (!wasSubmitted) return
    // Tuck banner after exit animation so the tip doesn’t jump with the anchor.
    window.setTimeout(() => {
      onSubmittedRef.current?.()
      submittedRef.current = false
    }, TIP_EXIT_MS)
  }

  useEffect(() => {
    if (open) {
      submittedRef.current = false
      const focusField = () => {
        const field = fieldWrapRef.current?.querySelector<HTMLTextAreaElement>('textarea')
        field?.focus({ preventScroll: true })
      }
      const frame = window.requestAnimationFrame(focusField)
      const timer = window.setTimeout(focusField, 40)
      return () => {
        window.cancelAnimationFrame(frame)
        window.clearTimeout(timer)
      }
    }

    // Reset content only after the exit animation finishes (avoids compose flash).
    const timer = window.setTimeout(() => {
      setMode('compose')
      setFeedbackText('')
      setSelectedFeedback([])
      setClosing(false)
      setCloseSeconds(3)
    }, TIP_EXIT_MS)
    return () => window.clearTimeout(timer)
  }, [open])

  useEffect(() => {
    if (!closing) return

    setCloseSeconds(3)
    const interval = window.setInterval(() => {
      setCloseSeconds((seconds) => Math.max(0, seconds - 1))
    }, 1000)
    const timer = window.setTimeout(() => {
      handleClose()
    }, FEEDBACK_CLOSE_MS)

    return () => {
      window.clearInterval(interval)
      window.clearTimeout(timer)
    }
  }, [closing])

  const toggleSuggestion = (suggestion: string) => {
    setSelectedFeedback((current) =>
      current.includes(suggestion)
        ? current.filter((item) => item !== suggestion)
        : [...current, suggestion],
    )
  }

  const sendFeedback = () => {
    if (!feedbackText.trim() && selectedFeedback.length === 0) return
    submittedRef.current = true
    setMode('sent')
    setFeedbackText('')
    setSelectedFeedback([])
    setCloseSeconds(3)
    setClosing(true)
  }

  const onFieldKeyDown = (event: ReactKeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || event.shiftKey) return
    event.preventDefault()
    sendFeedback()
  }

  return (
    <TooltipDialog
      referenceElement={open ? anchor : null}
      onClose={handleClose}
      placement="top-end"
      hasArrow
      isAnimated
      fallbackPlacements={['top', 'top-start']}
      focusOnMount={false}
      // Don't restore focus to Feedback — peek banner uses :focus-within and would re-expand.
      restoreFocus={false}
      appendToNode={document.body}
      zIndex={1100}
    >
      <TooltipDialog.Title tag="h2">
        {mode === 'sent' ? 'Thanks for your feedback' : 'Give feedback'}
      </TooltipDialog.Title>
      <TooltipDialog.Body>
        <TipBody>
          {mode === 'compose' ? (
            <FeedbackForm>
              <FeedbackSuggestions>
                {FEEDBACK_SUGGESTIONS.map((suggestion) => {
                  const selected = selectedFeedback.includes(suggestion)
                  return (
                    <FeedbackChip
                      key={suggestion}
                      type="button"
                      $selected={selected}
                      aria-pressed={selected}
                      onClick={() => toggleSuggestion(suggestion)}
                    >
                      {suggestion}
                    </FeedbackChip>
                  )
                })}
              </FeedbackSuggestions>
              <div ref={fieldWrapRef}>
                <FeedbackTextarea
                  value={feedbackText}
                  onChange={(event) => setFeedbackText(event.target.value)}
                  onKeyDown={onFieldKeyDown}
                  placeholder="Tell us more (optional)"
                  aria-label="Feedback details"
                  autoFocus
                />
              </div>
            </FeedbackForm>
          ) : (
            <SentCopy>
              Your notes help improve Auto Assist for this workflow.
            </SentCopy>
          )}
        </TipBody>
      </TooltipDialog.Body>
      <TooltipDialog.Footer>
        <TooltipDialog.FooterItem>
          <FooterRow>
            {mode === 'compose' ? (
              <>
                <Button size="small" isBasic onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  size="small"
                  isPrimary
                  disabled={!feedbackText.trim() && selectedFeedback.length === 0}
                  onClick={sendFeedback}
                >
                  Send
                </Button>
              </>
            ) : (
              <CloseProgressButton
                size="small"
                isPrimary
                $animating={closing}
                aria-label={`Close (${closeSeconds})`}
                onClick={handleClose}
              >
                <span>Close ({closeSeconds})</span>
              </CloseProgressButton>
            )}
          </FooterRow>
        </TooltipDialog.FooterItem>
      </TooltipDialog.Footer>
    </TooltipDialog>
  )
}

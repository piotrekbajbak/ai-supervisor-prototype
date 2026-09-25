import { useEffect, useMemo, useRef, useState } from 'react'
import styled from 'styled-components'
import { getTicket, tickets } from '../data/tickets'
import { useShortcutUi } from '../shortcuts/ShortcutUiContext'
import WorkListPanel from './WorkListPanel'
import ConversationPanel from './ConversationPanel'
import CustomerContextPanel from './CustomerContextPanel'
import ContextSidebar from './ContextSidebar'
import ActionBar from './ActionBar'

const Shell = styled.div`
  position: relative;
  display: flex;
  gap: 8px;
  height: 100%;
  min-height: 0;
  padding: 0 8px 4px 4px;
  overflow: visible;
  background: transparent;
`

const MainPanel = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border-radius: 20px 20px 0 0;
  box-shadow: 0 0 4px 0 rgba(10, 13, 14, 0.16);
  overflow: visible;
  isolation: isolate;
`

const MainPanelInner = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  min-width: 0;
  border-radius: 20px 20px 0 0;
  overflow: hidden;
  background: #ffffff;
`

const RecordRow = styled.div`
  flex: 1;
  min-height: 0;
  display: flex;
`

const EndPanel = styled.div`
  display: flex;
  width: 330px;
  flex-shrink: 0;
  border-left: 1px solid #eae9e8;
  min-height: 0;
`

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
}

function canUseTicketShortcut(target: EventTarget | null) {
  if (!isEditableTarget(target)) return true
  if (!(target instanceof HTMLElement) || !target.isContentEditable) return false
  if (target.getAttribute('aria-label') !== 'Message composer') return false
  const text = target.innerText.replace(/\u00a0/g, ' ').trim()
  return text.length === 0
}

export default function SplitView() {
  const [selectedId, setSelectedId] = useState(tickets[0].id)
  const { showShortcuts, setShowShortcuts, activeShortcut, setActiveShortcut } =
    useShortcutUi()
  const [customerReplyRequest, setCustomerReplyRequest] = useState(0)
  const [aaShortcutRequest, setAaShortcutRequest] = useState(0)
  const selectedTicket = useMemo(() => getTicket(selectedId), [selectedId])

  const controlAloneRef = useRef(false)

  useEffect(() => {
    const isControlKey = (event: KeyboardEvent) =>
      event.key === 'Control' || event.code === 'ControlLeft' || event.code === 'ControlRight'

    const onKeyDown = (event: KeyboardEvent) => {
      // Control alone (on keyup) toggles preview; chords don't toggle.
      if (isControlKey(event)) {
        if (!event.repeat) controlAloneRef.current = true
        return
      }
      if (event.ctrlKey) controlAloneRef.current = false

      if (event.repeat) return

      // Option/Alt+R — customer reply on the currently open ticket.
      if (event.altKey && !event.metaKey && !event.ctrlKey && event.code === 'KeyR') {
        event.preventDefault()
        setActiveShortcut('option+r')
        setCustomerReplyRequest((tick) => tick + 1)
        return
      }

      // Cmd+\ — Auto Assist primary action for the current state.
      if (event.metaKey && !event.altKey && !event.ctrlKey && event.code === 'Backslash') {
        event.preventDefault()
        setActiveShortcut('meta+backslash')
        setAaShortcutRequest((tick) => tick + 1)
        return
      }

      // Ticket / Esc shortcuts always work, with or without the preview.
      if (event.metaKey || event.altKey) return

      if (event.key === 'Escape') {
        setActiveShortcut('Escape')
        return
      }

      if (!/^[1-9]$/.test(event.key)) return
      if (!canUseTicketShortcut(event.target)) return

      const ticket = tickets[Number(event.key) - 1]
      if (!ticket) return

      event.preventDefault()
      setSelectedId(ticket.id)
      setActiveShortcut(event.key)
    }

    const onKeyUp = (event: KeyboardEvent) => {
      if (
        event.key === 'Escape' ||
        /^[1-9]$/.test(event.key) ||
        event.code === 'KeyR' ||
        event.key === 'Alt' ||
        event.code === 'Backslash' ||
        event.key === 'Meta'
      ) {
        setActiveShortcut((current) => {
          if (current === 'option+r') {
            if (event.code === 'KeyR' || event.key === 'Alt') return null
          }
          if (current === 'meta+backslash') {
            if (event.code === 'Backslash' || event.key === 'Meta') return null
          }
          return current === event.key ? null : current
        })
        if (event.key === 'Escape' || /^[1-9]$/.test(event.key)) return
      }

      if (!isControlKey(event)) return
      if (controlAloneRef.current) {
        setShowShortcuts((current) => !current)
      }
      controlAloneRef.current = false
    }

    const clearPressed = () => setActiveShortcut(null)

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', clearPressed)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', clearPressed)
    }
  }, [setActiveShortcut, setShowShortcuts])

  return (
    <Shell>
      <WorkListPanel
        items={tickets}
        selectedId={selectedId}
        onSelect={setSelectedId}
        showShortcuts={showShortcuts}
        activeShortcut={activeShortcut}
      />
      <MainPanel>
        <MainPanelInner>
          <RecordRow>
            <ConversationPanel
              ticket={selectedTicket}
              showShortcuts={showShortcuts}
              activeShortcut={activeShortcut}
              customerReplyRequest={customerReplyRequest}
              aaShortcutRequest={aaShortcutRequest}
            />
            <EndPanel>
              <CustomerContextPanel ticket={selectedTicket} />
              <ContextSidebar />
            </EndPanel>
          </RecordRow>
          <ActionBar />
        </MainPanelInner>
      </MainPanel>
    </Shell>
  )
}

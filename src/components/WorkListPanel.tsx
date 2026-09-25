import styled from 'styled-components'
import { Tag } from '@zendesk-ui/react-components'
import { SmallButton } from './IconButton'
import ShortcutKey from './ShortcutKey'
import FunnelIcon from '@zendesk-ui/assets/icons/20px/funnel-stroke.svg?react'
import ArrowReverseIcon from '@zendesk-ui/assets/icons/20px/arrow-reverse-stroke.svg?react'
import SparkleFillIcon from '@zendesk-ui/assets/icons/20px/sparkle-fill.svg?react'
import { flora } from '../flora/tokens'
import { typeStyle } from '../flora/typography'
import type { TicketItem } from '../data/tickets'

const Panel = styled.aside`
  width: 300px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
  border-radius: 20px 20px 0 0;
  box-shadow: 0 0 4px 0 rgba(12, 12, 13, 0.16);
  overflow: visible;
  isolation: isolate;
`

const PanelInner = styled.div<{ $shortcuts?: boolean }>`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  background: #ffffff;
  border-radius: 20px 20px 0 0;
  /* Allow shortcut keys to sit on the left ticket border without clipping. */
  overflow: ${({ $shortcuts }) => ($shortcuts ? 'visible' : 'hidden')};
`

const HeaderBar = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  height: 48px;
  padding: 8px;
  flex-shrink: 0;
`

const List = styled.div<{ $shortcuts?: boolean }>`
  flex: 1;
  overflow-y: auto;
  overflow-x: ${({ $shortcuts }) => ($shortcuts ? 'visible' : 'hidden')};
  min-height: 0;
`

const ItemButton = styled.button<{ $shortcuts?: boolean }>`
  position: relative;
  display: flex;
  width: 100%;
  padding: ${({ $shortcuts }) => ($shortcuts ? '0 8px 0 12px' : '0 8px')};
  border: none;
  background: transparent;
  text-align: left;
  cursor: pointer;
  font: inherit;
  color: inherit;
`

const ItemInner = styled.div<{ $selected?: boolean }>`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  padding: 12px;
  border-bottom: none;
  border-radius: ${({ $selected }) => ($selected ? '8px' : '0')};
  background: ${({ $selected }) => ($selected ? '#f7f7f7' : 'transparent')};
`

/** Centered on the ticket container’s left border. */
const TicketShortcut = styled(ShortcutKey)`
  position: absolute;
  left: 0;
  top: 50%;
  transform: translate(-50%, -50%);
  z-index: 50;
`

const Row = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
`

const Requester = styled.span`
  ${typeStyle('smallDefault')}
  color: ${flora.fg.subtle};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const MetaRight = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
`

const OnlineDot = styled.span`
  width: 8px;
  height: 8px;
  border-radius: 100px;
  background: #01b15c;
  flex-shrink: 0;
`

const Sparkle = styled(SparkleFillIcon)`
  width: 16px;
  height: 16px;
  color: #885bb3;
  flex-shrink: 0;
`

const Subject = styled.div`
  ${typeStyle('mediumBold')}
  color: ${flora.fg.default};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
`

const Snippet = styled.div`
  ${typeStyle('smallDefault')}
  color: ${flora.fg.default};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
`

const StatusDot = styled.span<{ $color: string }>`
  width: 8px;
  height: 8px;
  border-radius: 100px;
  background: ${({ $color }) => $color};
  flex-shrink: 0;
`

const Subtle = styled.span`
  ${typeStyle('smallDefault')}
  color: ${flora.fg.subtle};
  white-space: nowrap;
`

const Separator = styled.span`
  width: 2px;
  height: 2px;
  border-radius: 50%;
  background: ${flora.fg.subtle};
  flex-shrink: 0;
`

const TicketMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`

interface WorkListPanelProps {
  items: TicketItem[]
  selectedId: string
  onSelect: (id: string) => void
  showShortcuts?: boolean
  /** Digit currently flashing from a keyboard shortcut press. */
  activeShortcut?: string | null
}

export default function WorkListPanel({
  items,
  selectedId,
  onSelect,
  showShortcuts = false,
  activeShortcut = null,
}: WorkListPanelProps) {
  const shortcutsVisible = showShortcuts || activeShortcut != null

  return (
    <Panel>
      <PanelInner $shortcuts={shortcutsVisible}>
        <HeaderBar>
          <SmallButton size="small" isBasic>
            <SmallButton.StartIcon>
              <FunnelIcon />
            </SmallButton.StartIcon>
            Filter
          </SmallButton>
          <SmallButton size="small" isBasic>
            <SmallButton.StartIcon>
              <ArrowReverseIcon />
            </SmallButton.StartIcon>
            Recommended
          </SmallButton>
        </HeaderBar>
        <List $shortcuts={shortcutsVisible}>
          {items.map((item, index) => {
            const selected = item.id === selectedId
            const shortcut = index < 9 ? String(index + 1) : null
            const showKey =
              !!shortcut &&
              (showShortcuts || activeShortcut === shortcut)
            return (
              <ItemButton
                key={item.id}
                type="button"
                $shortcuts={shortcutsVisible}
                onClick={() => onSelect(item.id)}
                aria-current={selected ? 'true' : undefined}
                aria-keyshortcuts={shortcut ?? undefined}
              >
                <ItemInner $selected={selected}>
                  {showKey && shortcut ? (
                    <TicketShortcut
                      label={shortcut}
                      pressed={activeShortcut === shortcut}
                    />
                  ) : null}
                  <Row>
                    <Requester>{item.requester}</Requester>
                    <MetaRight>
                      {item.online ? <OnlineDot aria-hidden /> : null}
                      {item.autoAssist ? <Sparkle aria-label="Auto Assist" /> : null}
                      <Tag size="small" hue={item.slaHue} isPill={false}>
                        {item.sla}
                      </Tag>
                    </MetaRight>
                  </Row>
                  <div>
                    <Subject>{item.subject}</Subject>
                    <Snippet>{item.snippet}</Snippet>
                  </div>
                  <Row>
                    <TicketMeta>
                      <StatusDot $color={item.statusColor} />
                      <Subtle>{item.status}</Subtle>
                      <Separator />
                      <Subtle>{item.ticketId}</Subtle>
                    </TicketMeta>
                    <Subtle>{item.timestamp}</Subtle>
                  </Row>
                </ItemInner>
              </ItemButton>
            )
          })}
        </List>
      </PanelInner>
    </Panel>
  )
}

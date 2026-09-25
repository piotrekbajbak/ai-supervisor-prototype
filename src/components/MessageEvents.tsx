import { useState } from 'react'
import styled from 'styled-components'
import ChevronDownIcon from '@zendesk-ui/assets/icons/20px/chevron-down.svg?react'
import LightningBoltIcon from '@zendesk-ui/assets/icons/20px/lightning-bolt-stroke.svg?react'
import CheckCircleIcon from '@zendesk-ui/assets/icons/20px/check-circle-stroke.svg?react'
import { flora } from '../flora/tokens'
import { typeStyle } from '../flora/typography'
import type { AaAction } from '../data/aaSuggestions'

const EventsCard = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  margin-top: -4px;
  padding: 0;
  border: none;
  background: transparent;
`

const EventsToggle = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  width: fit-content;
  max-width: 100%;
  height: 24px;
  margin: 0;
  padding: 0 4px 0 0;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #293239;
  cursor: pointer;
  text-align: left;

  &:hover {
    background: rgba(47, 49, 48, 0.04);
  }
`

const EventsChevron = styled.span<{ $open?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px;
  flex-shrink: 0;
  color: #293239;
  transform: rotate(${({ $open }) => ($open ? '180deg' : '0deg')});
  transition: transform 200ms cubic-bezier(0.22, 1, 0.36, 1);

  svg {
    width: 12px;
    height: 12px;
  }
`

const EventsLabel = styled.span`
  ${typeStyle('smallBold')}
  letter-spacing: -0.0004px;
  color: #293239;
`

const EventsList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0 0 4px;
  display: flex;
  flex-direction: column;
`

const EventItem = styled.li`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px 0;
  border-top: 1px solid #eae9e8;
`

const EventIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  margin-top: 1px;
  flex-shrink: 0;
  color: ${flora.fg.default};

  svg {
    width: 14px;
    height: 14px;
  }
`

const EventBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
`

const EventTitle = styled.span`
  ${typeStyle('smallDefault')}
  color: ${flora.fg.strong};
`

const EventMeta = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  ${typeStyle('smallDefault')}
  color: ${flora.fg.muted};

  svg {
    width: 12px;
    height: 12px;
  }
`

interface MessageEventsProps {
  events: AaAction[]
}

export default function MessageEvents({ events }: MessageEventsProps) {
  const [open, setOpen] = useState(false)

  if (events.length === 0) return null

  return (
    <EventsCard>
      <EventsToggle
        type="button"
        aria-expanded={open}
        aria-label={open ? 'Collapse events' : 'Expand events'}
        onClick={() => setOpen((value) => !value)}
      >
        <EventsChevron $open={open} aria-hidden>
          <ChevronDownIcon />
        </EventsChevron>
        <EventsLabel>Events</EventsLabel>
      </EventsToggle>
      {open ? (
        <EventsList>
          {events.map((event, index) => (
            <EventItem key={`${event.label}-${event.value}-${index}`}>
              <EventIcon aria-hidden>
                <LightningBoltIcon />
              </EventIcon>
              <EventBody>
                <EventTitle>
                  {event.label}: {event.value}
                </EventTitle>
                <EventMeta>
                  <CheckCircleIcon aria-hidden />
                  Completed
                </EventMeta>
              </EventBody>
            </EventItem>
          ))}
        </EventsList>
      ) : null}
    </EventsCard>
  )
}

import styled from 'styled-components'
import { Avatar, Tag } from '@zendesk-ui/react-components'
import { IconButton } from './IconButton'
import ExternalLinkIcon from '@zendesk-ui/assets/icons/20px/external-link.svg?react'
import ChevronDownIcon from '@zendesk-ui/assets/icons/20px/chevron-down.svg?react'
import ArrowRotateIcon from '@zendesk-ui/assets/icons/20px/arrow-rotate-right.svg?react'
import { flora } from '../flora/tokens'
import { typeStyle } from '../flora/typography'
import { interactionsFor, type TicketItem } from '../data/tickets'

const Panel = styled.aside`
  width: 282px;
  flex-shrink: 0;
  height: 100%;
  overflow-y: auto;
  background: #ffffff;
  display: flex;
  flex-direction: column;
`

const ProfileBlock = styled.div`
  display: flex;
  flex-direction: column;
  padding-bottom: 16px;
`

const ProfileHeader = styled.div`
  display: flex;
  align-items: center;
  height: 56px;
  padding: 0 12px 0 20px;
`

const ProfileIdentity = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
`

const Name = styled.div`
  ${typeStyle('mediumBold')}
  color: ${flora.fg.strong};
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const Actions = styled.div`
  display: flex;
  align-items: center;
  flex-shrink: 0;
`

const Fields = styled.div`
  display: flex;
  flex-direction: column;
`

const FieldRow = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  min-height: 32px;
  padding: 6px 20px;
  ${typeStyle('smallDefault')}
`

const Label = styled.span`
  width: 80px;
  flex-shrink: 0;
  color: ${flora.fg.muted};
`

const Value = styled.span`
  color: ${flora.fg.ink};
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

/** Figma: Small/Bold, #0a0d0e, underline — not Flora primary blue Anchor */
const ProfileLink = styled.a`
  ${typeStyle('smallBold')}
  color: ${flora.fg.ink};
  text-decoration: underline;
  text-underline-position: from-font;
  text-decoration-skip-ink: none;
  white-space: nowrap;

  &:hover,
  &:focus-visible {
    color: ${flora.fg.ink};
  }
`

const Tags = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const TagRow = styled(FieldRow)`
  align-items: flex-start;
`

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  height: 56px;
  padding: 0 12px 0 20px;
`

const SectionTitle = styled.h2`
  margin: 0;
  flex: 1;
  ${typeStyle('mediumBold')}
  color: ${flora.fg.strong};
`

const Timeline = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0 12px 0 20px;
  display: flex;
  flex-direction: column;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    left: 39px;
    top: 28px;
    bottom: 28px;
    width: 1px;
    background: #eae9e8;
  }
`

const TimelineItem = styled.li<{ $active?: boolean }>`
  display: flex;
  gap: 12px;
  align-items: center;
  min-height: 56px;
  padding: ${({ $active }) => ($active ? '0 20px 0 12px' : '0 20px 0 12px')};
  border-radius: 12px;
  background: ${({ $active }) => ($active ? '#edf7ff' : 'transparent')};
  position: relative;
`

const Marker = styled.span<{ $accent?: string; $active?: boolean }>`
  width: 16px;
  height: 16px;
  border-radius: ${({ $accent }) => ($accent ? '6px' : '100px')};
  background: ${({ $accent, $active }) => $accent || ($active ? '#3b82f6' : '#c2c7cc')};
  border: ${({ $accent }) => ($accent ? '3px solid #ffffff' : 'none')};
  box-sizing: border-box;
  flex-shrink: 0;
  z-index: 1;
`

const ItemBody = styled.div`
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
`

const ItemTitle = styled.div`
  ${typeStyle('smallBold')}
  color: ${flora.fg.ink};
`

const ItemSubtitle = styled.div<{ $active?: boolean }>`
  ${typeStyle('smallDefault')}
  color: ${({ $active }) => ($active ? flora.fg.activeSubtitle : flora.fg.muted)};
`

export default function CustomerContextPanel({ ticket }: { ticket: TicketItem }) {
  const profile = ticket.profile
  const interactions = interactionsFor(ticket)

  return (
    <Panel>
      <ProfileBlock>
        <ProfileHeader>
          <ProfileIdentity>
            <Avatar size="small">
              <img src={profile.avatar} alt={profile.name} />
            </Avatar>
            <Name>{profile.name}</Name>
          </ProfileIdentity>
          <Actions>
            <IconButton aria-label="Open profile" size="small">
              <ExternalLinkIcon />
            </IconButton>
            <IconButton aria-label="Collapse profile" size="small">
              <ChevronDownIcon />
            </IconButton>
          </Actions>
        </ProfileHeader>

        <Fields>
          <FieldRow>
            <Label>Email</Label>
            <ProfileLink href={`mailto:${profile.email}`}>{profile.email}</ProfileLink>
          </FieldRow>
          <FieldRow>
            <Label>External ID</Label>
            <ProfileLink href="#">{profile.externalId}</ProfileLink>
          </FieldRow>
          <FieldRow>
            <Label>Phone</Label>
            <Value>{profile.phone}</Value>
          </FieldRow>
          <FieldRow>
            <Label>Local time</Label>
            <Value>{profile.localTime}</Value>
          </FieldRow>
          <FieldRow>
            <Label>Org.</Label>
            <ProfileLink href="#">{profile.org}</ProfileLink>
          </FieldRow>
          <FieldRow>
            <Label>Language</Label>
            <Value>{profile.language}</Value>
          </FieldRow>
          <TagRow>
            <Label>Tag</Label>
            <Tags>
              {profile.tags.map((tag) => (
                <Tag key={tag.label} size="small" hue={tag.hue}>
                  {tag.label}
                </Tag>
              ))}
            </Tags>
          </TagRow>
        </Fields>
      </ProfileBlock>

      <div>
        <SectionHeader>
          <SectionTitle>Interactions</SectionTitle>
          <Actions>
            <IconButton aria-label="Refresh interactions" size="small">
              <ArrowRotateIcon />
            </IconButton>
            <IconButton aria-label="Collapse interactions" size="small">
              <ChevronDownIcon />
            </IconButton>
          </Actions>
        </SectionHeader>

        <Timeline>
          {interactions.map((item) => (
            <TimelineItem key={item.id} $active={item.active}>
              <Marker $accent={item.accent} $active={item.active} />
              <ItemBody>
                <ItemTitle>{item.title}</ItemTitle>
                <ItemSubtitle $active={item.active}>{item.subtitle}</ItemSubtitle>
              </ItemBody>
            </TimelineItem>
          ))}
        </Timeline>
      </div>
    </Panel>
  )
}

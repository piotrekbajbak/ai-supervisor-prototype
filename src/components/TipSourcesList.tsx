import styled, { css } from 'styled-components'
import { Anchor } from '@zendesk-ui/react-components'
import ClipboardListIcon from '@zendesk-ui/assets/icons/20px/clipboard-list-stroke.svg?react'
import BookOpenIcon from '@zendesk-ui/assets/icons/20px/book-open-stroke.svg?react'
import { IconButton } from './IconButton'
import PencilIcon from '@zendesk-ui/assets/icons/20px/pencil-stroke.svg?react'
import { flora } from '../flora/tokens'
import { typeStyle } from '../flora/typography'
import type { TipSourceItem } from '../data/sourceCatalog'

const TipSources = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-bottom: 4px;
`

const TipSourcesHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 2px;
`

const TipSourcesTitle = styled.p`
  margin: 0;
  ${typeStyle('mediumBold')}
  color: ${flora.fg.default};
`

const TipEditButton = styled(IconButton)`
  && {
    width: 20px;
    height: 20px;
    min-width: 20px;
  }

  && svg {
    width: 12px;
    height: 12px;
  }
`

const TipSourceRow = styled.div<{ $removed?: boolean }>`
  display: flex;
  align-items: center;
  gap: 4px;

  > svg {
    width: 14px;
    height: 14px;
    flex-shrink: 0;
    color: ${({ $removed }) => ($removed ? '#cc3340' : flora.fg.default)};
  }
`

const TipAnchor = styled(Anchor).attrs({ isUnderlined: false })<{ $removed?: boolean }>`
  && {
    ${typeStyle('smallDefault')}
    ${({ $removed }) =>
      $removed &&
      css`
        color: #cc3340;
        text-decoration: line-through;

        &:hover,
        &:focus-visible {
          color: #a61f2b;
          text-decoration: line-through;
        }
      `}
  }
`

interface TipSourcesListProps {
  sources: TipSourceItem[]
  onEdit?: () => void
}

export default function TipSourcesList({ sources, onEdit }: TipSourcesListProps) {
  return (
    <TipSources>
      <TipSourcesHeader>
        <TipSourcesTitle>Sources</TipSourcesTitle>
        {onEdit ? (
          <TipEditButton aria-label="Change sources" size="small" onClick={onEdit}>
            <PencilIcon />
          </TipEditButton>
        ) : null}
      </TipSourcesHeader>
      {sources.map((source) => {
        const removed = !source.active
        const Icon = source.kind === 'procedure' ? ClipboardListIcon : BookOpenIcon
        return (
          <TipSourceRow key={source.id} $removed={removed}>
            <Icon aria-hidden />
            <TipAnchor
              href="#"
              isExternal
              $removed={removed}
              onClick={(event) => event.preventDefault()}
            >
              {source.title}
            </TipAnchor>
          </TipSourceRow>
        )
      })}
    </TipSources>
  )
}

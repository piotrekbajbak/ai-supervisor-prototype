import { Fragment, useEffect, useMemo, useState } from 'react'
import styled from 'styled-components'
import {
  Button,
  Checkbox,
  ChevronButton,
  Field,
  Item,
  MediaInput,
  Menu,
  Modal,
  SplitButton,
  Table,
} from '@zendesk-ui/react-components'
import SearchIcon from '@zendeskgarden/svg-icons/src/16/search-stroke.svg?react'
import AdjustIcon from '@zendeskgarden/svg-icons/src/16/adjust-stroke.svg?react'
import ChevronDownIcon from '@zendeskgarden/svg-icons/src/12/chevron-down-stroke.svg?react'
import ChevronRightIcon from '@zendeskgarden/svg-icons/src/12/chevron-right-stroke.svg?react'
import GlobeIcon from '@zendeskgarden/svg-icons/src/16/globe-stroke.svg?react'
import FileDocumentIcon from '@zendeskgarden/svg-icons/src/16/file-document-stroke.svg?react'
import ClipboardListIcon from '@zendeskgarden/svg-icons/src/16/clipboard-list-stroke.svg?react'
import BookOpenIcon from '@zendeskgarden/svg-icons/src/16/book-open-stroke.svg?react'
import { flora } from '../flora/tokens'
import { typeStyle } from '../flora/typography'
import {
  ACTIVE_GUIDELINE_ID,
  COMMUNICATION_GUIDELINES,
  PROCEDURES,
  isTipSourceId,
} from '../data/sourceCatalog'

type SourceIcon =
  | { kind: 'image'; src: string }
  | { kind: 'globe' }
  | { kind: 'file' }
  | { kind: 'clipboard' }
  | { kind: 'book' }

const PINNED_SOURCE_ORDER = ['procedures', 'communication-guidelines'] as const

interface SourceChild {
  id: string
  title: string
  items: number
  updated: string
}

interface ConnectedSource {
  id: string
  title: string
  items: number
  updated: string
  icon: SourceIcon
  expandable?: boolean
  children?: SourceChild[]
}

const CONNECTED: ConnectedSource[] = [
  {
    id: 'procedures',
    title: 'Procedures',
    items: PROCEDURES.length,
    updated: '1 day ago',
    icon: { kind: 'clipboard' },
    expandable: true,
    children: PROCEDURES,
  },
  {
    id: 'communication-guidelines',
    title: 'Communication Guidelines',
    items: COMMUNICATION_GUIDELINES.length,
    updated: '1 day ago',
    icon: { kind: 'book' },
    expandable: true,
    children: COMMUNICATION_GUIDELINES,
  },
  {
    id: 'confluence',
    title: 'Confluence',
    items: 64,
    updated: '2 days ago',
    icon: { kind: 'image', src: '/source-logos/confluence.png' },
    expandable: true,
    children: [
      {
        id: 'confluence-playbook',
        title: 'Customer Support Playbook',
        items: 64,
        updated: '2 days ago',
      },
    ],
  },
  {
    id: 'guru',
    title: 'Guru',
    items: 34,
    updated: '2 days ago',
    icon: { kind: 'image', src: '/source-logos/guru.png' },
  },
  {
    id: 'google-drive',
    title: 'Google Drive',
    items: 7,
    updated: '4 days ago',
    icon: { kind: 'image', src: '/source-logos/google-drive.png' },
    expandable: true,
  },
  {
    id: 'sharepoint',
    title: 'SharePoint',
    items: 9,
    updated: '4 days ago',
    icon: { kind: 'image', src: '/source-logos/sharepoint.png' },
    expandable: true,
  },
  {
    id: 'slack',
    title: 'Slack',
    items: 125,
    updated: '4 days ago',
    icon: { kind: 'image', src: '/source-logos/slack.png' },
    expandable: true,
  },
  {
    id: 'webpages',
    title: 'Webpages',
    items: 4,
    updated: '1 month ago',
    icon: { kind: 'globe' },
    expandable: true,
  },
  {
    id: 'files',
    title: 'Files',
    items: 1,
    updated: '1 month ago',
    icon: { kind: 'file' },
    expandable: true,
  },
]

const LargeModal = styled(Modal)`
  && {
    width: min(1200px, calc(100vw - 48px));
    max-height: min(820px, calc(100vh - 48px));
  }
`

/** Match default (non-large) modal chrome — isLarge footer padding is oversized. */
const ModalHeader = styled(Modal.Header)`
  && {
    padding-block: 16px;
  }
`

const ModalFooter = styled(Modal.Footer)`
  && {
    padding-block: 16px;
  }
`

const Body = styled(Modal.Body)`
  && {
    display: flex;
    flex-direction: column;
    gap: 24px;
    padding-top: 8px;
    max-height: min(640px, calc(100vh - 180px));
    overflow-y: auto;
  }
`

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
`

const SearchFilter = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  width: 100%;
  margin-top: 8px;
`

const SearchField = styled(Field)`
  && {
    flex: 0 1 450px;
    width: 450px;
    max-width: calc(100% - 96px);
    margin: 0;
  }
`

const SearchGlyph = styled(SearchIcon)`
  width: 16px;
  height: 16px;
`

const FilterButton = styled(Button)`
  && {
    flex-shrink: 0;
  }

  && svg {
    width: 16px;
    height: 16px;
  }
`

const ConnectionCount = styled.p`
  margin: 0 0 8px;
  ${typeStyle('mediumDefault')}
  color: #2f3941;
`

const TitleCell = styled.div<{ $indent?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding-inline-start: ${({ $indent }) => ($indent ? '28px' : '0')};
  min-width: 0;
  line-height: 20px;
`

const SourceLogo = styled.img`
  display: block;
  width: 16px;
  height: 16px;
  object-fit: contain;
  flex-shrink: 0;
`

const IconSlot = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  color: #2f3941;

  svg {
    display: block;
    width: 16px;
    height: 16px;
  }
`

const TitleText = styled.span`
  ${typeStyle('mediumDefault')}
  color: #2f3941;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

/** Match Garden OverflowButton hit target: 2em / 12px glyph. */
const ExpandButton = styled.button`
  appearance: none;
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  margin: 0;
  padding: 0;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #2f3941;
  cursor: pointer;
  vertical-align: middle;

  svg {
    display: block;
    width: 12px;
    height: 12px;
    flex-shrink: 0;
  }

  &:hover {
    background: rgba(47, 57, 65, 0.08);
  }

  &:focus-visible {
    outline: 2px solid ${flora.fg.primary};
    outline-offset: 1px;
  }
`

const ExpandCell = styled(Table.Cell)`
  && {
    width: 32px;
    min-width: 32px;
    max-width: 32px;
    padding-left: 0;
    padding-right: 0;
    text-align: center;
    vertical-align: middle;
  }
`

const ExpandHeaderCell = styled(Table.HeaderCell)`
  && {
    width: 32px;
    min-width: 32px;
    max-width: 32px;
    padding-left: 0;
    padding-right: 0;
  }
`

const CheckboxField = styled(Field)`
  && {
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0;
    width: 16px;
    height: 16px;
  }
`

const ControlCell = styled(Table.Cell)`
  && {
    vertical-align: middle;
  }
`

const ControlHeaderCell = styled(Table.HeaderCell)`
  && {
    vertical-align: middle;
  }
`

const TableWrap = styled.div`
  width: 100%;
  overflow-x: auto;
`

const StyledTable = styled(Table)`
  && th,
  && td {
    vertical-align: middle;
  }

  /* Garden OverflowButton uses a top margin that throws off middle alignment. */
  && [data-garden-id='tables.overflow_button'] {
    margin-top: 0;
    vertical-align: middle;
  }

  && tbody > tr:last-child {
    border-bottom: none;
    border-bottom-color: transparent;
  }
`

const OverflowCell = styled(Table.Cell)`
  && {
    vertical-align: middle;
    text-align: center;
  }
`

const OverflowHeaderCell = styled(Table.HeaderCell)`
  && {
    vertical-align: middle;
    text-align: center;
  }
`

function SourceGlyph({ icon }: { icon: SourceIcon }) {
  if (icon.kind === 'image') {
    return <SourceLogo src={icon.src} alt="" />
  }
  if (icon.kind === 'globe') {
    return (
      <IconSlot>
        <GlobeIcon aria-hidden />
      </IconSlot>
    )
  }
  if (icon.kind === 'clipboard') {
    return (
      <IconSlot>
        <ClipboardListIcon aria-hidden />
      </IconSlot>
    )
  }
  if (icon.kind === 'book') {
    return (
      <IconSlot>
        <BookOpenIcon aria-hidden />
      </IconSlot>
    )
  }
  return (
    <IconSlot>
      <FileDocumentIcon aria-hidden />
    </IconSlot>
  )
}

function RowCheckbox({
  checked,
  indeterminate,
  onChange,
  label,
}: {
  checked: boolean
  indeterminate?: boolean
  onChange: () => void
  label: string
}) {
  return (
    <CheckboxField>
      <Checkbox checked={checked} indeterminate={indeterminate} onChange={onChange}>
        <Field.Label hidden>{label}</Field.Label>
      </Checkbox>
    </CheckboxField>
  )
}

export type ApplyScope = 'ticket' | 'topic'

interface AddKnowledgeModalProps {
  isOpen: boolean
  onClose: () => void
  /** Ticket topic shown in the apply menu (e.g. "Product safety"). */
  topic?: string
  /** Tip-source ids that should appear checked when the modal opens. */
  initialSelectedIds?: string[]
  onApply?: (selectedIds: string[], scope: ApplyScope) => void
}

export default function AddKnowledgeModal({
  isOpen,
  onClose,
  topic,
  initialSelectedIds = [],
  onApply,
}: AddKnowledgeModalProps) {
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    procedures: true,
    'communication-guidelines': true,
  })
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [sort, setSort] = useState<'asc' | 'desc' | undefined>('asc')

  const initialSelectedKey = initialSelectedIds.join('|')

  useEffect(() => {
    if (!isOpen) return
    setExpanded({ procedures: true, 'communication-guidelines': true })
    const nextSelected: Record<string, boolean> = {}
    const seed = initialSelectedKey
      ? initialSelectedKey.split('|')
      : [ACTIVE_GUIDELINE_ID]
    seed.forEach((id) => {
      nextSelected[id] = true
    })
    setSelected(nextSelected)
    setQuery('')
  }, [isOpen, initialSelectedKey])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = !q
      ? CONNECTED
      : CONNECTED.filter(
          (source) =>
            source.title.toLowerCase().includes(q) ||
            source.children?.some((child) => child.title.toLowerCase().includes(q)),
        )
    if (!sort) return list
    return [...list].sort((a, b) => {
      const aPinned = PINNED_SOURCE_ORDER.indexOf(a.id as (typeof PINNED_SOURCE_ORDER)[number])
      const bPinned = PINNED_SOURCE_ORDER.indexOf(b.id as (typeof PINNED_SOURCE_ORDER)[number])
      if (aPinned !== -1 || bPinned !== -1) {
        if (aPinned === -1) return 1
        if (bPinned === -1) return -1
        return aPinned - bPinned
      }
      return sort === 'asc' ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title)
    })
  }, [query, sort])

  const allIds = useMemo(() => {
    const ids: string[] = []
    filtered.forEach((source) => {
      ids.push(source.id)
      if (source.children && expanded[source.id]) {
        source.children.forEach((child) => ids.push(child.id))
      }
    })
    return ids
  }, [filtered, expanded])

  const allSelected = allIds.length > 0 && allIds.every((id) => selected[id])
  const someSelected = allIds.some((id) => selected[id]) && !allSelected

  const toggleSelected = (id: string) => {
    setSelected((current) => ({ ...current, [id]: !current[id] }))
  }

  const toggleAll = () => {
    setSelected((current) => {
      const next = { ...current }
      const value = !allSelected
      allIds.forEach((id) => {
        next[id] = value
      })
      return next
    })
  }

  const handleApply = (scope: ApplyScope = 'ticket') => {
    const selectedIds = Object.entries(selected)
      .filter(([, on]) => on)
      .map(([id]) => id)
      .filter(isTipSourceId)
    onApply?.(selectedIds, scope)
    onClose()
  }

  if (!isOpen) return null

  return (
    <LargeModal isLarge isCentered onClose={onClose} appendToNode={document.body}>
      <ModalHeader tag="h2">Sources</ModalHeader>
      <Body>
        <Section>
          <SearchFilter>
            <SearchField>
              <Field.Label hidden>Search</Field.Label>
              <MediaInput
                placeholder="Search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                start={<SearchGlyph />}
              />
            </SearchField>
            <FilterButton>
              <Button.StartIcon>
                <AdjustIcon />
              </Button.StartIcon>
              Filter
            </FilterButton>
          </SearchFilter>

          <TableWrap>
            <ConnectionCount>{filtered.length} connections</ConnectionCount>
            <StyledTable>
              <Table.Head>
                <Table.HeaderRow>
                  <ControlHeaderCell isMinimum>
                    <RowCheckbox
                      checked={allSelected}
                      indeterminate={someSelected}
                      onChange={toggleAll}
                      label="Select all"
                    />
                  </ControlHeaderCell>
                  <ExpandHeaderCell />
                  <Table.SortableCell
                    sort={sort}
                    onClick={() => setSort((current) => (current === 'asc' ? 'desc' : 'asc'))}
                  >
                    Title
                  </Table.SortableCell>
                  <Table.HeaderCell width={120}>Items</Table.HeaderCell>
                  <Table.SortableCell width={174}>Last updated</Table.SortableCell>
                  <OverflowHeaderCell hasOverflow>
                    <Table.OverflowButton aria-label="Customize columns" />
                  </OverflowHeaderCell>
                </Table.HeaderRow>
              </Table.Head>
              <Table.Body>
                {filtered.map((source) => {
                  const isExpanded = Boolean(expanded[source.id])
                  return (
                    <Fragment key={source.id}>
                      <Table.Row isSelected={Boolean(selected[source.id])}>
                        <ControlCell isMinimum>
                          <RowCheckbox
                            checked={Boolean(selected[source.id])}
                            onChange={() => toggleSelected(source.id)}
                            label={`Select ${source.title}`}
                          />
                        </ControlCell>
                        <ExpandCell>
                          {source.expandable ? (
                            <ExpandButton
                              type="button"
                              aria-expanded={isExpanded}
                              aria-label={
                                isExpanded ? `Collapse ${source.title}` : `Expand ${source.title}`
                              }
                              onClick={() =>
                                setExpanded((current) => ({
                                  ...current,
                                  [source.id]: !current[source.id],
                                }))
                              }
                            >
                              {isExpanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
                            </ExpandButton>
                          ) : null}
                        </ExpandCell>
                        <Table.Cell>
                          <TitleCell>
                            <SourceGlyph icon={source.icon} />
                            <TitleText>{source.title}</TitleText>
                          </TitleCell>
                        </Table.Cell>
                        <Table.Cell>{source.items}</Table.Cell>
                        <Table.Cell>{source.updated}</Table.Cell>
                        <OverflowCell hasOverflow>
                          <Table.OverflowButton aria-label={`${source.title} actions`} />
                        </OverflowCell>
                      </Table.Row>
                      {source.children && isExpanded
                        ? source.children.map((child) => (
                            <Table.Row
                              key={child.id}
                              isSelected={Boolean(selected[child.id])}
                            >
                              <ControlCell isMinimum>
                                <RowCheckbox
                                  checked={Boolean(selected[child.id])}
                                  onChange={() => toggleSelected(child.id)}
                                  label={`Select ${child.title}`}
                                />
                              </ControlCell>
                              <ExpandCell />
                              <Table.Cell>
                                <TitleCell $indent>
                                  <TitleText>{child.title}</TitleText>
                                </TitleCell>
                              </Table.Cell>
                              <Table.Cell>{child.items}</Table.Cell>
                              <Table.Cell>{child.updated}</Table.Cell>
                              <OverflowCell hasOverflow>
                                <Table.OverflowButton aria-label={`${child.title} actions`} />
                              </OverflowCell>
                            </Table.Row>
                          ))
                        : null}
                    </Fragment>
                  )
                })}
              </Table.Body>
            </StyledTable>
          </TableWrap>
        </Section>
      </Body>
      <ModalFooter>
        <Modal.FooterItem>
          <Button isBasic onClick={onClose}>
            Cancel
          </Button>
        </Modal.FooterItem>
        <Modal.FooterItem>
          <SplitButton>
            <Button isPrimary onClick={() => handleApply('ticket')}>
              Apply
            </Button>
            <Menu
              button={(props) => (
                <ChevronButton {...props} isPrimary aria-label="More apply options" />
              )}
              placement="top-end"
              appendToNode={document.body}
              zIndex={1100}
              onChange={({ value }) => {
                if (value === 'ticket' || value === 'topic') {
                  handleApply(value)
                }
              }}
            >
              <Item value="ticket" label="Apply for this ticket" />
              <Item
                value="topic"
                label={
                  topic
                    ? `Apply for "${topic}" topic`
                    : 'Apply for the topic'
                }
              />
            </Menu>
          </SplitButton>
        </Modal.FooterItem>
      </ModalFooter>
      <Modal.Close aria-label="Close" />
    </LargeModal>
  )
}

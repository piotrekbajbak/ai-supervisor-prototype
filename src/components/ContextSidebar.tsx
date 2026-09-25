import styled from 'styled-components'
import { IconButton } from './IconButton'
import PersonIcon from '@zendesk-ui/assets/icons/20px/person-stroke.svg?react'
import BookOpenIcon from '@zendesk-ui/assets/icons/20px/book-open-stroke.svg?react'
import BubblesIcon from '@zendesk-ui/assets/icons/20px/bubbles-stroke.svg?react'
import DotsGridIcon from '@zendesk-ui/assets/icons/20px/dots-grid-2x3.svg?react'

const Sidebar = styled.aside`
  width: 48px;
  flex-shrink: 0;
  height: 100%;
  border-left: 1px solid #dcdcda;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 0;
  gap: 8px;
`

const ActiveButton = styled(IconButton)`
  && {
    background: rgba(125, 120, 103, 0.16);
  }
`

export default function ContextSidebar() {
  return (
    <Sidebar>
      <ActiveButton aria-label="Customer" size="small" isBasic>
        <PersonIcon />
      </ActiveButton>
      <IconButton aria-label="Knowledge" size="small" isBasic>
        <BookOpenIcon />
      </IconButton>
      <IconButton aria-label="Conversations" size="small" isBasic>
        <BubblesIcon />
      </IconButton>
      <IconButton aria-label="More context" size="small" isBasic>
        <DotsGridIcon />
      </IconButton>
    </Sidebar>
  )
}

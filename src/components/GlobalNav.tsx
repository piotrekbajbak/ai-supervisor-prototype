import { useState, type ReactNode } from 'react'
import {
  Product,
  Header,
  Nav,
  Main,
  ProfileMenu,
} from '@zendesk-ui/navigation'
import { Button, Tag } from '@zendesk-ui/react-components'
import styled from 'styled-components'
import { typeStyle } from '../flora/typography'
import { useShortcutUi } from '../shortcuts/ShortcutUiContext'
import ShortcutKey from './ShortcutKey'
import HomeIcon from '@zendesk-ui/assets/icons/20px/home-fill.svg?react'
import InboxIcon from '@zendesk-ui/assets/icons/20px/inbox-fill.svg?react'
import BookContactsIcon from '@zendesk-ui/assets/icons/20px/book-contacts-fill.svg?react'
import BuildingIcon from '@zendesk-ui/assets/icons/20px/building-fill.svg?react'
import ShapesIcon from '@zendesk-ui/assets/icons/20px/shapes-fill.svg?react'
import BarChartIcon from '@zendesk-ui/assets/icons/20px/bar-chart-square-fill.svg?react'
import GearIcon from '@zendesk-ui/assets/icons/20px/gear-fill.svg?react'
import SidebarIcon from '@zendesk-ui/assets/icons/20px/sidebar-stroke.svg?react'
import SearchIcon from '@zendesk-ui/assets/icons/20px/magnifying-glass.svg?react'
import PlusIcon from '@zendesk-ui/assets/icons/20px/plus.svg?react'
import ChatIcon from '@zendesk-ui/assets/icons/20px/product-chat.svg?react'
import VoiceIcon from '@zendesk-ui/assets/icons/20px/product-voice.svg?react'
import BellIcon from '@zendesk-ui/assets/icons/20px/bell-stroke.svg?react'
import HelpIcon from '@zendesk-ui/assets/icons/20px/rescue-ring-stroke.svg?react'
import ProductSupportIcon from '@zendesk-ui/assets/icons/20px/product-support.svg?react'
import ProductKnowledgeIcon from '@zendesk-ui/assets/icons/20px/product-knowledge.svg?react'
import ProductCommunityIcon from '@zendesk-ui/assets/icons/20px/product-community.svg?react'
import ProductChatIcon from '@zendesk-ui/assets/icons/20px/product-chat.svg?react'
import ProductVoiceIcon from '@zendesk-ui/assets/icons/20px/product-voice.svg?react'
import ProductAnalyticsIcon from '@zendesk-ui/assets/icons/20px/product-analytics.svg?react'
import ProductSalesIcon from '@zendesk-ui/assets/icons/20px/product-sales.svg?react'
import ProductWfmIcon from '@zendesk-ui/assets/icons/20px/product-workforce-management.svg?react'
import ProductQaIcon from '@zendesk-ui/assets/icons/20px/product-quality-assurance.svg?react'
import ProductAiAgentsIcon from '@zendesk-ui/assets/icons/20px/product-ai-agents.svg?react'
import ProductAdminCenterIcon from '@zendesk-ui/assets/icons/20px/product-admin-center.svg?react'
import { agentAvatar } from '../data/animalAvatars'

const products = [
  { value: 'support', label: 'Support', href: '#', icon: <ProductSupportIcon />, isSelected: true },
  { value: 'knowledge', label: 'Knowledge', href: '#', icon: <ProductKnowledgeIcon /> },
  { value: 'community', label: 'Community', href: '#', icon: <ProductCommunityIcon /> },
  { value: 'chat', label: 'Chat', href: '#', icon: <ProductChatIcon /> },
  { value: 'voice', label: 'Voice', href: '#', icon: <ProductVoiceIcon /> },
  { value: 'analytics', label: 'Analytics', href: '#', icon: <ProductAnalyticsIcon /> },
  { value: 'sales', label: 'Sales', href: '#', icon: <ProductSalesIcon /> },
  { value: 'wfm', label: 'Workforce management', href: '#', icon: <ProductWfmIcon /> },
  { value: 'qa', label: 'Quality assurance', href: '#', icon: <ProductQaIcon /> },
  { value: 'ai-agents', label: 'AI agents', href: '#', icon: <ProductAiAgentsIcon /> },
  { value: 'admin-center', label: 'Admin center', href: '#', icon: <ProductAdminCenterIcon /> },
]

const StyledMain = styled(Main)`
  && {
    background: transparent;
    box-shadow: none;
    border-radius: 0;
    overflow: visible;
    min-height: 0;
    padding: 0;
  }
`

const ConversationsChip = styled(Button)`
  && {
    height: 32px;
    border-radius: 99px;
    gap: 8px;
  }
`

const CustomerReplyHint = styled.div`
  /* Centered over the global Header strip (full app width). */
  position: fixed;
  top: 28px;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 200;
  display: flex;
  align-items: center;
  gap: 8px;
  pointer-events: none;
`

const CustomerReplyLabel = styled.span`
  ${typeStyle('smallBold')}
  font-size: 12px;
  font-weight: 500;
  color: #68737d;
  letter-spacing: -0.1px;
  white-space: nowrap;
`

const CustomerReplyKeys = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
`

interface GlobalNavProps {
  children: ReactNode
}

export default function GlobalNav({ children }: GlobalNavProps) {
  const [currentNav, setCurrentNav] = useState('views')
  const { showShortcuts, activeShortcut } = useShortcutUi()
  const optionKeyLabel = navigator.platform.toLowerCase().includes('mac') ? '⌥' : 'Alt'
  const showCustomerReplyHint = showShortcuts || activeShortcut === 'option+r'
  const customerReplyPressed = activeShortcut === 'option+r'

  return (
    <Product locale="en-US" products={products}>
      <Header
        startChildren={
          <>
            <Header.IconButton tooltip="Create">
              <PlusIcon />
            </Header.IconButton>
          </>
        }
      >
        <Header.IconButton tooltip="Search">
          <SearchIcon />
        </Header.IconButton>
        <ConversationsChip size="small" isBasic>
          Conversations
          <Button.EndIcon>
            <Tag size="small" isRound isEmphasis>
              0
            </Tag>
          </Button.EndIcon>
        </ConversationsChip>
        <Header.IconButton tooltip="Chat">
          <ChatIcon />
        </Header.IconButton>
        <Header.IconButton tooltip="Voice">
          <VoiceIcon />
        </Header.IconButton>
        <Header.Separator />
        <Header.IconButton tooltip="Notifications">
          <BellIcon />
        </Header.IconButton>
        <Header.IconButton tooltip="Help">
          <HelpIcon />
        </Header.IconButton>
        <ProfileMenu name="Alex Morgan" avatarUrl={agentAvatar}>
          <ProfileMenu.ItemGroup aria-label="Profile actions">
            <ProfileMenu.Item value="profile">Manage profile</ProfileMenu.Item>
            <ProfileMenu.Item value="logout">Sign out</ProfileMenu.Item>
          </ProfileMenu.ItemGroup>
        </ProfileMenu>
      </Header>
      {showCustomerReplyHint ? (
        <CustomerReplyHint>
          <CustomerReplyLabel>Customer reply</CustomerReplyLabel>
          <CustomerReplyKeys>
            <ShortcutKey label={optionKeyLabel} pressed={customerReplyPressed} />
            <ShortcutKey label="R" pressed={customerReplyPressed} />
          </CustomerReplyKeys>
        </CustomerReplyHint>
      ) : null}

      <Nav>
        <Nav.Item
          icon={<HomeIcon />}
          isCurrent={currentNav === 'home'}
          onAction={() => setCurrentNav('home')}
        >
          Home
        </Nav.Item>
        <Nav.Item
          icon={<InboxIcon />}
          isCurrent={currentNav === 'views'}
          onAction={() => setCurrentNav('views')}
        >
          Views
        </Nav.Item>
        <Nav.Item
          icon={<BookContactsIcon />}
          isCurrent={currentNav === 'customers'}
          onAction={() => setCurrentNav('customers')}
        >
          Customers
        </Nav.Item>
        <Nav.Item
          icon={<BuildingIcon />}
          isCurrent={currentNav === 'organizations'}
          onAction={() => setCurrentNav('organizations')}
        >
          Organizations
        </Nav.Item>
        <Nav.Item
          icon={<ShapesIcon />}
          isCurrent={currentNav === 'objects'}
          onAction={() => setCurrentNav('objects')}
        >
          Objects
        </Nav.Item>
        <Nav.Item
          icon={<BarChartIcon />}
          isCurrent={currentNav === 'reporting'}
          onAction={() => setCurrentNav('reporting')}
        >
          Reporting
        </Nav.Item>
        <Nav.Item
          icon={<GearIcon />}
          isCurrent={currentNav === 'settings'}
          onAction={() => setCurrentNav('settings')}
        >
          Admin
        </Nav.Item>
        <Nav.Item icon={<SidebarIcon />} onAction={() => undefined}>
          Expand
        </Nav.Item>
      </Nav>

      <StyledMain>{children}</StyledMain>
    </Product>
  )
}

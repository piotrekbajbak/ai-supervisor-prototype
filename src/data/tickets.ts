import { animalAvatars } from './animalAvatars'

export type TicketStatus = 'New' | 'Active' | 'Pending' | 'AR'

export type SlaHue = 'orange' | 'red' | 'lemon' | 'lime' | 'green' | 'purple'

export interface CustomerProfile {
  name: string
  email: string
  externalId: string
  phone: string
  localTime: string
  org: string
  language: string
  tags: { label: string; hue: SlaHue }[]
  avatar: string
}

export interface TicketItem {
  id: string
  ticketId: string
  requester: string
  subject: string
  snippet: string
  status: TicketStatus
  statusColor: string
  sla: string
  slaHue: SlaHue
  timestamp: string
  online?: boolean
  autoAssist?: boolean
  /** Unread subjects use Medium/Bold; read use Medium/Default */
  unread?: boolean
  /** Middle-panel header SLA chip (may differ from list SLA) */
  headerSla: string
  headerSlaHue: SlaHue
  channel: string
  intent: string
  messageTimestamp: string
  messageBody: string
  profile: CustomerProfile
}

function profile(
  name: string,
  opts: Partial<CustomerProfile> & { seed: number; emailLocal: string; animal: keyof typeof animalAvatars },
): CustomerProfile {
  return {
    name,
    email: `${opts.emailLocal}@gmail.com`,
    externalId: opts.externalId ?? `${opts.seed}${Math.abs(name.length * 97).toString(16)}e29`,
    phone: opts.phone ?? `+1 (415) 55${opts.seed}-4${opts.seed}67`,
    localTime: opts.localTime ?? 'Fri, 16:00 GMT+8',
    org: opts.org ?? 'Acme',
    language: opts.language ?? 'English (United States)',
    tags: opts.tags ?? [
      { label: 'Premium', hue: 'lime' },
      { label: 'Priority Shipping', hue: 'purple' },
    ],
    avatar: opts.avatar ?? animalAvatars[opts.animal],
  }
}

export const tickets: TicketItem[] = [
  {
    id: '1',
    ticketId: '#32001',
    requester: 'Jack Madison',
    subject: 'Product recall',
    snippet: 'We need to initiate a recall for lot #432 of the multivitamins.',
    status: 'New',
    statusColor: '#f79a3e',
    sla: '8m',
    slaHue: 'orange',
    timestamp: '3 minutes ago',
    online: true,
    autoAssist: true,
    unread: true,
    headerSla: '8m',
    headerSlaHue: 'orange',
    channel: 'Via messaging',
    intent: 'Product safety',
    messageTimestamp: '3 minutes ago',
    messageBody:
      'We need to initiate a recall for lot #432 of the multivitamins. Several customers reported nausea after taking capsules from that batch. Can you confirm the hold on outbound shipments?',
    profile: profile('Jack Madison', {
      seed: 1,
      emailLocal: 'jack.madison',
      animal: 'fox',
      phone: '+1 (415) 555-0142',
      tags: [
        { label: 'Wholesale', hue: 'lime' },
        { label: 'Priority', hue: 'orange' },
      ],
    }),
  },
  {
    id: '2',
    ticketId: '#32003',
    requester: 'Jesse Miles',
    subject: 'Quality concerns',
    snippet: 'Received reports of inconsistent quality in the latest batch of bars.',
    status: 'New',
    statusColor: '#f79a3e',
    sla: '-8m',
    slaHue: 'red',
    timestamp: '12 minutes ago',
    online: true,
    unread: true,
    headerSla: '-8m',
    headerSlaHue: 'red',
    channel: 'Via messaging',
    intent: 'Quality complaint',
    messageTimestamp: '12 minutes ago',
    messageBody:
      'Received reports of inconsistent quality in the latest batch of protein bars. Texture is off and a few bags arrived with broken seals. Who owns QA for this SKU?',
    profile: profile('Jesse Miles', {
      seed: 2,
      emailLocal: 'jesse.miles',
      animal: 'dog',
      phone: '+1 (628) 555-0199',
      localTime: 'Fri, 09:52 GMT-7',
      tags: [{ label: 'Retail partner', hue: 'purple' }],
    }),
  },
  {
    id: '3',
    ticketId: '#32002',
    requester: 'Riley Green',
    subject: 'Return Request: Rechargeable Hand Warmer (Order #HW-48291)',
    snippet: 'We need to initiate a recall for lot #432 of the multivitamins.',
    status: 'Active',
    statusColor: '#01b15c',
    sla: '8m',
    slaHue: 'orange',
    timestamp: '28 minutes ago',
    autoAssist: true,
    unread: true,
    headerSla: '2h',
    headerSlaHue: 'lime',
    channel: 'Via messaging',
    intent: 'Broken product',
    messageTimestamp: '28 minutes ago',
    messageBody:
      "I purchased a rechargeable hand warmer (order #HW-48291) and it won't hold a charge — it powers off within 10 minutes after a full charge. How can I return this item?",
    profile: profile('Riley Green', {
      seed: 3,
      emailLocal: 'rgreen',
      animal: 'koala',
      externalId: '232865e29',
      phone: '+1 (415) 123-4567',
    }),
  },
  {
    id: '4',
    ticketId: '#32004',
    requester: 'Jason Shiele',
    subject: 'Late delivery',
    snippet: 'Shipment was scheduled to arrive yesterday, but it is still in transit.',
    status: 'Pending',
    statusColor: '#3b82f6',
    sla: '4h',
    slaHue: 'lemon',
    timestamp: '45 minutes ago',
    headerSla: '4h',
    headerSlaHue: 'lemon',
    channel: 'Via email',
    intent: 'Shipping delay',
    messageTimestamp: '45 minutes ago',
    messageBody:
      'Shipment was scheduled to arrive yesterday, but the tracking page still shows it in transit in Reno. Can you expedite or issue a credit if it misses Friday?',
    profile: profile('Jason Shiele', {
      seed: 4,
      emailLocal: 'jason.shiele',
      animal: 'owl',
      org: 'Northwind Logistics',
      tags: [{ label: 'B2B', hue: 'lemon' }],
    }),
  },
  {
    id: '5',
    ticketId: '#32005',
    requester: 'Vanessa Mendoza',
    subject: 'Inventory discrepancy',
    snippet: 'Warehouse counts do not match the ERP for SKU HW-19.',
    status: 'Pending',
    statusColor: '#3b82f6',
    sla: '6h',
    slaHue: 'orange',
    timestamp: '1 hour ago',
    autoAssist: true,
    headerSla: '6h',
    headerSlaHue: 'orange',
    channel: 'Via messaging',
    intent: 'Inventory mismatch',
    messageTimestamp: '1 hour ago',
    messageBody:
      'Warehouse cycle counts do not match the ERP for SKU HW-19 — we are short 42 units. Can Auto Assist draft a reconciliation note for the inventory lead?',
    profile: profile('Vanessa Mendoza', {
      seed: 5,
      emailLocal: 'vmendoza',
      animal: 'cat',
      phone: '+1 (415) 555-0177',
      tags: [
        { label: 'Ops', hue: 'orange' },
        { label: 'Premium', hue: 'lime' },
      ],
    }),
  },
  {
    id: '6',
    ticketId: '#32006',
    requester: 'Email bot - production',
    subject: 'Unable to process order',
    snippet: 'Customer is experiencing issues completing their purchase online.',
    status: 'New',
    statusColor: '#f79a3e',
    sla: '7h',
    slaHue: 'lime',
    timestamp: '2 hours ago',
    online: true,
    headerSla: '7h',
    headerSlaHue: 'lime',
    channel: 'Via email',
    intent: 'Checkout failure',
    messageTimestamp: '2 hours ago',
    messageBody:
      'Automated alert: customer checkout failed three times on order draft #ORD-99102 (payment gateway timeout). Escalate to commerce on-call if not resolved within SLA.',
    profile: profile('Email bot - production', {
      seed: 6,
      emailLocal: 'noreply.orders',
      animal: 'penguin',
      org: 'Acme Systems',
      phone: '—',
      tags: [{ label: 'Automation', hue: 'lime' }],
    }),
  },
  {
    id: '7',
    ticketId: '#32007',
    requester: 'Emily White',
    subject: 'Accounts receivable follow-up',
    snippet: 'Follow-up needed on outstanding invoice payment.',
    status: 'AR',
    statusColor: '#01b15c',
    sla: '8m',
    slaHue: 'orange',
    timestamp: '4 hours ago',
    online: true,
    autoAssist: true,
    headerSla: '8m',
    headerSlaHue: 'orange',
    channel: 'Via messaging',
    intent: 'Invoice payment',
    messageTimestamp: '4 hours ago',
    messageBody:
      'Following up on outstanding invoice INV-44821 ($12,450). Finance asked whether we can offer a 2% early-pay discount if they settle this week.',
    profile: profile('Emily White', {
      seed: 7,
      emailLocal: 'emily.white',
      animal: 'rabbit',
      org: 'Brightside Co',
      tags: [
        { label: 'Finance', hue: 'lemon' },
        { label: 'Priority Shipping', hue: 'purple' },
      ],
    }),
  },
]

export function getTicket(id: string): TicketItem {
  return tickets.find((t) => t.id === id) ?? tickets[2]
}

export function interactionsFor(ticket: TicketItem) {
  const first = ticket.profile.name.split(' ')[0]
  return [
    {
      id: 'i1',
      title: `Conversation with ${first}`,
      subtitle: ticket.status === 'Active' ? 'Active now' : ticket.timestamp,
      active: true,
      accent: '#c8bb12',
    },
    {
      id: 'i2',
      title: 'Ordered 3 items',
      subtitle: 'Feb 08, 9:05 AM',
      active: false,
    },
    {
      id: 'i3',
      title: 'Change email address',
      subtitle: 'Jan 21, 9:43 AM',
      active: false,
      accent: '#d16d95',
    },
    {
      id: 'i4',
      title: 'Article viewed',
      subtitle: 'Jan 21, 9:14 AM',
      active: false,
    },
    {
      id: 'i5',
      title: 'Article viewed',
      subtitle: 'Jan 21, 9:38 AM',
      active: false,
    },
  ]
}

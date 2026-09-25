/** Curated customer follow-ups used as seeds for early turns, keyed by ticket id. */
export const customerReplies: Record<string, string[]> = {
  '1': [
    'Thanks — please send the customer notification draft when it’s ready. Should we also pause retail partner POs until QA signs off?',
    'Draft looks good. Please send it and keep me posted on the lot quarantine status.',
    'Notification is out. Can you confirm how many outbound cartons were blocked under the hold?',
    'Got the count. Please share the QA clearance criteria so we know when POs can resume.',
    'Clearance criteria works. One more thing — should we notify wholesale buyers separately?',
    'Perfect. I’ll wait on QA clearance before releasing those POs. Thanks for the help.',
  ],
  '2': [
    'Appreciate it. Can you share the QA ticket number once it’s opened? We’ll hold shelf fills until then.',
    'Got it. Replacement for the affected stores works — please confirm ETA when you have it.',
    'ETA looks fine. Can you also flag which lot codes should be pulled from shelves?',
    'Thanks. We’ll pull those lots today. Any guidance for stores that already sold units?',
    'Understood. Please send a short store-facing script we can forward.',
    'Script received — we’re good for now. I’ll follow up if stores report more issues.',
  ],
  '3': [
    'A prepaid return label would be great. I’d prefer a replacement if you still have the same model in stock.',
    'Label received, thanks. I’ll drop it off today — please confirm when the replacement ships.',
    'Dropped off this morning. Tracking shows it was accepted — any update on the replacement?',
    'Great. Can you email the replacement tracking number when it’s available?',
    'Tracking received, thank you. Estimated delivery looks good.',
    'All set on my side. Appreciate the quick help with the defective unit.',
  ],
  '4': [
    'Please expedite if you can. If it still misses Friday, the shipping credit works for us.',
    'Thanks for the update. We’ll watch tracking and reach out if Friday slips.',
    'Still showing Reno as of this morning. Any new scan?',
    'Good to hear it’s moving. Please confirm the credit if it lands after Friday.',
    'Arrived Saturday — please apply the shipping credit as discussed.',
    'Credit looks correct. Thanks for staying on top of this.',
  ],
  '5': [
    'Yes, please draft the reconciliation note and lock HW-19 for outbound until counts are confirmed.',
    'Note looks right. I’ve pinged the inventory lead — thanks for locking the SKU.',
    'Inventory lead asked for the last three cycle-count timestamps. Can you add those?',
    'Timestamps help. Once recount finishes, who unlocks the SKU?',
    'Recount is done — variance is now −6. Okay to unlock outbound?',
    'Unlocked, thanks. I’ll close the reconciliation thread on our side.',
  ],
  '6': [
    'Please page commerce on-call and send the customer a secure retry link. Alternate payment method is fine too.',
    'Retry link sent on our side as well. Let us know once the gateway timeout is cleared.',
    'Customer retried successfully with the alternate method. Can we close the alert?',
    'One more checkout failed overnight on a different draft. Related?',
    'Thanks for checking. Please keep monitoring for an hour in case it spikes again.',
    'Looks stable now. Appreciate the escalation and follow-through.',
  ],
  '7': [
    'Yes — please send the reminder with the 2% early-pay offer if they settle this week.',
    'Reminder went out from our AP contact too. I’ll update you when payment hits.',
    'They asked for wire instructions again — can you resend those with the offer?',
    'Wire is initiated according to their AP. Please confirm when it posts.',
    'Payment posted this morning. Can you send a quick receipt confirmation?',
    'Receipt received. We’re all clear on INV-44821 — thank you.',
  ],
}

export interface CustomerReplyContext {
  ticketId: string
  intent: string
  subject: string
  originalMessage: string
  lastAgentMessage?: string
  lastCustomerMessage?: string
  followUpIndex: number
}

function clip(text: string, max = 72): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  return `${clean.slice(0, max - 1).replace(/\s+\S*$/, '')}…`
}

function firstSentence(text: string): string {
  const match = text.match(/^[^.!?]+[.!?]?/)
  return clip(match?.[0] ?? text, 90)
}

/** Lightweight deterministic “generation” from thread context (no API). */
export function generateCustomerReply(context: CustomerReplyContext): string {
  const {
    ticketId,
    intent,
    subject,
    originalMessage,
    lastAgentMessage,
    lastCustomerMessage,
    followUpIndex,
  } = context

  // Early curated turns stay on-script for a polished demo path.
  const scripted = customerReplies[ticketId]?.[followUpIndex]
  if (scripted) return scripted

  const topic = intent.trim() || subject
  const agentBeat = lastAgentMessage
    ? firstSentence(lastAgentMessage)
    : clip(originalMessage, 80)
  const priorAsk = lastCustomerMessage ? firstSentence(lastCustomerMessage) : null

  const templates = [
    () =>
      `Thanks for that update on ${topic.toLowerCase()}. Following up — ${agentBeat.toLowerCase().replace(/\.$/, '')}? Can you confirm the next step on your side?`,
    () =>
      `Got it. One more thing about ${subject.toLowerCase()}: ${
        priorAsk
          ? `after “${clip(priorAsk, 48)}”, `
          : ''
      }what should I expect next, and is there anything you still need from me?`,
    () =>
      `Appreciate the help. Re: “${clip(agentBeat, 56)}” — please send a short status when that lands, and flag if anything is blocked.`,
    () =>
      `Quick follow-up on ${topic.toLowerCase()}. If ${clip(agentBeat, 50).toLowerCase().replace(/\.$/, '')} is already underway, can you share timing so I can update my team?`,
    () =>
      `Thanks — that covers most of it. Before we close the loop on ${subject.toLowerCase()}, can you confirm whether I should wait or take any action on my end?`,
    () =>
      `Still watching this thread. Latest from my side is fine; please reply when there’s news on “${clip(agentBeat, 48)}”.`,
  ]

  const pick = templates[followUpIndex % templates.length]
  return pick().replace(/\s+/g, ' ').trim()
}

/** @deprecated Prefer generateCustomerReply — kept for simple index lookups. */
export function getCustomerReply(ticketId: string, index: number): string {
  return generateCustomerReply({
    ticketId,
    intent: '',
    subject: '',
    originalMessage: '',
    followUpIndex: index,
  })
}

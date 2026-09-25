import { TIP_SOURCE_CATALOG } from './sourceCatalog'

export interface AaAction {
  label: string
  value: string
}

export interface AaSuggestionData {
  answer: string
  actions: AaAction[]
}

function cloneActions(actions: AaAction[]): AaAction[] {
  return actions.map((action) => ({ ...action }))
}

/** Build a refreshed suggestion when tip sources change from the ticket defaults. */
export function regenerateSuggestionFromSources(
  base: AaSuggestionData,
  sourceIds: string[],
): AaSuggestionData {
  const sources = sourceIds
    .map((id) => TIP_SOURCE_CATALOG.find((source) => source.id === id))
    .filter((source): source is (typeof TIP_SOURCE_CATALOG)[number] => Boolean(source))

  const procedures = sources.filter((source) => source.kind === 'procedure')
  const guidelines = sources.filter((source) => source.kind === 'guideline')
  const guidelineId = guidelines[0]?.id

  let answer = base.answer
  switch (guidelineId) {
    case 'guideline-empathy-first': {
      const rest = `${base.answer.charAt(0).toLowerCase()}${base.answer.slice(1)}`
      answer = `I’m sorry you’ve had to deal with this — ${rest}`
      break
    }
    case 'guideline-concise-replies': {
      const sentence = base.answer.split(/(?<=[.!?])\s+/)[0] ?? base.answer
      answer = /[.!?]$/.test(sentence) ? sentence : `${sentence}.`
      break
    }
    case 'guideline-escalation-tone':
      answer = `${base.answer} I’ve escalated this for priority review so we can resolve it faster.`
      break
    case 'guideline-brand-voice':
      answer = `${base.answer} We’ll keep you posted with a clear next update.`
      break
    default:
      if (procedures.length > 0) {
        const names = procedures.map((procedure) => procedure.title).join(' and ')
        answer = `${base.answer} I’ve aligned this with ${names}.`
      } else {
        answer = `${base.answer} I’ve refreshed this reply from your updated sources.`
      }
  }

  const actions = cloneActions(base.actions)
  if (procedures.length > 0 && !actions.some((action) => /procedure/i.test(action.value))) {
    actions.push({
      label: 'Action',
      value: `Follow ${procedures[0].title}`,
    })
  }

  return { answer, actions }
}

/** Suggested replies + agent actions derived from each ticket’s intent and message. */
export const aaSuggestions: Record<string, AaSuggestionData> = {
  '1': {
    answer:
      'Thanks for flagging lot #432. I’ve confirmed a temporary hold on outbound multivitamin shipments from that lot and notified Quality & Compliance. Next I’ll reconcile affected orders and share a customer notification draft for your review.',
    actions: [
      { label: 'Action', value: 'Hold outbound lot #432' },
      { label: 'Action', value: 'Notify Compliance' },
    ],
  },
  '2': {
    answer:
      'Sorry you’re seeing inconsistent quality on the latest protein bar batch. I’ll open a QA investigation on the sealed bags and broken seals, and we can offer a replacement shipment or credit while we wait on lab results.',
    actions: [
      { label: 'Action', value: 'Open QA investigation' },
      { label: 'Action', value: 'Offer replacement / credit' },
    ],
  },
  '3': {
    answer:
      "I'm sorry your rechargeable hand warmer (order #HW-48291) isn't holding a charge. You're within the return window for a defective product — I can start a prepaid return and issue a replacement or full refund once we receive it.",
    actions: [
      { label: 'Action', value: 'Start prepaid return' },
      { label: 'Action', value: 'Offer replacement' },
    ],
  },
  '4': {
    answer:
      'I checked tracking and the parcel is still delayed in Reno after the original ETA. I can escalate for expedited carrier handling and apply a shipping credit if it misses Friday — which would you prefer?',
    actions: [
      { label: 'Action', value: 'Expedite shipment' },
      { label: 'Action', value: 'Issue shipping credit' },
    ],
  },
  '5': {
    answer:
      'I’ve noted the ERP vs warehouse mismatch for SKU HW-19 (−42 units). I’ll draft a reconciliation note for the inventory lead and recommend locking the SKU for outbound until counts are confirmed.',
    actions: [
      { label: 'Action', value: 'Draft reconciliation note' },
      { label: 'Action', value: 'Assign inventory lead' },
    ],
  },
  '6': {
    answer:
      'Checkout failed three times on draft #ORD-99102 due to a payment gateway timeout. I’ve flagged commerce on-call and can send the customer a secure retry link plus an alternate payment method while the gateway is checked.',
    actions: [
      { label: 'Action', value: 'Page commerce on-call' },
      { label: 'Action', value: 'Send payment retry link' },
    ],
  },
  '7': {
    answer:
      'Invoice INV-44821 for $12,450 is still outstanding. Finance approved a 2% early-pay discount if settled this week — I can send a payment reminder with that offer and updated due date.',
    actions: [
      { label: 'Action', value: 'Send payment reminder' },
      { label: 'Action', value: 'Apply 2% early-pay offer' },
    ],
  },
}

export function getAaSuggestion(ticketId: string, turnIndex = 0): AaSuggestionData | undefined {
  if (turnIndex <= 0) return aaSuggestions[ticketId]

  const followUps = aaFollowUpSuggestions[ticketId]
  const followUp = followUps?.[turnIndex - 1]
  if (followUp) return followUp

  // Keep Auto Assist available for longer conversations.
  if (!aaSuggestions[ticketId] && !followUps?.length) return undefined
  return getFallbackAaSuggestion(ticketId, turnIndex)
}

function getFallbackAaSuggestion(ticketId: string, turnIndex: number): AaSuggestionData {
  const base = aaSuggestions[ticketId]
  const followUps = aaFollowUpSuggestions[ticketId] ?? []
  const seed = followUps[followUps.length - 1] ?? base
  const templates = [
    {
      answer: `${seed?.answer ? 'Following up on that — ' : ''}I’ve checked the latest status and can take the next step now. Want me to proceed and confirm here when it’s done?`,
      actions: [
        { label: 'Action', value: 'Proceed with next step' },
        { label: 'Action', value: 'Send status confirmation' },
      ],
    },
    {
      answer:
        'I’ve noted your latest reply and can update the record, notify the right owner, and send you a short confirmation. Should I go ahead?',
      actions: [
        { label: 'Action', value: 'Update ticket record' },
        { label: 'Action', value: 'Notify owner' },
      ],
    },
    {
      answer:
        'Thanks for confirming. I can close out the open items from this thread and share a brief summary for your records.',
      actions: [
        { label: 'Action', value: 'Close open items' },
        { label: 'Action', value: 'Share summary' },
      ],
    },
    {
      answer:
        'I’m ready to continue from here — I can check for any remaining blockers and propose the next concrete action.',
      actions: [
        { label: 'Action', value: 'Check remaining blockers' },
        { label: 'Action', value: 'Propose next action' },
      ],
    },
    {
      answer:
        'Everything from the prior step is tracked. I can follow up with the other team and report back with a clear status.',
      actions: [
        { label: 'Action', value: 'Follow up with other team' },
        { label: 'Action', value: 'Report status' },
      ],
    },
  ] as const

  const template = templates[(turnIndex - 1) % templates.length]
  return {
    answer: template.answer,
    actions: template.actions.map((action) => ({ ...action })),
  }
}

/** Next-turn suggestions after the customer replies (index 0 = after first follow-up). */
export const aaFollowUpSuggestions: Record<string, AaSuggestionData[]> = {
  '1': [
    {
      answer:
        'I’ll draft the customer notification for lot #432 and flag a temporary pause on retail partner POs until QA clears the batch. I’ll share the draft here for a quick review before it goes out.',
      actions: [
        { label: 'Action', value: 'Draft customer notification' },
        { label: 'Action', value: 'Pause retail partner POs' },
      ],
    },
    {
      answer:
        'Notification is queued to send. I’ve also logged the quarantine hold — I can pull the blocked outbound carton count from the warehouse system next.',
      actions: [
        { label: 'Action', value: 'Send customer notification' },
        { label: 'Action', value: 'Pull blocked carton count' },
      ],
    },
    {
      answer:
        'There are 128 outbound cartons blocked under the lot #432 hold. I can draft the QA clearance criteria checklist so merchandising knows when POs may resume.',
      actions: [
        { label: 'Action', value: 'Draft QA clearance criteria' },
        { label: 'Action', value: 'Share carton count summary' },
      ],
    },
    {
      answer:
        'Clearance criteria draft is ready. I can also prepare a short wholesale-buyer notice separate from the consumer notification if you want that sent in parallel.',
      actions: [
        { label: 'Action', value: 'Prepare wholesale-buyer notice' },
        { label: 'Action', value: 'Align notice with QA criteria' },
      ],
    },
    {
      answer:
        'I’ll hold retail partner PO release until QA clearance posts, and watch the quarantine queue for updates. I can ping you as soon as status changes.',
      actions: [
        { label: 'Action', value: 'Watch quarantine queue' },
        { label: 'Action', value: 'Notify on QA clearance' },
      ],
    },
  ],
  '2': [
    {
      answer:
        'QA investigation QI-2087 is open for the sealed-bag and broken-seal reports. I’ll hold shelf fills for the affected SKU and confirm a replacement ETA as soon as logistics responds.',
      actions: [
        { label: 'Action', value: 'Hold shelf fills' },
        { label: 'Action', value: 'Request replacement ETA' },
      ],
    },
    {
      answer:
        'Replacement ETA is 5 business days. I can also pull the impacted lot codes so stores know exactly what to remove from shelves.',
      actions: [
        { label: 'Action', value: 'Share impacted lot codes' },
        { label: 'Action', value: 'Confirm replacement ETA' },
      ],
    },
    {
      answer:
        'Impacted lot codes are L19-A through L19-C. For units already sold, I recommend a goodwill replacement or refund — I can draft a short store-facing script.',
      actions: [
        { label: 'Action', value: 'Draft store-facing script' },
        { label: 'Action', value: 'Offer goodwill replacement' },
      ],
    },
    {
      answer:
        'Here’s a concise store script covering pull instructions and customer remedies. I can format it for email blast or intranet posting.',
      actions: [
        { label: 'Action', value: 'Format script for email blast' },
        { label: 'Action', value: 'Post script to intranet' },
      ],
    },
    {
      answer:
        'I’ll keep QI-2087 updated as store pulls complete. Ping me if you need a daily count of recovered units.',
      actions: [
        { label: 'Action', value: 'Track recovered unit counts' },
        { label: 'Action', value: 'Update QI-2087 daily' },
      ],
    },
  ],
  '3': [
    {
      answer:
        'I’ve started a prepaid return for order #HW-48291 and reserved a replacement unit. You’ll get the label by email shortly — once the return is scanned, we’ll ship the replacement automatically.',
      actions: [
        { label: 'Action', value: 'Email prepaid label' },
        { label: 'Action', value: 'Reserve replacement unit' },
      ],
    },
    {
      answer:
        'Return scan is in — the replacement is in the fulfillment queue. I can send tracking as soon as the label prints, usually within a few hours.',
      actions: [
        { label: 'Action', value: 'Watch replacement fulfillment' },
        { label: 'Action', value: 'Send tracking when ready' },
      ],
    },
    {
      answer:
        'Replacement shipped via UPS Ground. I can email the tracking number now and note delivery expectations in the ticket.',
      actions: [
        { label: 'Action', value: 'Email replacement tracking' },
        { label: 'Action', value: 'Add delivery note to ticket' },
      ],
    },
    {
      answer:
        'Tracking is on the way to your inbox. Estimated delivery is in 2–3 business days — I can set a reminder to check in if it slips.',
      actions: [
        { label: 'Action', value: 'Set delivery check-in reminder' },
        { label: 'Action', value: 'Monitor tracking exceptions' },
      ],
    },
    {
      answer:
        'Glad that helped. I’ll leave the ticket ready to close once you confirm the replacement arrives in good condition.',
      actions: [
        { label: 'Action', value: 'Mark waiting on delivery' },
        { label: 'Action', value: 'Prepare close template' },
      ],
    },
  ],
  '4': [
    {
      answer:
        'I’ve requested expedited carrier handling out of Reno and noted a shipping credit if delivery misses Friday. I’ll update you as soon as the new scan posts.',
      actions: [
        { label: 'Action', value: 'Request expedited handling' },
        { label: 'Action', value: 'Note shipping credit' },
      ],
    },
    {
      answer:
        'Carrier just scanned the parcel out of Reno toward the local hub. I’ll keep watching — if Friday slips, I can apply the shipping credit automatically.',
      actions: [
        { label: 'Action', value: 'Monitor hub scans' },
        { label: 'Action', value: 'Auto-apply credit if late' },
      ],
    },
    {
      answer:
        'It’s moving again with a Saturday delivery estimate. I can pre-approve the shipping credit now so it posts as soon as delivery confirms late.',
      actions: [
        { label: 'Action', value: 'Pre-approve shipping credit' },
        { label: 'Action', value: 'Confirm Saturday ETA' },
      ],
    },
    {
      answer:
        'Delivery confirmed Saturday — I’ve applied the shipping credit to the order. I can send a short confirmation note for your records.',
      actions: [
        { label: 'Action', value: 'Apply shipping credit' },
        { label: 'Action', value: 'Send credit confirmation' },
      ],
    },
    {
      answer:
        'Credit is on the account. I’ll close the delay escalation unless you need anything else documented.',
      actions: [
        { label: 'Action', value: 'Close delay escalation' },
        { label: 'Action', value: 'Attach credit receipt' },
      ],
    },
  ],
  '5': [
    {
      answer:
        'I’ve drafted the HW-19 reconciliation note (−42 units) for the inventory lead and locked the SKU for outbound until counts are confirmed. Want me to assign it to you or the warehouse manager?',
      actions: [
        { label: 'Action', value: 'Lock SKU HW-19 outbound' },
        { label: 'Action', value: 'Assign reconciliation note' },
      ],
    },
    {
      answer:
        'I can append the last three cycle-count timestamps to the reconciliation note and resend it to the inventory lead.',
      actions: [
        { label: 'Action', value: 'Add cycle-count timestamps' },
        { label: 'Action', value: 'Resend note to inventory lead' },
      ],
    },
    {
      answer:
        'After recount, unlock rights sit with the inventory lead. I can add that to the note and leave a checklist for who signs off.',
      actions: [
        { label: 'Action', value: 'Document unlock owner' },
        { label: 'Action', value: 'Add sign-off checklist' },
      ],
    },
    {
      answer:
        'Variance is now −6 after recount. I can unlock outbound for HW-19 and note the residual variance for the next cycle count.',
      actions: [
        { label: 'Action', value: 'Unlock HW-19 outbound' },
        { label: 'Action', value: 'Log residual variance' },
      ],
    },
    {
      answer:
        'SKU is unlocked and the reconciliation thread is updated. I can archive the lock event for audit if you want a clean trail.',
      actions: [
        { label: 'Action', value: 'Archive lock event' },
        { label: 'Action', value: 'Close reconciliation thread' },
      ],
    },
  ],
  '6': [
    {
      answer:
        'Commerce on-call is paged for the gateway timeouts on #ORD-99102. I’m sending the customer a secure retry link and an alternate payment option now.',
      actions: [
        { label: 'Action', value: 'Send secure retry link' },
        { label: 'Action', value: 'Offer alternate payment' },
      ],
    },
    {
      answer:
        'Customer completed checkout with the alternate method. I can resolve the original alert and keep a short watch window for repeat failures.',
      actions: [
        { label: 'Action', value: 'Resolve checkout alert' },
        { label: 'Action', value: 'Start failure watch window' },
      ],
    },
    {
      answer:
        'The overnight failure looks like a single-card decline, not a gateway timeout. I can leave commerce monitoring on for an hour anyway.',
      actions: [
        { label: 'Action', value: 'Classify overnight failure' },
        { label: 'Action', value: 'Keep commerce monitoring' },
      ],
    },
    {
      answer:
        'Gateway metrics are stable for the last hour. I can clear the watch window and summarize the incident for the commerce channel.',
      actions: [
        { label: 'Action', value: 'Clear watch window' },
        { label: 'Action', value: 'Post incident summary' },
      ],
    },
    {
      answer:
        'Incident summary is ready for commerce. I’ll mark the automation alert closed unless another spike appears.',
      actions: [
        { label: 'Action', value: 'Close automation alert' },
        { label: 'Action', value: 'Share summary with commerce' },
      ],
    },
  ],
  '7': [
    {
      answer:
        'I’ll send the INV-44821 reminder with the approved 2% early-pay discount if settled this week, and update the due date in the note. I’ll confirm here once it’s delivered.',
      actions: [
        { label: 'Action', value: 'Send reminder with 2% offer' },
        { label: 'Action', value: 'Update invoice due date' },
      ],
    },
    {
      answer:
        'I can resend wire instructions with the early-pay offer attached so AP has everything in one place.',
      actions: [
        { label: 'Action', value: 'Resend wire instructions' },
        { label: 'Action', value: 'Attach early-pay offer' },
      ],
    },
    {
      answer:
        'I’ll watch for the wire post on INV-44821 and confirm as soon as finance systems show it cleared.',
      actions: [
        { label: 'Action', value: 'Watch for wire post' },
        { label: 'Action', value: 'Confirm payment cleared' },
      ],
    },
    {
      answer:
        'Payment posted this morning. I can send a receipt confirmation and mark the invoice settled in our AR queue.',
      actions: [
        { label: 'Action', value: 'Send payment receipt' },
        { label: 'Action', value: 'Mark invoice settled' },
      ],
    },
    {
      answer:
        'Receipt is sent and INV-44821 is marked settled. I can close the AR follow-up unless you need a ledger export.',
      actions: [
        { label: 'Action', value: 'Close AR follow-up' },
        { label: 'Action', value: 'Export ledger confirmation' },
      ],
    },
  ],
}

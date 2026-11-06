// P0-5 · Handover meeting + team notifications without unsupported permissions.
// - Meeting: a calendar event with isOnlineMeeting=true created as the PMO (delegated),
//   so it shows on everyone's calendar (a standalone onlineMeeting does not).
// - Channel notice: Teams Workflows "post to a channel when a webhook request is received".
//   App-only ChannelMessage.Send is migration-only and O365 Connectors were retired in 2026.
import type { GraphClient } from '../graph/client.ts'

export interface HandoverMeeting {
  subject: string
  startIso: string
  endIso: string
  timeZone?: string
  attendees: { email: string; name?: string; optional?: boolean }[]
  agendaHtml: string
}

export function handoverEventBody(m: HandoverMeeting) {
  return {
    subject: m.subject,
    body: { contentType: 'HTML', content: m.agendaHtml },
    start: { dateTime: m.startIso, timeZone: m.timeZone ?? 'SE Asia Standard Time' },
    end: { dateTime: m.endIso, timeZone: m.timeZone ?? 'SE Asia Standard Time' },
    attendees: m.attendees.map((a) => ({ emailAddress: { address: a.email, name: a.name }, type: a.optional ? 'optional' : 'required' })),
    isOnlineMeeting: true,
    onlineMeetingProvider: 'teamsForBusiness',
    allowNewTimeProposals: true,
  }
}

/** `pmoToken` must be the PMO's delegated token (Calendars.ReadWrite) obtained via OBO. */
export function createHandoverMeeting(g: GraphClient, pmoToken: string, m: HandoverMeeting) {
  return g.post<{ id: string; webLink: string; onlineMeeting?: { joinUrl: string } }>('/me/events', { token: pmoToken, body: handoverEventBody(m) })
}

export function adaptiveCardMessage(title: string, facts: [string, string][], url: string) {
  return {
    type: 'message',
    attachments: [{
      contentType: 'application/vnd.microsoft.card.adaptive',
      content: {
        $schema: 'http://adaptivecards.io/schemas/adaptive-card.json', type: 'AdaptiveCard', version: '1.4',
        body: [
          { type: 'TextBlock', text: title, weight: 'Bolder', size: 'Medium', wrap: true },
          { type: 'FactSet', facts: facts.map(([title, value]) => ({ title, value })) },
        ],
        actions: [{ type: 'Action.OpenUrl', title: 'เปิดใน SalesFlow', url }],
      },
    }],
  }
}

export async function notifyChannel(webhookUrl: string, card: object, f: typeof fetch = fetch) {
  const res = await f(webhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(card) })
  if (!res.ok) throw new Error(`Teams Workflow webhook ตอบ ${res.status}`)
}

import type { DurableTicket } from '@/access/tickets';
import type { RoomCalendarEvent, RoomEntitlement } from '@/rooms/types';

const UNAVAILABLE_STATES = new Set<RoomEntitlement['state']>([
  'cancelled',
  'exhausted',
  'expired',
  'revoked',
]);

export type MyNightDoorItem =
  | {
      kind: 'credential';
      awardId: string;
      title: string;
      location: string;
    }
  | {
      kind: 'rsvp';
      ticketId: string;
      title: string;
      location: string;
    }
  | {
      kind: 'event';
      eventId: string;
      title: string;
      location: string;
    };

type SelectMyNightDoorItemInput = {
  entitlements: RoomEntitlement[];
  events: RoomCalendarEvent[];
  now: number;
  roomId: string;
  tickets: DurableTicket[];
};

const isCurrent = (end: number | null, now: number) => end === null || end >= now;

/**
 * The actionable venue-issued credential wins over a saved RSVP or a bare
 * calendar listing. This keeps the screen copy and its destination truthful.
 */
export function selectMyNightDoorItem({
  entitlements,
  events,
  now,
  roomId,
  tickets,
}: SelectMyNightDoorItemInput): MyNightDoorItem | undefined {
  const eventsByAddress = new Map(events.map((event) => [event.address, event]));
  const credential = entitlements
    .filter(
      (item) =>
        item.roomId === roomId &&
        item.type === 'event_access' &&
        Boolean(item.eventAddress) &&
        !UNAVAILABLE_STATES.has(item.state),
    )
    .map((item) => ({ item, event: eventsByAddress.get(item.eventAddress ?? '') }))
    .filter(({ event }) => !event || isCurrent(event.end, now))
    .sort((left, right) => {
      const leftStart = left.event?.start ?? Number.MAX_SAFE_INTEGER;
      const rightStart = right.event?.start ?? Number.MAX_SAFE_INTEGER;
      return leftStart - rightStart || right.item.createdAt - left.item.createdAt;
    })[0];

  if (credential) {
    return {
      kind: 'credential',
      awardId: credential.item.awardId,
      title: credential.event?.title ?? credential.item.name,
      location: credential.event?.location ?? credential.item.roomName,
    };
  }

  const ticket = tickets
    .filter((item) => item.roomId === roomId && isCurrent(item.end, now))
    .sort((left, right) => left.start - right.start || right.confirmedAt - left.confirmedAt)[0];
  if (ticket) {
    return {
      kind: 'rsvp',
      ticketId: ticket.id,
      title: ticket.title,
      location: ticket.location,
    };
  }

  const event = events
    .filter((item) => isCurrent(item.end, now))
    .sort((left, right) => left.start - right.start || left.id.localeCompare(right.id))[0];
  if (!event) return undefined;
  return {
    kind: 'event',
    eventId: event.id,
    title: event.title,
    location: event.location,
  };
}

export function myNightDoorDestination(item: MyNightDoorItem) {
  if (item.kind === 'credential') {
    return { pathname: '/ticket', params: { awardId: item.awardId } } as const;
  }
  if (item.kind === 'rsvp') {
    return { pathname: '/ticket', params: { id: item.ticketId } } as const;
  }
  return { pathname: '/event', params: { id: item.eventId } } as const;
}

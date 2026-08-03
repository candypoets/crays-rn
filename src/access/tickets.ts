import * as SecureStore from 'expo-secure-store';

import type { RoomCalendarEvent } from '@/rooms/types';

const TICKETS_KEY = 'crays.tickets.archive.v1';

export type DurableTicket = {
  id: string;
  eventAddress: string;
  eventId: string;
  title: string;
  summary: string;
  location: string;
  start: number;
  end: number | null;
  roomId: string;
  roomName: string;
  relayUrl: string;
  status: 'going';
  confirmedAt: number;
};

function validTicket(value: unknown): value is DurableTicket {
  const item = value as Partial<DurableTicket>;
  return Boolean(
    item && typeof item.id === 'string' && /^3192[23]:[0-9a-f]{64}:.+/i.test(item.eventAddress || '') &&
    typeof item.title === 'string' && typeof item.start === 'number' && typeof item.relayUrl === 'string' &&
    /^wss?:\/\//.test(item.relayUrl) && item.status === 'going',
  );
}

export async function listTickets(): Promise<DurableTicket[]> {
  try {
    const parsed = JSON.parse((await SecureStore.getItemAsync(TICKETS_KEY)) || '[]') as unknown[];
    return parsed.filter(validTicket).sort((a, b) => a.start - b.start || b.confirmedAt - a.confirmedAt).slice(0, 200);
  } catch {
    return [];
  }
}

export async function findTicket(eventAddress: string): Promise<DurableTicket | null> {
  return (await listTickets()).find((item) => item.eventAddress === eventAddress) || null;
}

export async function saveConfirmedRsvp({ event, relayUrl, roomId, roomName }: {
  event: RoomCalendarEvent;
  relayUrl: string;
  roomId: string;
  roomName: string;
}): Promise<DurableTicket> {
  const ticket: DurableTicket = {
    id: event.address,
    eventAddress: event.address,
    eventId: event.id,
    title: event.title,
    summary: event.summary,
    location: event.location,
    start: event.start,
    end: event.end,
    roomId,
    roomName,
    relayUrl,
    status: 'going',
    confirmedAt: Date.now(),
  };
  const current = await listTickets();
  const next = [ticket, ...current.filter((item) => item.eventAddress !== ticket.eventAddress)].slice(0, 200);
  await SecureStore.setItemAsync(TICKETS_KEY, JSON.stringify(next));
  return ticket;
}

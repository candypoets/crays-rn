// THESIS: Tickets are durable access objects, while an RSVP remains a plan rather than a code.
// OWNED WORLD: Venue-backed ticket moments with explicit validity and one door-ready detail.
// STORY: Review owned access → distinguish RSVP from credential → present only valid truth.
// FIRST VIEWPORT: Event, room, date, validity, and the exact next action are readable.
// FORM: Empty, upcoming, past, available, exhausted, expired, revoked, and missing are explicit.
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { canPresentEntitlement } from '@/access/entitlements';
import type { DurableTicket } from '@/access/tickets';
import { AppShell } from '@/components/app/AppShell';
import { EntitlementPresentation } from '@/components/durable/EntitlementPresentation';
import { NightBadge, VenueImage } from '@/components/night/NightPrimitives';
import type { RoomEntitlement } from '@/rooms/types';
import { colors } from '@/theme/colors';

function ticketDate(epochSeconds: number) {
  return new Date(epochSeconds * 1000).toLocaleDateString([], {
    day: 'numeric',
    month: 'short',
    weekday: 'short',
  });
}

function entitlementLabel(item: RoomEntitlement) {
  if (canPresentEntitlement(item)) return 'Show at the door';
  return ({
    cancelled: 'Cancelled',
    exhausted: 'Used',
    expired: 'Expired',
    revoked: 'Revoked',
  } as Record<string, string>)[item.state] || 'View details';
}

function TicketsBack({ onBack }: { onBack: () => void }) {
  return (
    <Pressable
      accessibilityLabel="Back to Me"
      accessibilityRole="button"
      className="min-h-12 flex-row items-center gap-2 self-start pr-4"
      onPress={onBack}
      testID="tickets-back"
    >
      <Ionicons color={colors.ink} name="arrow-back" size={22} />
      <Text className="font-bold text-primary">Back to Me</Text>
    </Pressable>
  );
}

function SectionLabel({ children }: { children: string }) {
  return <Text accessibilityRole="header" className="mb-3 mt-7 text-xs font-black uppercase tracking-[0.8px] text-ink">{children}</Text>;
}

export function TicketsScreen({
  entitlements = [],
  now,
  onBack,
  onOpen,
  onOpenEntitlement,
  tickets,
}: {
  entitlements?: RoomEntitlement[];
  now: number;
  onBack: () => void;
  onOpen: (ticket: DurableTicket) => void;
  onOpenEntitlement?: (item: RoomEntitlement) => void;
  tickets: DurableTicket[];
}) {
  const upcoming = tickets.filter((ticket) => !ticket.end || ticket.end >= now);
  const past = tickets.filter((ticket) => ticket.end && ticket.end < now);
  const issued = entitlements.filter((item) => item.type === 'event_access');

  const rsvpRows = (items: DurableTicket[], pastEvent = false) => (
    <View className="border-t border-edge">
      {items.map((ticket, index) => (
        <Pressable
          accessibilityLabel={`Open ticket ${ticket.title}`}
          accessibilityRole="button"
          className="min-h-[104px] flex-row items-center border-b border-edge bg-surface p-3 active:bg-surface-soft"
          key={ticket.id}
          onPress={() => onOpen(ticket)}
          testID={`ticket-row-${ticket.eventId}`}
        >
          <VenueImage className="h-20 w-24 rounded-xl" index={index % 4} label={`${ticket.roomName} venue`} />
          <View className="ml-4 min-w-0 flex-1">
            <Text className="text-lg font-black uppercase text-ink">{ticket.title}</Text>
            <Text className="mt-1 text-sm font-semibold text-muted">{ticket.roomName} · {ticketDate(ticket.start)}</Text>
            <Text className="mt-2 text-xs font-black uppercase text-primary">
              {pastEvent ? 'Past RSVP' : 'RSVP saved · No entry code'}
            </Text>
          </View>
          <Ionicons color={colors.inkMuted} name="chevron-forward" size={20} />
        </Pressable>
      ))}
    </View>
  );

  return (
    <AppShell eyebrow="Durable access" testID="tickets-screen" title="Tickets">
      <TicketsBack onBack={onBack} />

      {issued.length ? (
        <>
          <SectionLabel>Ready at the door</SectionLabel>
          <View className="gap-3">
            {issued.map((item, index) => {
              const presentable = canPresentEntitlement(item);
              return (
                <Pressable
                  accessibilityLabel={`Open ${item.name}`}
                  accessibilityRole="button"
                  className="min-h-[118px] overflow-hidden rounded-2xl border border-edge bg-surface active:bg-surface-soft"
                  key={item.awardId}
                  onPress={() => onOpenEntitlement?.(item)}
                  testID={`ticket-award-${item.awardId}`}
                >
                  <View className="flex-row">
                    <VenueImage className="w-28 self-stretch" index={(index + 2) % 4} label={`${item.roomName} venue`} />
                    <View className="min-w-0 flex-1 p-4">
                      <NightBadge tone={presentable ? 'verified' : 'neutral'}>{entitlementLabel(item)}</NightBadge>
                      <Text className="mt-3 text-lg font-black uppercase text-ink">{item.name}</Text>
                      <Text className="mt-1 text-sm font-semibold text-muted">{item.roomName}</Text>
                      {item.remainingUses !== undefined ? (
                        <Text className="mt-2 text-xs text-muted">{item.remainingUses} of {item.maxUses} uses remain</Text>
                      ) : null}
                    </View>
                    <View className="items-center justify-center pr-3">
                      <Ionicons color={colors.ink} name="chevron-forward" size={20} />
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </>
      ) : null}

      {upcoming.length ? (
        <>
          <SectionLabel>RSVPs</SectionLabel>
          <Text className="-mt-2 mb-3 text-sm text-muted">Saved plans · not door codes</Text>
          {rsvpRows(upcoming)}
        </>
      ) : !issued.length ? (
        <View className="mt-10 items-center border-y border-dashed border-edge bg-surface px-6 py-10">
          <Ionicons color={colors.ink} name="ticket-outline" size={36} />
          <Text accessibilityRole="header" className="mt-4 text-center text-2xl font-black text-ink">No upcoming tickets</Text>
          <Text className="mt-2 max-w-[380px] text-center text-base leading-6 text-muted">
            A confirmed RSVP or venue-issued ticket appears here and remains after leaving.
          </Text>
        </View>
      ) : null}

      {past.length ? (
        <>
          <SectionLabel>Past RSVPs</SectionLabel>
          {rsvpRows(past, true)}
        </>
      ) : null}
    </AppShell>
  );
}

function TicketBackLink({ onBack }: { onBack: () => void }) {
  return (
    <Pressable
      accessibilityLabel="All tickets"
      accessibilityRole="button"
      className="min-h-12 flex-row items-center gap-2 self-start pr-4"
      hitSlop={8}
      onPress={onBack}
      testID="ticket-detail-back"
    >
      <Ionicons color={colors.ink} name="arrow-back" size={22} />
      <Text className="font-bold text-primary">All tickets</Text>
    </Pressable>
  );
}

export function TicketDetailScreen({
  entitlement,
  onBack,
  ticket,
}: {
  entitlement?: RoomEntitlement;
  onBack: () => void;
  ticket?: DurableTicket;
}) {
  if (!entitlement && !ticket) {
    return (
      <AppShell testID="ticket-detail-screen" title="Ticket">
        <TicketBackLink onBack={onBack} />
        <View className="mt-8 border-y border-dashed border-edge bg-surface px-5 py-10">
          <Ionicons color={colors.primary} name="ticket-outline" size={36} />
          <Text accessibilityRole="header" className="mt-5 text-2xl font-black text-ink">Ticket unavailable</Text>
          <Text className="mt-2 text-base leading-6 text-muted">No saved RSVP or active entry ticket matches this link.</Text>
        </View>
      </AppShell>
    );
  }

  if (entitlement) {
    const presentable = canPresentEntitlement(entitlement);
    const expiry = entitlement.expiresAt
      ? new Date(entitlement.expiresAt * 1000).toLocaleString()
      : 'No expiry published';
    return (
      <AppShell eyebrow="Show at the door" testID="ticket-detail-screen" title="Ticket">
        <TicketBackLink onBack={onBack} />
        <View className="mt-5 rounded-2xl border border-edge bg-surface p-5">
          <NightBadge tone={presentable ? 'verified' : 'neutral'}>
            {presentable ? 'Ready to show' : entitlementLabel(entitlement)}
          </NightBadge>
          <Text accessibilityRole="header" className="mt-4 text-[30px] font-black uppercase leading-8 text-ink">{entitlement.name}</Text>
          <Text className="mt-2 text-base font-semibold text-muted">{entitlement.roomName}</Text>
          {entitlement.description ? <Text className="mt-3 text-base leading-6 text-ink">{entitlement.description}</Text> : null}
          <View className="mt-4 border-t border-edge pt-4">
            <Text className="text-sm font-semibold text-muted">Valid: {expiry}</Text>
            {entitlement.remainingUses !== undefined ? (
              <Text className="mt-1 text-sm font-semibold text-muted">{entitlement.remainingUses} of {entitlement.maxUses} uses remaining</Text>
            ) : null}
          </View>
        </View>

        <Text accessibilityRole="header" className="mb-3 mt-7 text-xs font-black uppercase tracking-[0.8px] text-ink">
          {presentable ? 'Show at the door' : 'Ticket status'}
        </Text>
        <EntitlementPresentation item={entitlement} />
        <Text className="mt-4 text-sm leading-6 text-muted">
          {presentable
            ? 'This code refreshes automatically and is signed for you. Staff checks your ticket and its current status at the door.'
            : 'No live code is shown while this ticket is unavailable.'}
        </Text>

        {entitlement.activity.length ? (
          <>
            <SectionLabel>Entry activity</SectionLabel>
            <View className="border-y border-edge">
              {entitlement.activity.map((activity) => (
                <View className="min-h-14 flex-row items-center border-b border-edge py-3 last:border-b-0" key={activity.id}>
                  <Ionicons color={colors.ink} name="checkmark-circle-outline" size={22} />
                  <Text className="ml-3 flex-1 font-semibold text-ink">{activity.status} · {new Date(activity.createdAt * 1000).toLocaleString()}</Text>
                </View>
              ))}
            </View>
          </>
        ) : null}
      </AppShell>
    );
  }

  return (
    <AppShell eyebrow="Saved plan · not a door code" testID="ticket-detail-screen" title="RSVP">
      <TicketBackLink onBack={onBack} />
      <View className="mt-5 overflow-hidden rounded-2xl border border-edge bg-surface">
        <VenueImage className="h-44" index={0} label={`${ticket!.roomName} venue`} />
        <View className="p-5">
          <NightBadge tone="verified">RSVP saved</NightBadge>
          <Text accessibilityRole="header" className="mt-4 text-[30px] font-black uppercase leading-8 text-ink">{ticket!.title}</Text>
          <Text className="mt-2 text-base font-semibold text-muted">{ticket!.roomName}</Text>
          <Text className="mt-2 text-base text-ink">{ticketDate(ticket!.start)} · {ticket!.location}</Text>
        </View>
      </View>
      <View className="mt-6 items-center rounded-2xl bg-surface-soft p-6">
        <Ionicons color={colors.ink} name="calendar-outline" size={38} />
        <Text className="mt-4 text-center text-xl font-black text-ink">No entry code yet</Text>
        <Text className="mt-2 text-center text-base leading-6 text-muted">
          This RSVP confirms your plans, but it is not an entry code. A live code appears only after the venue issues ticket access.
        </Text>
      </View>
    </AppShell>
  );
}

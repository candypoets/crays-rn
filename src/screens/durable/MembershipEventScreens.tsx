// THESIS: Access products state concrete value and operational truth before acquisition.
// OWNED WORLD: Membership cards and door credentials feel issued by one real venue.
// STORY: Understand offer → see status/benefits → RSVP or present at the door.
// FIRST VIEWPORT: Venue, price/status, tangible benefits, and honest action availability lead.
// FORM: Sold-out, expired, revoked, unpaid, offline, and unconfigured payment states are explicit.
import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { canPresentEntitlement } from '@/access/entitlements';
import { AppShell } from '@/components/app/AppShell';
import { NightBadge, VenueImage } from '@/components/night/NightPrimitives';
import { ErrorBanner, PrimaryButton } from '@/components/onboarding/OnboardingPrimitives';
import type { RoomCalendarEvent, RoomEntitlement, RoomMembershipOffer } from '@/rooms/types';
import { EntitlementPresentation } from '@/components/durable/EntitlementPresentation';
import { formatCurrency } from '@/commerce/currency';
import { colors } from '@/theme/colors';

function MembershipBack({ label = 'Back', onBack, testID }: { label?: string; onBack: () => void; testID: string }) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      className="min-h-12 flex-row items-center gap-2 self-start pr-4"
      onPress={onBack}
      testID={testID}
    >
      <Ionicons color={colors.ink} name="arrow-back" size={22} />
      <Text className="font-bold text-primary">{label}</Text>
    </Pressable>
  );
}

function MembershipSection({ children }: { children: ReactNode }) {
  return <Text accessibilityRole="header" className="mb-3 mt-7 text-xs font-black uppercase tracking-[0.8px] text-ink">{children}</Text>;
}

export function MembershipOfferScreen({
  membership,
  onBack,
  onPaymentMethods,
  roomName,
}: {
  membership?: RoomMembershipOffer;
  onBack: () => void;
  onPaymentMethods: () => void;
  roomName: string;
}) {
  return (
    <AppShell eyebrow={roomName} testID="membership-offer-screen" title="Membership">
      <MembershipBack onBack={onBack} testID="membership-offer-back" />
      {!membership ? (
        <View className="mt-9 border-y border-dashed border-edge bg-surface px-5 py-10">
          <Ionicons color={colors.primary} name="ribbon-outline" size={36} />
          <Text accessibilityRole="header" className="mt-5 text-2xl font-black text-ink">No membership offer</Text>
          <Text className="mt-2 text-base leading-6 text-muted">This room has not published a membership offer matching this link.</Text>
        </View>
      ) : (
        <>
          <View className="relative mt-4 min-h-[240px] overflow-hidden rounded-2xl bg-photo-night">
            <VenueImage className="absolute inset-0" index={3} label={`${roomName} membership atmosphere`} />
            <View className="absolute inset-0 bg-photo-night/70" />
            <View className="grow justify-between p-5">
              <NightBadge tone={membership.available ? 'verified' : 'attention'}>
                {membership.available ? 'Offer available' : 'Unavailable'}
              </NightBadge>
              <View>
                <Text accessibilityRole="header" className="text-[30px] font-black uppercase leading-8 text-white">{membership.name}</Text>
                <Text className="mt-3 text-[28px] font-black text-white">
                  {formatCurrency(membership.price, membership.currency)} <Text className="text-base font-semibold">/ {membership.billing}</Text>
                </Text>
              </View>
            </View>
          </View>

          <MembershipSection>Published offer</MembershipSection>
          <Text className="text-lg leading-7 text-ink">{membership.description}</Text>
          <View className="mt-5 border-y border-edge">
            <View className="min-h-14 flex-row items-center border-b border-edge py-3">
              <Ionicons color={colors.ink} name="repeat-outline" size={22} />
              <Text className="ml-3 flex-1 font-semibold text-ink">Billing cadence</Text>
              <Text className="font-bold text-muted">{membership.billing}</Text>
            </View>
            <View className="min-h-14 flex-row items-center py-3">
              <Ionicons color={colors.ink} name="person-circle-outline" size={22} />
              <Text className="ml-3 flex-1 font-semibold text-ink">Ownership</Text>
              <Text className="ml-3 text-right font-bold text-muted">This Crays identity</Text>
            </View>
          </View>

          <View className="mt-7">
            <PrimaryButton
              disabled
              label={membership.available ? 'Membership checkout not configured' : 'Membership unavailable'}
              onPress={() => undefined}
              testID="membership-purchase-disabled"
            />
            <Pressable
              accessibilityRole="button"
              className="min-h-12 items-center justify-center"
              onPress={onPaymentMethods}
              testID="membership-payment-methods"
            >
              <Text className="font-bold text-primary">Review payment methods</Text>
            </Pressable>
            <Text className="mt-3 text-center text-sm leading-5 text-muted">
              No membership, charge, or renewal is created while payment rails are deferred.
            </Text>
          </View>
        </>
      )}
    </AppShell>
  );
}

export function entitlementStateLabel(state: RoomEntitlement['state']) {
  return ({
    active: 'Active',
    available: 'Available',
    cancelled: 'Cancelled',
    exhausted: 'Exhausted',
    expired: 'Expired',
    revoked: 'Revoked',
  } as const)[state];
}

function MembershipRows({ items, onOpen }: { items: RoomEntitlement[]; onOpen: (item: RoomEntitlement) => void }) {
  return (
    <View className="gap-3">
      {items.map((item, index) => (
        <Pressable
          accessibilityLabel={`Open ${item.name}`}
          accessibilityRole="button"
          className="min-h-[112px] overflow-hidden rounded-2xl border border-edge bg-surface active:bg-surface-soft"
          key={item.awardId}
          onPress={() => onOpen(item)}
          testID={`entitlement-row-${item.awardId}`}
        >
          <View className="flex-row">
            <VenueImage className="w-24 self-stretch" index={(index + 1) % 4} label={`${item.roomName} venue`} />
            <View className="min-w-0 flex-1 p-4">
              <View className="flex-row items-start justify-between gap-2">
                <Text className="min-w-0 flex-1 text-lg font-black uppercase text-ink">{item.name}</Text>
                <NightBadge tone={canPresentEntitlement(item) ? 'verified' : 'neutral'}>{entitlementStateLabel(item.state)}</NightBadge>
              </View>
              <Text className="mt-2 text-sm font-semibold text-muted">{item.roomName}</Text>
              {item.remainingUses !== undefined ? <Text className="mt-1 text-sm font-bold text-primary">{item.remainingUses} uses left</Text> : null}
            </View>
            <View className="items-center justify-center pr-3">
              <Ionicons color={colors.ink} name="chevron-forward" size={20} />
            </View>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

export function MembershipsScreen({
  entitlements,
  onBack,
  onOpen,
}: {
  entitlements: RoomEntitlement[];
  onBack: () => void;
  onOpen: (item: RoomEntitlement) => void;
}) {
  const access = entitlements.filter((item) => item.type === 'membership' || item.type === 'pass');
  const active = access.filter((item) => canPresentEntitlement(item));
  const inactive = access.filter((item) => !canPresentEntitlement(item));
  return (
    <AppShell eyebrow="Your access · your perks" testID="memberships-screen" title="Memberships & passes">
      <MembershipBack label="Back to Me" onBack={onBack} testID="memberships-back" />
      {active.length ? (
        <>
          <MembershipSection>Ready to use</MembershipSection>
          <MembershipRows items={active} onOpen={onOpen} />
        </>
      ) : (
        <View className="mt-9 border-y border-dashed border-edge bg-surface p-7">
          <Text accessibilityRole="header" className="text-center text-2xl font-black text-ink">No active access</Text>
          <Text className="mt-2 text-center text-base leading-6 text-muted">Venue-issued memberships and passes appear here.</Text>
        </View>
      )}
      {inactive.length ? (
        <>
          <MembershipSection>History & action needed</MembershipSection>
          <MembershipRows items={inactive} onOpen={onOpen} />
        </>
      ) : null}
    </AppShell>
  );
}

export function MembershipDetailScreen({
  entitlement,
  membership,
  onBack,
  roomName,
}: {
  entitlement?: RoomEntitlement;
  membership?: RoomMembershipOffer;
  onBack: () => void;
  roomName: string;
}) {
  const title = entitlement?.name || membership?.name || 'Room membership';
  const venue = entitlement?.roomName || roomName;
  const presentable = entitlement ? canPresentEntitlement(entitlement) : false;
  const expiry = entitlement?.expiresAt
    ? new Date(entitlement.expiresAt * 1000).toLocaleDateString()
    : 'No expiry published';

  return (
    <AppShell eyebrow={venue} testID="membership-detail-screen" title="Membership detail">
      <MembershipBack onBack={onBack} testID="membership-detail-back" />
      <View className="relative mt-4 min-h-[220px] overflow-hidden rounded-2xl bg-photo-night">
        <VenueImage className="absolute inset-0" index={3} label={`${venue} membership atmosphere`} />
        <View className="absolute inset-0 bg-photo-night/72" />
        <View className="grow justify-between p-5">
          <NightBadge tone={presentable ? 'verified' : entitlement ? 'neutral' : 'attention'}>
            {entitlement ? entitlementStateLabel(entitlement.state) : membership ? 'Offer available' : 'Unavailable'}
          </NightBadge>
          <View>
            <Text accessibilityRole="header" className="text-[30px] font-black uppercase leading-8 text-white">{title}</Text>
            <Text className="mt-2 text-base font-semibold text-white">{venue}</Text>
          </View>
        </View>
      </View>

      {entitlement ? (
        <>
          <View className="mt-5 border-y border-edge py-4">
            <Text className="text-base leading-6 text-ink">{entitlement.description || 'Issued to this Crays identity.'}</Text>
            <Text className="mt-3 text-sm font-semibold text-muted">Valid: {expiry}</Text>
            {entitlement.remainingUses !== undefined ? (
              <Text className="mt-1 text-sm font-bold text-primary">{entitlement.remainingUses} of {entitlement.maxUses} uses remaining</Text>
            ) : null}
          </View>

          <MembershipSection>Present {entitlement.type === 'pass' ? 'pass' : 'membership'}</MembershipSection>
          <EntitlementPresentation item={entitlement} />
          {!presentable ? <Text className="mt-3 text-sm leading-5 text-muted">No live code is shown while this access is {entitlementStateLabel(entitlement.state).toLowerCase()}.</Text> : null}

          <MembershipSection>Your perks</MembershipSection>
          <View className="flex-row items-start gap-3 rounded-2xl bg-surface-soft p-4">
            <Ionicons color={colors.ink} name="sparkles-outline" size={22} />
            <Text className="min-w-0 flex-1 text-base leading-6 text-ink">{entitlement.description || 'No benefit description was published.'}</Text>
          </View>

          <MembershipSection>Activity</MembershipSection>
          {entitlement.activity.length ? (
            <View className="border-y border-edge">
              {entitlement.activity.map((activity) => (
                <View className="min-h-14 flex-row items-center border-b border-edge py-3 last:border-b-0" key={activity.id}>
                  <Ionicons color={colors.ink} name={activity.status === 'fulfilled' ? 'checkmark-circle-outline' : 'time-outline'} size={22} />
                  <View className="ml-3 min-w-0 flex-1">
                    <Text className="font-bold text-ink">{activity.status === 'fulfilled' ? 'Used' : activity.status}</Text>
                    <Text className="mt-1 text-sm text-muted">{new Date(activity.createdAt * 1000).toLocaleString()}</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text className="text-base leading-6 text-muted">No benefit uses recorded yet. The app never keeps a competing local counter.</Text>
          )}
        </>
      ) : membership ? (
        <View className="mt-5 border-y border-edge py-5">
          <Text className="text-lg leading-7 text-ink">{membership.description}</Text>
          <Text className="mt-3 text-xl font-black text-ink">{formatCurrency(membership.price, membership.currency)} / {membership.billing}</Text>
          <Text className="mt-3 text-sm leading-5 text-muted">Purchase is unavailable until a payment method and checkout contract are configured.</Text>
        </View>
      ) : (
        <Text className="mt-6 text-base leading-6 text-muted">No owned membership or published offer matches this link.</Text>
      )}

      <MembershipSection>Management</MembershipSection>
      <View className="flex-row items-start gap-3 rounded-2xl border border-edge bg-surface p-4">
        <Ionicons color={colors.ink} name="document-text-outline" size={22} />
        <View className="min-w-0 flex-1">
          <Text className="font-bold text-ink">Terms and venue contact</Text>
          <Text className="mt-1 text-sm leading-5 text-muted">Renewal and payment actions are unavailable while payment rails are deferred. Nothing will charge automatically.</Text>
        </View>
      </View>
    </AppShell>
  );
}

function eventWindow(event: RoomCalendarEvent) {
  const start = new Date(event.start * 1000);
  const date = start.toLocaleDateString([], { day: 'numeric', month: 'short', weekday: 'short' });
  const startTime = start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const endTime = event.end
    ? new Date(event.end * 1000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : null;
  return `${date} · ${startTime}${endTime ? `–${endTime}` : ''}`;
}

function EventBack({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityLabel="Back"
      accessibilityRole="button"
      className="min-h-12 flex-row items-center gap-2 self-start pr-4"
      onPress={onPress}
      testID="event-back"
    >
      <Ionicons color={colors.ink} name="arrow-back" size={22} />
      <Text className="font-bold text-primary">Back</Text>
    </Pressable>
  );
}

export function EventScreen({
  error,
  event,
  going,
  loading,
  onBack,
  onRsvp,
  roomName,
}: {
  error?: string | null;
  event?: RoomCalendarEvent;
  going: boolean;
  loading: boolean;
  onBack: () => void;
  onRsvp: () => void;
  roomName: string;
}) {
  if (!event) {
    return (
      <AppShell testID="event-screen" title="Event">
        <EventBack onPress={onBack} />
        <View className="mt-7 border-y border-dashed border-edge bg-surface px-5 py-10">
          <Ionicons color={colors.primary} name="calendar-clear-outline" size={36} />
          <Text accessibilityRole="header" className="mt-5 text-2xl font-black text-ink">Event unavailable</Text>
          <Text className="mt-2 text-base leading-6 text-muted">This event is no longer available from the room relay.</Text>
        </View>
      </AppShell>
    );
  }

  const paid = event.price > 0;
  return (
    <AppShell testID="event-screen" title="Event">
      <EventBack onPress={onBack} />

      <View className="relative -mx-5 mt-2 min-h-[315px] overflow-hidden bg-photo-night">
        <VenueImage className="absolute inset-0" index={2} label={`${event.title} at ${roomName}`} />
        <View className="absolute inset-0 bg-photo-night/65" />
        <View className="grow justify-end px-6 py-7">
          <NightBadge tone="primary">Event</NightBadge>
          <Text accessibilityRole="header" className="mt-3 max-w-[430px] text-[38px] font-black uppercase leading-[39px] tracking-[-0.7px] text-white">
            {event.title}
          </Text>
          <View className="mt-4 flex-row flex-wrap items-center gap-x-3 gap-y-2">
            <Text className="text-base font-black text-white">{roomName}</Text>
            <View className="h-2.5 w-2.5 rounded-full bg-verified" />
            <Text className="text-base font-semibold text-white">{event.location}</Text>
          </View>
        </View>
      </View>

      <View className="border-b border-edge bg-surface px-4 py-4">
        <View className="flex-row items-center gap-3">
          <Ionicons color={colors.ink} name="calendar-outline" size={21} />
          <Text className="flex-1 font-bold text-ink">{eventWindow(event)}</Text>
        </View>
        <View className="mt-3 flex-row items-center gap-3">
          <Ionicons color={colors.ink} name={paid ? 'ticket-outline' : 'checkmark-circle-outline'} size={21} />
          <Text className="flex-1 font-bold text-ink">{paid ? `${formatCurrency(event.price, event.currency)} · ticket purchase deferred` : 'Free RSVP'}</Text>
        </View>
      </View>

      <Text className="mt-6 text-lg leading-7 text-ink">{event.summary}</Text>
      <View className="mt-5 border-y border-edge py-4">
        <Text className="text-xs font-black uppercase tracking-[0.7px] text-muted">Access</Text>
        <Text className="mt-2 text-base font-semibold text-ink">
          {event.capacity ? `${event.capacity} person capacity` : 'Capacity set by venue'}
        </Text>
      </View>

      <View className="mt-6">
        <ErrorBanner message={error} />
        <PrimaryButton
          disabled={paid || going}
          label={going ? 'Going · RSVP sent' : paid ? 'Ticket payment not configured' : 'RSVP going'}
          loading={loading}
          loadingLabel="Sending RSVP…"
          onPress={onRsvp}
          testID="event-rsvp"
        />
        <Text className="mt-3 text-center text-sm leading-5 text-muted">
          RSVP is signed by your identity and stored by this room. It does not publish presence.
        </Text>
      </View>

      {going ? (
        <View className="mt-6 items-center rounded-2xl border border-edge bg-surface p-6">
          <NightBadge tone="verified">RSVP saved</NightBadge>
          <View className="mt-4 h-16 w-16 items-center justify-center rounded-full bg-surface-soft">
            <Ionicons color={colors.ink} name="calendar-number-outline" size={31} />
          </View>
          <Text className="mt-4 text-center font-bold text-ink">Preview only · ticket credential not configured</Text>
          <Text className="mt-2 text-center text-sm leading-5 text-muted">This RSVP is not a scannable door credential.</Text>
        </View>
      ) : null}
    </AppShell>
  );
}

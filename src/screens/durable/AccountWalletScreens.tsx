// THESIS: Me identifies the local owner before opening their urgency-ranked archive.
// OWNED WORLD: Durable rows resemble a well-kept coat-check ledger, not a finance dashboard.
// STORY: Recognize the current profile → resolve the active room/item → find durable access.
// FIRST VIEWPORT: A compact identity pass keeps the current room visible below it.
// FORM: Night Playlist profile pass; account, archive, and relay failures remain independent.
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { abbreviateNpub, type LocalAccountRead } from '@/account/account';
import { AppShell, SectionTitle } from '@/components/app/AppShell';
import { DrinkImage, NightBadge, NightCard, PortraitImage, VenueImage } from '@/components/night/NightPrimitives';
import { ErrorBanner, PrimaryButton } from '@/components/onboarding/OnboardingPrimitives';
import type { RoomEntitlement, RoomOrder } from '@/rooms/types';
import { colors } from '@/theme/colors';
import { orderSummaryLabel } from '@/screens/durable/NightAndOrderScreens';

const activeOrderPriority: Record<RoomOrder['status'], number> = {
  ready: 0,
  processing: 1,
  accepted: 2,
  pending: 3,
  fulfilled: 4,
  cancelled: 5,
};

export function selectActiveOrder(orders: RoomOrder[]) {
  return [...orders]
    .filter((order) => !['fulfilled', 'cancelled'].includes(order.status))
    .sort((left, right) => activeOrderPriority[left.status] - activeOrderPriority[right.status]
      || right.updatedAt - left.updatedAt
      || left.id.localeCompare(right.id))[0];
}

export function hasUsableDurableAccess(entitlements: RoomEntitlement[]) {
  return entitlements.some((item) => (item.type === 'membership' || item.type === 'pass')
    && (item.state === 'active' || item.state === 'available'));
}

export function countUsableEventAccess(entitlements: RoomEntitlement[]) {
  return entitlements.filter((item) => item.type === 'event_access'
    && (item.state === 'active' || item.state === 'available')).length;
}

type MeRowProps = {
  action: () => void;
  detail: string;
  icon: keyof typeof Ionicons.glyphMap;
  id: string;
  title: string;
};

export type MeAccountState =
  | LocalAccountRead
  | { status: 'error'; message: string }
  | { status: 'loading' };

function MeIdentityCard({
  expanded,
  onRetry,
  onToggle,
  state,
}: {
  expanded: boolean;
  onRetry?: () => void;
  onToggle: () => void;
  state: MeAccountState;
}) {
  if (state.status === 'loading') {
    return (
      <View
        accessibilityLabel="Loading your protected profile"
        accessible
        className="mt-5 min-h-28 flex-row items-center rounded-2xl border border-edge bg-surface px-4"
        testID="me-account-loading"
      >
        <ActivityIndicator color={colors.primary} />
        <Text className="ml-3 flex-1 font-semibold text-muted">Loading your profile…</Text>
      </View>
    );
  }

  if (state.status === 'error') {
    const content = (
      <>
        <View className="h-12 w-12 items-center justify-center rounded-xl bg-error/10">
          <Ionicons color={colors.error} name="key-outline" size={23} />
        </View>
        <View className="ml-3 min-w-0 flex-1">
          <Text className="text-lg font-black text-ink">Profile unavailable</Text>
          <Text className="mt-1 text-sm leading-5 text-muted">{state.message}</Text>
          {onRetry ? <Text className="mt-2 font-extrabold text-primary">Try again</Text> : null}
        </View>
        {onRetry ? <Ionicons color={colors.primary} name="refresh" size={21} /> : null}
      </>
    );
    if (!onRetry) return <View accessibilityRole="alert" className="mt-5 min-h-28 flex-row items-center rounded-2xl border border-edge bg-surface p-4">{content}</View>;
    return (
      <Pressable
        accessibilityLabel={`Profile unavailable. ${state.message}. Try again`}
        accessibilityRole="button"
        className="mt-5 min-h-28 flex-row items-center rounded-2xl border border-edge bg-surface p-4 active:bg-surface-soft"
        onPress={onRetry}
        testID="me-account-retry"
      >
        {content}
      </Pressable>
    );
  }

  if (state.status !== 'ready') {
    const missing = state.status === 'missing';
    return (
      <View
        accessibilityRole="alert"
        className="mt-5 min-h-28 flex-row items-center rounded-2xl border border-edge bg-surface p-4"
        testID={`me-account-${state.status}`}
      >
        <View className="h-12 w-12 items-center justify-center rounded-xl bg-surface-soft">
          <Ionicons color={colors.ink} name={missing ? 'person-outline' : 'shield-outline'} size={23} />
        </View>
        <View className="ml-3 min-w-0 flex-1">
          <Text className="text-lg font-black text-ink">
            {missing ? 'No Crays identity on this device' : state.status === 'incomplete' ? 'Finish your profile' : 'Profile could not be verified'}
          </Text>
          <Text className="mt-1 text-sm leading-5 text-muted">
            {missing
              ? 'Create an account before entering a room.'
              : state.status === 'incomplete'
                ? 'Choose the name rooms will see when you enter visibly.'
                : 'Your protected account data is incomplete or inconsistent.'}
          </Text>
        </View>
      </View>
    );
  }

  const { account } = state;
  const custodyLabel = !account.setupComplete
    ? 'Account setup not finished'
    : account.custody === 'remote-signer'
      ? 'Connected signer'
      : 'Protected on this device';
  return (
    <View className="mt-5 overflow-hidden rounded-2xl border border-edge bg-surface" testID="me-account-card">
      <Pressable
        accessibilityLabel={`${account.displayName}. Your Crays identity. ${custodyLabel}. ${expanded ? 'Hide' : 'View'} profile`}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        className="min-h-28 flex-row items-center p-4 active:bg-surface-soft"
        onPress={onToggle}
        testID="me-account-profile"
      >
        <PortraitImage
          className="h-20 w-20 shrink-0 rounded-[20px]"
          identity={account.pubkey}
          picture={account.picture}
          testID="me-account-portrait"
        />
        <View className="ml-4 min-w-0 flex-1">
          <Text className="text-[22px] font-black leading-7 text-ink">{account.displayName}</Text>
          <Text className="mt-0.5 text-sm font-semibold text-ink">Your Crays identity</Text>
          <Text className="mt-1 text-sm text-muted">{abbreviateNpub(account.npub)}</Text>
          <View className="mt-2 flex-row items-center gap-1.5">
            <Ionicons color={colors.inkMuted} name="key-outline" size={16} />
            <Text className="min-w-0 flex-1 text-sm font-semibold text-muted">{custodyLabel}</Text>
          </View>
        </View>
        <View className="ml-2 min-h-12 items-center justify-center">
          <Text className="text-sm font-extrabold text-primary">{expanded ? 'Hide' : 'View'}</Text>
          <Ionicons color={colors.primary} name={expanded ? 'chevron-up' : 'chevron-down'} size={19} />
        </View>
      </Pressable>
      {expanded ? (
        <View className="border-t border-edge bg-surface-soft px-4 py-4" testID="me-account-details">
          <Text className="text-xs font-black uppercase tracking-[0.8px] text-ink">Public identity</Text>
          <Text className="mt-2 text-sm leading-5 text-ink" selectable>{account.npub}</Text>
          <Text className="mt-3 text-sm leading-5 text-muted">
            This is the name rooms see when you choose to be visible. Your secret key is never shown here.
          </Text>
          <Text className="mt-2 text-sm font-semibold text-ink">
            {account.custody === 'remote-signer' ? 'Signing stays with your connected signer' : 'Saved on this device'}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function MeRow({ action, detail, icon, id, title }: MeRowProps) {
  return (
    <Pressable
      accessibilityLabel={`${title}. ${detail}`}
      accessibilityRole="button"
      className="min-h-16 flex-row items-center border-b border-edge px-3 py-3"
      onPress={action}
      testID={id}
    >
      <View className="h-10 w-10 items-center justify-center rounded-xl bg-surface-soft">
        <Ionicons color={colors.ink} name={icon} size={22} />
      </View>
      <View className="ml-3 min-w-0 flex-1">
        <Text className="text-base font-extrabold text-ink">{title}</Text>
        <Text className="mt-0.5 text-sm text-muted">{detail}</Text>
      </View>
      <Ionicons color={colors.primary} name="chevron-forward" size={20} />
    </Pressable>
  );
}

export function MeScreen({
  accountState = { status: 'missing' },
  activeOrder,
  error,
  hasMembership,
  loading = false,
  onMemberships,
  onMessages,
  onOrders,
  onProfile,
  onRetryAccount,
  onRoom,
  onTickets,
  onWallet,
  roomName,
  offline = false,
  refreshing = false,
  ticketCount,
}: {
  accountState?: MeAccountState;
  activeOrder?: RoomOrder;
  error?: string | null;
  hasMembership: boolean;
  loading?: boolean;
  onMemberships: () => void;
  onMessages?: () => void;
  onOrders: () => void;
  onProfile: () => void;
  onRetryAccount?: () => void;
  onRoom: () => void;
  onTickets: () => void;
  onWallet: () => void;
  roomName?: string;
  offline?: boolean;
  refreshing?: boolean;
  ticketCount: number;
}) {
  const [profileExpanded, setProfileExpanded] = useState(false);
  const orderDetail = loading
    ? 'Loading saved orders…'
    : refreshing && !activeOrder
      ? 'Checking the room…'
      : activeOrder
        ? 'Track active order and history'
        : offline
          ? 'Saved history · room unavailable'
          : 'Order history and receipts';
  const membershipDetail = loading
    ? 'Loading saved access…'
    : refreshing && !hasMembership
      ? 'Checking the room…'
      : hasMembership
        ? 'Membership or pass ready'
        : offline
          ? 'No saved access · room unavailable'
          : 'No active access';
  const ticketDetail = loading
    ? 'Loading saved tickets…'
    : ticketCount
      ? `${ticketCount} saved ${ticketCount === 1 ? 'ticket' : 'tickets'}`
      : 'No saved tickets';

  return (
    <AppShell
      headerAction={(
        <View
          accessibilityElementsHidden
          className="h-12 w-12 items-center justify-center rounded-full bg-surface-soft"
          importantForAccessibility="no-hide-descendants"
        >
          <Ionicons color={colors.ink} name="notifications-outline" size={22} />
        </View>
      )}
      testID="me-screen"
      underTabBar
    >
      <Text accessibilityRole="header" className="mt-2 text-[40px] font-black uppercase tracking-[-1px] text-ink">
        Me
      </Text>
      <Text className="text-xs font-black uppercase tracking-[1.4px] text-ink">Keeping the night</Text>

      <MeIdentityCard
        expanded={profileExpanded}
        onRetry={onRetryAccount}
        onToggle={() => setProfileExpanded((value) => !value)}
        state={accountState}
      />

      {error ? <View className="mt-5"><ErrorBanner message={error} /></View> : null}
      {loading ? (
        <View accessible accessibilityLabel="Loading saved night" className="mt-5 flex-row items-center rounded-2xl bg-surface-soft p-4" testID="me-durable-loading">
          <ActivityIndicator color={colors.primary} />
          <Text className="ml-3 flex-1 font-semibold text-muted">Loading saved night…</Text>
        </View>
      ) : refreshing ? (
        <View accessible className="mt-5 flex-row items-center rounded-2xl bg-surface-soft p-4" testID="me-durable-refreshing">
          <ActivityIndicator color={colors.primary} />
          <Text className="ml-3 flex-1 font-semibold text-muted">Refreshing room status…</Text>
        </View>
      ) : offline ? (
        <View accessible accessibilityRole="alert" className="mt-5 flex-row items-start rounded-2xl bg-attention/25 p-4" testID="me-durable-offline">
          <Ionicons color={colors.ink} name="cloud-offline-outline" size={21} />
          <Text className="ml-3 flex-1 text-sm font-semibold leading-5 text-ink">Room updates are unavailable. Saved items remain visible.</Text>
        </View>
      ) : null}

      <Text className="mb-2 mt-5 text-[11px] font-black uppercase tracking-[0.8px] text-ink">Current room</Text>
      {roomName ? (
        <NightCard
          accessibilityLabel={`${roomName}. You’re inside. Return to room`}
          className="p-0 active:bg-surface-soft"
          onPress={onRoom}
          testID="me-current-room"
        >
          <View className="flex-row overflow-hidden rounded-2xl">
            <VenueImage className="h-24 w-32" index={0} label={`${roomName} interior`} testID="me-room-image" />
            <View className="min-w-0 flex-1 justify-center px-4 py-3">
              <Text className="text-lg font-black text-ink">{roomName}</Text>
              <View className="mt-2 flex-row items-center gap-2">
                <View className="h-2 w-2 rounded-full bg-success" />
                <Text className="flex-1 text-sm font-semibold text-muted">You’re inside</Text>
                <Ionicons color={colors.primary} name="chevron-forward" size={20} />
              </View>
            </View>
          </View>
        </NightCard>
      ) : (
        <NightCard>
          <Text className="font-extrabold text-ink">No room selected</Text>
          <Text className="mt-1 text-sm leading-5 text-muted">Join a nearby room to see live context here.</Text>
        </NightCard>
      )}

      {activeOrder ? (
        <View>
          <Text className="mb-2 mt-5 text-[11px] font-black uppercase tracking-[0.8px] text-ink">Active order</Text>
          <Pressable
            accessibilityLabel={`${activeOrder.product.name}. ${orderSummaryLabel(activeOrder)}. Open orders`}
            accessibilityRole="button"
            className="rounded-2xl border border-edge bg-surface"
            onPress={onOrders}
            testID="me-active-order"
          >
            <View className="flex-row items-center p-3">
              <DrinkImage className="h-16 w-16 rounded-xl" index={activeOrder.product.position % 4} label={activeOrder.product.name} />
              <View className="ml-3 min-w-0 flex-1">
                <Text className="text-base font-black text-ink">{activeOrder.product.name}</Text>
                <Text className="mt-1 text-sm font-semibold text-primary">{orderSummaryLabel(activeOrder)}</Text>
                <View accessibilityElementsHidden className="mt-3 flex-row items-center" importantForAccessibility="no-hide-descendants">
                  <View className="h-1 flex-1 rounded-full bg-primary" />
                  <View className="h-2.5 w-2.5 rounded-full border-2 border-primary bg-surface" />
                  <View className="h-1 flex-1 rounded-full bg-edge" />
                </View>
              </View>
              <Ionicons color={colors.primary} name="chevron-forward" size={20} />
            </View>
          </Pressable>
        </View>
      ) : null}

      <View className="mt-5 overflow-hidden rounded-2xl border border-edge bg-surface">
        <MeRow action={onOrders} detail={orderDetail} icon="receipt-outline" id="me-orders" title="Orders" />
        <MeRow action={onMemberships} detail={membershipDetail} icon="ribbon-outline" id="me-memberships" title="Memberships & passes" />
        <MeRow action={onTickets} detail={ticketDetail} icon="ticket-outline" id="me-tickets" title="Tickets" />
        <MeRow action={onWallet} detail="Setup required · balance unavailable" icon="wallet-outline" id="me-wallet" title="Wallet" />
        {onMessages ? <MeRow action={onMessages} detail="Conversations stay after you leave" icon="chatbox-ellipses-outline" id="me-messages" title="Messages" /> : null}
      </View>

      <View className="mt-5">
        <Pressable
          accessibilityLabel="Open profile, privacy, and settings"
          accessibilityRole="button"
          className="min-h-14 flex-row items-center rounded-2xl border border-edge bg-surface px-4"
          onPress={onProfile}
          testID="me-profile"
        >
          <Ionicons color={colors.ink} name="settings-outline" size={22} />
          <View className="ml-3 min-w-0 flex-1">
            <Text className="font-extrabold text-ink">Settings & privacy</Text>
            <View className="mt-2 flex-row items-center justify-between">
              <NightBadge>Account</NightBadge>
              <Ionicons color={colors.primary} name="chevron-forward" size={20} />
            </View>
          </View>
        </Pressable>
      </View>
    </AppShell>
  );
}

export function WalletScreen({ onAddFunds, onBack }: { onAddFunds: () => void; onBack: () => void }) {
  const disabledAction = (icon: keyof typeof Ionicons.glyphMap, label: string, detail: string, testID: string) => (
    <Pressable
      accessibilityLabel={`${label}. ${detail}`}
      accessibilityRole="button"
      accessibilityState={{ disabled: true }}
      className="min-h-24 flex-1 items-center justify-center rounded-2xl border border-edge bg-surface px-2 py-3 opacity-60"
      disabled
      testID={testID}
    >
      <View className="h-10 w-10 items-center justify-center rounded-full bg-surface-soft">
        <Ionicons color={colors.inkMuted} name={icon} size={22} />
      </View>
      <Text className="mt-2 text-center text-sm font-extrabold text-muted">{label}</Text>
      <Text className="mt-1 text-center text-xs font-semibold text-muted">{detail}</Text>
    </Pressable>
  );

  return (
    <AppShell chrome="child" testID="wallet-screen">
      <Pressable
        accessibilityLabel="Back to Me"
        accessibilityRole="button"
        className="-ml-3 mt-1 min-h-12 flex-row items-center gap-2 self-start px-3"
        onPress={onBack}
        testID="wallet-back"
      >
        <Ionicons color={colors.primary} name="arrow-back" size={20} />
        <Text className="font-bold text-primary">Back to Me</Text>
      </Pressable>
      <Text accessibilityRole="header" className="mt-2 text-[36px] font-black uppercase tracking-[-0.8px] text-ink">Wallet</Text>
      <Text className="text-sm font-semibold text-ink">Simple. Private. Yours.</Text>

      <NightCard className="mt-6">
        <Text className="text-[11px] font-black uppercase tracking-[0.8px] text-ink">Wallet status</Text>
        <Text className="mt-4 text-[40px] font-black tracking-[-1px] text-ink">Unavailable</Text>
        <Text className="mt-2 leading-6 text-muted">No trusted Cashu mint or encrypted NIP-60 wallet has been configured for this build.</Text>
        <View className="mt-5">
          <PrimaryButton label="Review add funds setup" onPress={onAddFunds} testID="wallet-add-funds" />
        </View>
      </NightCard>

      <View className="mt-5 flex-row gap-3">
        <Pressable
          accessibilityLabel="Add funds. Opens setup requirements"
          accessibilityRole="button"
          className="min-h-24 flex-1 items-center justify-center rounded-2xl border border-edge bg-surface px-2 py-3"
          onPress={onAddFunds}
          testID="wallet-add-funds-tile"
        >
          <View className="h-10 w-10 items-center justify-center rounded-full bg-primary">
            <Ionicons color={colors.paper} name="add" size={22} />
          </View>
          <Text className="mt-2 text-center text-sm font-extrabold text-ink">Add funds</Text>
        </Pressable>
        {disabledAction('arrow-down', 'Receive', 'After wallet setup', 'wallet-receive-disabled')}
        {disabledAction('list', 'Activity', 'After wallet setup', 'wallet-activity-disabled')}
      </View>

      <Text className="mb-2 mt-7 text-[11px] font-black uppercase tracking-[0.8px] text-ink">Recovery</Text>
      <NightCard>
        <View className="flex-row items-start">
          <View className="h-11 w-11 items-center justify-center rounded-xl bg-surface-soft">
            <Ionicons color={colors.ink} name="lock-closed-outline" size={22} />
          </View>
          <View className="ml-3 min-w-0 flex-1">
            <Text className="font-extrabold text-ink">Set up recovery</Text>
            <Text className="mt-1 text-sm leading-5 text-muted">Recovery remains unavailable until an encrypted wallet and proof-sync contract exist.</Text>
          </View>
          <NightBadge>Not configured</NightBadge>
        </View>
      </NightCard>

      <View className="mt-5 rounded-2xl bg-surface-soft p-4">
        <Text className="text-center text-sm font-semibold text-muted">Nostr sync not configured</Text>
        <Text className="mt-1 text-center text-xs leading-5 text-muted">No balance, proofs, or activity are fabricated.</Text>
      </View>
    </AppShell>
  );
}

export function AddFundsScreen({ onBack }: { onBack: () => void }) {
  const steps = [
    'Enter an amount in EUR',
    'Review the live Lightning quote and expiry',
    'Credit only after mint proofs verify and sync safely',
  ];
  return (
    <AppShell chrome="child" showTempoRail testID="add-funds-screen">
      <Pressable
        accessibilityLabel="Back to Wallet"
        accessibilityRole="button"
        className="-ml-3 mt-1 min-h-12 flex-row items-center gap-2 self-start px-3"
        onPress={onBack}
        testID="add-funds-back"
      >
        <Ionicons color={colors.primary} name="arrow-back" size={20} />
        <Text className="font-bold text-primary">Back to Wallet</Text>
      </Pressable>
      <Text accessibilityRole="header" className="mt-2 text-[36px] font-black uppercase tracking-[-0.8px] text-ink">Add funds</Text>
      <Text className="text-sm font-semibold text-ink">A verified path into your wallet.</Text>

      <NightCard className="mt-6">
        <View className="h-16 w-16 items-center justify-center rounded-full bg-attention">
          <Ionicons color={colors.ink} name="flash-outline" size={32} />
        </View>
        <Text className="mt-5 text-2xl font-black leading-8 text-ink">Lightning funding is not configured</Text>
        <Text className="mt-3 leading-6 text-muted">A funding request needs a selected Cashu mint, a real Lightning quote, an expiry, and recoverable proof state. This build creates none of those.</Text>
      </NightCard>

      <SectionTitle>When enabled</SectionTitle>
      <View className="overflow-hidden rounded-2xl border border-edge bg-surface">
        {steps.map((text, index) => (
          <View className={`min-h-16 flex-row items-center px-4 py-3 ${index ? 'border-t border-edge' : ''}`} key={text}>
            <View className="h-9 w-9 items-center justify-center rounded-full bg-primary">
              <Text className="font-black text-surface">{index + 1}</Text>
            </View>
            <Text className="ml-3 flex-1 leading-6 text-ink">{text}</Text>
          </View>
        ))}
      </View>

      <View className="mt-5 flex-row items-start rounded-2xl bg-surface-soft p-4">
        <Ionicons color={colors.ink} name="shield-checkmark-outline" size={22} />
        <Text className="ml-3 flex-1 text-sm leading-5 text-muted">No invoice, QR code, token, or spendable balance is created on this screen.</Text>
      </View>
      <View className="mt-6">
        <PrimaryButton disabled label="Mint configuration required" onPress={() => {}} testID="add-funds-disabled" tone="commitment" />
      </View>
    </AppShell>
  );
}

// THESIS: Safety settings are operational controls, not a decorative account checklist.
// OWNED WORLD: Blocks read like a private door list; unavailable integrations stay plainly labelled.
// STORY: Confirm custody → inspect/unblock people → understand request and notification boundaries.
// FIRST VIEWPORT: Identity custody and the first privacy control remain immediately readable.
// FORM: Empty block list, mixed scopes, storage error, and deferred provider/push states are explicit.
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { AppShell } from '@/components/app/AppShell';
import { NightBadge } from '@/components/night/NightPrimitives';
import { ErrorBanner } from '@/components/onboarding/OnboardingPrimitives';
import type { BlockRecord } from '@/safety/Safety';
import { colors } from '@/theme/colors';

function SettingsHeading({ children }: { children: string }) {
  return <Text accessibilityRole="header" className="mb-2 mt-6 text-[11px] font-black uppercase tracking-[0.8px] text-ink">{children}</Text>;
}

function SettingsInfoRow({
  badge,
  detail,
  icon,
  title,
}: {
  badge?: string;
  detail: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
}) {
  return (
    <View accessibilityLabel={`${title}. ${detail}${badge ? `. ${badge}` : ''}`} accessible className="min-h-16 flex-row items-center border-b border-edge px-4 py-3 last:border-b-0">
      <View className="h-10 w-10 items-center justify-center rounded-xl bg-surface-soft">
        <Ionicons color={colors.ink} name={icon} size={21} />
      </View>
      <View className="ml-3 min-w-0 flex-1">
        <Text className="font-extrabold text-ink">{title}</Text>
        <Text className="mt-0.5 text-sm leading-5 text-muted">{detail}</Text>
        {badge ? <View className="mt-2 self-start"><NightBadge>{badge}</NightBadge></View> : null}
      </View>
    </View>
  );
}

export function SettingsScreen({ blocks, blocksError, custody = 'unknown', error, loading = false, onBack, onUnblock, unblockingKey }: {
  blocks: BlockRecord[];
  blocksError?: string | null;
  custody?: 'device-only' | 'remote-signer' | 'unknown';
  error?: string | null;
  loading?: boolean;
  onBack: () => void;
  onUnblock: (record: BlockRecord) => void;
  unblockingKey?: string | null;
}) {
  return (
    <AppShell chrome="child" testID="settings-screen">
      <Pressable
        accessibilityLabel="Back to Me"
        accessibilityRole="button"
        className="-ml-3 mt-1 min-h-12 flex-row items-center gap-2 self-start px-3"
        onPress={onBack}
        testID="settings-back"
      >
        <Ionicons color={colors.primary} name="arrow-back" size={20} />
        <Text className="font-bold text-primary">Back to Me</Text>
      </Pressable>
      <Text accessibilityRole="header" className="mt-2 text-[36px] font-black uppercase tracking-[-0.8px] text-ink">Settings</Text>
      <Text className="text-sm font-semibold text-ink">Your space. Your rules.</Text>

      {error ? <View className="mt-5"><ErrorBanner message={error} /></View> : null}

      <SettingsHeading>Profile & access</SettingsHeading>
      <View className="overflow-hidden rounded-2xl border border-edge bg-surface">
        <SettingsInfoRow
          badge={custody === 'remote-signer' ? 'NIP-46' : custody === 'device-only' ? 'Local' : 'Unavailable'}
          detail={custody === 'remote-signer'
            ? 'Crays asks your connected signer to approve signed actions.'
            : custody === 'device-only'
              ? 'Your private key stays in device-only protected storage.'
              : 'Crays could not read the configured signing method.'}
          icon={custody === 'remote-signer' ? 'phone-portrait-outline' : 'key-outline'}
          title={custody === 'remote-signer' ? 'Connected signer' : 'Protected on this device'}
        />
        <SettingsInfoRow badge="Available at login" detail="Connect a Nostr signer or use advanced secret-key import before account setup." icon="link-outline" title="Existing Nostr identity" />
      </View>

      <SettingsHeading>Privacy & presence</SettingsHeading>
      <View className="overflow-hidden rounded-2xl border border-edge bg-surface">
        <SettingsInfoRow badge="Per room" detail="Visibility, intent, context, and leave time are chosen before joining." icon="people-outline" title="Presence defaults" />
        <SettingsInfoRow badge="One request" detail="Repeated requests and gifts stop until you accept." icon="chatbubble-ellipses-outline" title="Who can message you" />
      </View>

      <SettingsHeading>Blocked people</SettingsHeading>
      {loading ? (
        <View accessible accessibilityLabel="Loading protected block list" className="min-h-28 items-center justify-center rounded-2xl border border-edge bg-surface p-5" testID="blocks-loading">
          <ActivityIndicator color={colors.primary} />
          <Text className="mt-3 text-sm font-semibold text-muted">Loading protected block list…</Text>
        </View>
      ) : blocksError ? (
        <View testID="blocks-unavailable"><ErrorBanner message={blocksError} /></View>
      ) : !blocks.length ? (
        <View className="rounded-2xl border border-edge bg-surface p-5" testID="blocks-empty">
          <Text className="font-extrabold text-ink">Nobody is blocked</Text>
          <Text className="mt-2 leading-6 text-muted">Venue blocks hide someone in one room. Global blocks suppress their profile and direct messages everywhere on this device.</Text>
        </View>
      ) : (
        <View className="gap-3">
          {blocks.map((record) => (
            <View className="rounded-2xl border border-edge bg-surface p-4" key={`${record.pubkey}:${record.scope}:${record.roomId || '*'}`} testID={`blocked-${record.pubkey}`}>
              <View className="flex-row items-center">
                <View className="h-10 w-10 items-center justify-center rounded-xl bg-surface-soft">
                  <Ionicons color={colors.ink} name={record.scope === 'global' ? 'ban-outline' : 'eye-off-outline'} size={22} />
                </View>
                <View className="ml-3 min-w-0 flex-1">
                  <Text className="font-extrabold text-ink">{record.label || `Person ${record.pubkey.slice(0, 8)}`}</Text>
                  <Text className="mt-1 text-sm text-muted">{record.scope === 'global' ? 'Blocked everywhere' : `Hidden in room ${record.roomId}`}</Text>
                </View>
                <Pressable
                  accessibilityLabel={`Unblock ${record.label || 'person'} ${record.scope === 'global' ? 'everywhere' : 'in this room'}`}
                  accessibilityRole="button"
                  accessibilityState={{ busy: unblockingKey === `${record.pubkey}:${record.scope}:${record.roomId || '*'}`, disabled: Boolean(unblockingKey) }}
                  className="min-h-12 justify-center px-3"
                  disabled={Boolean(unblockingKey)}
                  onPress={() => onUnblock(record)}
                  testID={`unblock-${record.pubkey}-${record.scope}`}
                >
                  <Text className={`font-bold ${unblockingKey ? 'text-muted' : 'text-primary'}`}>
                    {unblockingKey === `${record.pubkey}:${record.scope}:${record.roomId || '*'}` ? 'Removing…' : 'Unblock'}
                  </Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      )}

      <SettingsHeading>Notifications</SettingsHeading>
      <View className="overflow-hidden rounded-2xl border border-edge bg-surface">
        <SettingsInfoRow badge="Off" detail="Crays asks only after a real reason to return. Push delivery is not configured." icon="notifications-off-outline" title="Permission not requested" />
      </View>

      <SettingsHeading>Recovery & room controls</SettingsHeading>
      <View className="overflow-hidden rounded-2xl border border-edge bg-surface">
        <SettingsInfoRow badge={custody === 'remote-signer' ? 'Signer-owned' : 'Not configured'} detail={custody === 'remote-signer' ? 'Reconnect through your signer app; Crays does not hold its secret key.' : 'Cross-device recovery for a device-held key is not configured.'} icon="shield-outline" title="Recovery options" />
        <SettingsInfoRow badge="At join" detail="Room notifications and presence choices remain owned by their room flows." icon="options-outline" title="Room preferences" />
      </View>
    </AppShell>
  );
}

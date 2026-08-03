// THESIS: Safety settings are operational controls, not a decorative account checklist.
// OWNED WORLD: Blocks read like a private door list; unavailable integrations stay plainly labelled.
// STORY: Confirm custody → inspect/unblock people → understand request and notification boundaries.
// FIRST VIEWPORT: Identity custody and the first privacy control remain immediately readable.
// FORM: Empty block list, mixed scopes, storage error, and deferred provider/push states are explicit.
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { AppShell, RaisedRow, SectionTitle } from '@/components/app/AppShell';
import type { BlockRecord } from '@/safety/Safety';
import { colors } from '@/theme/colors';

export function SettingsScreen({ blocks, error, onBack, onUnblock }: {
  blocks: BlockRecord[];
  error?: string | null;
  onBack: () => void;
  onUnblock: (record: BlockRecord) => void;
}) {
  return <AppShell eyebrow="Me" testID="settings-screen" title="Profile & settings">
    <Pressable accessibilityRole="button" className="mt-1 min-h-12 flex-row items-center gap-2 self-start" onPress={onBack} testID="settings-back"><Ionicons color={colors.accent} name="arrow-back" size={18} /><Text className="font-bold text-primary">Back to Me</Text></Pressable>
    <SectionTitle>Identity</SectionTitle>
    <RaisedRow><Ionicons color={colors.accent} name="key-outline" size={25} /><View className="ml-4 min-w-0 flex-1"><Text className="font-bold text-base-content">Protected on this device</Text><Text className="mt-1 text-sm leading-5 text-muted">Cross-device recovery and remote signing are not configured. This must be resolved before wallet funding.</Text></View></RaisedRow>
    <SectionTitle>Blocked people</SectionTitle>
    {!blocks.length ? <View className="rounded-2xl bg-base-200 p-5" testID="blocks-empty"><Text className="font-bold text-base-content">Nobody is blocked</Text><Text className="mt-2 leading-6 text-muted">Venue blocks hide someone in one room. Global blocks suppress their profiles and direct messages everywhere on this device.</Text></View> : <View className="gap-3">{blocks.map((record) => <View className="rounded-2xl bg-base-200 p-4" key={`${record.pubkey}:${record.scope}:${record.roomId || '*'}`} testID={`blocked-${record.pubkey}`}><View className="flex-row items-center"><Ionicons color={colors.accent} name={record.scope === 'global' ? 'ban-outline' : 'eye-off-outline'} size={23} /><View className="ml-3 min-w-0 flex-1"><Text numberOfLines={1} className="font-bold text-base-content">{record.label || `Person ${record.pubkey.slice(0, 8)}`}</Text><Text className="mt-1 text-sm text-muted">{record.scope === 'global' ? 'Blocked everywhere' : `Hidden in room ${record.roomId}`}</Text></View><Pressable accessibilityRole="button" className="min-h-12 justify-center px-3" onPress={() => onUnblock(record)} testID={`unblock-${record.pubkey}-${record.scope}`}><Text className="font-bold text-primary">Unblock</Text></Pressable></View></View>)}</View>}
    {error ? <Text accessibilityRole="alert" className="mt-3 leading-6 text-error">{error}</Text> : null}
    <SectionTitle>Contact controls</SectionTitle>
    <RaisedRow><Ionicons color={colors.accent} name="chatbubble-ellipses-outline" size={24} /><View className="ml-4 min-w-0 flex-1"><Text className="font-bold text-base-content">One request from a visible person</Text><Text className="mt-1 text-sm leading-5 text-muted">Repeated requests and gifts stop until you accept. Mutual-only and intent filters require a signed interoperable policy before they can be enforced.</Text></View></RaisedRow>
    <SectionTitle>Notifications</SectionTitle>
    <RaisedRow><Ionicons color={colors.accent} name="notifications-off-outline" size={24} /><View className="ml-4 min-w-0 flex-1"><Text className="font-bold text-base-content">Permission not requested</Text><Text className="mt-1 text-sm leading-5 text-muted">Crays asks only after a real message, order, ticket, pass, or membership creates a reason to return. Push delivery is not configured in this build.</Text></View></RaisedRow>
    <SectionTitle>Linked access</SectionTitle>
    <RaisedRow><Ionicons color={colors.placeholder} name="link-outline" size={24} /><View className="ml-4 min-w-0 flex-1"><Text className="font-bold text-base-content">Apple and Google</Text><Text className="mt-1 text-sm text-muted">Not configured</Text></View></RaisedRow>
  </AppShell>;
}

// THESIS: First contact is ordinary and consent-led: message first, gift second.
// OWNED WORLD: A single room profile card keeps context without exposing distance or popularity.
// STORY: Recognize the person → understand the contact boundary → choose one respectful action.
// FIRST VIEWPORT: Identity, live context, Message, and Send a drink fit together.
// FORM: Missing profile data never invents identity; actions remain explicit.
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { AppShell } from '@/components/app/AppShell';
import type { RoomPerson } from '@/rooms/types';
import { colors } from '@/theme/colors';

export function FirstContactScreen({ contactState, onBack, onBlock, onHideInRoom, onMessage, onReport, onSendDrink, person, reporting = false, roomName, safetyNotice }: {
  contactState?: 'requested' | 'accepted';
  onBack: () => void;
  onBlock: () => void;
  onHideInRoom: () => void;
  onMessage: () => void;
  onReport: () => void;
  onSendDrink: () => void;
  person: RoomPerson;
  reporting?: boolean;
  roomName: string;
  safetyNotice?: string | null;
}) {
  const waiting = contactState === 'requested';
  const canSendDrink = contactState === 'accepted';
  return (
    <AppShell
      eyebrow={roomName}
      headerAction={<Pressable accessibilityLabel="Back to people" className="h-12 w-12 items-center justify-center rounded-full bg-base-200" onPress={onBack}><Ionicons color={colors.accent} name="close" size={24} /></Pressable>}
      testID="first-contact-screen"
      title="Room profile"
    >
      <View className="mt-5 overflow-hidden rounded-[34px] border border-base-300 bg-base-200">
        <View className="h-56 items-center justify-center bg-primary/10">
          <View className="h-28 w-28 items-center justify-center rounded-full border-4 border-base-100 bg-primary/20">
            <Text className="text-5xl font-black text-primary">{person.name.slice(0, 1).toUpperCase()}</Text>
          </View>
          <View className="absolute bottom-5 right-5 flex-row items-center gap-2 rounded-full bg-base-100 px-3 py-2">
            <View className="h-2.5 w-2.5 rounded-full bg-success" />
            <Text className="text-xs font-black uppercase tracking-[1px] text-base-content">In the room</Text>
          </View>
        </View>
        <View className="p-6">
          <Text accessibilityRole="header" className="text-4xl font-black text-base-content">{person.name}</Text>
          <Text className="mt-2 text-sm font-black uppercase tracking-[2px] text-primary">{person.intent}</Text>
          {person.context ? <Text className="mt-4 text-lg leading-7 text-base-content">“{person.context}”</Text> : null}
        </View>
      </View>

      <Pressable accessibilityRole="button" accessibilityState={{ disabled: waiting }} className="mt-6 min-h-14 flex-row items-center justify-center gap-3 rounded-2xl bg-primary px-6 disabled:opacity-50" disabled={waiting} onPress={onMessage} testID="message-person">
        <Ionicons color="white" name="chatbubble-outline" size={22} />
        <Text className="text-base font-black text-white">{contactState === 'accepted' ? `Open conversation with ${person.name}` : waiting ? 'Waiting for a response' : `Message ${person.name}`}</Text>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityState={{ disabled: !canSendDrink }} className="mt-3 min-h-14 flex-row items-center justify-center gap-3 rounded-2xl border border-base-300 bg-base-200 px-6 disabled:opacity-50" disabled={!canSendDrink} onPress={onSendDrink} testID="send-drink-person">
        <Ionicons color={colors.accent} name="wine-outline" size={22} />
        <Text className="text-base font-black text-base-content">Send a drink</Text>
      </Pressable>
      <View className="mt-6 flex-row gap-3 rounded-2xl bg-base-200 p-4">
        <Ionicons color={colors.accent} name="shield-checkmark-outline" size={22} />
        <Text className="flex-1 text-sm leading-5 text-muted">One first message only. They can accept, reply, dismiss, block, or report. Drink gifting unlocks after acceptance. A drink is never anonymous.</Text>
      </View>
      <Text className="mb-3 mt-8 text-xl font-black text-base-content">Privacy & safety</Text>
      <View className="gap-2">
        <Pressable accessibilityRole="button" className="min-h-12 flex-row items-center rounded-2xl bg-base-200 px-4" onPress={onHideInRoom} testID="person-hide-room"><Ionicons color={colors.accent} name="eye-off-outline" size={22} /><Text className="ml-3 flex-1 font-bold text-base-content">Hide in this room</Text></Pressable>
        <Pressable accessibilityRole="button" className="min-h-12 flex-row items-center rounded-2xl bg-base-200 px-4" onPress={onBlock} testID="person-block-global"><Ionicons color={colors.accent} name="ban-outline" size={22} /><Text className="ml-3 flex-1 font-bold text-base-content">Block everywhere</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityState={{ disabled: reporting }} className="min-h-12 flex-row items-center rounded-2xl bg-base-200 px-4 disabled:opacity-50" disabled={reporting} onPress={onReport} testID="person-report"><Ionicons color={colors.accent} name="flag-outline" size={22} /><Text className="ml-3 flex-1 font-bold text-base-content">{reporting ? 'Reporting…' : 'Report to this venue'}</Text></Pressable>
      </View>
      {safetyNotice ? <Text accessibilityRole="alert" className="mt-3 leading-6 text-muted">{safetyNotice}</Text> : null}
    </AppShell>
  );
}

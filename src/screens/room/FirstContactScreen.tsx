// THESIS: First contact is a vivid room moment bounded by ordinary, explicit consent.
// OWNED WORLD: The selected portrait becomes a liner-note sheet with blue, coral, and lime signals.
// STORY: Recognize the person → understand the contact boundary → choose one respectful action.
// FIRST VIEWPORT: Identity, live context, Message, Send a drink, and Browse quietly stay together.
// FORM: Missing contact rights never become a visually enabled action; safety remains one menu away.
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { PortraitImage } from '@/components/night/NightPrimitives';
import type { RoomPerson } from '@/rooms/types';
import { colors } from '@/theme/colors';

type FirstContactScreenProps = {
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
};

function portraitIndex(name: string) {
  return [...name].reduce((sum, character) => sum + character.charCodeAt(0), 0) % 8;
}

function RoundButton({
  icon,
  label,
  onPress,
  testID,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  testID: string;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      className="h-12 w-12 items-center justify-center rounded-full border border-edge bg-surface/95 active:bg-surface-soft"
      onPress={onPress}
      testID={testID}
    >
      <Ionicons color={colors.ink} name={icon} size={24} />
    </Pressable>
  );
}

function Scribble() {
  return (
    <View accessibilityElementsHidden className="absolute right-5 top-28 h-24 w-20 rotate-12">
      <View className="absolute right-2 top-3 h-1 w-16 rotate-[-35deg] rounded-full bg-ink" />
      <View className="absolute right-0 top-10 h-1 w-20 rotate-[-18deg] rounded-full bg-ink" />
      <View className="absolute right-3 top-16 h-1 w-14 rotate-[-42deg] rounded-full bg-ink" />
    </View>
  );
}

export function FirstContactScreen({
  contactState,
  onBack,
  onBlock,
  onHideInRoom,
  onMessage,
  onReport,
  onSendDrink,
  person,
  reporting = false,
  roomName,
  safetyNotice,
}: FirstContactScreenProps) {
  const [showSafety, setShowSafety] = useState(false);
  const insets = useSafeAreaInsets();
  const waiting = contactState === 'requested';
  const canSendDrink = contactState === 'accepted';

  return (
    <SafeAreaView className="flex-1 bg-surface-soft" edges={['top', 'left', 'right']} testID="first-contact-screen">
      <ScrollView contentContainerClassName="grow" contentContainerStyle={{ paddingBottom: insets.bottom }} scrollIndicatorInsets={{ bottom: insets.bottom }} showsVerticalScrollIndicator={false}>
        <View className="relative h-[390px] overflow-hidden bg-surface-soft">
          <PortraitImage className="absolute inset-0" index={portraitIndex(person.name)} label={`Portrait of ${person.name}`} />
          <View className="absolute inset-x-0 top-0 flex-row items-center justify-between px-5 pt-3">
            <RoundButton icon="chevron-back" label="Back to people" onPress={onBack} testID="first-contact-back" />
            <RoundButton icon="ellipsis-horizontal" label="Privacy and safety" onPress={() => setShowSafety((value) => !value)} testID="first-contact-more" />
          </View>
          <Scribble />
          <View className="absolute bottom-5 left-5 max-w-28 -rotate-6 rounded-lg bg-verified px-3 py-3 shadow-sm">
            <Text className="text-center text-[11px] font-black uppercase leading-4 text-ink">In the room now</Text>
          </View>
        </View>

        <View className="-mt-5 grow rounded-t-[28px] bg-surface px-5 pb-7 pt-6">
          <View className="flex-row flex-wrap items-baseline gap-x-3">
            <Text accessibilityRole="header" className="text-[40px] font-black uppercase leading-[42px] tracking-[-1px] text-primary">{person.name}</Text>
            <Text className="text-lg font-black uppercase text-commitment">/ {person.intent}</Text>
          </View>
          {person.context ? <Text className="mt-3 text-lg leading-7 text-ink">{person.context}</Text> : null}
          <Text className="mt-1 text-xs font-semibold text-muted">Visible in {roomName}</Text>

          <View className="mt-5 rounded-2xl bg-surface-soft px-4 py-3">
            <Text className="text-sm leading-5 text-ink">
              One first message only. Drink gifting unlocks after acceptance. A drink is never anonymous.
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: waiting }}
            className="mt-5 min-h-14 flex-row items-center justify-center gap-3 rounded-2xl bg-primary px-6 disabled:opacity-45"
            disabled={waiting}
            onPress={onMessage}
            testID="message-person"
          >
            <Ionicons color={colors.surface} name="chatbubble" size={22} />
            <Text className="text-base font-black uppercase text-white">
              {contactState === 'accepted' ? `Open conversation with ${person.name}` : waiting ? 'Waiting for a response' : `Message ${person.name}`}
            </Text>
          </Pressable>

          <Pressable
            accessibilityHint={canSendDrink ? 'Opens the room gift menu' : 'Available after this person accepts your message request'}
            accessibilityRole="button"
            accessibilityState={{ disabled: !canSendDrink }}
            className="mt-3 min-h-14 flex-row items-center justify-center gap-3 rounded-2xl bg-commitment px-6 disabled:opacity-40"
            disabled={!canSendDrink}
            onPress={onSendDrink}
            testID="send-drink-person"
          >
            <Ionicons color={colors.ink} name="wine" size={22} />
            <Text className="text-base font-black uppercase text-ink">Send a drink</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            className="mt-5 min-h-14 flex-row items-center justify-center gap-3 rounded-2xl border border-ink px-6 active:bg-surface-soft"
            onPress={onHideInRoom}
            testID="person-hide-room"
          >
            <Ionicons color={colors.ink} name="eye-off-outline" size={22} />
            <Text className="text-sm font-black uppercase text-ink">Browse quietly</Text>
          </Pressable>

          {showSafety ? (
            <View className="mt-5 border-t border-edge pt-4" testID="first-contact-safety-menu">
              <Text className="mb-2 text-xs font-black uppercase tracking-[0.7px] text-muted">Privacy & safety</Text>
              <Pressable accessibilityRole="button" className="min-h-12 flex-row items-center px-2" onPress={onBlock} testID="person-block-global">
                <Ionicons color={colors.error} name="ban-outline" size={22} />
                <Text className="ml-3 flex-1 font-bold text-ink">Block everywhere</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: reporting }}
                className="min-h-12 flex-row items-center px-2 disabled:opacity-50"
                disabled={reporting}
                onPress={onReport}
                testID="person-report"
              >
                <Ionicons color={colors.error} name="flag-outline" size={22} />
                <Text className="ml-3 flex-1 font-bold text-ink">{reporting ? 'Reporting…' : 'Report to this venue'}</Text>
              </Pressable>
            </View>
          ) : null}
          {safetyNotice ? <Text accessibilityRole="alert" className="mt-3 leading-6 text-muted">{safetyNotice}</Text> : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

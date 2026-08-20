// THESIS: A first message is one editable request, not a gamified social action.
// OWNED WORLD: One portrait-led sealed note with a visible consent boundary.
// STORY: Recognize the person → understand the limit → edit one note → send once.
// FIRST VIEWPORT: Recipient, room context, composer, safety note, and action stay visible.
// FORM: Empty, maximum length, rejected, sending, and sent states are explicit.
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, TextInput, View } from 'react-native';

import { AppShell } from '@/components/app/AppShell';
import { PortraitImage } from '@/components/night/NightPrimitives';
import { ErrorBanner, PrimaryButton, TextAction } from '@/components/onboarding/OnboardingPrimitives';
import type { RoomPerson } from '@/rooms/types';
import { colors } from '@/theme/colors';

const STARTERS = ['What are you drinking?', 'How do you know this place?', 'Enjoying the jazz set?'];

type MessageRequestScreenProps = {
  error?: string | null;
  message: string;
  onBack: () => void;
  onChangeMessage: (value: string) => void;
  onMessages?: () => void;
  onSend: () => void;
  person: RoomPerson;
  roomName?: string;
  sending?: boolean;
  sent?: boolean;
};

export function MessageRequestScreen({
  error,
  message,
  onBack,
  onChangeMessage,
  onMessages = onBack,
  onSend,
  person,
  roomName = 'this room',
  sending = false,
  sent = false,
}: MessageRequestScreenProps) {
  const close = (
    <Pressable
      accessibilityLabel="Close message request"
      accessibilityRole="button"
      className="h-12 w-12 items-center justify-center rounded-full border border-edge bg-surface active:bg-surface-soft"
      onPress={onBack}
      testID="message-request-close"
    >
      <Ionicons color={colors.ink} name="close" size={24} />
    </Pressable>
  );

  return (
    <AppShell headerAction={close} testID="message-request-screen" title="Message request">
      {sent ? (
        <View className="mt-8 items-center border-y border-edge bg-surface px-5 py-9">
          <PortraitImage className="h-24 w-20 rounded-[24px]" identity={person.pubkey} label={`Profile image for ${person.name}`} picture={person.picture} />
          <View className="-mt-5 h-11 w-11 items-center justify-center self-center rounded-full border-4 border-surface bg-verified">
            <Ionicons color={colors.ink} name="checkmark" size={23} />
          </View>
          <Text accessibilityRole="header" className="mt-4 text-center text-[32px] font-black leading-9 text-ink">Waiting for {person.name}</Text>
          <Text className="mt-3 max-w-[390px] text-center text-base leading-6 text-muted">
            {person.name} can decrypt the note and choose what happens next. You cannot send another request until they respond.
          </Text>
          <View className="mt-7 w-full">
            <PrimaryButton label="View in Messages" onPress={onMessages} testID="message-request-done" />
          </View>
        </View>
      ) : (
        <>
          <View className="mt-3 flex-row items-center gap-4 border-b border-edge pb-5">
            <View className="relative">
              <PortraitImage className="h-20 w-16 rounded-[20px]" identity={person.pubkey} label={`Profile image for ${person.name}`} picture={person.picture} />
              <View className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-canvas bg-verified" />
            </View>
            <View className="min-w-0 flex-1">
              <Text accessibilityRole="header" className="text-[26px] font-black uppercase text-ink">{person.name}</Text>
              <Text className="mt-1 text-sm font-semibold text-primary">{person.intent}</Text>
              <Text className="mt-1 text-sm text-muted">Met in {roomName}</Text>
            </View>
          </View>

          <Text className="mt-6 text-xs font-black uppercase tracking-[0.8px] text-ink">Send a message request</Text>
          <View className="mt-2 rounded-2xl border border-edge bg-surface p-4">
            <TextInput
              accessibilityLabel="First message"
              className="min-h-32 text-lg leading-7 text-ink"
              maxLength={240}
              multiline
              onChangeText={onChangeMessage}
              placeholder="Write one short message…"
              placeholderTextColor={colors.placeholder}
              selectionColor={colors.primary}
              testID="message-request-input"
              textAlignVertical="top"
              value={message}
            />
            <Text className="self-end text-xs font-semibold text-muted">{message.length}/240</Text>
          </View>

          <View className="mt-3 flex-row flex-wrap gap-2">
            {STARTERS.map((starter) => (
              <Pressable
                accessibilityRole="button"
                className="min-h-12 justify-center rounded-full border border-edge bg-surface px-4 py-2"
                key={starter}
                onPress={() => onChangeMessage(starter)}
              >
                <Text className="text-sm font-semibold text-ink">{starter}</Text>
              </Pressable>
            ))}
          </View>

          <View className="mt-5 flex-row items-start gap-3 rounded-2xl bg-surface-soft p-4">
            <Ionicons color={colors.ink} name="shield-checkmark-outline" size={21} />
            <View className="min-w-0 flex-1">
              <Text className="text-sm font-bold text-ink">Be kind and respectful.</Text>
              <Text className="mt-1 text-sm leading-5 text-muted">
                This is your only message until {person.name} accepts or replies. It is encrypted before publication.
              </Text>
            </View>
          </View>

          <View className="mt-auto pt-6">
            <ErrorBanner message={error} />
            <PrimaryButton
              disabled={!message.trim()}
              label="Send request"
              loading={sending}
              loadingLabel="Sending request…"
              onPress={onSend}
              testID="send-message-request"
              tone="commitment"
            />
            <TextAction label="Not right now" onPress={onBack} testID="message-request-not-now" />
            <Text className="mt-1 text-center text-xs leading-5 text-muted">
              Block and report remain available from the person and conversation controls.
            </Text>
          </View>
        </>
      )}
    </AppShell>
  );
}

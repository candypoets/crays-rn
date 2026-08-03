// THESIS: A first message is one editable request, not a branded contact game.
// OWNED WORLD: The composer is framed as a single sealed note with clear recipient control.
// STORY: Understand the boundary → write or adapt a starter → send once → wait.
// FIRST VIEWPORT: Recipient, policy, composer, count, and send commitment are visible.
// FORM: Empty, too-long, rejected, sending, and sent states are explicit.
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';

import { AppShell } from '@/components/app/AppShell';
import type { RoomPerson } from '@/rooms/types';
import { colors } from '@/theme/colors';

const STARTERS = ['What are you drinking?', 'How do you know this place?', 'Enjoying the jazz set?'];

export function MessageRequestScreen({ error, message, onBack, onChangeMessage, onSend, person, sending, sent }: {
  error?: string | null;
  message: string;
  onBack: () => void;
  onChangeMessage: (value: string) => void;
  onSend: () => void;
  person: RoomPerson;
  sending?: boolean;
  sent?: boolean;
}) {
  return (
    <AppShell
      eyebrow="First contact"
      headerAction={<Pressable accessibilityLabel="Close message request" className="h-12 w-12 items-center justify-center rounded-full bg-base-200" onPress={onBack}><Ionicons color={colors.accent} name="close" size={24} /></Pressable>}
      testID="message-request-screen"
      title={`Message ${person.name}`}
    >
      {sent ? (
        <View className="mt-12 items-center rounded-[30px] border border-base-300 bg-base-200 px-7 py-10">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-success/15"><Ionicons color={colors.success} name="checkmark" size={34} /></View>
          <Text accessibilityRole="header" className="mt-5 text-center text-3xl font-black text-base-content">Request sent</Text>
          <Text className="mt-3 text-center text-base leading-6 text-muted">{person.name} can decrypt the direct message and choose what happens next. You cannot send another request until they respond.</Text>
          <Pressable className="mt-7 min-h-14 w-full items-center justify-center rounded-2xl bg-primary" onPress={onBack} testID="message-request-done"><Text className="font-black text-white">Back to the room</Text></Pressable>
        </View>
      ) : (
        <>
          <View className="mt-5 flex-row items-center gap-4 rounded-2xl bg-base-200 p-4">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-primary/15"><Text className="text-xl font-black text-primary">{person.name.slice(0, 1)}</Text></View>
            <View className="flex-1"><Text className="text-lg font-extrabold text-base-content">{person.name}</Text><Text className="text-sm text-muted">{person.intent} · visible now</Text></View>
          </View>
          <View className="mt-5 flex-row gap-3 rounded-2xl border border-primary/20 bg-primary/10 p-4">
            <Ionicons color={colors.primary} name="lock-closed-outline" size={21} />
            <Text className="flex-1 text-sm leading-5 text-base-content">This is your only message until {person.name} accepts or replies. It is encrypted before publication.</Text>
          </View>
          <Text className="mb-2 mt-7 text-sm font-black uppercase tracking-[2px] text-muted">Optional starters</Text>
          <View className="flex-row flex-wrap gap-2">
            {STARTERS.map((starter) => <Pressable className="rounded-full border border-base-300 bg-base-200 px-4 py-3" key={starter} onPress={() => onChangeMessage(starter)}><Text className="text-sm font-semibold text-base-content">{starter}</Text></Pressable>)}
          </View>
          <View className="mt-5 rounded-[24px] border border-base-300 bg-base-200 p-4">
            <TextInput
              accessibilityLabel="First message"
              autoFocus
              className="min-h-32 text-lg leading-7 text-base-content"
              maxLength={240}
              multiline
              onChangeText={onChangeMessage}
              placeholder="Write one short message…"
              placeholderTextColor={colors.placeholder}
              testID="message-request-input"
              textAlignVertical="top"
              value={message}
            />
            <Text className="self-end text-xs text-muted">{message.length}/240</Text>
          </View>
          {error ? <Text accessibilityRole="alert" className="mt-3 text-sm font-semibold text-error">{error}</Text> : null}
          <Pressable
            accessibilityRole="button"
            className="mt-6 min-h-14 items-center justify-center rounded-2xl bg-primary disabled:opacity-40"
            disabled={!message.trim() || sending}
            onPress={onSend}
            testID="send-message-request"
          >
            {sending ? <ActivityIndicator color="white" /> : <Text className="text-base font-black text-white">Send request</Text>}
          </Pressable>
        </>
      )}
    </AppShell>
  );
}

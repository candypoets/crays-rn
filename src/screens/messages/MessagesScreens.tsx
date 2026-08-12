// THESIS: Private relationships outlive the room while first contact remains consent-aware.
// OWNED WORLD: A durable note archive and a quiet portrait-led conversation surface.
// STORY: Review context → open one person → accept or wait → converse → retain safety control.
// FIRST VIEWPORT: Person, room context, request state, and the latest message are legible.
// FORM: Empty, request, waiting, accepted, ignored, blocked, error, and relay gaps are explicit.
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, TextInput, View } from 'react-native';

import { AppShell } from '@/components/app/AppShell';
import { PortraitImage } from '@/components/night/NightPrimitives';
import { ErrorBanner, PrimaryButton } from '@/components/onboarding/OnboardingPrimitives';
import type { LocalMessage } from '@/messages/store';
import { colors } from '@/theme/colors';

function portraitIndex(pubkey: string) {
  return Number.parseInt(pubkey.slice(0, 2), 16) % 8 || 1;
}

function stateLabel(message: LocalMessage) {
  if (message.direction === 'outgoing' && message.state === 'requested') return 'waiting';
  return message.state;
}

export function MessagesScreen({
  error,
  messages,
  onOpen,
}: {
  error?: string | null;
  messages: LocalMessage[];
  onOpen: (message: LocalMessage) => void;
}) {
  return (
    <AppShell eyebrow="Private · stays after the room" testID="messages-screen" title="Messages">
      {error ? (
        <View accessibilityLiveRegion="polite" accessibilityRole="alert" className="mt-3" testID="messages-error">
          <ErrorBanner message={error} />
        </View>
      ) : null}

      {!messages.length ? (
        <View className="mt-10 items-center border-y border-dashed border-edge bg-surface px-6 py-10">
          <View className="h-14 w-14 items-center justify-center rounded-full bg-surface-soft">
            <Ionicons color={colors.ink} name="chatbubbles-outline" size={30} />
          </View>
          <Text accessibilityRole="header" className="mt-5 text-center text-2xl font-black text-ink">No conversations yet</Text>
          <Text className="mt-2 max-w-[380px] text-center text-base leading-6 text-muted">
            Encrypted message requests and accepted conversations appear here and remain after you leave a room.
          </Text>
        </View>
      ) : (
        <View className="mt-5 border-t border-edge">
          {messages.map((message) => (
            <Pressable
              accessibilityLabel={`Open conversation with ${message.recipientName}`}
              accessibilityRole="button"
              className="min-h-[104px] flex-row items-center border-b border-edge bg-surface py-4 pl-3 pr-4 active:bg-surface-soft"
              key={message.id}
              onPress={() => onOpen(message)}
              testID={`message-row-${message.recipientPubkey}`}
            >
              <PortraitImage
                className="h-16 w-14 rounded-[18px]"
                index={portraitIndex(message.recipientPubkey)}
                label={`Portrait of ${message.recipientName}`}
              />
              <View className="ml-4 min-w-0 flex-1">
                <View className="flex-row items-start justify-between gap-3">
                  <Text className="min-w-0 flex-1 text-lg font-black uppercase text-ink">{message.recipientName}</Text>
                  <Text className="text-xs font-black uppercase text-primary">{stateLabel(message)}</Text>
                </View>
                <Text className="mt-1 text-sm leading-5 text-ink">{message.content}</Text>
                <Text className="mt-2 text-xs font-semibold text-muted">From {message.roomName}</Text>
              </View>
              <Ionicons color={colors.inkMuted} name="chevron-forward" size={20} />
            </Pressable>
          ))}
        </View>
      )}
    </AppShell>
  );
}

type ConversationScreenProps = {
  draft: string;
  error?: string | null;
  message: LocalMessage;
  onAccept: () => void;
  onBack: () => void;
  onBlock: () => void;
  onChangeDraft: (value: string) => void;
  onNotNow: () => void;
  onReply: () => void;
  onReport: () => void;
  sending: boolean;
  thread?: LocalMessage[];
};

function SafetyAction({
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
      accessibilityRole="button"
      className="min-h-14 flex-row items-center border-b border-edge py-3 last:border-b-0"
      onPress={onPress}
      testID={testID}
    >
      <Ionicons color={colors.ink} name={icon} size={22} />
      <Text className="ml-3 flex-1 font-bold text-ink">{label}</Text>
      <Ionicons color={colors.inkMuted} name="chevron-forward" size={19} />
    </Pressable>
  );
}

export function ConversationScreen({
  draft,
  error,
  message,
  onAccept,
  onBack,
  onBlock,
  onChangeDraft,
  onNotNow,
  onReply,
  onReport,
  sending,
  thread = [message],
}: ConversationScreenProps) {
  const incoming = message.direction === 'incoming';
  const accepted = message.state === 'accepted';
  const status = accepted ? 'Conversation' : incoming ? 'Message request' : 'Request sent';

  return (
    <AppShell
      eyebrow={message.roomName}
      headerAction={(
        <PortraitImage
          className="h-12 w-10 rounded-[14px]"
          index={portraitIndex(message.recipientPubkey)}
          label={`Portrait of ${message.recipientName}`}
        />
      )}
      testID="conversation-screen"
      title={message.recipientName}
    >
      <Pressable
        accessibilityLabel="Back to Messages"
        accessibilityRole="button"
        className="min-h-12 flex-row items-center gap-2 self-start pr-4"
        onPress={onBack}
        testID="conversation-back"
      >
        <Ionicons color={colors.ink} name="arrow-back" size={22} />
        <Text className="font-bold text-primary">Messages</Text>
      </Pressable>

      <View className="mt-4 flex-row items-center justify-center gap-2">
        <View className="h-px flex-1 bg-edge" />
        <Text className="text-[11px] font-black uppercase tracking-[0.7px] text-muted">{status} · {message.state}</Text>
        <View className="h-px flex-1 bg-edge" />
      </View>

      {accepted ? (
        <View className="mt-5 gap-3" testID="conversation-thread">
          {thread.map((item) => {
            const outgoing = item.direction === 'outgoing';
            return (
              <View
                className={`max-w-[88%] rounded-2xl px-4 py-3 ${outgoing ? 'self-end rounded-br-sm bg-primary' : 'self-start rounded-bl-sm bg-surface-soft'}`}
                key={item.id}
              >
                <Text className={`text-base leading-6 ${outgoing ? 'text-white' : 'text-ink'}`}>{item.content}</Text>
              </View>
            );
          })}
        </View>
      ) : (
        <View className="mt-5 rounded-2xl border border-edge bg-surface p-5">
          <Text className="text-lg leading-7 text-ink">{message.content}</Text>
        </View>
      )}

      <Text className="mt-4 text-center text-xs leading-5 text-muted">
        NIP-04 encrypted message. The relay can see the participants, not the message text. Messages stay after you leave the room.
      </Text>

      {incoming && message.state === 'requested' ? (
        <View className="mt-6">
          <PrimaryButton
            label="Accept conversation"
            loading={sending}
            loadingLabel="Accepting…"
            onPress={onAccept}
            testID="conversation-accept"
          />
          <Pressable
            accessibilityRole="button"
            className="mt-2 min-h-12 items-center justify-center"
            onPress={onNotNow}
            testID="conversation-not-now"
          >
            <Text className="font-bold text-muted">Not now</Text>
          </Pressable>
          <Text className="mt-2 text-center text-sm leading-5 text-muted">
            Accepting permits a reply; it does not publish room presence. Not now stays private.
          </Text>
        </View>
      ) : null}

      {!incoming && message.state === 'requested' ? (
        <View className="mt-6 rounded-2xl bg-surface-soft p-4">
          <Text className="text-center font-bold text-ink">Waiting for {message.recipientName} to accept or reply.</Text>
          <Text className="mt-1 text-center text-sm text-muted">No second request can be sent.</Text>
        </View>
      ) : null}

      {message.state === 'ignored' ? (
        <Text className="mt-5 rounded-2xl bg-surface-soft p-4 leading-6 text-muted">
          Request dismissed. The sender is not told why and cannot send another first request from this device.
        </Text>
      ) : null}

      {accepted ? (
        <View className="mt-6 rounded-2xl border-2 border-primary bg-surface p-3">
          <TextInput
            accessibilityLabel={`Reply to ${message.recipientName}`}
            className="min-h-24 px-1 py-2 text-base leading-6 text-ink"
            maxLength={2000}
            multiline
            onChangeText={onChangeDraft}
            onSubmitEditing={onReply}
            placeholder={`Message ${message.recipientName}…`}
            placeholderTextColor={colors.placeholder}
            returnKeyType="send"
            selectionColor={colors.primary}
            submitBehavior="blurAndSubmit"
            testID="conversation-reply-input"
            textAlignVertical="top"
            value={draft}
          />
          <Text className="mb-3 mt-1 text-right text-xs text-muted" testID="conversation-reply-count">{draft.length}/2000</Text>
          <PrimaryButton
            disabled={!draft.trim()}
            label="Send reply"
            loading={sending}
            loadingLabel="Sending…"
            onPress={onReply}
            testID="conversation-send-reply"
            tone="commitment"
          />
        </View>
      ) : null}

      {message.state === 'blocked' ? (
        <Text className="mt-5 rounded-2xl border border-edge bg-surface-soft p-4 leading-6 text-muted">
          This person is blocked on this device. No new private messages will be sent from this conversation.
        </Text>
      ) : null}

      <View className="mt-5">
        <ErrorBanner message={error} />
      </View>

      <Text accessibilityRole="header" className="mt-4 text-xs font-black uppercase tracking-[0.8px] text-ink">Safety</Text>
      <View className="mt-2 border-y border-edge">
        <SafetyAction icon="ban-outline" label="Block this person" onPress={onBlock} testID="conversation-block" />
        <SafetyAction icon="flag-outline" label="Report to the venue" onPress={onReport} testID="conversation-report" />
      </View>
    </AppShell>
  );
}

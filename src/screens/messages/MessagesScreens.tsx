// THESIS: Private relationships outlive a room, while first contact remains consent-aware.
// OWNED WORLD: Conversation rows resemble sealed notes retained from real places.
// STORY: Review requests → open one known person → accept, block, report, or return.
// FIRST VIEWPORT: Request state, person, room context, and last private message are clear.
// FORM: Empty archive, pending request, accepted, blocked, report failure, and relay gaps are explicit.
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, TextInput, View } from 'react-native';
import { AppShell, RaisedRow, SectionTitle } from '@/components/app/AppShell';
import { PrimaryButton } from '@/components/onboarding/OnboardingPrimitives';
import type { LocalMessage } from '@/messages/store';
import { colors } from '@/theme/colors';

export function MessagesScreen({ error, messages, onOpen }: { error?: string | null; messages: LocalMessage[]; onOpen: (message: LocalMessage) => void }) { return <AppShell eyebrow="Private and durable" testID="messages-screen" title="Messages">{error ? <Text accessibilityRole="alert" className="mt-4 text-sm leading-5 text-error" testID="messages-error">{error}</Text> : null}{!messages.length ? <View className="mt-12 items-center rounded-[28px] border border-dashed border-base-300 p-8"><Ionicons color={colors.accent} name="chatbubbles-outline" size={38} /><Text className="mt-5 text-xl font-black text-base-content">No conversations yet</Text><Text className="mt-2 text-center leading-6 text-muted">An encrypted direct-message request sent from a visible room profile appears here and stays after you leave.</Text></View> : <><SectionTitle>Requests & conversations</SectionTitle><View className="gap-3">{messages.map((message) => <Pressable accessibilityLabel={`Open conversation with ${message.recipientName}`} accessibilityRole="button" key={message.id} onPress={() => onOpen(message)} testID={`message-row-${message.recipientPubkey}`}><RaisedRow><View className="h-12 w-12 items-center justify-center rounded-full bg-primary/15"><Text className="text-xl font-black text-primary">{message.recipientName.slice(0, 1)}</Text></View><View className="ml-4 flex-1"><View className="flex-row items-center justify-between"><Text className="text-lg font-black text-base-content">{message.recipientName}</Text><Text className="text-xs font-black uppercase text-primary">{message.direction === 'outgoing' && message.state === 'requested' ? 'waiting' : message.state}</Text></View><Text numberOfLines={1} className="mt-1 text-sm text-muted">{message.content}</Text><Text className="mt-1 text-xs text-muted">From {message.roomName}</Text></View></RaisedRow></Pressable>)}</View></>}</AppShell>; }

export function ConversationScreen({ draft, error, message, onAccept, onBack, onBlock, onChangeDraft, onNotNow, onReply, onReport, sending, thread = [message] }: {
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
}) {
  const incoming = message.direction === 'incoming';
  const accepted = message.state === 'accepted';
  return <AppShell eyebrow={message.roomName} testID="conversation-screen" title={message.recipientName}>
    <Pressable accessibilityRole="button" className="mt-1 min-h-12 flex-row items-center gap-2 self-start" onPress={onBack}><Ionicons color={colors.accent} name="arrow-back" size={18} /><Text className="font-bold text-primary">Messages</Text></Pressable>
    <View className="mt-7 rounded-[26px] border border-base-300 bg-base-200 p-5">
      <Text className="text-xs font-black uppercase tracking-[2px] text-primary">{accepted ? 'Conversation' : incoming ? 'Message request' : 'Request sent'} · {message.state}</Text>
      {accepted ? <View className="mt-4 gap-3" testID="conversation-thread">{thread.map((item) => <View className={`max-w-[88%] rounded-2xl px-4 py-3 ${item.direction === 'outgoing' ? 'self-end bg-primary/15' : 'self-start bg-base-300'}`} key={item.id}><Text className="leading-6 text-base-content">{item.content}</Text></View>)}</View> : <Text className="mt-4 text-lg leading-7 text-base-content">{message.content}</Text>}
      <Text className="mt-4 text-sm text-muted">NIP-04 encrypted direct message. The relay can see the participants, not the message text.</Text>
    </View>
    {incoming && message.state === 'requested' ? <View className="mt-6"><PrimaryButton label="Accept conversation" loading={sending} onPress={onAccept} testID="conversation-accept" /><Pressable accessibilityRole="button" className="mt-2 min-h-12 items-center justify-center" onPress={onNotNow} testID="conversation-not-now"><Text className="font-bold text-muted">Not now</Text></Pressable><Text className="mt-2 text-center text-sm leading-5 text-muted">Accepting permits a reply; it does not publish room presence. Not now stays private.</Text></View> : !incoming && message.state === 'requested' ? <Text className="mt-5 text-center leading-6 text-muted">Waiting for {message.recipientName} to accept or reply. No second request can be sent.</Text> : null}
    {message.state === 'ignored' ? <Text className="mt-5 rounded-2xl bg-base-200 p-4 leading-6 text-muted">Request dismissed. The sender is not told why and cannot send another first request from this device.</Text> : null}
    {accepted ? <View className="mt-6 rounded-[26px] border border-base-300 bg-base-200 p-5">
      <Text className="text-xs font-black uppercase tracking-[2px] text-primary">Private reply</Text>
      <TextInput className="mt-4 min-h-24 rounded-2xl border border-base-300 bg-base-100 px-4 py-3 text-base text-base-content" maxLength={2000} multiline onChangeText={onChangeDraft} onSubmitEditing={onReply} placeholder={`Reply to ${message.recipientName}`} placeholderTextColor={colors.placeholder} returnKeyType="send" submitBehavior="blurAndSubmit" testID="conversation-reply-input" textAlignVertical="top" value={draft} />
      <Text className="mb-4 mt-2 text-right text-xs text-muted" testID="conversation-reply-count">{draft.length}/2000</Text>
      <PrimaryButton disabled={!draft.trim()} label="Send reply" loading={sending} onPress={onReply} testID="conversation-send-reply" />
    </View> : null}
    {message.state === 'blocked' ? <Text className="mt-5 rounded-2xl border border-base-300 bg-base-200 p-4 leading-6 text-muted">This person is blocked on this device. No new private messages will be sent from this conversation.</Text> : null}
    {error ? <Text className="mt-4 text-error">{error}</Text> : null}
    <SectionTitle>Safety</SectionTitle>
    <View className="gap-3"><Pressable accessibilityRole="button" onPress={onBlock} testID="conversation-block"><RaisedRow><Ionicons color={colors.accent} name="ban-outline" size={24} /><Text className="ml-4 flex-1 font-bold text-base-content">Block this person</Text></RaisedRow></Pressable><Pressable accessibilityRole="button" onPress={onReport} testID="conversation-report"><RaisedRow><Ionicons color={colors.accent} name="flag-outline" size={24} /><Text className="ml-4 flex-1 font-bold text-base-content">Report to the venue</Text></RaisedRow></Pressable></View>
  </AppShell>;
}

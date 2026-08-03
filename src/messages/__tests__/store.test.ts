import * as SecureStore from 'expo-secure-store';

import {
  conversationMessages,
  hasAcceptedConversation,
  latestConversationMessages,
  saveLocalMessage,
  type LocalMessage,
} from '@/messages/store';

jest.mock('expo-secure-store', () => ({ getItemAsync: jest.fn(), setItemAsync: jest.fn() }));

const peer = 'a'.repeat(64);
const otherPeer = 'b'.repeat(64);
const makeMessage = (id: string, recipientPubkey: string, createdAt: number): LocalMessage => ({
  id,
  recipientPubkey,
  recipientName: recipientPubkey === peer ? 'Maya' : 'Jonas',
  roomId: 'room',
  roomName: 'Skyline',
  content: id,
  createdAt,
  state: 'accepted',
  direction: 'outgoing',
  protocol: 'nip04',
});

beforeEach(() => jest.resetAllMocks());

it('retains previous messages in the same conversation', async () => {
  jest.mocked(SecureStore.getItemAsync).mockResolvedValue(JSON.stringify([makeMessage('first', peer, 1)]));
  await saveLocalMessage(makeMessage('second', peer, 2));
  const saved = JSON.parse(jest.mocked(SecureStore.setItemAsync).mock.calls[0][1]) as LocalMessage[];
  expect(saved.map((item) => item.id)).toEqual(['second', 'first']);
});

it('projects one latest row per peer while preserving chronological threads', () => {
  const messages = [makeMessage('new', peer, 3), makeMessage('other', otherPeer, 2), makeMessage('old', peer, 1)];
  expect(latestConversationMessages(messages).map((item) => item.id)).toEqual(['new', 'other']);
  expect(conversationMessages(messages, peer).map((item) => item.id)).toEqual(['old', 'new']);
  expect(hasAcceptedConversation(messages, peer)).toBe(true);
  expect(hasAcceptedConversation([{ ...messages[0], state: 'requested' }], peer)).toBe(false);
});

import * as SecureStore from 'expo-secure-store';

const KEY = 'crays.messages.local.v1';
export type LocalMessage = { id: string; recipientPubkey: string; recipientName: string; roomId: string; roomName: string; content: string; createdAt: number; state: 'requested' | 'accepted' | 'ignored' | 'blocked'; direction?: 'incoming' | 'outgoing'; protocol?: 'nip04'; relayUrls?: string[] };
export async function loadLocalMessages(): Promise<LocalMessage[]> { try { const data = JSON.parse((await SecureStore.getItemAsync(KEY)) || '[]') as LocalMessage[]; return data.filter((item) => typeof item.id === 'string' && typeof item.recipientPubkey === 'string').map((item) => ({ ...item, direction: item.direction || 'outgoing' })).sort((a, b) => b.createdAt - a.createdAt); } catch { return []; } }
export async function saveLocalMessage(message: LocalMessage): Promise<void> { const current = await loadLocalMessages(); const next = [message, ...current.filter((item) => item.id !== message.id)].sort((a, b) => b.createdAt - a.createdAt).slice(0, 200); await SecureStore.setItemAsync(KEY, JSON.stringify(next)); }
export async function updateLocalConversation(pubkey: string, state: LocalMessage['state']): Promise<void> { const current = await loadLocalMessages(); await SecureStore.setItemAsync(KEY, JSON.stringify(current.map((item) => item.recipientPubkey === pubkey ? { ...item, state } : item))); }

export function latestConversationMessages(messages: LocalMessage[]): LocalMessage[] {
  const seen = new Set<string>();
  return messages.filter((message) => {
    if (seen.has(message.recipientPubkey)) return false;
    seen.add(message.recipientPubkey);
    return true;
  });
}

export function conversationMessages(messages: LocalMessage[], pubkey: string): LocalMessage[] {
  return messages.filter((message) => message.recipientPubkey === pubkey).sort((a, b) => a.createdAt - b.createdAt);
}

export function hasAcceptedConversation(messages: LocalMessage[], pubkey: string): boolean {
  return messages.some((message) => message.recipientPubkey === pubkey && message.state === 'accepted');
}

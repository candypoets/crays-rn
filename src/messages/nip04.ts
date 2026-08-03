import type { EventTemplate } from 'nostr-tools';

export const CRAYS_DM_SCHEMA = 'life.crays/dm/v1';

export type CraysDirectMessageType = 'message-request' | 'message-acceptance' | 'message';

export type CraysDirectMessage = {
  schema: typeof CRAYS_DM_SCHEMA;
  messageId: string;
  messageType: CraysDirectMessageType;
  text: string;
  roomId: string;
  roomName: string;
  replyTo?: string;
};

export function createNip04MessageTemplate({ messageId, messageType, recipientPubkey, replyTo, roomId, roomName, text }: {
  messageId: string;
  messageType: CraysDirectMessageType;
  recipientPubkey: string;
  replyTo?: string;
  roomId: string;
  roomName: string;
  text: string;
}): { envelope: CraysDirectMessage; template: EventTemplate } {
  if (!/^[0-9a-f]{64}$/i.test(recipientPubkey)) throw new Error('The recipient identity is invalid.');
  if (!messageId || !roomId || !roomName || !text.trim()) throw new Error('The direct message is incomplete.');
  const envelope: CraysDirectMessage = {
    schema: CRAYS_DM_SCHEMA,
    messageId,
    messageType,
    text: text.trim(),
    roomId,
    roomName,
    ...(replyTo ? { replyTo } : {}),
  };
  return {
    envelope,
    // nipworker recognizes kind 4, encrypts this plaintext envelope with the
    // active signer using NIP-04, then signs the encrypted event.
    template: {
      kind: 4,
      created_at: Math.floor(Date.now() / 1000),
      content: JSON.stringify(envelope),
      tags: [['p', recipientPubkey]],
    },
  };
}

export function parseCraysDirectMessage(plaintext: string): CraysDirectMessage | null {
  try {
    const value = JSON.parse(plaintext) as Partial<CraysDirectMessage>;
    if (
      value.schema !== CRAYS_DM_SCHEMA ||
      typeof value.messageId !== 'string' || !value.messageId ||
      !['message-request', 'message-acceptance', 'message'].includes(value.messageType || '') ||
      typeof value.text !== 'string' || !value.text.trim() ||
      typeof value.roomId !== 'string' || !value.roomId ||
      typeof value.roomName !== 'string' || !value.roomName ||
      (value.replyTo !== undefined && typeof value.replyTo !== 'string')
    ) return null;
    return value as CraysDirectMessage;
  } catch { return null; }
}

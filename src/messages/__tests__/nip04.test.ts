import { createNip04MessageTemplate, parseCraysDirectMessage } from '@/messages/nip04';

describe('NIP-04 direct-message contract', () => {
  it('creates a standard kind-4 template with Crays state inside plaintext for nipworker encryption', () => {
    const { envelope, template } = createNip04MessageTemplate({ messageId: 'request-1', messageType: 'message-request', recipientPubkey: 'b'.repeat(64), roomId: 'skyline', roomName: 'The Skyline Room', text: ' Hello ' });
    expect(template).toMatchObject({ kind: 4, tags: [['p', 'b'.repeat(64)]] });
    expect(JSON.parse(template.content)).toEqual(envelope);
    expect(envelope).toEqual({ schema: 'life.crays/dm/v1', messageId: 'request-1', messageType: 'message-request', text: 'Hello', roomId: 'skyline', roomName: 'The Skyline Room' });
  });

  it('preserves consent state and reply linkage inside the encrypted envelope', () => {
    const { template } = createNip04MessageTemplate({ messageId: 'reply-2', messageType: 'message', recipientPubkey: 'b'.repeat(64), replyTo: 'accept-1', roomId: 'skyline', roomName: 'Skyline', text: 'See you there' });
    expect(parseCraysDirectMessage(template.content)).toEqual(expect.objectContaining({ messageId: 'reply-2', messageType: 'message', replyTo: 'accept-1', text: 'See you there' }));
  });

  it.each(['plain legacy text', '{}', '{bad'])('rejects non-Crays or malformed payload %s', (value) => {
    expect(parseCraysDirectMessage(value)).toBeNull();
  });
});

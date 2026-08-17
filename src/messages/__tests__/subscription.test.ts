/* eslint-disable import/first -- Jest mocks must be declared before imports. */
const mockSubscribe = jest.fn();
const mockAsParsedEvent = jest.fn();
const mockAsKind4 = jest.fn();
const mockIsConnectionStatus = jest.fn();
jest.mock('@candypoets/nipworker/hooks', () => ({
  isConnectionStatus: (...args: unknown[]) => mockIsConnectionStatus(...args),
  useSubscription: (...args: unknown[]) => mockSubscribe(...args),
}));
jest.mock('@candypoets/nipworker/utils', () => ({
  asParsedEvent: (...args: unknown[]) => mockAsParsedEvent(...args),
  asKind4: (...args: unknown[]) => mockAsKind4(...args),
}));

import { subscribeNip04Messages } from '@/messages/subscription';

describe('nipworker kind-4 subscription', () => {
  beforeEach(() => { jest.resetAllMocks(); mockIsConnectionStatus.mockReturnValue(null); mockSubscribe.mockReturnValue(jest.fn()); });

  it('authenticates the incoming half before opening outgoing and exposes decrypted participants', () => {
    const callbacks: ((message: unknown) => void)[] = [];
    const stops = [jest.fn(), jest.fn()];
    mockSubscribe.mockImplementation((_id, _requests, next) => { callbacks.push(next); return stops[callbacks.length - 1]; });
    const parsed = { id: () => 'e'.repeat(64), kind: () => 4, pubkey: () => 'b'.repeat(64), createdAt: () => 100 };
    mockAsParsedEvent.mockReturnValue(parsed);
    mockAsKind4.mockReturnValue({ decryptedContent: () => '{"schema":"life.crays/dm/v1"}', recipient: () => 'a'.repeat(64) });
    const onEvent = jest.fn();
    const onReady = jest.fn();
    const stop = subscribeNip04Messages({ onEvent, onReady, pubkey: 'a'.repeat(64), relays: ['wss://dm.test', 'wss://dm.test'] });
    expect(mockSubscribe).toHaveBeenNthCalledWith(1, expect.stringMatching(/^crays_kind4_in_aaaaaaaaaaaa_/), [expect.objectContaining({ kinds: [4], tags: { '#p': ['a'.repeat(64)] }, relays: ['wss://dm.test'] })], expect.any(Function));
    expect(mockSubscribe).toHaveBeenCalledTimes(1);
    callbacks[0]?.({});
    expect(onEvent).toHaveBeenCalledWith({ eventId: 'e'.repeat(64), senderPubkey: 'b'.repeat(64), recipientPubkey: 'a'.repeat(64), createdAt: 100, plaintext: '{"schema":"life.crays/dm/v1"}' });
    // A cache-phase marker has no relay ConnectionStatus and must not unlock
    // public subscriptions on an unauthenticated socket.
    callbacks[0]?.({});
    expect(mockSubscribe).toHaveBeenCalledTimes(1);
    mockIsConnectionStatus.mockReturnValue({ status: () => 'EOSE', relayUrl: () => 'wss://dm.test/' });
    callbacks[0]?.({});
    expect(mockSubscribe).toHaveBeenNthCalledWith(2, expect.stringMatching(/^crays_kind4_out_aaaaaaaaaaaa_/), [expect.objectContaining({ kinds: [4], authors: ['a'.repeat(64)], relays: ['wss://dm.test'] })], expect.any(Function));
    expect(mockSubscribe.mock.calls[1]?.[0].replace('_out_', '_in_')).toBe(mockSubscribe.mock.calls[0]?.[0]);
    expect(onReady).toHaveBeenCalledTimes(1);
    callbacks[0]?.({});
    expect(mockSubscribe).toHaveBeenCalledTimes(2);
    stop();
    expect(stops[0]).toHaveBeenCalled();
    expect(stops[1]).toHaveBeenCalled();
  });

  it('drops events that nipworker could not decrypt', () => {
    let callback: ((message: unknown) => void) | undefined;
    mockSubscribe.mockImplementation((_id, _requests, next) => { callback = next; return jest.fn(); });
    mockAsParsedEvent.mockReturnValue({ id: () => 'e'.repeat(64), kind: () => 4, pubkey: () => 'b'.repeat(64), createdAt: () => 100 });
    mockAsKind4.mockReturnValue({ decryptedContent: () => null, recipient: () => 'a'.repeat(64) });
    const onEvent = jest.fn();
    subscribeNip04Messages({ onEvent, pubkey: 'a'.repeat(64), relays: ['wss://dm.test'] });
    callback?.({});
    expect(onEvent).not.toHaveBeenCalled();
  });

  it('uses distinct stable subscription ids for distinct relay result sets', () => {
    subscribeNip04Messages({ onEvent: jest.fn(), pubkey: 'a'.repeat(64), relays: ['wss://one.test'] });
    subscribeNip04Messages({ onEvent: jest.fn(), pubkey: 'a'.repeat(64), relays: ['wss://two.test'] });
    expect(mockSubscribe.mock.calls[0]?.[0]).not.toBe(mockSubscribe.mock.calls[1]?.[0]);
  });
});

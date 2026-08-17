/* eslint-disable import/first */
jest.mock('expo-secure-store', () => ({
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY',
  deleteItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
}));
jest.mock('@candypoets/nipworker/hooks', () => ({ useSignEvent: jest.fn() }));
jest.mock('@/nostr/manager', () => ({ getNostrRuntime: jest.fn(() => ({ manager: null, status: 'ready' })) }));

import * as SecureStore from 'expo-secure-store';
import { finalizeEvent, getPublicKey, nip19 } from 'nostr-tools';

import { abbreviateNpub, readLocalAccountSummary } from '@/account/account';

const secret = Uint8Array.from([...new Array(31).fill(0), 1]);
const pubkey = getPublicKey(secret);
const nsec = nip19.nsecEncode(secret);
const npub = nip19.npubEncode(pubkey);

function signedProfile(content: string) {
  return finalizeEvent({ content, created_at: 1_700_000_000, kind: 0, tags: [] }, secret);
}

function mockStored(values: Record<string, string | null>) {
  jest.mocked(SecureStore.getItemAsync).mockImplementation(async (key) => values[key] ?? null);
}

describe('local account summary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns one verified public-only summary from a single storage generation', async () => {
    const profile = signedProfile(JSON.stringify({
      display_name: '  Maya   QA  ',
      name: 'Maya QA',
      picture: 'https://profiles.example/maya.jpg',
    }));
    mockStored({
      'crays.identity.nsec': nsec,
      'crays.identity.profile': JSON.stringify(profile),
      'crays.identity.pubkey': pubkey,
      'crays.onboarding.complete': '1',
    });

    const result = await readLocalAccountSummary();

    expect(result).toEqual({
      status: 'ready',
      account: {
        custody: 'device-only',
        displayName: 'Maya QA',
        npub,
        picture: 'https://profiles.example/maya.jpg',
        pubkey,
        setupComplete: true,
      },
    });
    expect(SecureStore.getItemAsync).toHaveBeenCalledTimes(5);
    expect(JSON.stringify(result)).not.toContain(nsec);
  });

  it('distinguishes absent, incomplete, and inconsistent protected account state', async () => {
    mockStored({});
    await expect(readLocalAccountSummary()).resolves.toEqual({ status: 'missing' });

    mockStored({ 'crays.identity.nsec': nsec, 'crays.identity.pubkey': pubkey });
    await expect(readLocalAccountSummary()).resolves.toEqual({ status: 'incomplete', npub, pubkey });

    mockStored({ 'crays.identity.nsec': nsec });
    await expect(readLocalAccountSummary()).resolves.toEqual({ status: 'invalid' });
  });

  it('rejects an unsigned-for-this-key or malformed kind-0 profile without inventing a name', async () => {
    const otherSecret = Uint8Array.from([...new Array(31).fill(0), 2]);
    const mismatched = finalizeEvent({ content: JSON.stringify({ name: 'Someone else' }), created_at: 1_700_000_000, kind: 0, tags: [] }, otherSecret);
    mockStored({
      'crays.identity.nsec': nsec,
      'crays.identity.profile': JSON.stringify(mismatched),
      'crays.identity.pubkey': pubkey,
    });
    await expect(readLocalAccountSummary()).resolves.toEqual({ status: 'invalid' });

    const malformed = signedProfile('not-json');
    mockStored({
      'crays.identity.nsec': nsec,
      'crays.identity.profile': JSON.stringify(malformed),
      'crays.identity.pubkey': pubkey,
    });
    await expect(readLocalAccountSummary()).resolves.toEqual({ status: 'invalid' });
  });

  it('ignores an unsafe picture URL while keeping a valid signed display name', async () => {
    const profile = signedProfile(JSON.stringify({ display_name: 'Maya QA', picture: 'file:///private/avatar.jpg' }));
    mockStored({
      'crays.identity.nsec': nsec,
      'crays.identity.profile': JSON.stringify(profile),
      'crays.identity.pubkey': pubkey,
      'crays.onboarding.complete': '1',
    });
    await expect(readLocalAccountSummary()).resolves.toEqual({
      status: 'ready',
      account: { custody: 'device-only', displayName: 'Maya QA', npub, picture: undefined, pubkey, setupComplete: true },
    });
  });

  it('reports connected-signer custody without requiring or exposing an nsec', async () => {
    const profile = signedProfile(JSON.stringify({ display_name: 'Remote Maya' }));
    mockStored({
      'crays.identity.profile': JSON.stringify(profile),
      'crays.identity.pubkey': pubkey,
      'crays.identity.signer': JSON.stringify({
        type: 'nip46',
        payload: {
          clientSecret: 'c'.repeat(64),
          url: `bunker://${pubkey}?relay=wss%3A%2F%2Frelay.example`,
        },
      }),
      'crays.onboarding.complete': '1',
    });
    await expect(readLocalAccountSummary()).resolves.toEqual({
      status: 'ready',
      account: {
        custody: 'remote-signer',
        displayName: 'Remote Maya',
        npub,
        picture: undefined,
        pubkey,
        setupComplete: true,
      },
    });
  });

  it('propagates protected-store read failures instead of treating them as logout', async () => {
    jest.mocked(SecureStore.getItemAsync).mockRejectedValueOnce(new Error('User interaction is not allowed.'));
    await expect(readLocalAccountSummary()).rejects.toThrow('User interaction is not allowed.');
  });

  it('abbreviates only long public identities', () => {
    expect(abbreviateNpub('npub1short')).toBe('npub1short');
    expect(abbreviateNpub(npub)).toBe(`${npub.slice(0, 12)}…${npub.slice(-8)}`);
  });
});

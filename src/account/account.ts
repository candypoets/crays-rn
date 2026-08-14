import '@/polyfills/text-encoding';

import { useSignEvent } from '@candypoets/nipworker/hooks';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { getPublicKey, nip19, type Event, type EventTemplate, verifyEvent } from 'nostr-tools';

import {
  normaliseDisplayName,
  resolveEntryDestination,
  type EntryDestination,
} from '@/account/state';
import { getNostrRuntime } from '@/nostr/manager';

const STORAGE = {
  nsec: 'crays.identity.nsec',
  pubkey: 'crays.identity.pubkey',
  profile: 'crays.identity.profile',
  complete: 'crays.onboarding.complete',
} as const;

export type { EntryDestination } from '@/account/state';

export type LocalIdentity = {
  nsec: string;
  pubkey: string;
};

export type LocalAccountSummary = {
  custody: 'device-only';
  displayName: string;
  npub: string;
  picture?: string;
  pubkey: string;
  setupComplete: boolean;
};

export type LocalAccountRead =
  | { status: 'ready'; account: LocalAccountSummary }
  | { status: 'incomplete'; npub: string; pubkey: string }
  | { status: 'invalid' }
  | { status: 'missing' };

let identityRequest: Promise<LocalIdentity> | null = null;

const secureOptions: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

export async function getEntryDestination(): Promise<EntryDestination> {
  const [nsec, pubkey, profile, complete] = await Promise.all([
    SecureStore.getItemAsync(STORAGE.nsec),
    SecureStore.getItemAsync(STORAGE.pubkey),
    SecureStore.getItemAsync(STORAGE.profile),
    SecureStore.getItemAsync(STORAGE.complete),
  ]);

  const hasIdentity = isStoredIdentityValid(nsec, pubkey);
  return resolveEntryDestination({
    complete: complete === '1',
    hasIdentity,
    hasProfile: hasIdentity && isStoredProfileValid(profile, pubkey),
  });
}

function isStoredIdentityValid(nsec: string | null, pubkey: string | null): boolean {
  if (!nsec || !pubkey) return false;
  try {
    const decoded = nip19.decode(nsec);
    return (
      decoded.type === 'nsec' &&
      decoded.data instanceof Uint8Array &&
      getPublicKey(decoded.data) === pubkey
    );
  } catch {
    return false;
  }
}

function isStoredProfileValid(profile: string | null, pubkey: string | null): boolean {
  if (!profile || !pubkey) return false;
  try {
    const event = JSON.parse(profile) as Event;
    return event.kind === 0 && event.pubkey === pubkey && verifyEvent(event);
  } catch {
    return false;
  }
}

export function abbreviateNpub(npub: string): string {
  if (npub.length <= 24) return npub;
  return `${npub.slice(0, 12)}…${npub.slice(-8)}`;
}

/**
 * Returns one validated, public-only view of the local account. Reads that
 * fail are allowed to reject: an unavailable Keychain is never evidence that
 * the account is missing and must not redirect or create a replacement key.
 */
export async function readLocalAccountSummary(): Promise<LocalAccountRead> {
  const [nsec, pubkey, profile, complete] = await Promise.all([
    SecureStore.getItemAsync(STORAGE.nsec),
    SecureStore.getItemAsync(STORAGE.pubkey),
    SecureStore.getItemAsync(STORAGE.profile),
    SecureStore.getItemAsync(STORAGE.complete),
  ]);
  const hasAnyAccountMaterial = Boolean(nsec || pubkey || profile || complete);
  if (!hasAnyAccountMaterial) return { status: 'missing' };
  if (!isStoredIdentityValid(nsec, pubkey)) return { status: 'invalid' };

  const publicIdentity = { npub: nip19.npubEncode(pubkey!), pubkey: pubkey! };
  if (!profile) {
    return complete === '1'
      ? { status: 'invalid' }
      : { status: 'incomplete', ...publicIdentity };
  }
  if (!isStoredProfileValid(profile, pubkey)) return { status: 'invalid' };

  try {
    const event = JSON.parse(profile) as Event;
    const metadata = JSON.parse(event.content) as Record<string, unknown>;
    if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return { status: 'invalid' };
    const nameValue = typeof metadata.display_name === 'string'
      ? metadata.display_name
      : typeof metadata.name === 'string'
        ? metadata.name
        : '';
    const displayName = normaliseDisplayName(nameValue);
    if (displayName.length < 2 || displayName.length > 50) return { status: 'invalid' };
    const pictureValue = typeof metadata.picture === 'string' ? metadata.picture.trim() : '';
    const picture = /^https?:\/\/\S+$/i.test(pictureValue) ? pictureValue : undefined;

    return {
      status: 'ready',
      account: {
        ...publicIdentity,
        custody: 'device-only',
        displayName,
        picture,
        setupComplete: complete === '1',
      },
    };
  } catch {
    return { status: 'invalid' };
  }
}

function nsecToSignerHex(nsec: string): string {
  const decoded = nip19.decode(nsec);
  if (decoded.type !== 'nsec' || !(decoded.data instanceof Uint8Array)) {
    throw new Error('The protected account key is not a valid Nostr secret.');
  }
  return Array.from(decoded.data, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function generateIdentity(): Promise<LocalIdentity> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const secret = await Crypto.getRandomBytesAsync(32);
    try {
      const pubkey = getPublicKey(secret);
      return { nsec: nip19.nsecEncode(secret), pubkey };
    } catch {
      // Extremely unlikely invalid scalar; retry with fresh secure randomness.
    }
  }

  throw new Error('This device could not create a secure identity. Please try again.');
}

async function createOrRestoreLocalIdentity(): Promise<LocalIdentity> {
  const runtime = getNostrRuntime();
  if (!runtime.manager) {
    throw new Error('The secure Nostr engine is unavailable. Use a Crays development build.');
  }

  const [savedNsec, savedPubkey] = await Promise.all([
    SecureStore.getItemAsync(STORAGE.nsec),
    SecureStore.getItemAsync(STORAGE.pubkey),
  ]);

  if (savedNsec && savedPubkey) {
    if (!isStoredIdentityValid(savedNsec, savedPubkey)) {
      throw new Error('The protected account key is inconsistent. Restore or reset this account.');
    }
    runtime.manager.setSigner('privkey', nsecToSignerHex(savedNsec));
    return { nsec: savedNsec, pubkey: savedPubkey };
  }

  const identity = await generateIdentity();
  // nipworker's React Native private-key signer accepts a 64-character hex
  // scalar. The durable representation remains an nsec in SecureStore.
  runtime.manager.setSigner('privkey', nsecToSignerHex(identity.nsec));
  try {
    await SecureStore.setItemAsync(STORAGE.nsec, identity.nsec, secureOptions);
    await SecureStore.setItemAsync(STORAGE.pubkey, identity.pubkey, secureOptions);
  } catch (error) {
    await Promise.allSettled([
      SecureStore.deleteItemAsync(STORAGE.nsec),
      SecureStore.deleteItemAsync(STORAGE.pubkey),
    ]);
    throw error;
  }
  if (__DEV__) console.info(`[onboarding-identity]${JSON.stringify({ pubkey: identity.pubkey })}`);
  return identity;
}

export function ensureLocalIdentity(): Promise<LocalIdentity> {
  if (!identityRequest) {
    identityRequest = createOrRestoreLocalIdentity().finally(() => {
      identityRequest = null;
    });
  }
  return identityRequest;
}

export function signActiveEvent(template: EventTemplate): Promise<Event> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const timeout = setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error('The protected signer did not respond. Please try again.'));
    }, 15000);

    useSignEvent(template, (event) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      resolve(event);
    });
  });
}

export async function createLocalProfile(displayNameInput: string): Promise<Event> {
  const displayName = normaliseDisplayName(displayNameInput);
  if (displayName.length < 2) throw new Error('Enter at least two characters for your name.');
  if (displayName.length > 50) throw new Error('Keep your display name to 50 characters or fewer.');

  const identity = await ensureLocalIdentity();
  const template: EventTemplate = {
    kind: 0,
    created_at: Math.floor(Date.now() / 1000),
    tags: [],
    content: JSON.stringify({ display_name: displayName, name: displayName }),
  };
  // nipworker 0.97.11 routes the React Native SignedEvent callback by request
  // id. The secret remains inside the configured signer and never enters the
  // route or screen state.
  const event = await signActiveEvent(template);

  if (event.pubkey !== identity.pubkey || !verifyEvent(event)) {
    throw new Error('The profile signature could not be verified. Please try again.');
  }

  await SecureStore.setItemAsync(STORAGE.profile, JSON.stringify(event), secureOptions);
  const runtime = getNostrRuntime();
  if (__DEV__) {
    console.info(
      `[onboarding-profile]${JSON.stringify({
        event,
        relayCount: runtime.manager?.getRelayStatuses().size ?? 0,
        subscriptionCount: runtime.manager?.getSubscriptionCount() ?? 0,
      })}`,
    );
  }
  return event;
}

export async function completeLocalOnboarding(): Promise<void> {
  const [profile, pubkey, nsec] = await Promise.all([
    SecureStore.getItemAsync(STORAGE.profile),
    SecureStore.getItemAsync(STORAGE.pubkey),
    SecureStore.getItemAsync(STORAGE.nsec),
  ]);
  if (!isStoredIdentityValid(nsec, pubkey) || !isStoredProfileValid(profile, pubkey)) {
    throw new Error('Your saved profile is missing or invalid. Return and save it again.');
  }
  await SecureStore.setItemAsync(STORAGE.complete, '1', secureOptions);
  if (__DEV__) console.info(`[onboarding-complete]${JSON.stringify({ recovery: 'device-only' })}`);
}

export async function getLocalPubkey(): Promise<string | null> {
  const [nsec, pubkey] = await Promise.all([
    SecureStore.getItemAsync(STORAGE.nsec),
    SecureStore.getItemAsync(STORAGE.pubkey),
  ]);
  return isStoredIdentityValid(nsec, pubkey) ? pubkey : null;
}

export async function getLocalProfileTemplate(): Promise<EventTemplate | null> {
  const [profile, pubkey] = await Promise.all([
    SecureStore.getItemAsync(STORAGE.profile),
    SecureStore.getItemAsync(STORAGE.pubkey),
  ]);
  if (!isStoredProfileValid(profile, pubkey)) return null;
  const event = JSON.parse(profile!) as Event;
  return {
    kind: 0,
    created_at: Math.floor(Date.now() / 1000),
    content: event.content,
    tags: event.tags,
  };
}

export async function resetLocalOnboarding(): Promise<void> {
  await Promise.all(Object.values(STORAGE).map((key) => SecureStore.deleteItemAsync(key)));
}

/**
 * Native-only deterministic identity setup for relay QA. This is deliberately
 * unavailable in release builds: production identities must only enter
 * through the custody/recovery surfaces above.
 */
export async function seedQaIdentity(nsec: string, displayName = 'Maya QA'): Promise<LocalIdentity> {
  if (!__DEV__) throw new Error('QA identity setup is not available in release builds.');
  const decoded = nip19.decode(nsec);
  if (decoded.type !== 'nsec' || !(decoded.data instanceof Uint8Array)) {
    throw new Error('The QA fixture key is invalid.');
  }
  const identity = { nsec, pubkey: getPublicKey(decoded.data) };
  const runtime = getNostrRuntime();
  if (!runtime.manager) throw new Error('The secure Nostr engine is unavailable.');
  runtime.manager.setSigner('privkey', nsecToSignerHex(nsec));
  const template: EventTemplate = {
    kind: 0,
    created_at: Math.floor(Date.now() / 1000),
    tags: [],
    content: JSON.stringify({ name: displayName, display_name: displayName }),
  };
  const profile = await signActiveEvent(template);
  if (profile.pubkey !== identity.pubkey || !verifyEvent(profile)) {
    throw new Error('The QA profile signature could not be verified.');
  }
  await Promise.all([
    SecureStore.setItemAsync(STORAGE.nsec, identity.nsec, secureOptions),
    SecureStore.setItemAsync(STORAGE.pubkey, identity.pubkey, secureOptions),
    SecureStore.setItemAsync(STORAGE.profile, JSON.stringify(profile), secureOptions),
    SecureStore.setItemAsync(STORAGE.complete, '1', secureOptions),
  ]);
  if (__DEV__) console.info(`[crays-qa-identity]${JSON.stringify({ pubkey: identity.pubkey })}`);
  return identity;
}

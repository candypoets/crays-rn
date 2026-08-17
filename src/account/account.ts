import '@/polyfills/text-encoding';

import { useSignEvent } from '@candypoets/nipworker/hooks';
import type { NostrManagerLike } from '@candypoets/nipworker/react-native';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { Linking } from 'react-native';
import { getPublicKey, nip19, type Event as NostrEvent, type EventTemplate, verifyEvent } from 'nostr-tools';

import {
  normaliseDisplayName,
  resolveEntryDestination,
  type EntryDestination,
} from '@/account/state';
import { getNostrRuntime } from '@/nostr/manager';

const STORAGE = {
  profile: 'crays.identity.profile',
  complete: 'crays.onboarding.complete',
} as const;

const LEGACY_CREDENTIAL_STORAGE = [
  'crays.identity.nsec',
  'crays.identity.pubkey',
  'crays.identity.signer',
] as const;

export type { EntryDestination } from '@/account/state';

export type LocalIdentity = {
  nsec?: string;
  pubkey: string;
  signer: 'nip46' | 'privkey';
};

type Nip46SignerPayload = {
  clientSecret: string;
  url: string;
};

type StoredSigner =
  | { type: 'nip46'; payload: Nip46SignerPayload }
  | { type: 'privkey' };

type PersistedIdentity = {
  pubkey: string;
  signer: StoredSigner;
};

export type LocalAccountSummary = {
  custody: 'device-only' | 'remote-signer';
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
let legacyCredentialPurge: Promise<void> | null = null;

const secureOptions: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

export async function getEntryDestination(): Promise<EntryDestination> {
  await purgeLegacyCredentialStorage();
  const identity = readPersistedIdentity(getNostrRuntime().manager);
  const [profile, complete] = await Promise.all([
    SecureStore.getItemAsync(STORAGE.profile),
    SecureStore.getItemAsync(STORAGE.complete),
  ]);

  const hasIdentity = Boolean(identity);
  return resolveEntryDestination({
    complete: complete === '1',
    hasIdentity,
    hasProfile: hasIdentity && isStoredProfileValid(profile, identity?.pubkey ?? null),
  });
}

function isNip46Payload(value: unknown): value is Nip46SignerPayload {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const payload = value as Record<string, unknown>;
  return (
    typeof payload.clientSecret === 'string' &&
    /^[0-9a-f]{64}$/i.test(payload.clientSecret) &&
    typeof payload.url === 'string' &&
    /^(?:bunker|nostrconnect):\/\//i.test(payload.url)
  );
}


function isPrivateSignerPayload(value: unknown, pubkey: string): value is string {
  if (typeof value !== 'string' || !/^[0-9a-f]{64}$/i.test(value)) return false;
  try {
    const bytes = Uint8Array.from(value.match(/../g)!.map((byte) => Number.parseInt(byte, 16)));
    return getPublicKey(bytes) === pubkey;
  } catch {
    return false;
  }
}

export function readPersistedIdentity(manager: NostrManagerLike | null): PersistedIdentity | null {
  if (!manager) return null;
  const accounts = manager.getAccounts();
  const activePubkey = manager.getActivePubkey();
  const candidates = activePubkey && accounts[activePubkey]
    ? [[activePubkey, accounts[activePubkey]] as const]
    : Object.entries(accounts);

  for (const [pubkey, account] of candidates) {
    if (!/^[0-9a-f]{64}$/i.test(pubkey)) continue;
    if (account.type === 'privkey' && isPrivateSignerPayload(account.payload, pubkey)) {
      return { pubkey, signer: { type: 'privkey' } };
    }
    if (account.type === 'nip46' && isNip46Payload(account.payload)) {
      return { pubkey, signer: { type: 'nip46', payload: account.payload } };
    }
  }
  return null;
}

async function purgeLegacyCredentialStorage(): Promise<void> {
  if (!legacyCredentialPurge) {
    legacyCredentialPurge = Promise.all(
      LEGACY_CREDENTIAL_STORAGE.map((key) => SecureStore.deleteItemAsync(key)),
    ).then(() => undefined).catch((error) => {
      legacyCredentialPurge = null;
      throw error;
    });
  }
  return legacyCredentialPurge;
}

function isStoredProfileValid(profile: string | null, pubkey: string | null): boolean {
  if (!profile || !pubkey) return false;
  try {
    const event = JSON.parse(profile) as NostrEvent;
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
 * Returns one validated, public-only view of nipworker's saved account plus
 * the signed local profile. Profile reads may reject; storage failure is never
 * evidence that a replacement identity should be generated.
 */
export async function readLocalAccountSummary(): Promise<LocalAccountRead> {
  await purgeLegacyCredentialStorage();
  const identity = readPersistedIdentity(getNostrRuntime().manager);
  const [profile, complete] = await Promise.all([
    SecureStore.getItemAsync(STORAGE.profile),
    SecureStore.getItemAsync(STORAGE.complete),
  ]);
  if (!identity) return { status: 'missing' };
  const { pubkey, signer } = identity;

  const publicIdentity = { npub: nip19.npubEncode(pubkey), pubkey };
  if (!profile) {
    return complete === '1'
      ? { status: 'invalid' }
      : { status: 'incomplete', ...publicIdentity };
  }
  if (!isStoredProfileValid(profile, pubkey)) return { status: 'invalid' };

  try {
    const event = JSON.parse(profile) as NostrEvent;
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
        custody: signer.type === 'nip46' ? 'remote-signer' : 'device-only',
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
    throw new Error('The Nostr account key is not a valid secret.');
  }
  return Array.from(decoded.data, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function generateIdentity(): Promise<LocalIdentity> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const secret = await Crypto.getRandomBytesAsync(32);
    try {
      const pubkey = getPublicKey(secret);
      return { nsec: nip19.nsecEncode(secret), pubkey, signer: 'privkey' };
    } catch {
      // Extremely unlikely invalid scalar; retry with fresh secure randomness.
    }
  }

  throw new Error('This device could not create a secure identity. Please try again.');
}

type AuthDetail = {
  error?: string;
  hasSigner?: boolean;
  pubkey?: string | null;
};

function waitForSigner(
  manager: NostrManagerLike,
  start: () => void,
  { expectedPubkey, signal, timeoutMs = 30_000 }: {
    expectedPubkey?: string;
    signal?: AbortSignal;
    timeoutMs?: number;
  } = {},
): Promise<string> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (pubkey?: string, error?: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      manager.removeEventListener('auth', onAuth);
      signal?.removeEventListener('abort', onAbort);
      if (error) reject(error);
      else resolve(pubkey!);
    };
    const onAbort = () => finish(undefined, new Error('Signer connection cancelled.'));
    const onAuth = ((event: globalThis.Event & { detail?: AuthDetail }) => {
      const detail = event.detail;
      if (detail?.error) {
        finish(undefined, new Error(`The signer rejected the connection: ${detail.error}`));
        return;
      }
      if (!detail?.pubkey || !detail.hasSigner) return;
      if (!/^[0-9a-f]{64}$/i.test(detail.pubkey)) {
        finish(undefined, new Error('The signer returned an invalid public identity.'));
        return;
      }
      if (expectedPubkey && detail.pubkey !== expectedPubkey) {
        finish(undefined, new Error('The signer returned a different public identity.'));
        return;
      }
      finish(detail.pubkey);
    }) as EventListener;
    const timeout = setTimeout(
      () => finish(undefined, new Error('The signer did not respond in time. Try again from your signer app.')),
      timeoutMs,
    );
    manager.addEventListener('auth', onAuth);
    signal?.addEventListener('abort', onAbort, { once: true });
    try {
      start();
    } catch (cause) {
      finish(undefined, cause instanceof Error ? cause : new Error('The signer could not be started.'));
    }
  });
}

async function assertNoStoredIdentity(): Promise<void> {
  await purgeLegacyCredentialStorage();
  const manager = getNostrRuntime().manager;
  if (manager && (manager.getActivePubkey() || Object.keys(manager.getAccounts()).length > 0)) {
    throw new Error('An identity already exists on this device. Remove it from Settings before adding another.');
  }
  await Promise.all([
    SecureStore.deleteItemAsync(STORAGE.profile),
    SecureStore.deleteItemAsync(STORAGE.complete),
  ]);
}

async function resetOnboardingProjection(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(STORAGE.profile),
    SecureStore.deleteItemAsync(STORAGE.complete),
  ]);
}

async function activateStoredIdentity(): Promise<LocalIdentity> {
  await purgeLegacyCredentialStorage();
  const runtime = getNostrRuntime();
  if (!runtime.manager) {
    throw new Error('The secure Nostr engine is unavailable. Use a Crays development build.');
  }

  const identity = readPersistedIdentity(runtime.manager);
  if (!identity) {
    throw new Error('No valid Nostr identity is available on this device. Log in or create one first.');
  }
  if (runtime.manager.getActivePubkey() === identity.pubkey) {
    return { pubkey: identity.pubkey, signer: identity.signer.type };
  }

  await waitForSigner(
    runtime.manager,
    () => runtime.manager!.switchAccount(identity.pubkey),
    { expectedPubkey: identity.pubkey, timeoutMs: identity.signer.type === 'nip46' ? 60_000 : 15_000 },
  );
  return { pubkey: identity.pubkey, signer: identity.signer.type };
}

export function ensureActiveIdentity(): Promise<LocalIdentity> {
  if (!identityRequest) {
    identityRequest = activateStoredIdentity().finally(() => {
      identityRequest = null;
    });
  }
  return identityRequest;
}

export async function createLocalIdentity(): Promise<LocalIdentity> {
  await assertNoStoredIdentity();
  const runtime = getNostrRuntime();
  if (!runtime.manager) throw new Error('The secure Nostr engine is unavailable. Use a Crays development build.');
  const identity = await generateIdentity();
  await waitForSigner(
    runtime.manager,
    () => runtime.manager!.setSigner('privkey', nsecToSignerHex(identity.nsec!)),
    { expectedPubkey: identity.pubkey, timeoutMs: 15_000 },
  );
  await resetOnboardingProjection();
  if (__DEV__) console.info(`[onboarding-identity]${JSON.stringify({ pubkey: identity.pubkey, signer: 'privkey' })}`);
  return identity;
}

export async function importNostrSecret(secretInput: string): Promise<LocalIdentity> {
  await assertNoStoredIdentity();
  const nsec = secretInput.trim();
  let pubkey: string;
  try {
    const decoded = nip19.decode(nsec);
    if (decoded.type !== 'nsec' || !(decoded.data instanceof Uint8Array)) throw new Error('not nsec');
    pubkey = getPublicKey(decoded.data);
  } catch {
    throw new Error('Enter a valid Nostr secret key beginning with nsec1.');
  }
  const runtime = getNostrRuntime();
  if (!runtime.manager) throw new Error('The secure Nostr engine is unavailable. Use a Crays development build.');
  await waitForSigner(
    runtime.manager,
    () => runtime.manager!.setSigner('privkey', nsecToSignerHex(nsec)),
    { expectedPubkey: pubkey, timeoutMs: 15_000 },
  );
  const identity: LocalIdentity = { nsec, pubkey, signer: 'privkey' };
  await resetOnboardingProjection();
  if (__DEV__) console.info(`[onboarding-identity]${JSON.stringify({ pubkey, signer: 'imported-privkey' })}`);
  return identity;
}

export async function connectNip46Signer({
  clientSecret,
  signal,
  url,
}: Nip46SignerPayload & { signal?: AbortSignal }): Promise<LocalIdentity> {
  await assertNoStoredIdentity();
  if (!isNip46Payload({ clientSecret, url })) throw new Error('Enter a valid Nostr Connect or bunker link.');
  const runtime = getNostrRuntime();
  if (!runtime.manager) throw new Error('The secure Nostr engine is unavailable. Use a Crays development build.');
  try {
    const pubkey = await waitForSigner(
      runtime.manager,
      () => runtime.manager!.setSigner('nip46', { clientSecret, url }),
      { signal, timeoutMs: 120_000 },
    );
    const saved = runtime.manager.getAccounts()[pubkey];
    const payload = saved?.type === 'nip46' && isNip46Payload(saved.payload)
      ? saved.payload
      : { clientSecret, url };
    if (url.startsWith('nostrconnect://') && !payload.url.startsWith('bunker://')) {
      runtime.manager.removeAccount();
      throw new Error('The signer connected without a reusable bunker session. Please try again.');
    }
    const identity: LocalIdentity = { pubkey, signer: 'nip46' };
    await resetOnboardingProjection();
    if (__DEV__) console.info(`[onboarding-identity]${JSON.stringify({ pubkey, signer: 'nip46' })}`);
    return identity;
  } catch (error) {
    runtime.manager.logout();
    throw error;
  }
}

export function cancelPendingSignerConnection(): void {
  getNostrRuntime().manager?.logout();
}

export function signActiveEvent(template: EventTemplate): Promise<NostrEvent> {
  return new Promise((resolve, reject) => {
    const manager = getNostrRuntime().manager;
    let settled = false;
    const timeout = setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error('The protected signer did not respond. Please try again.'));
      manager?.removeEventListener('authUrl', onAuthUrl);
    }, 90_000);

    const onAuthUrl = ((event: globalThis.Event & { detail?: { url?: string } }) => {
      const url = event.detail?.url;
      if (/^https?:\/\//i.test(url || '')) void Linking.openURL(url!).catch(() => undefined);
    }) as EventListener;
    manager?.addEventListener('authUrl', onAuthUrl);

    useSignEvent(template, (event) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      manager?.removeEventListener('authUrl', onAuthUrl);
      resolve(event);
    });
  });
}

export async function createLocalProfile(displayNameInput: string): Promise<NostrEvent> {
  const displayName = normaliseDisplayName(displayNameInput);
  if (displayName.length < 2) throw new Error('Enter at least two characters for your name.');
  if (displayName.length > 50) throw new Error('Keep your display name to 50 characters or fewer.');

  const identity = await ensureActiveIdentity();
  const template: EventTemplate = {
    kind: 0,
    created_at: Math.floor(Date.now() / 1000),
    tags: [],
    content: JSON.stringify({ display_name: displayName, name: displayName }),
  };
  // nipworker routes the React Native SignedEvent callback by request
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
  await purgeLegacyCredentialStorage();
  const identity = readPersistedIdentity(getNostrRuntime().manager);
  const profile = await SecureStore.getItemAsync(STORAGE.profile);
  if (!identity || !isStoredProfileValid(profile, identity.pubkey)) {
    throw new Error('Your saved profile is missing or invalid. Return and save it again.');
  }
  await SecureStore.setItemAsync(STORAGE.complete, '1', secureOptions);
  if (__DEV__) console.info(`[onboarding-complete]${JSON.stringify({ recovery: identity.signer.type === 'nip46' ? 'remote-signer' : 'device-only' })}`);
}

export async function getLocalPubkey(): Promise<string | null> {
  await purgeLegacyCredentialStorage();
  return readPersistedIdentity(getNostrRuntime().manager)?.pubkey ?? null;
}

export async function getLocalProfileTemplate(): Promise<EventTemplate | null> {
  await purgeLegacyCredentialStorage();
  const identity = readPersistedIdentity(getNostrRuntime().manager);
  const profile = await SecureStore.getItemAsync(STORAGE.profile);
  if (!identity || !isStoredProfileValid(profile, identity.pubkey)) return null;
  const event = JSON.parse(profile!) as NostrEvent;
  return {
    kind: 0,
    created_at: Math.floor(Date.now() / 1000),
    content: event.content,
    tags: event.tags,
  };
}

export async function resetLocalOnboarding(): Promise<void> {
  await Promise.all([
    purgeLegacyCredentialStorage(),
    ...Object.values(STORAGE).map((key) => SecureStore.deleteItemAsync(key)),
  ]);
  const manager = getNostrRuntime().manager;
  manager?.removeAccount();
  manager?.logout();
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
  const identity: LocalIdentity = { nsec, pubkey: getPublicKey(decoded.data), signer: 'privkey' };
  const runtime = getNostrRuntime();
  if (!runtime.manager) throw new Error('The secure Nostr engine is unavailable.');
  await purgeLegacyCredentialStorage();
  await waitForSigner(
    runtime.manager,
    () => runtime.manager!.setSigner('privkey', nsecToSignerHex(nsec)),
    { expectedPubkey: identity.pubkey, timeoutMs: 15_000 },
  );
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
    SecureStore.setItemAsync(STORAGE.profile, JSON.stringify(profile), secureOptions),
    SecureStore.setItemAsync(STORAGE.complete, '1', secureOptions),
  ]);
  if (__DEV__) console.info(`[crays-qa-identity]${JSON.stringify({ pubkey: identity.pubkey })}`);
  return identity;
}

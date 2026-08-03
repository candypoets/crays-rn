import * as SecureStore from 'expo-secure-store';

const CONTEXT_KEY = 'crays.entry.context.v1';

export type InviteEntryContext = {
  kind: 'invite';
  serviceUrl: string;
  relayUrl?: string;
  roomId?: string;
  token: string;
};

export type EntryContext = InviteEntryContext;

function validContext(value: string | null): EntryContext | null {
  if (!value) return null;
  try {
    const candidate = JSON.parse(value) as EntryContext;
    if (
      candidate.kind === 'invite' &&
      /^https?:\/\//.test(candidate.serviceUrl) &&
      candidate.token.length > 20
    ) return candidate;
  } catch {
    // Invalid navigation context is discarded; it never changes account data.
  }
  return null;
}

export async function saveEntryContext(context: EntryContext): Promise<void> {
  await SecureStore.setItemAsync(CONTEXT_KEY, JSON.stringify(context));
}

export async function getEntryContext(): Promise<EntryContext | null> {
  return validContext(await SecureStore.getItemAsync(CONTEXT_KEY));
}

export async function clearEntryContext(): Promise<void> {
  await SecureStore.deleteItemAsync(CONTEXT_KEY);
}

export function entryContextHref(context: EntryContext): { pathname: '/invite'; params: Record<string, string> } {
  return {
    pathname: '/invite',
    params: {
      service: context.serviceUrl,
      token: context.token,
      ...(context.relayUrl ? { relay: context.relayUrl } : {}),
      ...(context.roomId ? { room: context.roomId } : {}),
    },
  };
}

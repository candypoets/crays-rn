import * as SecureStore from 'expo-secure-store';
import type { PropsWithChildren } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

const STORAGE_KEY = 'crays.safety.blocks.v1';

export type BlockScope = 'global' | 'venue';
export type BlockRecord = {
  pubkey: string;
  scope: BlockScope;
  roomId?: string;
  label?: string;
  createdAt: number;
};

export function parseBlockRecords(value: string | null): BlockRecord[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((item): BlockRecord[] => {
      if (!item || typeof item !== 'object') return [];
      const record = item as Partial<BlockRecord>;
      const valid = /^[0-9a-f]{64}$/i.test(record.pubkey || '') &&
        (record.scope === 'global' || (record.scope === 'venue' && typeof record.roomId === 'string' && Boolean(record.roomId))) &&
        Number.isSafeInteger(record.createdAt);
      if (!valid) return [];
      return [{ pubkey: record.pubkey!, scope: record.scope!, ...(record.scope === 'venue' ? { roomId: record.roomId } : {}), ...(typeof record.label === 'string' && record.label.trim() ? { label: record.label.trim().slice(0, 80) } : {}), createdAt: record.createdAt! }];
    }).slice(0, 1_000);
  } catch { return []; }
}

function recordKey(record: Pick<BlockRecord, 'pubkey' | 'scope' | 'roomId'>): string {
  return `${record.pubkey}:${record.scope}:${record.roomId || '*'}`;
}

type SafetyValue = {
  blocks: BlockRecord[];
  hydrated: boolean;
  storageError: string | null;
  block: (pubkey: string, scope: BlockScope, roomId?: string, label?: string) => Promise<void>;
  unblock: (pubkey: string, scope?: BlockScope, roomId?: string) => Promise<void>;
  isBlocked: (pubkey: string, roomId?: string) => boolean;
};

const SafetyContext = createContext<SafetyValue | null>(null);

export function SafetyProvider({ children }: PropsWithChildren) {
  const [blocks, setBlocks] = useState<BlockRecord[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  const blocksRef = useRef<BlockRecord[]>([]);
  const mutationQueue = useRef<Promise<void>>(Promise.resolve());
  useEffect(() => {
    let current = true;
    void SecureStore.getItemAsync(STORAGE_KEY)
      .then((value) => {
        if (!current) return;
        const next = parseBlockRecords(value);
        blocksRef.current = next;
        setBlocks(next);
      })
      .catch(() => {
        if (current) setStorageError('The protected block list could not be read on this device.');
      })
      .finally(() => {
        if (current) setHydrated(true);
      });
    return () => {
      current = false;
    };
  }, []);

  const mutate = useCallback((project: (current: BlockRecord[]) => BlockRecord[]) => {
    const operation = mutationQueue.current.then(async () => {
      const next = project(blocksRef.current);
      await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(next));
      blocksRef.current = next;
      setBlocks(next);
    });
    mutationQueue.current = operation.catch(() => undefined);
    return operation;
  }, []);
  const block = useCallback(async (pubkey: string, scope: BlockScope, roomId?: string, label?: string) => {
    if (!/^[0-9a-f]{64}$/i.test(pubkey)) throw new Error('The selected identity is invalid.');
    if (scope === 'venue' && !roomId) throw new Error('A room is required for a venue block.');
    const record: BlockRecord = { pubkey, scope, ...(scope === 'venue' ? { roomId } : {}), ...(label?.trim() ? { label: label.trim().slice(0, 80) } : {}), createdAt: Date.now() };
    const key = recordKey(record);
    await mutate((current) => [record, ...current.filter((candidate) => recordKey(candidate) !== key)]);
  }, [mutate]);
  const unblock = useCallback(async (pubkey: string, scope?: BlockScope, roomId?: string) => {
    await mutate((current) => current.filter((record) => !(record.pubkey === pubkey && (!scope || record.scope === scope) && (!roomId || record.roomId === roomId))));
  }, [mutate]);
  const isBlocked = useCallback((pubkey: string, roomId?: string) => blocks.some((record) => record.pubkey === pubkey && (record.scope === 'global' || (record.scope === 'venue' && record.roomId === roomId))), [blocks]);
  const value = useMemo(() => ({ block, blocks, hydrated, isBlocked, storageError, unblock }), [block, blocks, hydrated, isBlocked, storageError, unblock]);
  return <SafetyContext.Provider value={value}>{children}</SafetyContext.Provider>;
}

export function useSafety(): SafetyValue {
  const value = useContext(SafetyContext);
  if (!value) throw new Error('useSafety must be used inside SafetyProvider');
  return value;
}

import type { BlockRecord } from '@/safety/Safety';

export const BLOCK_REMOVED_REFRESH_WARNING = 'The block was removed, but its conversation could not be refreshed. Reopen Messages to retry.';

export function unblockConfirmationCopy(record: BlockRecord) {
  const person = record.label?.trim() || `Person ${record.pubkey.slice(0, 8)}`;
  const scope = record.scope === 'global' ? 'everywhere' : 'in this room';
  return {
    message: record.scope === 'global'
      ? `${person} will be able to appear in rooms and contact you again.`
      : `${person} will be visible in this room again. Any global block remains in place.`,
    title: `Unblock ${person} ${scope}?`,
  };
}

export async function unblockAndRefreshConversation({
  record,
  refreshConversation,
  unblock,
}: {
  record: BlockRecord;
  refreshConversation: (pubkey: string) => Promise<void>;
  unblock: (pubkey: string, scope: BlockRecord['scope'], roomId?: string) => Promise<void>;
}) {
  await unblock(record.pubkey, record.scope, record.roomId);
  if (record.scope !== 'global') return null;
  try {
    await refreshConversation(record.pubkey);
    return null;
  } catch {
    return BLOCK_REMOVED_REFRESH_WARNING;
  }
}

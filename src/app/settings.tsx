import { router } from 'expo-router';
import { useState } from 'react';

import { updateLocalConversation } from '@/messages/store';
import type { BlockRecord } from '@/safety/Safety';
import { useSafety } from '@/safety/Safety';
import { SettingsScreen } from '@/screens/settings/SettingsScreen';

export default function SettingsRoute() {
  const { blocks, unblock } = useSafety();
  const [error, setError] = useState<string | null>(null);
  const remove = async (record: BlockRecord) => {
    setError(null);
    try {
      await unblock(record.pubkey, record.scope, record.roomId);
      if (record.scope === 'global') await updateLocalConversation(record.pubkey, 'ignored');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'The block could not be removed.'); }
  };
  return <SettingsScreen blocks={blocks} error={error} onBack={() => router.back()} onUnblock={(record) => void remove(record)} />;
}

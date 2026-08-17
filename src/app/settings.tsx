import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Alert } from 'react-native';

import { readLocalAccountSummary, type LocalAccountSummary } from '@/account/account';
import { updateLocalConversation } from '@/messages/store';
import type { BlockRecord } from '@/safety/Safety';
import { useSafety } from '@/safety/Safety';
import { SettingsScreen } from '@/screens/settings/SettingsScreen';
import { unblockAndRefreshConversation, unblockConfirmationCopy } from '@/screens/settings/unblock';

export default function SettingsRoute() {
  const { blocks, hydrated, storageError, unblock } = useSafety();
  const [error, setError] = useState<string | null>(null);
  const [unblockingKey, setUnblockingKey] = useState<string | null>(null);
  const [custody, setCustody] = useState<LocalAccountSummary['custody'] | 'unknown'>('unknown');
  const unblockingRef = useRef(false);
  useEffect(() => {
    let active = true;
    void readLocalAccountSummary().then((result) => {
      if (active && result.status === 'ready') setCustody(result.account.custody);
    }).catch(() => undefined);
    return () => { active = false; };
  }, []);
  const remove = async (record: BlockRecord) => {
    const key = `${record.pubkey}:${record.scope}:${record.roomId || '*'}`;
    if (unblockingRef.current) return;
    unblockingRef.current = true;
    setError(null);
    setUnblockingKey(key);
    try {
      const warning = await unblockAndRefreshConversation({
        record,
        refreshConversation: (pubkey) => updateLocalConversation(pubkey, 'ignored'),
        unblock,
      });
      if (warning) {
        setError(warning);
        AccessibilityInfo.announceForAccessibility(warning);
      } else {
        AccessibilityInfo.announceForAccessibility(`${record.label || 'Person'} unblocked.`);
      }
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'The block could not be removed.';
      setError(message);
      AccessibilityInfo.announceForAccessibility(message);
    } finally {
      unblockingRef.current = false;
      setUnblockingKey(null);
    }
  };
  const confirmRemove = (record: BlockRecord) => {
    const copy = unblockConfirmationCopy(record);
    Alert.alert(copy.title, copy.message, [
      { style: 'cancel', text: 'Keep blocked' },
      { onPress: () => void remove(record), text: 'Unblock' },
    ]);
  };
  return (
    <SettingsScreen
      blocks={blocks}
      blocksError={storageError}
      custody={custody}
      error={error}
      loading={!hydrated}
      onBack={() => router.back()}
      onUnblock={confirmRemove}
      unblockingKey={unblockingKey}
    />
  );
}

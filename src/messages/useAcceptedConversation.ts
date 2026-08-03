import { useEffect, useState } from 'react';

import { hasAcceptedConversation, loadLocalMessages } from '@/messages/store';

export function useAcceptedConversation(pubkey?: string): boolean | null {
  const [result, setResult] = useState<{ pubkey: string; accepted: boolean } | null>(null);

  useEffect(() => {
    let active = true;
    if (!pubkey) return () => { active = false; };
    void loadLocalMessages().then((messages) => {
      if (active) setResult({ pubkey, accepted: hasAcceptedConversation(messages, pubkey) });
    });
    return () => { active = false; };
  }, [pubkey]);

  if (!pubkey) return true;
  return result?.pubkey === pubkey ? result.accepted : null;
}

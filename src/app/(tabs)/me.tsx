import { router, useIsFocused } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { readLocalAccountSummary } from '@/account/account';
import { listTickets } from '@/access/tickets';
import { useRoomData } from '@/rooms/RoomData';
import { countUsableEventAccess, hasUsableDurableAccess, MeScreen, type MeAccountState } from '@/screens/durable/AccountWalletScreens';
import { useRoomSession } from '@/session/RoomSession';

export default function MeRoute() {
  const focused = useIsFocused();
  const data = useRoomData();
  const { activeRoom } = useRoomSession();
  const [ticketCount, setTicketCount] = useState(0);
  const [ticketsLoaded, setTicketsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accountState, setAccountState] = useState<MeAccountState>({ status: 'loading' });
  const accountReadGeneration = useRef(0);

  const loadAccount = useCallback(() => {
    const generation = ++accountReadGeneration.current;
    void readLocalAccountSummary().then((result) => {
      if (generation !== accountReadGeneration.current) return;
      setAccountState(result);
      if (__DEV__ && result.status === 'ready') {
        console.info(`[crays-me-profile]${JSON.stringify({
          custody: result.account.custody,
          displayName: result.account.displayName,
          npub: result.account.npub,
          pubkey: result.account.pubkey,
          setupComplete: result.account.setupComplete,
          verified: true,
        })}`);
      }
    }).catch(() => {
      if (generation !== accountReadGeneration.current) return;
      setAccountState({ status: 'error', message: 'Crays could not read the protected profile on this device.' });
    });
  }, []);

  const retryAccount = useCallback(() => {
    setAccountState({ status: 'loading' });
    loadAccount();
  }, [loadAccount]);

  useEffect(() => {
    if (!focused) return;
    loadAccount();
    return () => {
      accountReadGeneration.current += 1;
    };
  }, [focused, loadAccount]);

  useEffect(() => {
    if (!focused) return;
    let active = true;
    void listTickets().then((tickets) => {
      if (!active) return;
      setError(null);
      setTicketCount(tickets.length);
    }).catch((cause) => {
      if (active) setError(cause instanceof Error ? cause.message : 'Saved tickets could not be read on this device.');
    }).finally(() => {
      if (active) setTicketsLoaded(true);
    });
    return () => {
      active = false;
    };
  }, [focused]);

  const hasMembership = hasUsableDurableAccess(data.entitlements);
  const durableError = error || data.archiveError;
  const offline = Boolean(activeRoom && data.archiveHydrated && !data.loading && !data.connected);

  return (
    <MeScreen
      accountState={accountState}
      error={durableError}
      hasMembership={hasMembership}
      loading={!data.archiveHydrated || !ticketsLoaded}
      offline={offline}
      refreshing={Boolean(activeRoom && data.loading)}
      ticketCount={ticketCount + countUsableEventAccess(data.entitlements)}
      onMemberships={() => router.push('/memberships' as never)}
      onOrders={() => router.push('/orders' as never)}
      onProfile={() => router.push('/settings' as never)}
      onRetryAccount={retryAccount}
      onTickets={() => router.push('/tickets' as never)}
    />
  );
}

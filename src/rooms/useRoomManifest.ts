import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { asPreGeneric, isParsedEvent } from '@candypoets/nipworker/utils';
import { useSubscription as subscribeToNostr } from '@candypoets/nipworker/hooks';

import { getLocalPubkey } from '@/account/account';
import { subscribeNip04Messages } from '@/messages/subscription';
import { CRAYS_PROTOCOL, pilotD } from '@/nostr/protocol';
import { projectRoomManifest } from '@/rooms/projections';
import type { RoomDescriptor } from '@/rooms/types';

type ManifestState = {
  loading: boolean;
  room: RoomDescriptor | null;
  error: string | null;
};

export function useRoomManifest(relayUrl?: string, roomId?: string): ManifestState {
  const [state, setState] = useState<ManifestState>({ loading: Boolean(relayUrl), room: null, error: null });

  useEffect(() => {
    if (!relayUrl) {
      // The hook owns this external relay projection and clears it when detached.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState({ loading: false, room: null, error: null });
      return;
    }
    setState({ loading: true, room: null, error: null });
    let unsubscribeAuth = () => {};
    let unsubscribeManifest = () => {};
    let subscribeTimer: ReturnType<typeof setTimeout> | null = null;
    let timeout: ReturnType<typeof setTimeout> | null = null;
    let authSubscribed = false;
    let manifestSubscribed = false;
    let lifecycle = 0;

    // A deep link foregrounds Android immediately before this effect runs.
    // nipworker replaces live sockets during that foreground wake, so opening
    // a REQ in the same native tick can race the replacement connection. The
    // small settle window lets the lifecycle wake finish before this screen
    // takes ownership of its stable subscription.
    const stop = () => {
      lifecycle += 1;
      if (subscribeTimer) clearTimeout(subscribeTimer);
      if (timeout) clearTimeout(timeout);
      subscribeTimer = null;
      timeout = null;
      if (authSubscribed) unsubscribeAuth();
      if (manifestSubscribed) unsubscribeManifest();
      unsubscribeAuth = () => {};
      unsubscribeManifest = () => {};
      authSubscribed = false;
      manifestSubscribed = false;
    };

    const startAfterForegroundSettles = () => {
      stop();
      const currentLifecycle = lifecycle;
      subscribeTimer = setTimeout(() => {
        subscribeTimer = null;
        const startManifest = () => {
          if (currentLifecycle !== lifecycle || manifestSubscribed) return;
          const subId = `room_manifest_${roomId || relayUrl.replace(/[^a-z0-9]/gi, '_')}`;
          unsubscribeManifest = subscribeToNostr(
            subId,
            [{
              kinds: [CRAYS_PROTOCOL.roomManifestKind],
              ...(roomId ? { tags: { '#d': [pilotD.room(roomId)] } } : {}),
              relays: [relayUrl],
              limit: 10,
              noCache: true,
              // Live RequestObject field: nipworker 0.97.11 forwards it to the
              // worker (distinct from the subscription-level closeOnEose below).
              closeOnEOSE: true,
            }],
            (message) => {
              const parsed = isParsedEvent(message);
              if (!parsed) return;
              const generic = asPreGeneric(parsed);
              if (!generic) return;
              const room = projectRoomManifest(parsed, generic);
              if (room) {
                if (__DEV__) console.info(`[crays-room-manifest]${JSON.stringify({ id: room.id, relayUrl: room.relayUrl, operatorPubkey: room.operatorPubkey })}`);
                setState({ loading: false, room, error: null });
              }
            },
            { closeOnEose: true },
          );
          manifestSubscribed = true;
        };

        timeout = setTimeout(() => {
          setState((current) => current.room ? current : {
            loading: false,
            room: null,
            error: 'This room did not return a fresh, verified room card.',
          });
        }, 10_000);

        // Once an identity exists, make the private NIP-04 REQ the first frame
        // on this venue connection. The retained lease also lets RoomData and
        // Messages share the authenticated socket without mirroring events.
        void getLocalPubkey().then((pubkey) => {
          if (currentLifecycle !== lifecycle) return;
          if (!pubkey) {
            startManifest();
            return;
          }
          unsubscribeAuth = subscribeNip04Messages({
            onEvent: () => undefined,
            onReady: startManifest,
            pubkey,
            relays: [relayUrl],
          });
          authSubscribed = true;
        }).catch(() => {
          if (currentLifecycle === lifecycle) {
            setState({ loading: false, room: null, error: 'Your room identity could not be opened on this device.' });
          }
        });
      }, 350);
    };

    if (AppState.currentState === 'active') startAfterForegroundSettles();
    const appStateSubscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') startAfterForegroundSettles();
      else stop();
    });

    return () => {
      appStateSubscription.remove();
      stop();
    };
  }, [relayUrl, roomId]);

  return state;
}

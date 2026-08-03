import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { asPreGeneric, isParsedEvent } from '@candypoets/nipworker/utils';
import { useSubscription as subscribeToNostr } from '@candypoets/nipworker/hooks';

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
    let unsubscribe = () => {};
    let subscribeTimer: ReturnType<typeof setTimeout> | null = null;
    let timeout: ReturnType<typeof setTimeout> | null = null;
    let subscribed = false;

    // A deep link foregrounds Android immediately before this effect runs.
    // nipworker replaces live sockets during that foreground wake, so opening
    // a REQ in the same native tick can race the replacement connection. The
    // small settle window lets the lifecycle wake finish before this screen
    // takes ownership of its stable subscription.
    const stop = () => {
      if (subscribeTimer) clearTimeout(subscribeTimer);
      if (timeout) clearTimeout(timeout);
      subscribeTimer = null;
      timeout = null;
      if (subscribed) unsubscribe();
      unsubscribe = () => {};
      subscribed = false;
    };

    const startAfterForegroundSettles = () => {
      stop();
      subscribeTimer = setTimeout(() => {
        subscribeTimer = null;
        const subId = `room_manifest_${roomId || relayUrl.replace(/[^a-z0-9]/gi, '_')}`;
        unsubscribe = subscribeToNostr(
          subId,
          [{
            kinds: [CRAYS_PROTOCOL.roomManifestKind],
            ...(roomId ? { tags: { '#d': [pilotD.room(roomId)] } } : {}),
            relays: [relayUrl],
            limit: 10,
            noCache: true,
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
        subscribed = true;
        timeout = setTimeout(() => {
          setState((current) => current.room ? current : {
            loading: false,
            room: null,
            error: 'This room did not return a fresh, verified room card.',
          });
        }, 10_000);
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

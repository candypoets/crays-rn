import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { useSubscription as subscribeToNostr } from '@candypoets/nipworker/hooks';
import { isParsedEvent } from '@candypoets/nipworker/utils';

import { getLocalPubkey } from '@/account/account';
import { isNewerAnchor, parseCommunityAnchor, type CommunityAnchor } from '@/access/nip97';
import { subscribeNip04Messages } from '@/messages/subscription';
import { CRAYS_PROTOCOL } from '@/nostr/protocol';
import {
  isNewerRoomDefinition,
  projectRoomDefinition,
  type VersionedRoomDefinition,
} from '@/rooms/roomDefinition';
import { fetchRelayRootPubkeyWithRetry, trustFromAnchor } from '@/rooms/trust';
import type { RoomDescriptor } from '@/rooms/types';

type RoomDefinitionState = {
  loading: boolean;
  room: RoomDescriptor | null;
  error: string | null;
};

function subscriptionSuffix(relayUrl: string, roomId?: string): string {
  return `${roomId || 'any'}_${relayUrl}`.replace(/[^a-z0-9]/gi, '_').slice(-80);
}

/** Resolve one room through NIP-11 root -> NIP-97 anchor -> NIP-53 30312. */
export function useRoomDefinition(relayUrl?: string, roomId?: string): RoomDefinitionState {
  const [state, setState] = useState<RoomDefinitionState>({ loading: Boolean(relayUrl), room: null, error: null });

  useEffect(() => {
    if (!relayUrl) {
      // This hook owns the external relay projection and clears it when detached.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState({ loading: false, room: null, error: null });
      return;
    }

    setState({ loading: true, room: null, error: null });
    let lifecycle = 0;
    let settleTimer: ReturnType<typeof setTimeout> | null = null;
    let timeout: ReturnType<typeof setTimeout> | null = null;
    let unsubscribeAuth: () => void = () => undefined;
    let unsubscribeAnchor: () => void = () => undefined;
    let unsubscribeRoom: () => void = () => undefined;
    let resolving = false;
    let trustSubscribed = false;
    const suffix = subscriptionSuffix(relayUrl, roomId);

    const stop = () => {
      lifecycle += 1;
      if (settleTimer) clearTimeout(settleTimer);
      if (timeout) clearTimeout(timeout);
      settleTimer = null;
      timeout = null;
      unsubscribeAuth();
      unsubscribeAnchor();
      unsubscribeRoom();
      unsubscribeAuth = () => undefined;
      unsubscribeAnchor = () => undefined;
      unsubscribeRoom = () => undefined;
      resolving = false;
      trustSubscribed = false;
    };

    const startAfterForegroundSettles = () => {
      stop();
      const currentLifecycle = lifecycle;
      settleTimer = setTimeout(() => {
        settleTimer = null;
        timeout = setTimeout(() => {
          setState((current) => current.room ? current : {
            loading: false,
            room: null,
            error: 'This room did not return a root-authorized NIP-53 room definition.',
          });
        }, 10_000);

        const resolveTrustAndRoom = async () => {
          if (resolving || trustSubscribed) return;
          resolving = true;
          try {
            const rootPubkey = await fetchRelayRootPubkeyWithRetry(relayUrl);
            if (currentLifecycle !== lifecycle) return;
            trustSubscribed = true;
            let currentAnchor: CommunityAnchor | null = null;
            unsubscribeAnchor = subscribeToNostr(
              `room_anchor_lookup_${suffix}`,
              [{
                kinds: [CRAYS_PROTOCOL.anchorKind],
                authors: [rootPubkey],
                tags: { '#d': ['community'] },
                relays: [relayUrl],
                limit: 10,
                noCache: true,
              }],
              (message) => {
                const event = isParsedEvent(message);
                if (!event) return;
                const anchor = parseCommunityAnchor(event);
                if (!anchor || anchor.pubkey !== rootPubkey) return;
                if (currentAnchor && !isNewerAnchor(anchor, currentAnchor)) return;
                currentAnchor = anchor;
                const trust = trustFromAnchor(anchor);
                const authors = [...new Set([rootPubkey, ...trust.admins])];
                let currentRoom: VersionedRoomDefinition | null = null;
                unsubscribeRoom();
                setState({ loading: true, room: null, error: null });
                unsubscribeRoom = subscribeToNostr(
                  `room_definition_lookup_${suffix}`,
                  [{
                    kinds: [CRAYS_PROTOCOL.roomDefinitionKind],
                    authors,
                    ...(roomId ? { tags: { '#d': [roomId] } } : {}),
                    relays: [relayUrl],
                    limit: 50,
                    noCache: true,
                  }],
                  (roomMessage) => {
                    const roomEvent = isParsedEvent(roomMessage);
                    if (!roomEvent) return;
                    const room = projectRoomDefinition(roomEvent, trust, relayUrl);
                    if (!room || (roomId && room.id !== roomId)) return;
                    const candidate = {
                      eventId: roomEvent.id() ?? '',
                      createdAt: roomEvent.createdAt(),
                      room,
                    };
                    if (currentRoom && !isNewerRoomDefinition(candidate, currentRoom)) return;
                    currentRoom = candidate;
                    if (timeout) clearTimeout(timeout);
                    if (__DEV__) console.info(`[crays-room-definition]${JSON.stringify({
                      id: room.id,
                      address: room.address,
                      relayUrl: room.relayUrl,
                      rootPubkey: room.rootPubkey,
                      operatorPubkey: room.operatorPubkey,
                    })}`);
                    setState({ loading: false, room, error: null });
                  },
                  { closeOnEose: false },
                );
              },
              { closeOnEose: false },
            );
          } catch (cause) {
            if (currentLifecycle !== lifecycle) return;
            trustSubscribed = false;
            if (timeout) clearTimeout(timeout);
            setState({
              loading: false,
              room: null,
              error: cause instanceof Error ? cause.message : 'This room could not establish its community authority.',
            });
          } finally {
            resolving = false;
          }
        };

        // Community anchors and NIP-53 room definitions are public discovery
        // metadata. Resolve them independently of the private-message lease:
        // a relay whose NIP-42/NIP-04 service is unavailable must not make a
        // valid, root-authorized room disappear from Discover.
        void resolveTrustAndRoom();
        void getLocalPubkey().then((pubkey) => {
          if (currentLifecycle !== lifecycle) return;
          if (!pubkey) return;
          unsubscribeAuth = subscribeNip04Messages({
            onEvent: () => undefined,
            onReady: () => undefined,
            pubkey,
            relays: [relayUrl],
          });
        }).catch(() => undefined);
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

export type RoomRelayAuth = {
  key: string;
  status: 'pending' | 'ready' | 'failed';
};

/**
 * Anonymous room sessions only read public venue families and can open them
 * immediately. Identified sessions must first establish the private NIP-04
 * lease so nipworker cannot classify a public EVENT as the connection's auth
 * decision before the relay has challenged the private request.
 */
export function canOpenRoomSubscriptions(
  viewerPubkey: string | null,
  relayUrl: string,
  relayAuth: RoomRelayAuth | null,
): boolean {
  if (!viewerPubkey) return true;
  return relayAuth?.key === `${viewerPubkey}:${relayUrl}` && relayAuth.status === 'ready';
}

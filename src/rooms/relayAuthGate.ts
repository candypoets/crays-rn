export type RoomRelayAuth = {
  key: string;
  status: 'pending' | 'started' | 'ready' | 'failed';
};

export type RoomSignerAuth = {
  hasSigner: boolean;
  pubkey: string | null;
  resolved: boolean;
};

/** The manager auth callback is authoritative for the live native signer. */
export function roomSignerAvailable(
  viewerPubkey: string,
  signer: RoomSignerAuth,
): boolean {
  return signer.resolved && signer.hasSigner && signer.pubkey === viewerPubkey;
}

/**
 * Anonymous room sessions can open public venue families immediately. For an
 * identified session, wait only until the private NIP-04 request has been
 * registered first. nipworker owns connection recovery and NIP-42; public room
 * reads must not remain blocked while a private request waits for EOSE or fails.
 */
export function canOpenRoomSubscriptions(
  viewerPubkey: string | null,
  relayUrl: string,
  relayAuth: RoomRelayAuth | null,
): boolean {
  if (!viewerPubkey) return true;
  return relayAuth?.key === `${viewerPubkey}:${relayUrl}` && relayAuth.status !== 'pending';
}

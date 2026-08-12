import {
  confirmInviteRedemption,
  loadInvitePreview,
  redeemInvite,
  resolveInviteSource,
  type InvitePreview,
  type InviteRedemption,
  type InviteSource,
} from '@/invites/invites';
import type { PresenceVisibility } from '@/nostr/protocol';

export function inviteSourceForVisibility(
  visibility: PresenceVisibility,
  source: InviteSource,
): InviteSource | null {
  if (visibility !== 'visible') return null;
  return source.handoffUrl || source.serviceUrl || source.token ? source : null;
}

type VisibleAccessOperations = {
  resolve: typeof resolveInviteSource;
  preview: typeof loadInvitePreview;
  redeem: typeof redeemInvite;
  confirm: typeof confirmInviteRedemption;
};

const DEFAULT_OPERATIONS: VisibleAccessOperations = {
  resolve: resolveInviteSource,
  preview: loadInvitePreview,
  redeem: redeemInvite,
  confirm: confirmInviteRedemption,
};

/** Redeem and independently confirm a broadcast invite before visible writes. */
export async function grantVisibleRoomAccess({
  source,
  pubkey,
  roomRelayUrl,
  operations = DEFAULT_OPERATIONS,
}: {
  source: InviteSource;
  pubkey: string;
  roomRelayUrl: string;
  operations?: VisibleAccessOperations;
}): Promise<InviteRedemption | null> {
  const invite = await operations.resolve(source);
  if (!invite) return null;
  const preview: InvitePreview = await operations.preview(invite.serviceUrl, invite.token);
  if (preview.community.relay_url !== roomRelayUrl) {
    throw new Error('This room invitation belongs to another venue. Ask staff for a fresh invite.');
  }
  const redemption = await operations.redeem(preview, invite.token, pubkey);
  await operations.confirm({ preview, pubkey, redemption, relayUrl: roomRelayUrl });
  return redemption;
}

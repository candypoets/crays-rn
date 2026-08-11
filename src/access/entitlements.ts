import type {
  RoomEntitlement,
  RoomEntitlementActivity,
  RoomEntitlementState,
  RoomEntitlementType,
  RoomOrderStatus,
} from '@/rooms/types';
import { awardIssuerValid, revocationSignerValid, statusSignerValid, type CommunityTrust } from '@/rooms/trust';

export type EntitlementDefinitionProjection = {
  id: string;
  /** NIP-97 definition address: 30009, 30402, 31922, or 31923. */
  address: string;
  issuerPubkey: string;
  type: RoomEntitlementType;
  name: string;
  description: string;
  billing?: string;
  eventAddress?: string;
  maxUses?: number;
  /** A well-formed `price` tag makes the definition awardable by the badge issuer. */
  sellable: boolean;
};

export type EntitlementAwardProjection = {
  id: string;
  address: string;
  issuerPubkey: string;
  recipientPubkey: string;
  orderRef: string;
  createdAt: number;
  expiresAt?: number;
};

export type EntitlementStatusProjection = {
  id: string;
  awardId: string;
  address: string;
  recipientPubkey: string;
  /** Event author; trusted only as an anchor admin or the badge issuer. */
  signerPubkey: string;
  contextKey: string;
  status: RoomOrderStatus;
  createdAt: number;
};

export type EntitlementRoomContext = {
  id: string;
  name: string;
  relayUrl: string;
};

function latestPerContext(
  award: EntitlementAwardProjection,
  statuses: EntitlementStatusProjection[],
): RoomEntitlementActivity[] {
  const latest = new Map<string, EntitlementStatusProjection>();
  for (const status of statuses) {
    if (
      status.awardId !== award.id ||
      status.address !== award.address ||
      status.recipientPubkey !== award.recipientPubkey ||
      !status.contextKey
    ) continue;
    const current = latest.get(status.contextKey);
    if (
      !current ||
      status.createdAt > current.createdAt ||
      (status.createdAt === current.createdAt && status.id < current.id)
    ) latest.set(status.contextKey, status);
  }
  return Array.from(latest.values())
    .sort((left, right) => right.createdAt - left.createdAt || left.id.localeCompare(right.id))
    .map(({ id, status, contextKey, createdAt }) => ({ id, status, contextKey, createdAt }));
}

export function entitlementState({
  type,
  revoked,
  expiresAt,
  remainingUses,
  activity,
  now,
}: {
  type: RoomEntitlementType;
  revoked: boolean;
  expiresAt?: number;
  remainingUses?: number;
  activity: RoomEntitlementActivity[];
  now: number;
}): RoomEntitlementState {
  if (revoked) return 'revoked';
  if (expiresAt && expiresAt <= now) return 'expired';
  if (remainingUses === 0) return 'exhausted';
  if (type === 'product' || type === 'event_access') {
    const latest = activity[0]?.status;
    if (latest === 'cancelled') return 'cancelled';
    return latest === 'fulfilled' ? 'exhausted' : 'available';
  }
  return type === 'pass' ? 'available' : 'active';
}

export function deriveEntitlements({
  awards,
  definitions,
  statuses,
  revocations,
  trust,
  room,
  now = Math.floor(Date.now() / 1000),
}: {
  awards: EntitlementAwardProjection[];
  definitions: ReadonlyMap<string, EntitlementDefinitionProjection>;
  statuses: EntitlementStatusProjection[];
  /** Award id → kind-5 deleter pubkey, as read from the community relay. */
  revocations: ReadonlyMap<string, string>;
  trust: CommunityTrust;
  room: EntitlementRoomContext;
  now?: number;
}): RoomEntitlement[] {
  return awards.flatMap((award) => {
    const definition = definitions.get(award.address);
    if (!definition) return [];
    // NIP-97 issuance rule, checked where award and definition meet: anchor
    // admins may award anything; the badge issuer only sellable definitions.
    if (!awardIssuerValid({ issuer: award.issuerPubkey, sellable: definition.sellable, trust })) return [];
    const deleter = revocations.get(award.id);
    const revoked = deleter !== undefined && revocationSignerValid(deleter, award.issuerPubkey, trust);
    const activity = latestPerContext(
      award,
      statuses.filter((status) => statusSignerValid(status.signerPubkey, trust)),
    );
    const used = activity.filter((item) => item.status === 'fulfilled').length;
    const remainingUses = definition.maxUses === undefined
      ? undefined
      : Math.max(0, definition.maxUses - used);
    return [{
      awardId: award.id,
      badgeAddress: award.address,
      awardIssuerPubkey: award.issuerPubkey,
      recipientPubkey: award.recipientPubkey,
      definitionId: definition.id,
      definitionIssuerPubkey: definition.issuerPubkey,
      type: definition.type,
      name: definition.name,
      description: definition.description,
      billing: definition.billing,
      eventAddress: definition.eventAddress,
      maxUses: definition.maxUses,
      remainingUses,
      expiresAt: award.expiresAt,
      state: entitlementState({
        type: definition.type,
        revoked,
        expiresAt: award.expiresAt,
        remainingUses,
        activity,
        now,
      }),
      orderRef: award.orderRef,
      createdAt: award.createdAt,
      activity,
      roomId: room.id,
      roomName: room.name,
      relayUrl: room.relayUrl,
    } satisfies RoomEntitlement];
  }).sort((left, right) => right.createdAt - left.createdAt);
}

export function canPresentEntitlement(item: RoomEntitlement): boolean {
  return !['exhausted', 'expired', 'revoked', 'cancelled'].includes(item.state) &&
    Boolean(item.type !== 'event_access' || item.eventAddress);
}

export function presentationContextFor(item: RoomEntitlement, nonce: string) {
  if (item.type === 'event_access' && item.eventAddress) return { eventAddress: item.eventAddress };
  if (item.type === 'membership' || item.type === 'pass') return { orderId: `use:${nonce}` };
  return { orderId: item.orderRef || item.awardId };
}

export type RoomCapability = 'social' | 'menu' | 'events' | 'membership';
export type RoomIntent = 'social' | 'business' | 'dating' | 'curious';

export type RoomJoinPreferences = {
  visibility: 'quiet' | 'visible';
  intent: RoomIntent;
  context: string;
  leaveAfterMinutes: 60 | 120 | 240;
};

export type RoomDescriptor = {
  id: string;
  name: string;
  about: string;
  relayUrl: string;
  operatorPubkey: string;
  capabilities: RoomCapability[];
  expiresAt: number;
  open: boolean;
  verified: boolean;
  /**
   * @deprecated NIP-97 trust flows from the relay's NIP-11 root key and the
   * community anchor (kind 31727), resolved by `src/rooms/trust.ts`. The
   * manifest tag is still parsed for interop but never trusted.
   */
  awardIssuerPubkey?: string;
};

export type ActiveRoom = RoomDescriptor & {
  /** Local entry instant in Unix milliseconds. */
  joinedAt: number;
  visibility: 'quiet' | 'visible';
  intent: RoomIntent;
  context: string;
  /** Local room lock boundary in Unix milliseconds. Presence uses the same instant in seconds. */
  leaveAt: number;
  /** Transport URL used on this device; the signed relayUrl remains authoritative metadata. */
  connectionRelayUrl?: string;
};

export type RoomProfile = {
  pubkey: string;
  name: string;
  about: string;
  picture?: string;
  createdAt: number;
};

export type RoomPerson = RoomProfile & {
  intent: string;
  context: string;
  expiresAt: number;
};

export type RoomPost = {
  id: string;
  pubkey: string;
  content: string;
  createdAt: number;
  announcement: boolean;
  expiresAt: number;
};

export type RoomProduct = {
  id: string;
  address: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  section: string;
  productKind: string;
  available: boolean;
  position: number;
};

export type RoomCalendarEvent = {
  id: string;
  address: string;
  title: string;
  summary: string;
  location: string;
  start: number;
  end: number | null;
  capacity: number | null;
  price: number;
  currency: string;
};

export type RoomMembershipOffer = {
  id: string;
  address: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  billing: string;
  available: boolean;
};

export type RoomEntitlementType = 'product' | 'membership' | 'pass' | 'event_access';
export type RoomEntitlementState =
  | 'active'
  | 'available'
  | 'exhausted'
  | 'expired'
  | 'revoked'
  | 'cancelled';

export type RoomEntitlementActivity = {
  id: string;
  status: RoomOrderStatus;
  contextKey: string;
  createdAt: number;
};

/** Stable, cache-safe projection of one venue-issued kind-8 award. */
export type RoomEntitlement = {
  awardId: string;
  /** NIP-97 definition address: 30009 (membership), 30402 (product/pass/ticket), or 31922/31923 (free event). */
  badgeAddress: string;
  awardIssuerPubkey: string;
  recipientPubkey: string;
  definitionId: string;
  definitionIssuerPubkey: string;
  type: RoomEntitlementType;
  name: string;
  description: string;
  billing?: string;
  eventAddress?: string;
  maxUses?: number;
  remainingUses?: number;
  expiresAt?: number;
  state: RoomEntitlementState;
  orderRef: string;
  createdAt: number;
  activity: RoomEntitlementActivity[];
  roomId: string;
  roomName: string;
  relayUrl: string;
};

export type RoomOrderStatus = 'pending' | 'accepted' | 'processing' | 'ready' | 'fulfilled' | 'cancelled';

export type RoomOrder = {
  id: string;
  awardId: string;
  orderRef: string;
  product: RoomProduct;
  status: RoomOrderStatus;
  createdAt: number;
  updatedAt: number;
  recipientPubkey: string;
  roomId?: string;
  roomName?: string;
};

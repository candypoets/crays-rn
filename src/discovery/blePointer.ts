export type NearbyRoomPointerValue = { relayUrl: string; roomId: string };

/**
 * Decode the versioned, base64-encoded value exposed by a Crays gateway.
 * This function is intentionally native-module-free so malformed gateway data
 * can be tested without a Bluetooth adapter.
 */
export function decodeNearbyRoomPointer(
  encoded: string | null,
  decodeBase64: (value: string) => string = globalThis.atob,
): NearbyRoomPointerValue | null {
  if (!encoded || typeof decodeBase64 !== 'function') return null;
  try {
    const value = JSON.parse(decodeBase64(encoded)) as { v?: number; relay?: string; room?: string };
    if (value.v !== 1) return null;
    if (!/^wss?:\/\//.test(value.relay || '')) return null;
    if (!/^[a-z0-9][a-z0-9._-]{1,127}$/i.test(value.room || '')) return null;
    return { relayUrl: value.relay!, roomId: value.room! };
  } catch {
    return null;
  }
}

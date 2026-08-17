import * as Crypto from 'expo-crypto';
import * as FileSystem from 'expo-file-system/legacy';
import type { Event as NostrEvent, EventTemplate } from 'nostr-tools';

import { signActiveEvent } from '@/account/account';
import type { RoomPostMedia } from '@/nostr/protocol';

export const DEFAULT_BLOSSOM_SERVER = process.env.EXPO_PUBLIC_BLOSSOM_SERVER?.trim() || 'https://blossom.nuts.cash';
export const MAX_ROOM_IMAGE_BYTES = 10 * 1024 * 1024;

export type LocalRoomImage = {
  uri: string;
  width: number;
  height: number;
  mimeType?: string | null;
  fileName?: string | null;
};

function base64ToBytes(value: string): Uint8Array<ArrayBuffer> {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const clean = value.replace(/[^A-Za-z0-9+/=]/g, '');
  const output: number[] = [];
  for (let index = 0; index < clean.length; index += 4) {
    const first = chars.indexOf(clean.charAt(index));
    const second = chars.indexOf(clean.charAt(index + 1));
    const third = chars.indexOf(clean.charAt(index + 2));
    const fourth = chars.indexOf(clean.charAt(index + 3));
    if (first < 0 || second < 0) break;
    output.push((first << 2) | (second >> 4));
    if (third >= 0) output.push(((second & 15) << 4) | (third >> 2));
    if (fourth >= 0) output.push(((third & 3) << 6) | fourth);
  }
  return new Uint8Array(output);
}

function base64Encode(value: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let output = '';
  for (let index = 0; index < value.length;) {
    const first = value.charCodeAt(index++);
    const second = value.charCodeAt(index++);
    const third = value.charCodeAt(index++);
    const enc1 = first >> 2;
    const enc2 = ((first & 3) << 4) | (second >> 4);
    const enc3 = Number.isNaN(second) ? 64 : ((second & 15) << 2) | (third >> 6);
    const enc4 = Number.isNaN(third) ? 64 : third & 63;
    output += chars.charAt(enc1) + chars.charAt(enc2) + chars.charAt(enc3) + chars.charAt(enc4);
  }
  return output;
}

function bytesToHex(value: ArrayBuffer): string {
  return Array.from(new Uint8Array(value), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function blossomAuthorizationTemplate(sha256: string, now = Math.floor(Date.now() / 1000)): EventTemplate {
  return {
    kind: 24242,
    created_at: now,
    tags: [
      ['t', 'upload'],
      ['x', sha256],
      ['expiration', String(now + 3600)],
    ],
    content: '',
  };
}

export function canonicalSignedEvent(event: NostrEvent): NostrEvent {
  if (!event.id || !event.pubkey || !event.sig) throw new Error('The image upload authorization was not signed.');
  return {
    id: event.id,
    pubkey: event.pubkey,
    created_at: event.created_at,
    kind: event.kind,
    tags: event.tags,
    content: event.content,
    sig: event.sig,
  };
}

export function blossomAuthorizationHeader(event: NostrEvent): string {
  return `Nostr ${base64Encode(JSON.stringify(canonicalSignedEvent(event))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')}`;
}

export function roomImageContentType(image: LocalRoomImage): string {
  if (image.mimeType?.startsWith('image/')) return image.mimeType;
  if (image.mimeType) throw new Error('Choose a supported image file.');
  const path = `${image.fileName || ''} ${image.uri}`.toLowerCase();
  if (/\.(?:jpe?g)(?:\?|\s|$)/.test(path)) return 'image/jpeg';
  if (/\.png(?:\?|\s|$)/.test(path)) return 'image/png';
  if (/\.webp(?:\?|\s|$)/.test(path)) return 'image/webp';
  if (/\.gif(?:\?|\s|$)/.test(path)) return 'image/gif';
  if (/\.hei[cf](?:\?|\s|$)/.test(path)) return 'image/heic';
  return 'application/octet-stream';
}

export async function hashRoomImage(uri: string): Promise<string> {
  const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
  const bytes = base64ToBytes(base64);
  // Expo Crypto's native bridge expects the typed view so it can attach the
  // ArrayBuffer payload to the JSI call. Passing `.buffer` alone loses that
  // attachment on Android and reaches Kotlin as an empty object wrapper.
  const digest = await Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA256, bytes);
  return bytesToHex(digest);
}

export async function uploadRoomImage(
  image: LocalRoomImage,
  server = DEFAULT_BLOSSOM_SERVER,
): Promise<RoomPostMedia> {
  const contentType = roomImageContentType(image);
  const info = await FileSystem.getInfoAsync(image.uri);
  if (!info.exists) throw new Error('The selected image is no longer available. Choose it again.');
  if ((info.size || 0) > MAX_ROOM_IMAGE_BYTES) throw new Error('Choose an image smaller than 10 MB.');

  const sha256 = await hashRoomImage(image.uri);
  const authorization = blossomAuthorizationHeader(await signActiveEvent(blossomAuthorizationTemplate(sha256)));
  const baseUrl = server.replace(/\/$/, '');
  const response = await FileSystem.uploadAsync(`${baseUrl}/upload`, image.uri, {
    httpMethod: 'PUT',
    uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
    headers: {
      Authorization: authorization,
      'Content-Type': contentType,
      'X-SHA-256': sha256,
    },
  });
  if (response.status < 200 || response.status >= 300) {
    const reason = response.headers['x-reason'] || response.headers['X-Reason'] || response.body;
    throw new Error(`Blossom rejected the image (${response.status})${reason ? `: ${reason}` : '.'}`);
  }
  let descriptor: { url?: string } | null = null;
  try { descriptor = JSON.parse(response.body); } catch { /* Existing blobs may return no body. */ }
  const url = String(descriptor?.url || `${baseUrl}/${sha256}`).replace(/^https?:\/\/https?:\/\//i, 'https://');
  return {
    url,
    mimeType: contentType,
    width: image.width,
    height: image.height,
    sha256,
    alt: image.fileName || 'Room photo',
  };
}

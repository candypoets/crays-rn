/* eslint-disable import/first */
const mockRead = jest.fn();
const mockInfo = jest.fn();
const mockUpload = jest.fn();
const mockDigest = jest.fn();
const mockSign = jest.fn();

jest.mock('expo-file-system/legacy', () => ({
  EncodingType: { Base64: 'base64' },
  FileSystemUploadType: { BINARY_CONTENT: 0 },
  getInfoAsync: (...args: unknown[]) => mockInfo(...args),
  readAsStringAsync: (...args: unknown[]) => mockRead(...args),
  uploadAsync: (...args: unknown[]) => mockUpload(...args),
}));
jest.mock('expo-crypto', () => ({
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
  digest: (...args: unknown[]) => mockDigest(...args),
}));
jest.mock('@/account/account', () => ({ signActiveEvent: (...args: unknown[]) => mockSign(...args) }));

import { blossomAuthorizationHeader, blossomAuthorizationTemplate, MAX_ROOM_IMAGE_BYTES, roomImageContentType, uploadRoomImage } from '@/media/blossom';

const signed = { id: '1'.repeat(64), pubkey: '2'.repeat(64), created_at: 1, kind: 24242, tags: [], content: '', sig: '3'.repeat(128) };

describe('Blossom room image publishing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockInfo.mockResolvedValue({ exists: true, uri: 'file:///room.jpg', size: 1024, isDirectory: false, modificationTime: 1 });
    mockRead.mockResolvedValue('AQID');
    mockDigest.mockResolvedValue(Uint8Array.from({ length: 32 }, () => 15).buffer);
    mockSign.mockResolvedValue(signed);
    mockUpload.mockResolvedValue({ status: 200, body: JSON.stringify({ url: 'https://cdn.example/blob' }), headers: {} });
  });

  it('constructs an expiring BUD-11 upload authorization', () => {
    expect(blossomAuthorizationTemplate('f'.repeat(64), 100)).toEqual({ kind: 24242, created_at: 100, content: '', tags: [['t', 'upload'], ['x', 'f'.repeat(64)], ['expiration', '3700']] });
    expect(blossomAuthorizationHeader(signed)).toMatch(/^Nostr [A-Za-z0-9_-]+$/);
  });

  it('accepts picker images whose MIME type is missing', () => {
    expect(roomImageContentType({ uri: 'file:///room.JPG', width: 1, height: 1 })).toBe('image/jpeg');
    expect(roomImageContentType({ uri: 'content://picker/42', width: 1, height: 1 })).toBe('application/octet-stream');
    expect(() => roomImageContentType({ uri: 'file:///room.txt', width: 1, height: 1, mimeType: 'text/plain' })).toThrow('supported image');
  });

  it('hashes, signs, uploads, and returns note media metadata', async () => {
    const result = await uploadRoomImage({ uri: 'file:///room.jpg', width: 1200, height: 800, mimeType: 'image/jpeg', fileName: 'room.jpg' }, 'https://blossom.example/');
    expect(mockDigest).toHaveBeenCalledWith('SHA-256', new Uint8Array([1, 2, 3]));
    expect(mockUpload).toHaveBeenCalledWith('https://blossom.example/upload', 'file:///room.jpg', expect.objectContaining({ httpMethod: 'PUT', headers: expect.objectContaining({ Authorization: expect.stringMatching(/^Nostr /), 'Content-Type': 'image/jpeg', 'X-SHA-256': '0f'.repeat(32) }) }));
    expect(result).toEqual({ url: 'https://cdn.example/blob', mimeType: 'image/jpeg', width: 1200, height: 800, sha256: '0f'.repeat(32), alt: 'room.jpg' });
  });

  it('rejects unsupported, missing, oversized, and failed uploads with actionable errors', async () => {
    await expect(uploadRoomImage({ uri: 'file:///room.txt', width: 1, height: 1, mimeType: 'text/plain' })).rejects.toThrow('supported image');
    mockInfo.mockResolvedValueOnce({ exists: false, uri: 'file:///gone.jpg', isDirectory: false });
    await expect(uploadRoomImage({ uri: 'file:///gone.jpg', width: 1, height: 1, mimeType: 'image/jpeg' })).rejects.toThrow('no longer available');
    mockInfo.mockResolvedValueOnce({ exists: true, uri: 'file:///large.jpg', size: MAX_ROOM_IMAGE_BYTES + 1, isDirectory: false, modificationTime: 1 });
    await expect(uploadRoomImage({ uri: 'file:///large.jpg', width: 1, height: 1, mimeType: 'image/jpeg' })).rejects.toThrow('smaller than 10 MB');
    mockUpload.mockResolvedValueOnce({ status: 413, body: '', headers: { 'x-reason': 'too large' } });
    await expect(uploadRoomImage({ uri: 'file:///room.jpg', width: 1, height: 1, mimeType: 'image/jpeg' })).rejects.toThrow(/413.*too large/);
  });
});

import { createTestRoomPointer, setQaTestRoomPointer, testRoomEntryParams } from '@/config/testRoom';

describe('test-build Test Room entry', () => {
  afterEach(() => setQaTestRoomPointer(null));

  it('uses the same direct-invite nearby pointer as a physical room signal', () => {
    const pointer = createTestRoomPointer({ token: 'claims.signature' });
    const params = testRoomEntryParams(pointer);

    expect(pointer).toMatchObject({
      relayUrl: expect.stringMatching(/^wss?:\/\//),
      roomId: 'crays-test-room',
      invite: {
        serviceUrl: expect.stringMatching(/^https?:\/\//),
        token: 'claims.signature',
      },
    });
    expect(params).toEqual({
      relay: pointer!.relayUrl,
      room: 'crays-test-room',
      service: pointer!.invite!.serviceUrl,
      token: 'claims.signature',
    });
  });

  it('fails closed when a test build has no compiled invitation', () => {
    expect(createTestRoomPointer({ token: '' })).toBeNull();
  });

  it('lets native QA exercise the card with the freshly minted direct credential', () => {
    setQaTestRoomPointer({
      relayUrl: 'wss://qa-room.test',
      roomId: 'qa-room',
      serviceUrl: 'https://qa-room.test',
      token: 'qa-claims.qa-signature',
    });

    expect(testRoomEntryParams()).toEqual({
      relay: 'wss://qa-room.test',
      room: 'qa-room',
      service: 'https://qa-room.test',
      token: 'qa-claims.qa-signature',
    });
  });
});

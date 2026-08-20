import { roomInviteContent } from '@/rooms/invite';

describe('roomInviteContent', () => {
  it('builds a join-room deep link without losing relay query characters', () => {
    expect(roomInviteContent('Crays Test Room', 'wss://relay.test/path?x=1', 'crays room')).toEqual({
      message: 'Join me in Crays Test Room on Crays: crays:///join-room?relay=wss%3A%2F%2Frelay.test%2Fpath%3Fx%3D1&room=crays%20room',
      url: 'crays:///join-room?relay=wss%3A%2F%2Frelay.test%2Fpath%3Fx%3D1&room=crays%20room',
    });
  });
});

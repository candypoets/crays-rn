import { devTestRoomEntryParams } from '@/config/testRoom';

describe('development Test Room entry', () => {
  it('uses the configured relay and room pointer without an invite handoff', () => {
    const params = devTestRoomEntryParams();

    expect(params.relay).toMatch(/^wss?:\/\//);
    expect(params.room).toBe('crays-test-room');
    expect(params).not.toHaveProperty('invite');
  });
});

import { RelayRejectedError, retryPendingRoomAccess } from '@/nostr/publish';

describe('post-invite relay access propagation', () => {
  it('retries only the temporary NIP-97 gate lag and preserves order', async () => {
    const calls: string[] = [];
    const attempt = jest.fn(async () => {
      calls.push('publish');
      if (attempt.mock.calls.length < 3) throw new RelayRejectedError('false blocked: no NIP-97 write capability');
      return 'ok';
    });
    const wait = jest.fn(async (milliseconds: number) => { calls.push(`wait:${milliseconds}`); });

    await expect(retryPendingRoomAccess(attempt, wait, [10, 20])).resolves.toBe('ok');
    expect(calls).toEqual(['publish', 'wait:10', 'publish', 'wait:20', 'publish']);
  });

  it('bounds rejection retries even when nipworker omits the relay reason', async () => {
    const rejection = new RelayRejectedError('false blocked: event kind is not allowed');
    const attempt = jest.fn(async () => { throw rejection; });
    const wait = jest.fn(async () => {});

    await expect(retryPendingRoomAccess(attempt, wait, [10, 20])).rejects.toBe(rejection);
    expect(attempt).toHaveBeenCalledTimes(3);
    expect(wait).toHaveBeenCalledTimes(2);
  });
});

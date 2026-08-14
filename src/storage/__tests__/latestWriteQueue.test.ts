import { LatestWriteQueue } from '@/storage/latestWriteQueue';

describe('LatestWriteQueue', () => {
  it('defers and coalesces snapshots until writes are allowed', async () => {
    let writable = false;
    const write = jest.fn().mockResolvedValue(undefined);
    const queue = new LatestWriteQueue({ canWrite: () => writable, write });

    queue.queue('orders', 'old');
    queue.queue('orders', 'latest');
    await Promise.resolve();
    expect(write).not.toHaveBeenCalled();

    writable = true;
    await queue.flush();
    expect(write).toHaveBeenCalledTimes(1);
    expect(write).toHaveBeenCalledWith('orders', 'latest');
  });

  it('handles a native rejection, retains the latest snapshot, and reports recovery', async () => {
    const error = new Error('User interaction is not allowed.');
    const write = jest.fn()
      .mockRejectedValueOnce(error)
      .mockResolvedValue(undefined);
    const onError = jest.fn();
    const onRecovered = jest.fn();
    const queue = new LatestWriteQueue({ canWrite: () => true, onError, onRecovered, write });

    queue.queue('entitlements', 'snapshot');
    await queue.flush();
    expect(onError).toHaveBeenCalledWith(error);
    expect(onRecovered).not.toHaveBeenCalled();

    await queue.flush();
    expect(write).toHaveBeenLastCalledWith('entitlements', 'snapshot');
    expect(onRecovered).toHaveBeenCalledTimes(1);
  });

  it('stops a batch when the app becomes inactive and resumes the remaining key later', async () => {
    let writable = false;
    const write = jest.fn().mockImplementation(async () => {
      writable = false;
    });
    const queue = new LatestWriteQueue({ canWrite: () => writable, write });
    queue.queue('orders', 'orders-snapshot');
    queue.queue('entitlements', 'entitlements-snapshot');

    writable = true;
    await queue.flush();
    expect(write).toHaveBeenCalledTimes(1);

    writable = true;
    await queue.flush();
    expect(write).toHaveBeenCalledTimes(2);
    expect(write).toHaveBeenLastCalledWith('entitlements', 'entitlements-snapshot');
  });

  it('does not write or notify after disposal', async () => {
    const write = jest.fn().mockResolvedValue(undefined);
    const onRecovered = jest.fn();
    const queue = new LatestWriteQueue({ canWrite: () => false, onRecovered, write });
    queue.queue('orders', 'snapshot');
    queue.dispose();
    await queue.flush();
    expect(write).not.toHaveBeenCalled();
    expect(onRecovered).not.toHaveBeenCalled();
  });
});

type LatestWriteQueueOptions = {
  canWrite: () => boolean;
  onError?: (error: unknown) => void;
  onRecovered?: () => void;
  write: (key: string, value: string) => Promise<void>;
};

/**
 * Coalesces cache snapshots by key and serializes their writes. A failed or
 * temporarily disallowed write remains pending until the owner calls flush()
 * again, normally when the app returns to the foreground.
 */
export class LatestWriteQueue {
  private disposed = false;
  private flushPromise: Promise<void> | null = null;
  private pending = new Map<string, string>();

  constructor(private readonly options: LatestWriteQueueOptions) {}

  queue(key: string, value: string): void {
    if (this.disposed) return;
    this.pending.set(key, value);
    void this.flush();
  }

  flush(): Promise<void> {
    if (this.disposed || !this.options.canWrite()) return Promise.resolve();
    if (this.flushPromise) return this.flushPromise;
    this.flushPromise = this.drain().finally(() => {
      this.flushPromise = null;
    });
    return this.flushPromise;
  }

  private async drain(): Promise<void> {
    let wrote = false;
    while (!this.disposed && this.options.canWrite() && this.pending.size) {
      const batch = [...this.pending.entries()];
      this.pending.clear();
      for (let index = 0; index < batch.length; index += 1) {
        if (this.disposed) return;
        if (!this.options.canWrite()) {
          this.retain(batch, index);
          return;
        }
        const [key, value] = batch[index];
        try {
          await this.options.write(key, value);
          wrote = true;
        } catch (error) {
          this.retain(batch, index);
          if (!this.disposed) this.options.onError?.(error);
          return;
        }
      }
    }
    if (wrote && !this.pending.size && !this.disposed) this.options.onRecovered?.();
  }

  private retain(batch: [string, string][], start: number): void {
    for (const [key, value] of batch.slice(start)) {
      if (!this.pending.has(key)) this.pending.set(key, value);
    }
  }

  dispose(): void {
    this.disposed = true;
    this.pending.clear();
  }
}

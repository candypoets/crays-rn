import type { WorkerMessage } from '@candypoets/nipworker';
import { usePublish } from '@candypoets/nipworker/hooks';
import { isConnectionStatus } from '@candypoets/nipworker/utils';
import type { EventTemplate } from 'nostr-tools';

export type PublishResult = { relayUrl: string; status: string };

export class RelayRejectedError extends Error {
  constructor(readonly relayStatus: string) {
    super('The room rejected this action. Your account may not have access here.');
    this.name = 'RelayRejectedError';
  }
}

const ACCESS_PROPAGATION_DELAYS_MS = [400, 800, 1_200, 1_600] as const;

export async function retryPendingRoomAccess<T>(
  attempt: () => Promise<T>,
  wait: (milliseconds: number) => Promise<void> = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)),
  delays: readonly number[] = ACCESS_PROPAGATION_DELAYS_MS,
): Promise<T> {
  for (let index = 0; ; index += 1) {
    try {
      return await attempt();
    } catch (cause) {
      // nipworker currently exposes some relay OK=false responses as just
      // `false`, without the relay's reason text. This helper is called only
      // after the exact invite award has been confirmed, so bounded retries
      // remain scoped to that post-award gate window.
      const accessStillPropagating = cause instanceof RelayRejectedError;
      if (!accessStillPropagating || index >= delays.length) throw cause;
      await wait(delays[index]);
    }
  }
}

/** Resolve only after one target relay explicitly confirms the write. */
export function publishEvent(
  template: EventTemplate,
  relays: string[],
  operation: string,
  timeoutMs = 12_000,
): Promise<PublishResult> {
  if (!relays.length) return Promise.reject(new Error('No relay is available for this action.'));
  return new Promise((resolve, reject) => {
    let settled = false;
    let stop: (() => void) | undefined;
    const finish = (result?: PublishResult, error?: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      stop?.();
      if (error) reject(error);
      else if (result) resolve(result);
    };
    const timeout = setTimeout(
      () => finish(undefined, new Error('The room did not confirm this action. Check the connection and try again.')),
      timeoutMs,
    );
    stop = usePublish(
      `${operation}_${Date.now().toString(36)}`,
      template,
      (message: WorkerMessage) => {
        const status = isConnectionStatus(message);
        const value = status?.status()?.toString().toLowerCase() ?? '';
        const relayUrl = status?.relayUrl() ?? '';
        if (value === 'ok' || value === 'true' || value.startsWith('true ')) {
          finish({ relayUrl, status: value });
        } else if (value.startsWith('false') || value.startsWith('error')) {
          finish(undefined, new RelayRejectedError(value));
        }
      },
      { trackStatus: true, defaultRelays: relays },
    );
  });
}

/** Retry the relay gate's short post-award propagation window. */
export function publishEventAfterAccess(
  template: EventTemplate,
  relays: string[],
  operation: string,
): Promise<PublishResult> {
  return retryPendingRoomAccess(() => publishEvent(template, relays, operation));
}

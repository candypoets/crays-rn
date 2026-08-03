export type EntryDestination = '/welcome' | '/profile' | '/recovery' | '/discover';
export type AppEntryDestination = EntryDestination | '/room';

export function resolveEntryDestination(state: {
  complete: boolean;
  hasIdentity: boolean;
  hasProfile: boolean;
}): EntryDestination {
  if (state.complete && state.hasIdentity && state.hasProfile) return '/discover';
  if (state.hasProfile && state.hasIdentity) return '/recovery';
  if (state.hasIdentity) return '/profile';
  return '/welcome';
}

export function resolveResumeDestination(destination: EntryDestination, hasActiveRoom: boolean): AppEntryDestination {
  return destination === '/discover' && hasActiveRoom ? '/room' : destination;
}

export function normaliseDisplayName(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

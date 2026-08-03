import { normaliseDisplayName, resolveEntryDestination, resolveResumeDestination } from '@/account/state';

describe('entry state', () => {
  it.each([
    [{ complete: false, hasIdentity: false, hasProfile: false }, '/welcome'],
    [{ complete: false, hasIdentity: true, hasProfile: false }, '/profile'],
    [{ complete: false, hasIdentity: true, hasProfile: true }, '/recovery'],
    [{ complete: true, hasIdentity: true, hasProfile: true }, '/discover'],
    [{ complete: true, hasIdentity: false, hasProfile: false }, '/welcome'],
  ] as const)('resolves %o to %s', (state, destination) => {
    expect(resolveEntryDestination(state)).toBe(destination);
  });

  it('normalises surrounding and repeated whitespace without changing the chosen name', () => {
    expect(normaliseDisplayName('  QA   Alex  ')).toBe('QA Alex');
  });

  it('resumes a still-valid active room only after account setup is complete', () => {
    expect(resolveResumeDestination('/discover', true)).toBe('/room');
    expect(resolveResumeDestination('/recovery', true)).toBe('/recovery');
    expect(resolveResumeDestination('/discover', false)).toBe('/discover');
  });
});

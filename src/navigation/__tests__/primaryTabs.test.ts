import { PRIMARY_TABS, primaryTabIcon } from '@/navigation/primaryTabs';

describe('primary tab navigation', () => {
  it('defines exactly the four ordered top-level destinations', () => {
    expect(PRIMARY_TABS.map(({ name }) => name)).toEqual([
      'room',
      'discover',
      'messages',
      'me',
    ]);
    expect(new Set(PRIMARY_TABS.map(({ testID }) => testID)).size).toBe(PRIMARY_TABS.length);
  });

  it.each(PRIMARY_TABS)('uses a distinct selected icon for $title', (tab) => {
    expect(primaryTabIcon(tab.name, false)).toBe(tab.icon);
    expect(primaryTabIcon(tab.name, true)).toBe(tab.selectedIcon);
    expect(tab.selectedIcon).not.toBe(tab.icon);
  });

  it('fails loudly when route configuration asks for an unknown tab', () => {
    expect(() => primaryTabIcon('wallet' as never, false)).toThrow('Unknown primary tab: wallet');
  });
});

import { PRIMARY_TABS, primaryTabBarStyle, primaryTabIcon } from '@/navigation/primaryTabs';

describe('primary tab navigation', () => {
  it('defines exactly the three ordered top-level destinations', () => {
    expect(PRIMARY_TABS.map(({ name }) => name)).toEqual([
      'room',
      'messages',
      'me',
    ]);
    expect(PRIMARY_TABS[0]).toMatchObject({ title: 'Tonight', testID: 'tab-tonight' });
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

  it('keeps labels above the full bottom safe area', () => {
    expect(primaryTabBarStyle(24)).toEqual({ height: 88, paddingBottom: 24, paddingTop: 6 });
    expect(primaryTabBarStyle(-5)).toEqual({ height: 64, paddingBottom: 0, paddingTop: 6 });
  });
});

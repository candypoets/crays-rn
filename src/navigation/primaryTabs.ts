export const PRIMARY_TABS = [
  {
    name: 'room',
    title: 'Tonight',
    testID: 'tab-tonight',
    icon: 'moon-outline',
    selectedIcon: 'moon',
  },
  {
    name: 'messages',
    title: 'Messages',
    testID: 'tab-messages',
    icon: 'chatbubbles-outline',
    selectedIcon: 'chatbubbles',
  },
  {
    name: 'me',
    title: 'Me',
    testID: 'tab-me',
    icon: 'person-circle-outline',
    selectedIcon: 'person-circle',
  },
] as const;

export type PrimaryTabName = (typeof PRIMARY_TABS)[number]['name'];

export function primaryTabBarStyle(bottomInset: number) {
  const safeBottomInset = Number.isFinite(bottomInset) ? Math.max(0, bottomInset) : 0;

  return {
    height: 64 + safeBottomInset,
    paddingBottom: safeBottomInset,
    paddingTop: 6,
  } as const;
}

export function primaryTabIcon(name: PrimaryTabName, selected: boolean) {
  const tab = PRIMARY_TABS.find((candidate) => candidate.name === name);
  if (!tab) throw new Error(`Unknown primary tab: ${name}`);
  return selected ? tab.selectedIcon : tab.icon;
}

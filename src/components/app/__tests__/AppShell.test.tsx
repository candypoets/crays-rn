import { render } from '@testing-library/react-native';
import { ScrollView, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppShell } from '@/components/app/AppShell';

describe('AppShell', () => {
  it('owns screen chrome without rendering a second navigation bar', () => {
    const view = render(
      <AppShell testID="example-screen" title="Example">
        <Text>Content</Text>
      </AppShell>,
    );

    expect(view.getByText('Content')).toBeOnTheScreen();
    expect(view.queryByTestId('tab-room')).toBeNull();
    expect(view.queryByTestId('tab-discover')).toBeNull();
    expect(view.queryByTestId('tab-messages')).toBeNull();
    expect(view.queryByTestId('tab-me')).toBeNull();
  });

  it('lets scroll content rest above the home-indicator inset instead of hard-clipping it', () => {
    jest.mocked(useSafeAreaInsets).mockReturnValue({ bottom: 20, left: 0, right: 0, top: 0 });
    const view = render(
      <AppShell testID="stack-screen" title="Stack">
        <Text>Content</Text>
      </AppShell>,
    );

    expect(view.getByTestId('stack-screen').props.edges.bottom).toBe('off');
    expect(view.UNSAFE_getByType(ScrollView).props.scrollIndicatorInsets.bottom).toBe(20);
  });

  it('leaves the bottom inset to the tab bar when rendered under it', () => {
    jest.mocked(useSafeAreaInsets).mockReturnValue({ bottom: 20, left: 0, right: 0, top: 0 });
    const view = render(
      <AppShell testID="tab-screen" title="Tab" underTabBar>
        <Text>Content</Text>
      </AppShell>,
    );

    expect(view.UNSAFE_getByType(ScrollView).props.scrollIndicatorInsets.bottom).toBe(0);
  });
});

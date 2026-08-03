import { render } from '@testing-library/react-native';
import { Text } from 'react-native';

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
});

import { fireEvent, render } from '@testing-library/react-native';

import type { BlockRecord } from '@/safety/Safety';
import { SettingsScreen } from '@/screens/settings/SettingsScreen';

const blocked: BlockRecord = { pubkey: 'a'.repeat(64), label: 'Jonas', scope: 'global', createdAt: 1 };

describe('SettingsScreen', () => {
  it('shows the honest empty and deferred boundaries', () => {
    const view = render(<SettingsScreen blocks={[]} onBack={jest.fn()} onUnblock={jest.fn()} />);
    expect(view.getByTestId('blocks-empty')).toBeTruthy();
    expect(view.getByText('Permission not requested')).toBeTruthy();
    expect(view.getByText('Not configured')).toBeTruthy();
  });

  it('names block scope and exposes an explicit unblock action', () => {
    const onUnblock = jest.fn();
    const view = render(<SettingsScreen blocks={[blocked]} onBack={jest.fn()} onUnblock={onUnblock} />);
    expect(view.getByText('Blocked everywhere')).toBeTruthy();
    fireEvent.press(view.getByTestId(`unblock-${blocked.pubkey}-global`));
    expect(onUnblock).toHaveBeenCalledWith(blocked);
  });
});

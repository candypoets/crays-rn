import { fireEvent, render, screen } from '@testing-library/react-native';

import { BluetoothRationaleScreen } from '@/screens/discovery/BluetoothRationaleScreen';

describe('BluetoothRationaleScreen', () => {
  it('states privacy limits before continuing and preserves Map', () => {
    const onContinue = jest.fn();
    const onMap = jest.fn();
    render(<BluetoothRationaleScreen onContinue={onContinue} onMap={onMap} />);
    expect(screen.getByRole('header', { name: 'Why we ask for Nearby' })).toBeOnTheScreen();
    expect(screen.getByText(/do not publish your presence or exact location/)).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Turn on Nearby' })).toBeOnTheScreen();
    fireEvent.press(screen.getByTestId('bluetooth-continue-button'));
    fireEvent.press(screen.getByTestId('use-map-button'));
    expect(onContinue).toHaveBeenCalledTimes(1);
    expect(onMap).toHaveBeenCalledTimes(1);
  });
});

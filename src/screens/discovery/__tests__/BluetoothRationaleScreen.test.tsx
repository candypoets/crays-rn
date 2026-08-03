import { fireEvent, render, screen } from '@testing-library/react-native';

import { BluetoothRationaleScreen } from '@/screens/discovery/BluetoothRationaleScreen';

describe('BluetoothRationaleScreen', () => {
  it('states privacy limits before continuing and preserves Map', () => {
    const onContinue = jest.fn();
    const onMap = jest.fn();
    render(<BluetoothRationaleScreen onContinue={onContinue} onMap={onMap} />);
    expect(screen.getByText(/does not make you visible/)).toBeOnTheScreen();
    expect(screen.getByText(/does not publish your exact location/)).toBeOnTheScreen();
    fireEvent.press(screen.getByTestId('bluetooth-continue-button'));
    fireEvent.press(screen.getByTestId('use-map-button'));
    expect(onContinue).toHaveBeenCalledTimes(1);
    expect(onMap).toHaveBeenCalledTimes(1);
  });
});

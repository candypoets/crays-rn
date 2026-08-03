import { fireEvent, render, screen } from '@testing-library/react-native';

import type { RoomDescriptor } from '@/rooms/types';
import { RoomPreviewScreen } from '@/screens/discovery/RoomPreviewScreen';

jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn(), replace: jest.fn() }, usePathname: () => '/room-preview' }));

const room: RoomDescriptor = { id: 'skyline', name: 'The Skyline Room', about: 'Rooftop jazz.', relayUrl: 'wss://skyline.test', operatorPubkey: 'a'.repeat(64), capabilities: ['social'], expiresAt: 2_000_000_000, open: true, verified: true };

describe('RoomPreviewScreen', () => {
  it('shows identity, verification, utility, and explicit entry', () => {
    const onEnter = jest.fn();
    render(<RoomPreviewScreen onEnter={onEnter} room={room} />);
    expect(screen.getByText('The Skyline Room')).toBeOnTheScreen();
    expect(screen.getByText('Verified room')).toBeOnTheScreen();
    expect(screen.getByTestId('enter-room-button')).toBeEnabled();
    expect(screen.getByText(/do not require Bluetooth/)).toBeOnTheScreen();
    fireEvent.press(screen.getByTestId('enter-room-button'));
    expect(onEnter).toHaveBeenCalledTimes(1);
  });

  it('disables entry for a closed room', () => {
    render(<RoomPreviewScreen room={{ ...room, open: false }} />);
    expect(screen.getByTestId('enter-room-button')).toBeDisabled();
    expect(screen.getByText('Room closed')).toBeOnTheScreen();
  });

  it('has a safe unverified state', () => {
    render(<RoomPreviewScreen error="Operator mismatch." />);
    expect(screen.getByText('Room could not be verified')).toBeOnTheScreen();
    expect(screen.getByText('Operator mismatch.')).toBeOnTheScreen();
  });
});

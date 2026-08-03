import { fireEvent, render, screen } from '@testing-library/react-native';

import type { RoomDescriptor } from '@/rooms/types';
import { DiscoverHandoffScreen } from '@/screens/DiscoverHandoffScreen';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn() },
  usePathname: () => '/discover',
}));

const room: RoomDescriptor = {
  id: 'skyline', name: 'The Skyline Room', about: 'Rooftop jazz.', relayUrl: 'wss://skyline.test',
  operatorPubkey: 'a'.repeat(64), capabilities: ['social', 'menu'], expiresAt: 2_000_000_000,
  open: true, verified: true,
};

describe('DiscoverHandoffScreen', () => {
  it('exposes the honest unconfigured search state without room cards', () => { const view = render(<DiscoverHandoffScreen mode="map" onChangeMode={jest.fn()} searchUnavailable />); expect(view.getByTestId('search-unavailable-state')).toBeTruthy(); expect(view.getByTestId('discover-search-disabled').props.editable).toBe(false); expect(view.queryByTestId('room-result-card')).toBeNull(); });
  it('keeps the cold-signup privacy consequence in the empty Map state', () => {
    render(<DiscoverHandoffScreen mode="map" onChangeMode={jest.fn()} />);
    expect(screen.getByRole('header', { name: 'Discover rooms' })).toBeOnTheScreen();
    expect(screen.getByText(/Account ready/i)).toBeOnTheScreen();
    expect(screen.getByText(/No Bluetooth or location permission was requested/)).toBeOnTheScreen();
    expect(screen.getByText('No room selected yet')).toBeOnTheScreen();
  });

  it('shows a relay-backed verified room result', () => {
    render(<DiscoverHandoffScreen mode="map" onChangeMode={jest.fn()} room={room} />);
    expect(screen.getByText('The Skyline Room')).toBeOnTheScreen();
    expect(screen.getByText('Verified room')).toBeOnTheScreen();
  });

  it('explains Nearby before permission', () => {
    const onChangeMode = jest.fn();
    render(<DiscoverHandoffScreen mode="nearby" onChangeMode={onChangeMode} />);
    fireEvent.press(screen.getByTestId('discover-map-tab'));
    expect(onChangeMode).toHaveBeenCalledWith('map');
    expect(screen.getByTestId('nearby-rationale-button')).toBeOnTheScreen();
  });

  it('renders verification failure without fabricating a room', () => {
    render(<DiscoverHandoffScreen error="Room signature expired." mode="map" onChangeMode={jest.fn()} />);
    expect(screen.queryByTestId('room-result-card')).not.toBeOnTheScreen();
    expect(screen.getByText('Room signature expired.')).toBeOnTheScreen();
  });
});

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
  it('keeps Map unselected and unselectable while search is unavailable', () => {
    const onChangeMode = jest.fn();
    render(<DiscoverHandoffScreen mapAvailable={false} mode="nearby" onChangeMode={onChangeMode} />);
    expect(screen.getByText("Map search isn’t available yet")).toBeOnTheScreen();
    expect(screen.getByText(/won’t invent places/)).toBeOnTheScreen();
    expect(screen.queryByTestId('room-result-card')).toBeNull();
    const mapTab = screen.getByTestId('discover-map-tab');
    expect(mapTab).toBeDisabled();
    fireEvent.press(mapTab);
    expect(onChangeMode).not.toHaveBeenCalled();
  });

  it('keeps diagnostics inside the developer section instead of the newcomer card', () => {
    render(<DiscoverHandoffScreen mapAvailable={false} mode="nearby" onChangeMode={jest.fn()} testRoom={{ loading: false }} />);
    expect(screen.getByTestId('search-unavailable-dev-note')).toBeOnTheScreen();
    expect(screen.queryByText('Map and search are not configured')).toBeNull();
    expect(screen.queryByText(/Direct signed room links/)).toBeNull();
  });

  it('hides the D-001 diagnostic with the developer section when no test room is configured', () => {
    render(<DiscoverHandoffScreen mapAvailable={false} mode="nearby" onChangeMode={jest.fn()} />);
    expect(screen.queryByTestId('search-unavailable-dev-note')).toBeNull();
    expect(screen.queryByTestId('dev-test-room-card')).toBeNull();
  });

  it('defaults the newcomer to Nearby with the consent truth and one action', () => {
    render(<DiscoverHandoffScreen mapAvailable={false} mode="nearby" onChangeMode={jest.fn()} />);
    expect(screen.getByRole('header', { name: 'Discover rooms' })).toBeOnTheScreen();
    expect(screen.getByText(/never enters one for you/)).toBeOnTheScreen();
    expect(screen.getByText(/Account ready/i)).toBeOnTheScreen();
    expect(screen.getByText(/No Bluetooth or location permission asked/)).toBeOnTheScreen();
    expect(screen.getByText('Nearby is off')).toBeOnTheScreen();
    expect(screen.getByTestId('nearby-rationale-button')).toBeOnTheScreen();
    expect(screen.getByText("Map search isn’t available yet")).toBeOnTheScreen();
  });

  it('shows a relay-backed verified room result', () => {
    render(<DiscoverHandoffScreen mode="map" onChangeMode={jest.fn()} room={room} />);
    expect(screen.getByText('The Skyline Room')).toBeOnTheScreen();
    expect(screen.getByText('Verified room')).toBeOnTheScreen();
    expect(screen.getByText('View room →')).toBeOnTheScreen();
  });

  it('exposes the development Test Room as a subordinate dev row when online', () => {
    const onOpenTestRoom = jest.fn();
    render(<DiscoverHandoffScreen mode="nearby" onChangeMode={jest.fn()} onOpenTestRoom={onOpenTestRoom} testRoom={{ loading: false, room: { ...room, id: 'crays-test-room', name: 'Crays Test Room' } }} />);
    expect(screen.getByTestId('dev-test-room-card')).toBeOnTheScreen();
    expect(screen.getByText('Crays Test Room is online')).toBeOnTheScreen();
    expect(screen.queryByText(/Development test mode/)).toBeNull();
    expect(screen.queryByText(/test relay/i)).toBeNull();
    fireEvent.press(screen.getByTestId('open-test-room'));
    expect(onOpenTestRoom).toHaveBeenCalledWith(expect.objectContaining({ id: 'crays-test-room' }));
  });

  it('keeps the recovery hint on the dev row while the Test Room is offline', () => {
    render(<DiscoverHandoffScreen mode="nearby" onChangeMode={jest.fn()} testRoom={{ error: 'offline', loading: false }} />);
    expect(screen.getByText(/npm run test-room/)).toBeOnTheScreen();
    expect(screen.getByTestId('open-test-room')).toBeDisabled();
  });

  it('lets Nearby explain itself before any permission request', () => {
    const onChangeMode = jest.fn();
    render(<DiscoverHandoffScreen mapAvailable mode="nearby" onChangeMode={onChangeMode} />);
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

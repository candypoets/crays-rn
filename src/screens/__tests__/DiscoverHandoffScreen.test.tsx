import { fireEvent, render, screen } from '@testing-library/react-native';

import type { RoomDescriptor } from '@/rooms/types';
import { DiscoverHandoffScreen } from '@/screens/DiscoverHandoffScreen';

const room: RoomDescriptor = {
  id: 'skyline', name: 'The Skyline Room', about: 'Rooftop jazz.', relayUrl: 'wss://skyline.test',
  address: `30312:${'a'.repeat(64)}:skyline`, communityAddress: `31727:${'b'.repeat(64)}:community`,
  rootPubkey: 'b'.repeat(64), operatorPubkey: 'a'.repeat(64), serviceUrl: 'https://skyline.test',
  capabilities: ['social', 'menu'], status: 'open', open: true, verified: true,
};

describe('Tonight find state', () => {
  it('shows the approved one-night doorway and honest unavailable entry methods', () => {
    render(<DiscoverHandoffScreen />);
    expect(screen.getByRole('header', { name: 'Find your room' })).toBeOnTheScreen();
    expect(screen.getByTestId('tonight-empty')).toBeOnTheScreen();
    expect(screen.getByTestId('tonight-scan')).toBeDisabled();
    expect(screen.getByTestId('tonight-map')).toBeDisabled();
    expect(screen.getByTestId('tonight-nearby')).toBeDisabled();
    expect(screen.getByText(/asks for Bluetooth or location only after/)).toBeOnTheScreen();
  });

  it('opens the exact verified room in the native entry-sheet owner', () => {
    const onOpenRoom = jest.fn();
    render(<DiscoverHandoffScreen onOpenRoom={onOpenRoom} room={room} />);
    expect(screen.getByText('Verified room')).toBeOnTheScreen();
    expect(screen.getByText('The Skyline Room')).toBeOnTheScreen();
    fireEvent.press(screen.getByTestId('room-result-card'));
    expect(onOpenRoom).toHaveBeenCalledWith(room);
  });

  it('routes each enabled physical entry action and keeps selection outside the screen', () => {
    const onMap = jest.fn(); const onNearby = jest.fn(); const onScan = jest.fn();
    render(<DiscoverHandoffScreen onMap={onMap} onNearby={onNearby} onScan={onScan} />);
    fireEvent.press(screen.getByTestId('tonight-scan'));
    fireEvent.press(screen.getByTestId('tonight-map'));
    fireEvent.press(screen.getByTestId('tonight-nearby'));
    expect(onScan).toHaveBeenCalledTimes(1); expect(onMap).toHaveBeenCalledTimes(1); expect(onNearby).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['loading', { loading: true }, 'discover-loading'],
    ['empty', {}, 'tonight-empty'],
  ] as const)('renders deterministic %s state', (_name, props, testID) => {
    render(<DiscoverHandoffScreen {...props} />);
    expect(screen.getByTestId(testID)).toBeOnTheScreen();
  });

  it('shows signature failure without fabricating a verified room', () => {
    render(<DiscoverHandoffScreen error="Room signature expired." />);
    expect(screen.getByRole('alert')).toHaveTextContent('Room signature expired.');
    expect(screen.queryByTestId('room-result-card')).toBeNull();
  });

  it('features the real test room when it is the only verified room', () => {
    const onOpenTestRoom = jest.fn();
    render(<DiscoverHandoffScreen onOpenTestRoom={onOpenTestRoom} testRoom={{ loading: false, room: { ...room, name: 'Crays Test Room' } }} />);
    fireEvent.press(screen.getByTestId('room-result-card'));
    expect(onOpenTestRoom).toHaveBeenCalledWith(expect.objectContaining({ name: 'Crays Test Room' }));
  });
});

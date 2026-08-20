import { fireEvent, render, screen } from '@testing-library/react-native';

import RoomRoute from '@/app/(tabs)/room';

const mockAcknowledge = jest.fn();
const mockNavigate = jest.fn();
let mockEndedRoom: { name: string; reason: 'automatic' | 'explicit' | 'switch' } | null;

jest.mock('expo-router', () => ({
  router: { navigate: (...args: unknown[]) => mockNavigate(...args), push: jest.fn(), setParams: jest.fn() },
  useIsFocused: () => true,
  useLocalSearchParams: () => ({}),
}));
jest.mock('@/config/testRoom', () => ({ createTestRoomPointer: () => null, TEST_ROOM_BUILD: false }));
jest.mock('@/discovery/useNearbyRoom', () => ({ useNearbyRoom: () => ({ error: null, pointer: null, scanning: false }) }));
jest.mock('@/rooms/useRoomDefinition', () => ({ useRoomDefinition: () => ({ error: null, loading: false, room: null }) }));
jest.mock('@/session/RoomSession', () => ({
  useRoomSession: () => ({
    acknowledgeEndedRoom: mockAcknowledge,
    activeRoom: null,
    endedRoom: mockEndedRoom,
    hydrated: true,
  }),
}));
jest.mock('@/screens/DiscoverHandoffScreen', () => ({
  DiscoverHandoffScreen: () => {
    const ReactRuntime = jest.requireActual<typeof import('react')>('react');
    const { View: NativeView } = jest.requireActual<typeof import('react-native')>('react-native');
    return ReactRuntime.createElement(NativeView, { testID: 'tonight-find-screen' });
  },
}));
jest.mock('@/screens/room/LeaveAndSwitchScreens', () => {
  const ReactRuntime = jest.requireActual<typeof import('react')>('react');
  const { Pressable: NativePressable, Text: NativeText, View: NativeView } = jest.requireActual<typeof import('react-native')>('react-native');
  return {
    RoomEndedScreen: ({ onDiscover, onMessages, underTabBar }: { onDiscover: () => void; onMessages: () => void; underTabBar?: boolean }) => ReactRuntime.createElement(
      NativeView,
      { testID: 'inline-room-ended' },
      ReactRuntime.createElement(NativeText, null, underTabBar ? 'Inside Tonight' : 'Outside Tonight'),
      ReactRuntime.createElement(NativePressable, { onPress: onDiscover, testID: 'discover-another' }, ReactRuntime.createElement(NativeText, null, 'Discover another room')),
      ReactRuntime.createElement(NativePressable, { onPress: onMessages, testID: 'open-messages' }, ReactRuntime.createElement(NativeText, null, 'Open Messages')),
    ),
  };
});
jest.mock('@/commerce/Cart', () => ({ useCart: () => ({ count: 0 }) }));
jest.mock('@/rooms/RoomData', () => ({ useRoomData: () => ({}) }));
jest.mock('@candypoets/nipworker/hooks', () => ({ usePublish: jest.fn() }));
jest.mock('@candypoets/nipworker/utils', () => ({ isConnectionStatus: jest.fn() }));

describe('Tonight settled-room routing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockEndedRoom = { name: 'Crays Test Room', reason: 'automatic' };
  });

  it('keeps automatic expiry inside Tonight and acknowledges Discover another room', () => {
    render(<RoomRoute />);

    expect(screen.getByTestId('inline-room-ended')).toBeOnTheScreen();
    expect(screen.getByText('Inside Tonight')).toBeOnTheScreen();
    fireEvent.press(screen.getByTestId('discover-another'));
    expect(mockAcknowledge).toHaveBeenCalledTimes(1);
  });

  it('switches to the durable Messages tab without clearing the settled state', () => {
    render(<RoomRoute />);

    fireEvent.press(screen.getByTestId('open-messages'));
    expect(mockNavigate).toHaveBeenCalledWith('/messages');
    expect(mockAcknowledge).not.toHaveBeenCalled();
  });

  it('renders Find after the settled state has been acknowledged', () => {
    mockEndedRoom = null;
    render(<RoomRoute />);

    expect(screen.getByTestId('tonight-find-screen')).toBeOnTheScreen();
    expect(screen.queryByTestId('inline-room-ended')).toBeNull();
  });
});

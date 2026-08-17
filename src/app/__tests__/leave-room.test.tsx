import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import LeaveRoomRoute from '@/app/leave-room';
import type { ActiveRoom } from '@/rooms/types';

const mockLeaveRoom = jest.fn(async () => undefined);
const mockUsePublish = jest.fn();
let mockActiveRoom: ActiveRoom | null;

const room: ActiveRoom = {
  id: 'test-room',
  name: 'Test Room',
  about: 'A room',
  relayUrl: 'wss://room.example',
  address: `30312:${'a'.repeat(64)}:test-room`,
  communityAddress: `31727:${'b'.repeat(64)}:community`,
  rootPubkey: 'b'.repeat(64),
  operatorPubkey: 'a'.repeat(64),
  serviceUrl: 'https://room.example',
  capabilities: ['social' as const],
  status: 'open' as const,
  open: true,
  verified: true,
  joinedAt: 1,
  visibility: 'visible' as const,
  intent: 'social' as const,
  context: '',
  leaveAt: 2_000_000_000_000,
};

jest.mock('expo-router', () => ({
  Redirect: () => null,
  router: { back: jest.fn(), replace: jest.fn() },
}));

jest.mock('@candypoets/nipworker/hooks', () => ({
  usePublish: (...args: unknown[]) => mockUsePublish(...args),
}));

jest.mock('@candypoets/nipworker/utils', () => ({
  isConnectionStatus: (message: unknown) => message,
}));

jest.mock('@/session/RoomSession', () => ({
  useRoomSession: () => ({ activeRoom: mockActiveRoom, hydrated: true, leaveRoom: mockLeaveRoom }),
}));

jest.mock('@/screens/room/LeaveAndSwitchScreens', () => ({
  LeaveRoomScreen: ({ error, leaving, onLeave }: { error?: string | null; leaving: boolean; onLeave: () => void }) => {
    const { Pressable, Text, View } = jest.requireActual('react-native');
    return (
      <View>
        <Pressable accessibilityRole="button" disabled={leaving} onPress={onLeave} testID="confirm-leave">
          <Text>{leaving ? 'Leaving' : 'Leave'}</Text>
        </Pressable>
        {error ? <Text>{error}</Text> : null}
      </View>
    );
  },
}));

const mockReplace = jest.requireMock('expo-router').router.replace as jest.Mock;

describe('LeaveRoomRoute relay ownership', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLeaveRoom.mockResolvedValue(undefined);
    mockActiveRoom = room;
  });

  it.each(['failed', 'false: presence write denied'])('surfaces nipworker %s status and relay reason immediately', (statusValue) => {
    const stop = jest.fn();
    let callback: ((message: unknown) => void) | undefined;
    mockUsePublish.mockImplementation((_id, _template, next) => { callback = next; return stop; });
    render(<LeaveRoomRoute />);

    fireEvent.press(screen.getByTestId('confirm-leave'));
    act(() => callback?.({ status: () => statusValue, message: () => 'blocked: presence write denied' }));

    expect(screen.getByText('blocked: presence write denied')).toBeOnTheScreen();
    expect(screen.getByText('Leave')).toBeOnTheScreen();
    expect(mockLeaveRoom).not.toHaveBeenCalled();
    expect(stop).toHaveBeenCalledTimes(1);
  });

  it.each(['ok', 'true'])('clears the local session after the first %s status', async (statusValue) => {
    let callback: ((message: unknown) => void) | undefined;
    mockUsePublish.mockImplementation((_id, _template, next) => { callback = next; return jest.fn(); });
    render(<LeaveRoomRoute />);

    fireEvent.press(screen.getByTestId('confirm-leave'));
    await act(async () => {
      callback?.({ status: () => statusValue, message: () => '' });
      await Promise.resolve();
    });

    expect(mockLeaveRoom).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith({ pathname: '/room-ended', params: { name: 'Test Room' } }));
  });

  it('leaves a quiet room locally without publishing synthetic presence', async () => {
    mockActiveRoom = { ...room, visibility: 'quiet' };
    render(<LeaveRoomRoute />);

    fireEvent.press(screen.getByTestId('confirm-leave'));

    await waitFor(() => expect(mockLeaveRoom).toHaveBeenCalledTimes(1));
    expect(mockUsePublish).not.toHaveBeenCalled();
  });

  it('stops an in-flight publish when the route unmounts', () => {
    const stop = jest.fn();
    mockUsePublish.mockReturnValue(stop);
    const view = render(<LeaveRoomRoute />);
    fireEvent.press(screen.getByTestId('confirm-leave'));

    view.unmount();

    expect(stop).toHaveBeenCalledTimes(1);
  });

  it('returns a stalled publish to a retryable timeout state', () => {
    jest.useFakeTimers();
    mockUsePublish.mockReturnValue(jest.fn());
    render(<LeaveRoomRoute />);
    fireEvent.press(screen.getByTestId('confirm-leave'));

    act(() => jest.advanceTimersByTime(12_000));

    expect(screen.getByText('The room did not confirm this action. Check the connection and try again.')).toBeOnTheScreen();
    expect(screen.getByText('Leave')).toBeOnTheScreen();
    jest.useRealTimers();
  });
});

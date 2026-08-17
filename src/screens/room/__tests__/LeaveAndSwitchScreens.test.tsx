import { fireEvent, render, screen } from '@testing-library/react-native';

import { LeaveRoomScreen, RoomEndedScreen, SwitchRoomScreen } from '@/screens/room/LeaveAndSwitchScreens';

const room = {
  id: 'one',
  name: 'One',
  about: 'Rooftop · Live music',
  relayUrl: 'wss://one',
  address: `30312:${'a'.repeat(64)}:one`,
  communityAddress: `31727:${'b'.repeat(64)}:community`,
  rootPubkey: 'b'.repeat(64),
  operatorPubkey: 'a'.repeat(64),
  serviceUrl: 'https://one',
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

describe('leave and switch privacy boundaries', () => {
  it('names the exact leave consequences and requires explicit confirmation', () => {
    const leave = jest.fn();
    const cancel = jest.fn();
    render(<LeaveRoomScreen leaving={false} onCancel={cancel} onLeave={leave} room={room} />);

    expect(screen.getByText('Stop appearing in People')).toBeOnTheScreen();
    expect(screen.getByText('Lock this room’s live feed')).toBeOnTheScreen();
    expect(screen.getByText(/Keep messages, orders, tickets/)).toBeOnTheScreen();
    fireEvent.press(screen.getByTestId('leave-room-confirm'));
    fireEvent.press(screen.getByTestId('leave-room-cancel'));
    expect(leave).toHaveBeenCalledTimes(1);
    expect(cancel).toHaveBeenCalledTimes(1);
  });

  it('locks repeat leave attempts and preserves relay failure truth', () => {
    const leave = jest.fn();
    render(<LeaveRoomScreen error="Relay rejected leave." leaving onCancel={jest.fn()} onLeave={leave} room={room} />);

    expect(screen.getByText('Leaving…')).toBeOnTheScreen();
    expect(screen.getByText('Relay rejected leave.')).toBeOnTheScreen();
    expect(screen.getByTestId('leave-room-confirm')).toBeDisabled();
    fireEvent.press(screen.getByTestId('leave-room-confirm'));
    expect(leave).not.toHaveBeenCalled();
  });

  it('names every retained object and routes both settled next actions', () => {
    const discover = jest.fn();
    const messages = jest.fn();
    render(<RoomEndedScreen onDiscover={discover} onMessages={messages} previousRoomName="One" />);

    expect(screen.getByRole('header', { name: 'You’ve left One' })).toBeOnTheScreen();
    for (const label of ['Messages', 'Orders', 'Tickets & passes', 'Memberships', 'Wallet']) {
      expect(screen.getByText(label)).toBeOnTheScreen();
    }
    expect(screen.getAllByText('Kept')).toHaveLength(5);
    fireEvent.press(screen.getByTestId('room-ended-discover'));
    fireEvent.press(screen.getByTestId('room-ended-messages'));
    expect(discover).toHaveBeenCalledTimes(1);
    expect(messages).toHaveBeenCalledTimes(1);
  });

  it('distinguishes automatic expiry without implying an announcement', () => {
    render(<RoomEndedScreen automatic onDiscover={jest.fn()} onMessages={jest.fn()} previousRoomName="One" />);

    expect(screen.getByRole('header', { name: 'Your time at One ended' })).toBeOnTheScreen();
    expect(screen.getByText(/automatic leave time passed/)).toBeOnTheScreen();
    expect(screen.getByText(/Nothing announces that you left/)).toBeOnTheScreen();
  });

  it('names both room chapters before switching and supports cancel', () => {
    const go = jest.fn();
    const cancel = jest.fn();
    const destination = { ...room, id: 'two', name: 'Two' };
    render(<SwitchRoomScreen current={room} destination={destination} loading={false} onCancel={cancel} onSwitch={go} switching={false} />);

    expect(screen.getByText('You are in')).toBeOnTheScreen();
    expect(screen.getByText('You’re entering')).toBeOnTheScreen();
    expect(screen.getByText('One')).toBeOnTheScreen();
    expect(screen.getByText('Two')).toBeOnTheScreen();
    fireEvent.press(screen.getByTestId('switch-room-confirm'));
    fireEvent.press(screen.getByTestId('switch-room-cancel'));
    expect(go).toHaveBeenCalledTimes(1);
    expect(cancel).toHaveBeenCalledTimes(1);
  });

  it('cannot switch before destination verification resolves', () => {
    const go = jest.fn();
    const { rerender } = render(<SwitchRoomScreen current={room} destination={null} loading onCancel={jest.fn()} onSwitch={go} switching={false} />);

    expect(screen.getByText('Verifying destination…')).toBeOnTheScreen();
    expect(screen.getByTestId('switch-room-confirm')).toBeDisabled();
    rerender(<SwitchRoomScreen current={room} destination={null} error="Destination rejected." loading={false} onCancel={jest.fn()} onSwitch={go} switching={false} />);
    expect(screen.getByText('Destination unavailable')).toBeOnTheScreen();
    expect(screen.getByText('Destination rejected.')).toBeOnTheScreen();
    fireEvent.press(screen.getByTestId('switch-room-confirm'));
    expect(go).not.toHaveBeenCalled();
  });

  it('locks repeat switch attempts while the leave handoff is settling', () => {
    render(<SwitchRoomScreen current={room} destination={{ ...room, id: 'two', name: 'Two' }} loading={false} onCancel={jest.fn()} onSwitch={jest.fn()} switching />);

    expect(screen.getByText('Switching rooms…')).toBeOnTheScreen();
    expect(screen.getByTestId('switch-room-confirm')).toBeDisabled();
  });
});

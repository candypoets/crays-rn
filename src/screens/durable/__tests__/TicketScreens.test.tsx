import { fireEvent, render, screen } from '@testing-library/react-native';

import type { DurableTicket } from '@/access/tickets';
import type { RoomEntitlement } from '@/rooms/types';
import { TicketDetailScreen, TicketsScreen } from '@/screens/durable/TicketScreens';

jest.mock('@/components/durable/EntitlementPresentation', () => ({
  EntitlementPresentation: ({ item }: { item: RoomEntitlement }) => {
    const { Text } = jest.requireActual('react-native');
    return <Text testID="presentation-stub">presentation:{item.state}</Text>;
  },
}));

const ticket: DurableTicket = {
  id: 'ticket',
  eventAddress: `31923:${'a'.repeat(64)}:jazz`,
  eventId: 'e'.repeat(64),
  title: 'Rooftop Jazz',
  summary: 'Live set',
  location: 'Roof',
  start: 2_000_000_000,
  end: null,
  roomId: 'skyline',
  roomName: 'Skyline',
  relayUrl: 'wss://room.test',
  status: 'going',
  confirmedAt: 1,
};
const entitlement: RoomEntitlement = {
  awardId: 'b'.repeat(64),
  badgeAddress: `30402:${'a'.repeat(64)}:jazz-entry`,
  awardIssuerPubkey: 'c'.repeat(64),
  recipientPubkey: 'd'.repeat(64),
  definitionId: 'jazz-entry',
  definitionIssuerPubkey: 'a'.repeat(64),
  type: 'event_access',
  name: 'Rooftop Jazz entry',
  description: 'Door entry',
  eventAddress: ticket.eventAddress,
  state: 'available',
  orderRef: '',
  createdAt: 1,
  activity: [],
  roomId: ticket.roomId,
  roomName: ticket.roomName,
  relayUrl: ticket.relayUrl,
};

describe('ticket archive screens', () => {
  it('opens the exact RSVP while labelling it as a non-door-code plan', () => {
    const open = jest.fn();
    render(<TicketsScreen now={1_900_000_000} onBack={jest.fn()} onOpen={open} tickets={[ticket]} />);

    expect(screen.getByText('RSVPs')).toBeOnTheScreen();
    expect(screen.getByText('Saved plans · not door codes')).toBeOnTheScreen();
    expect(screen.getByText('RSVP saved · No entry code')).toBeOnTheScreen();
    fireEvent.press(screen.getByTestId(`ticket-row-${ticket.eventId}`));
    expect(open).toHaveBeenCalledWith(ticket);
  });

  it('separates past RSVPs and renders an honest empty archive', () => {
    const ended = { ...ticket, end: 1_800_000_000 };
    const { rerender } = render(<TicketsScreen now={1_900_000_000} onBack={jest.fn()} onOpen={jest.fn()} tickets={[ended]} />);
    expect(screen.getByText('Past RSVPs')).toBeOnTheScreen();
    expect(screen.getByText('Past RSVP')).toBeOnTheScreen();
    rerender(<TicketsScreen now={1_900_000_000} onBack={jest.fn()} onOpen={jest.fn()} tickets={[]} />);
    expect(screen.getByRole('header', { name: 'No upcoming tickets' })).toBeOnTheScreen();
  });

  it('opens the exact venue-issued award and exposes presentable status', () => {
    const open = jest.fn();
    render(<TicketsScreen entitlements={[entitlement]} now={1_900_000_000} onBack={jest.fn()} onOpen={jest.fn()} onOpenEntitlement={open} tickets={[]} />);
    expect(screen.getByText('Ready at the door')).toBeOnTheScreen();
    expect(screen.getByText('Show at the door')).toBeOnTheScreen();
    fireEvent.press(screen.getByTestId(`ticket-award-${entitlement.awardId}`));
    expect(open).toHaveBeenCalledWith(entitlement);
  });

  it('keeps invalid awards visible as detail without calling them door-ready', () => {
    render(<TicketsScreen entitlements={[{ ...entitlement, state: 'revoked' }]} now={1_900_000_000} onBack={jest.fn()} onOpen={jest.fn()} tickets={[]} />);
    expect(screen.getByText('Revoked')).toBeOnTheScreen();
    expect(screen.queryByText('Show at the door')).not.toBeOnTheScreen();
  });

  it('labels an RSVP detail as non-scannable without rendering a fake code', () => {
    render(<TicketDetailScreen onBack={jest.fn()} ticket={ticket} />);
    expect(screen.getByText('RSVP saved')).toBeOnTheScreen();
    expect(screen.getByText('No entry code yet')).toBeOnTheScreen();
    expect(screen.queryByText(/relay|kind-27236/i)).not.toBeOnTheScreen();
    expect(screen.queryByTestId('presentation-stub')).not.toBeOnTheScreen();
  });

  it('labels a venue-issued credential as ready and renders its presentation owner', () => {
    const back = jest.fn();
    render(<TicketDetailScreen entitlement={entitlement} onBack={back} />);
    expect(screen.getByText('Ready to show')).toBeOnTheScreen();
    expect(screen.getByText(/Staff checks your ticket/)).toBeOnTheScreen();
    expect(screen.getByTestId('presentation-stub')).toHaveTextContent('presentation:available');
    expect(screen.queryByText(/relay issued|venue relay/i)).not.toBeOnTheScreen();
    expect(screen.getByTestId('ticket-detail-back').props.className).toContain('min-h-12');
    fireEvent.press(screen.getByTestId('ticket-detail-back'));
    expect(back).toHaveBeenCalledTimes(1);
  });

  it('replaces an invalid credential action with status and no-live-code truth', () => {
    render(<TicketDetailScreen entitlement={{ ...entitlement, state: 'exhausted' }} onBack={jest.fn()} />);
    expect(screen.getByText('Used')).toBeOnTheScreen();
    expect(screen.getByText('No live code is shown while this ticket is unavailable.')).toBeOnTheScreen();
    expect(screen.queryByText('Ready to show')).not.toBeOnTheScreen();
  });

  it('renders a missing exact ticket with a working archive action', () => {
    const back = jest.fn();
    render(<TicketDetailScreen onBack={back} />);
    expect(screen.getByRole('header', { name: 'Ticket unavailable' })).toBeOnTheScreen();
    fireEvent.press(screen.getByTestId('ticket-detail-back'));
    expect(back).toHaveBeenCalledTimes(1);
  });
});

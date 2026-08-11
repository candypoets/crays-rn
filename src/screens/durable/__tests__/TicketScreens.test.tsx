import { fireEvent, render } from '@testing-library/react-native';
import { TicketDetailScreen, TicketsScreen } from '@/screens/durable/TicketScreens';
import type { DurableTicket } from '@/access/tickets';
import type { RoomEntitlement } from '@/rooms/types';

jest.mock('@/components/durable/EntitlementPresentation', () => ({ EntitlementPresentation: () => null }));

const ticket: DurableTicket = { id: 'ticket', eventAddress: `31923:${'a'.repeat(64)}:jazz`, eventId: 'e'.repeat(64), title: 'Rooftop Jazz', summary: 'Live set', location: 'Roof', start: 2_000_000_000, end: null, roomId: 'skyline', roomName: 'Skyline', relayUrl: 'wss://room.test', status: 'going', confirmedAt: 1 };
const entitlement: RoomEntitlement = { awardId: 'b'.repeat(64), badgeAddress: `30402:${'a'.repeat(64)}:jazz-entry`, awardIssuerPubkey: 'c'.repeat(64), recipientPubkey: 'd'.repeat(64), definitionId: 'jazz-entry', definitionIssuerPubkey: 'a'.repeat(64), type: 'event_access', name: 'Rooftop Jazz entry', description: 'Door entry', eventAddress: ticket.eventAddress, state: 'available', orderRef: '', createdAt: 1, activity: [], roomId: ticket.roomId, roomName: ticket.roomName, relayUrl: ticket.relayUrl };

describe('ticket archive screens', () => {
  it('opens a durable ticket from the list', () => { const open = jest.fn(); const view = render(<TicketsScreen now={1_900_000_000} onBack={jest.fn()} onOpen={open} tickets={[ticket]} />); fireEvent.press(view.getByTestId(`ticket-row-${ticket.eventId}`)); expect(open).toHaveBeenCalledWith(ticket); });
  it('labels an RSVP as non-scannable in plain product language', () => { const view = render(<TicketDetailScreen onBack={jest.fn()} ticket={ticket} />); expect(view.getByText('RSVP saved')).toBeTruthy(); expect(view.getByText('No entry code yet')).toBeTruthy(); expect(view.queryByText(/relay|kind-27236/i)).toBeNull(); });
  it('labels a venue-issued credential as ready without exposing relay jargon', () => { const view = render(<TicketDetailScreen entitlement={entitlement} onBack={jest.fn()} />); expect(view.getByText('Ready to show')).toBeTruthy(); expect(view.getByText(/Staff checks your ticket/)).toBeTruthy(); expect(view.queryByText(/relay issued|venue relay/i)).toBeNull(); expect(view.getByTestId('ticket-detail-back').props.className).toContain('min-h-12'); });
});

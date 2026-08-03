import { fireEvent, render } from '@testing-library/react-native';
import { TicketDetailScreen, TicketsScreen } from '@/screens/durable/TicketScreens';
import type { DurableTicket } from '@/access/tickets';

jest.mock('@/components/durable/EntitlementPresentation', () => ({ EntitlementPresentation: () => null }));

const ticket: DurableTicket = { id: 'ticket', eventAddress: `31923:${'a'.repeat(64)}:jazz`, eventId: 'e'.repeat(64), title: 'Rooftop Jazz', summary: 'Live set', location: 'Roof', start: 2_000_000_000, end: null, roomId: 'skyline', roomName: 'Skyline', relayUrl: 'wss://room.test', status: 'going', confirmedAt: 1 };

describe('ticket archive screens', () => {
  it('opens a durable ticket from the list', () => { const open = jest.fn(); const view = render(<TicketsScreen now={1_900_000_000} onBack={jest.fn()} onOpen={open} tickets={[ticket]} />); fireEvent.press(view.getByTestId(`ticket-row-${ticket.eventId}`)); expect(open).toHaveBeenCalledWith(ticket); });
  it('labels the scanner surface as a preview', () => { const view = render(<TicketDetailScreen onBack={jest.fn()} ticket={ticket} />); expect(view.getByText('Going · relay confirmed')).toBeTruthy(); expect(view.getByText('Preview only · ticket credential not configured')).toBeTruthy(); });
});

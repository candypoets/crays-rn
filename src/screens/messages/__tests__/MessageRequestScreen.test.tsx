import { fireEvent, render, screen } from '@testing-library/react-native';

import { MessageRequestScreen } from '@/screens/messages/MessageRequestScreen';
import type { RoomPerson } from '@/rooms/types';

jest.mock('expo-router', () => ({ router: { replace: jest.fn() }, usePathname: () => '/message-request' }));

const person: RoomPerson = { pubkey: 'b'.repeat(64), name: 'Maya', about: '', intent: 'Open to chat', context: '', expiresAt: 2_000_000_000, createdAt: 1 };

describe('MessageRequestScreen', () => {
  it('supports editable starter and one-message send commitment', () => {
    const onChangeMessage = jest.fn();
    const onSend = jest.fn();
    render(<MessageRequestScreen message="Hello" onBack={jest.fn()} onChangeMessage={onChangeMessage} onSend={onSend} person={person} />);
    fireEvent.press(screen.getByText('What are you drinking?'));
    expect(onChangeMessage).toHaveBeenCalledWith('What are you drinking?');
    fireEvent.press(screen.getByTestId('send-message-request'));
    expect(onSend).toHaveBeenCalledTimes(1);
  });

  it('shows relay failure and disables an empty request', () => {
    render(<MessageRequestScreen error="Rejected" message="" onBack={jest.fn()} onChangeMessage={jest.fn()} onSend={jest.fn()} person={person} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Rejected');
    expect(screen.getByTestId('send-message-request')).toBeDisabled();
  });

  it('prevents a second prompt after success', () => {
    render(<MessageRequestScreen message="Hello" onBack={jest.fn()} onChangeMessage={jest.fn()} onSend={jest.fn()} person={person} sent />);
    expect(screen.getByText('Request sent')).toBeOnTheScreen();
    expect(screen.queryByTestId('send-message-request')).not.toBeOnTheScreen();
  });
});

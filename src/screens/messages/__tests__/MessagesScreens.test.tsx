import { fireEvent, render, screen } from '@testing-library/react-native';

import type { LocalMessage } from '@/messages/store';
import { ConversationScreen, MessagesScreen, messageTimestamp } from '@/screens/messages/MessagesScreens';

const message: LocalMessage = {
  id: 'm',
  recipientPubkey: 'a'.repeat(64),
  recipientName: 'Maya',
  roomId: 'room',
  roomName: 'Skyline',
  content: 'Hello',
  createdAt: 1,
  state: 'requested',
  direction: 'incoming',
  protocol: 'nip04',
};

function conversationProps(overrides: Partial<Parameters<typeof ConversationScreen>[0]> = {}): Parameters<typeof ConversationScreen>[0] {
  return {
    draft: '',
    message,
    onAccept: jest.fn(),
    onBack: jest.fn(),
    onBlock: jest.fn(),
    onChangeDraft: jest.fn(),
    onNotNow: jest.fn(),
    onReply: jest.fn(),
    onReport: jest.fn(),
    sending: false,
    ...overrides,
  };
}

describe('durable messages', () => {
  it('has an honest empty state alongside a relay error', () => {
    render(<MessagesScreen error="The direct-message relay is unavailable." messages={[]} onOpen={jest.fn()} />);

    expect(screen.getByRole('header', { name: 'No conversations yet' })).toBeOnTheScreen();
    expect(screen.getByTestId('messages-error')).toBeOnTheScreen();
    expect(screen.getByText('The direct-message relay is unavailable.')).toBeOnTheScreen();
  });

  it('opens exact stored conversation context and labels outbound waiting', () => {
    const open = jest.fn();
    const outgoing = { ...message, direction: 'outgoing' as const };
    render(<MessagesScreen messages={[outgoing]} onOpen={open} />);

    expect(screen.getByText('waiting')).toBeOnTheScreen();
    expect(screen.getByText('Skyline')).toBeOnTheScreen();
    expect(screen.getByText(messageTimestamp(outgoing.createdAt))).toBeOnTheScreen();
    fireEvent.press(screen.getByTestId(`message-row-${message.recipientPubkey}`));
    expect(open).toHaveBeenCalledWith(outgoing);
  });

  it('exposes accept, not-now, block, report, and Back controls for a request', () => {
    const onAccept = jest.fn();
    const onBack = jest.fn();
    const onBlock = jest.fn();
    const onNotNow = jest.fn();
    const onReport = jest.fn();
    render(<ConversationScreen {...conversationProps({ onAccept, onBack, onBlock, onNotNow, onReport })} />);

    expect(screen.getByText('Message request · requested')).toBeOnTheScreen();
    fireEvent.press(screen.getByTestId('conversation-accept'));
    fireEvent.press(screen.getByTestId('conversation-not-now'));
    fireEvent.press(screen.getByTestId('conversation-block'));
    fireEvent.press(screen.getByTestId('conversation-report'));
    fireEvent.press(screen.getByTestId('conversation-back'));
    expect(onAccept).toHaveBeenCalledTimes(1);
    expect(onNotNow).toHaveBeenCalledTimes(1);
    expect(onBlock).toHaveBeenCalledTimes(1);
    expect(onReport).toHaveBeenCalledTimes(1);
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('shows outgoing waiting without exposing accept or reply controls', () => {
    render(<ConversationScreen {...conversationProps({ message: { ...message, direction: 'outgoing' } })} />);

    expect(screen.getByText(/Waiting for Maya/)).toBeOnTheScreen();
    expect(screen.queryByTestId('conversation-accept')).not.toBeOnTheScreen();
    expect(screen.queryByTestId('conversation-reply-input')).not.toBeOnTheScreen();
  });

  it('allows a non-empty reply only after acceptance and preserves its boundary', () => {
    const onChangeDraft = jest.fn();
    const onReply = jest.fn();
    const accepted = { ...message, state: 'accepted' as const };
    const { rerender } = render(<ConversationScreen {...conversationProps({ message: accepted, onChangeDraft, onReply })} />);

    expect(screen.getByTestId('conversation-send-reply')).toBeDisabled();
    expect(screen.getByTestId('conversation-reply-input')).toHaveProp('maxLength', 2000);
    rerender(<ConversationScreen {...conversationProps({ draft: 'See you there', message: accepted, onChangeDraft, onReply })} />);
    fireEvent.changeText(screen.getByTestId('conversation-reply-input'), 'Later');
    fireEvent.press(screen.getByTestId('conversation-send-reply'));
    expect(onChangeDraft).toHaveBeenCalledWith('Later');
    expect(onReply).toHaveBeenCalledTimes(1);
  });

  it('locks accepted replies while sending and retains the draft', () => {
    render(<ConversationScreen {...conversationProps({ draft: 'See you there', message: { ...message, state: 'accepted' }, sending: true })} />);

    expect(screen.getByText('Sending…')).toBeOnTheScreen();
    expect(screen.getByTestId('conversation-reply-input')).toHaveProp('value', 'See you there');
    expect(screen.getByTestId('conversation-send-reply')).toBeDisabled();
  });

  it('renders ignored, blocked, and error truth without hiding safety actions', () => {
    const { rerender } = render(<ConversationScreen {...conversationProps({ error: 'Report rejected.', message: { ...message, state: 'ignored' } })} />);
    expect(screen.getByText(/Request dismissed/)).toBeOnTheScreen();
    expect(screen.getByRole('alert')).toHaveAccessibleName('Report rejected.');
    rerender(<ConversationScreen {...conversationProps({ message: { ...message, state: 'blocked' } })} />);
    expect(screen.getByText(/blocked on this device/)).toBeOnTheScreen();
    expect(screen.getByTestId('conversation-report')).toBeOnTheScreen();
  });
});

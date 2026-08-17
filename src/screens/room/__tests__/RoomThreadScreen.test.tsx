import { fireEvent, render, screen } from '@testing-library/react-native';

import { buildRoomThread } from '@/rooms/feed';
import type { RoomPost, RoomProfile } from '@/rooms/types';
import { RoomThreadScreen } from '@/screens/room/RoomThreadScreen';

const root: RoomPost = { id: 'root', pubkey: 'a'.repeat(64), content: 'Meet by the stage.', createdAt: 1, announcement: false, expiresAt: 2_000_000_000, images: [], participantPubkeys: [] };
const reply: RoomPost = { ...root, id: 'reply', pubkey: 'b'.repeat(64), content: 'On my way.', createdAt: 2, replyToId: root.id, rootId: root.id, rootPubkey: root.pubkey };
const profile: RoomProfile = { pubkey: root.pubkey, name: 'Maya', about: '', createdAt: 1 };

function props(overrides: Partial<Parameters<typeof RoomThreadScreen>[0]> = {}): Parameters<typeof RoomThreadScreen>[0] {
  return { roomName: 'The Skyline Room', thread: buildRoomThread([root, reply], root.id), loading: false, profiles: new Map([[root.pubkey, profile]]), reactions: [], onBack: jest.fn(), onLike: jest.fn(), onMessage: jest.fn(), onOpenPerson: jest.fn(), onReply: jest.fn(), onReport: jest.fn(), ...overrides };
}

describe('RoomThreadScreen', () => {
  it('renders the root and ordered responses with reply actions', () => {
    const onReply = jest.fn();
    render(<RoomThreadScreen {...props({ onReply })} />);
    expect(screen.getByTestId('room-thread-screen')).toBeOnTheScreen();
    expect(screen.getByText('Meet by the stage.')).toBeOnTheScreen();
    expect(screen.getByText('Responses')).toBeOnTheScreen();
    expect(screen.getByText('On my way.')).toBeOnTheScreen();
    fireEvent.press(screen.getByTestId('reply-to-thread'));
    expect(onReply).toHaveBeenCalledWith(expect.objectContaining({ id: root.id }));
  });

  it('shows loading, unavailable, and empty-response states', () => {
    const { rerender } = render(<RoomThreadScreen {...props({ loading: true, thread: [] })} />);
    expect(screen.getByTestId('room-thread-loading')).toBeOnTheScreen();
    rerender(<RoomThreadScreen {...props({ loading: false, thread: [] })} />);
    expect(screen.getByText('This post is unavailable')).toBeOnTheScreen();
    rerender(<RoomThreadScreen {...props({ thread: buildRoomThread([root], root.id) })} />);
    expect(screen.getByText('No responses yet')).toBeOnTheScreen();
  });

  it('announces failures and forwards like, report, message, profile, and nested reply actions', () => {
    const onLike = jest.fn(); const onReport = jest.fn(); const onMessage = jest.fn(); const onOpenPerson = jest.fn(); const onReply = jest.fn();
    render(<RoomThreadScreen {...props({ notice: 'Relay rejected it.', onLike, onReport, onMessage, onOpenPerson, onReply })} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Relay rejected it.');
    fireEvent.press(screen.getByTestId(`like-post-${reply.id}`));
    fireEvent.press(screen.getByTestId(`report-post-${reply.id}`));
    fireEvent.press(screen.getByTestId(`message-post-${reply.id}`));
    fireEvent.press(screen.getByTestId(`post-author-${reply.id}`));
    fireEvent.press(screen.getByTestId(`reply-post-${reply.id}`));
    expect(onLike).toHaveBeenCalledWith(expect.objectContaining({ id: reply.id }));
    expect(onReport).toHaveBeenCalledWith(expect.objectContaining({ id: reply.id }));
    expect(onMessage).toHaveBeenCalledWith(expect.objectContaining({ id: reply.id }));
    expect(onOpenPerson).toHaveBeenCalledWith(expect.objectContaining({ id: reply.id }));
    expect(onReply).toHaveBeenCalledWith(expect.objectContaining({ id: reply.id }));
  });
});

import { fireEvent, render, screen } from '@testing-library/react-native';

import type { ActiveRoom, RoomPost, RoomProfile } from '@/rooms/types';
import { RoomPostScreen } from '@/screens/room/RoomPostScreen';

const room: ActiveRoom = {
  id: 'skyline', name: 'The Skyline Room', about: '', relayUrl: 'wss://room.test', address: `30312:${'a'.repeat(64)}:skyline`, communityAddress: `31727:${'b'.repeat(64)}:community`, rootPubkey: 'b'.repeat(64), operatorPubkey: 'a'.repeat(64), serviceUrl: 'https://room.test', capabilities: ['social'], status: 'open', open: true, verified: true, joinedAt: 1, visibility: 'quiet', intent: 'curious', context: '', leaveAt: 2_000_000_000_000,
};
const parent: RoomPost = { id: 'post-1', pubkey: 'c'.repeat(64), content: 'Who is by the stage?', createdAt: 1, announcement: false, expiresAt: 2_000_000_000, images: [], participantPubkeys: [] };
const profile: RoomProfile = { pubkey: parent.pubkey, name: 'Maya', about: '', createdAt: 1 };

function props(overrides: Partial<Parameters<typeof RoomPostScreen>[0]> = {}): Parameters<typeof RoomPostScreen>[0] {
  return { activeRoom: room, attachments: [], draft: '', phase: 'idle', onAddImages: jest.fn(), onChangeDraft: jest.fn(), onClose: jest.fn(), onPublish: jest.fn(), onRemoveImage: jest.fn(), ...overrides };
}

describe('RoomPostScreen', () => {
  it('renders a focused new-post modal and disables an empty draft', () => {
    render(<RoomPostScreen {...props()} />);
    expect(screen.getByTestId('room-post-screen')).toBeOnTheScreen();
    expect(screen.getByText('New post')).toBeOnTheScreen();
    expect(screen.getByText('Posting in The Skyline Room')).toBeOnTheScreen();
    expect(screen.getByTestId('publish-room-post')).toBeDisabled();
    expect(screen.getByTestId('room-post-input')).toHaveProp('maxLength', 500);
    expect(screen.getByText('0/500')).toBeOnTheScreen();
  });

  it('shows reply context and publishes a text reply', () => {
    const onPublish = jest.fn();
    render(<RoomPostScreen {...props({ draft: 'I am.', onPublish, parent, parentProfile: profile })} />);
    expect(screen.getByText('Replying to Maya')).toBeOnTheScreen();
    expect(screen.getByText('Who is by the stage?')).toBeOnTheScreen();
    expect(screen.getByLabelText('Write a reply to Maya')).toBeOnTheScreen();
    fireEvent.press(screen.getByTestId('publish-room-post'));
    expect(onPublish).toHaveBeenCalledTimes(1);
  });

  it('allows an image-only post, removes attachments, and explains Blossom timing', () => {
    const onRemoveImage = jest.fn();
    render(<RoomPostScreen {...props({ attachments: [{ uri: 'file:///room.jpg', width: 800, height: 600, mimeType: 'image/jpeg', fileName: 'room.jpg' }], onRemoveImage })} />);
    expect(screen.getByTestId('publish-room-post')).toBeEnabled();
    expect(screen.getByLabelText('room.jpg')).toHaveProp('source', { uri: 'file:///room.jpg' });
    expect(screen.getByText(/uploads them to Blossom only after you tap Post/)).toBeOnTheScreen();
    fireEvent.press(screen.getByLabelText('Remove room.jpg'));
    expect(onRemoveImage).toHaveBeenCalledWith('file:///room.jpg');
  });

  it.each([
    ['selecting', 'Opening photos…'],
    ['uploading', 'Uploading photos…'],
    ['publishing', 'Publishing…'],
  ] as const)('locks duplicate submission while %s', (phase, label) => {
    render(<RoomPostScreen {...props({ draft: 'Hello', phase })} />);
    expect(screen.getByLabelText(label)).toBeDisabled();
    expect(screen.getByTestId('room-post-input')).toHaveProp('editable', false);
  });

  it('retains the draft on error and blocks a missing reply target', () => {
    render(<RoomPostScreen {...props({ draft: 'Still here', error: 'Relay rejected it.', replyTargetMissing: true })} />);
    expect(screen.getByRole('alert', { name: 'The post you wanted to reply to is unavailable.' })).toBeOnTheScreen();
    expect(screen.getByText('Relay rejected it.')).toBeOnTheScreen();
    expect(screen.getByTestId('room-post-input')).toHaveProp('value', 'Still here');
    expect(screen.getByTestId('publish-room-post')).toBeDisabled();
  });
});

import { fireEvent, render, screen } from '@testing-library/react-native';

import { RoomScreen } from '@/screens/room/RoomScreen';
import type { ActiveRoom, RoomPerson, RoomPost, RoomProfile } from '@/rooms/types';

jest.mock('expo-router', () => ({ router: { replace: jest.fn() }, usePathname: () => '/room' }));

const activeRoom: ActiveRoom = {
  id: 'skyline', name: 'The Skyline Room', about: 'Rooftop jazz', relayUrl: 'wss://room.test',
  operatorPubkey: 'a'.repeat(64), capabilities: ['social', 'menu'], expiresAt: 2_000_000_000,
  open: true, verified: true, joinedAt: 1, visibility: 'quiet', intent: 'curious', context: '', leaveAt: 2_000_000_000_000,
};
const maya: RoomPerson = {
  pubkey: 'b'.repeat(64), name: 'Maya', about: 'Here for jazz', intent: 'Open to chat', context: 'Here for the jazz',
  expiresAt: 2_000_000_000, createdAt: 1,
};
const profile: RoomProfile = { pubkey: maya.pubkey, name: 'Maya', about: '', createdAt: 1 };
const post: RoomPost = { id: 'post-1', pubkey: maya.pubkey, content: 'Jazz starts at 20:30.', createdAt: 1, announcement: true, expiresAt: 2_000_000_000 };

function props(overrides: Partial<Parameters<typeof RoomScreen>[0]> = {}): Parameters<typeof RoomScreen>[0] {
  return {
    activeRoom, connected: true, loading: false, people: [maya], posts: [post], profiles: new Map([[maya.pubkey, profile]]),
    view: 'people', composer: '', onChangeComposer: jest.fn(), onChangeView: jest.fn(), onLeave: jest.fn(),
    onMenu: jest.fn(), onMyNight: jest.fn(), onOpenPerson: jest.fn(), onPublish: jest.fn(), onReportPost: jest.fn(), ...overrides,
  };
}

describe('RoomScreen', () => {
  it('renders visible people in predictable accessibility order', () => {
    const onOpenPerson = jest.fn();
    render(<RoomScreen {...props({ onOpenPerson })} />);
    expect(screen.getByText('Connected in the room')).toBeOnTheScreen();
    expect(screen.getByText('1 visible · no distance or ranking')).toBeOnTheScreen();
    fireEvent.press(screen.getByTestId(`person-${maya.pubkey}`));
    expect(onOpenPerson).toHaveBeenCalledWith(maya.pubkey);
  });

  it('explains an empty quiet roster without implying nobody is present', () => {
    render(<RoomScreen {...props({ people: [] })} />);
    expect(screen.getByText(/Only people who chose to be visible/)).toBeOnTheScreen();
  });

  it('renders room-only feed, announcement, composer, and publish error', () => {
    render(<RoomScreen {...props({ view: 'feed', composer: 'Hello', composerError: 'Relay rejected it.' })} />);
    expect(screen.getByText('Live from this room')).toBeOnTheScreen();
    expect(screen.getByText('Announcement')).toBeOnTheScreen();
    expect(screen.getByText('Jazz starts at 20:30.')).toBeOnTheScreen();
    expect(screen.getByRole('alert')).toHaveTextContent('Relay rejected it.');
  });

  it('sends the exact selected post to the report owner', () => {
    const onReportPost = jest.fn();
    render(<RoomScreen {...props({ view: 'feed', onReportPost })} />);
    fireEvent.press(screen.getByTestId(`report-post-${post.id}`));
    expect(onReportPost).toHaveBeenCalledWith(post);
  });
});

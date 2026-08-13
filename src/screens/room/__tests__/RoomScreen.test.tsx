import { fireEvent, render, screen } from '@testing-library/react-native';

import { RoomScreen } from '@/screens/room/RoomScreen';
import type { ActiveRoom, RoomPerson, RoomPost, RoomProfile } from '@/rooms/types';

jest.mock('expo-router', () => ({ router: { replace: jest.fn() }, usePathname: () => '/room' }));

const activeRoom: ActiveRoom = {
  id: 'skyline', name: 'The Skyline Room', about: 'Rooftop jazz', relayUrl: 'wss://room.test',
  address: `30312:${'a'.repeat(64)}:skyline`, communityAddress: `31727:${'b'.repeat(64)}:community`,
  rootPubkey: 'b'.repeat(64), operatorPubkey: 'a'.repeat(64), serviceUrl: 'https://room.test',
  capabilities: ['social', 'menu'], status: 'open', open: true, verified: true,
  joinedAt: 1_600_000_000_000, visibility: 'quiet', intent: 'curious', context: '', leaveAt: 2_000_000_000_000,
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
    const joined = new Date(activeRoom.joinedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    const expiryDate = new Date(activeRoom.leaveAt);
    const expiry = `${expiryDate.toLocaleDateString([], { day: 'numeric', month: 'short' })} · ${expiryDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
    expect(screen.getByText('Connected in the room')).toBeOnTheScreen();
    expect(screen.getByText('People here · 1 visible')).toBeOnTheScreen();
    expect(screen.getByLabelText(`Room session. Joined ${joined}. Leave at ${expiry}.`)).toBeOnTheScreen();
    expect(screen.queryByText(activeRoom.about)).toBeNull();
    expect(screen.queryByText('Room moment')).toBeNull();
    expect(screen.queryByLabelText(`${activeRoom.name} venue atmosphere`)).toBeNull();
    expect(screen.getByLabelText('Maya, Open to chat, Here for the jazz')).toBeOnTheScreen();
    fireEvent.press(screen.getByTestId(`person-${maya.pubkey}`));
    expect(onOpenPerson).toHaveBeenCalledWith(maya.pubkey);
  });

  it('explains an empty quiet roster without implying nobody is present', () => {
    render(<RoomScreen {...props({ people: [] })} />);
    expect(screen.getByText(/Only people who chose to be visible/)).toBeOnTheScreen();
  });

  it('renders room-only feed, announcement, composer, and publish error', () => {
    render(<RoomScreen {...props({ view: 'feed', composer: 'Hello', composerError: 'Relay rejected it.' })} />);
    expect(screen.getByText('Room feed')).toBeOnTheScreen();
    expect(screen.getByText('Chronological · locks when you leave')).toBeOnTheScreen();
    expect(screen.getByText('Add a note')).toBeOnTheScreen();
    expect(screen.getByText('Announcement')).toBeOnTheScreen();
    expect(screen.getByText('Jazz starts at 20:30.')).toBeOnTheScreen();
    expect(screen.getByRole('alert')).toHaveTextContent('Relay rejected it.');
  });

  it('keeps publish disabled for an empty draft and exposes the 500-character boundary', () => {
    render(<RoomScreen {...props({ view: 'feed', composer: '   ' })} />);

    expect(screen.getByTestId('publish-room-post')).toBeDisabled();
    expect(screen.getByTestId('room-post-input')).toHaveProp('maxLength', 500);
    expect(screen.getByText('3/500')).toBeOnTheScreen();
  });

  it('retains the draft and locks the composer action while publish is pending', () => {
    render(<RoomScreen {...props({ view: 'feed', composer: 'Hello', composerLoading: true })} />);

    expect(screen.getByTestId('room-post-input')).toHaveProp('value', 'Hello');
    expect(screen.getByText('5/500')).toBeOnTheScreen();
    expect(screen.getByTestId('publish-room-post')).toBeDisabled();
  });

  it('sends the exact selected post to the report owner', () => {
    const onReportPost = jest.fn();
    render(<RoomScreen {...props({ view: 'feed', onReportPost })} />);
    fireEvent.press(screen.getByTestId(`report-post-${post.id}`));
    expect(onReportPost).toHaveBeenCalledWith(post);
  });

  it('locks only the selected report action while its relay result is pending', () => {
    render(<RoomScreen {...props({ view: 'feed', reportingPostId: post.id })} />);

    expect(screen.getByTestId(`report-post-${post.id}`)).toBeDisabled();
    expect(screen.getByText('Reporting…')).toBeOnTheScreen();
  });
});

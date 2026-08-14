import { fireEvent, render, screen } from '@testing-library/react-native';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getPeopleRosterLayout, RoomScreen } from '@/screens/room/RoomScreen';
import type { ActiveRoom, RoomPerson, RoomPost, RoomProduct, RoomProfile } from '@/rooms/types';

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
const profile: RoomProfile = { pubkey: maya.pubkey, name: 'Maya', about: '', picture: 'https://profiles.example/maya.jpg', createdAt: 1 };
const post: RoomPost = { id: 'post-1', pubkey: maya.pubkey, content: 'Jazz starts at 20:30.', createdAt: 1, announcement: true, expiresAt: 2_000_000_000 };
const product: RoomProduct = { id: 'drink-1', address: `30402:${'a'.repeat(64)}:drink`, name: 'Mezcal Negroni', description: 'Smoky and bitter', price: 12, currency: 'EUR', section: 'Cocktails', productKind: 'drink', available: true, position: 0 };

function props(overrides: Partial<Parameters<typeof RoomScreen>[0]> = {}): Parameters<typeof RoomScreen>[0] {
  return {
    activeRoom, cartCount: 0, connected: true, loading: false, people: [{ ...maya, picture: profile.picture }], posts: [post], products: [product], profiles: new Map([[maya.pubkey, profile]]),
    view: 'menu', composer: '', onCart: jest.fn(), onChangeComposer: jest.fn(), onChangeView: jest.fn(), onLeave: jest.fn(),
    onMyNight: jest.fn(), onOpenPerson: jest.fn(), onOpenProduct: jest.fn(), onPublish: jest.fn(), onReportPost: jest.fn(), ...overrides,
  };
}

describe('RoomScreen', () => {
  beforeEach(() => {
    jest.mocked(useSafeAreaInsets).mockReturnValue({ bottom: 0, left: 0, right: 0, top: 0 });
  });

  it('lets the room scroll through the top safe area while the tab bar owns the bottom inset', () => {
    jest.mocked(useSafeAreaInsets).mockReturnValue({ bottom: 20, left: 0, right: 0, top: 24 });
    render(<RoomScreen {...props()} />);

    const scrollView = screen.UNSAFE_getByType(ScrollView);
    expect(scrollView.props.contentContainerStyle).toEqual({ paddingTop: 24 });
    expect(scrollView.props.scrollIndicatorInsets).toEqual({ top: 24, bottom: 0 });
  });

  it('selects the relay menu by default and exposes the live people count in room navigation', () => {
    const onChangeView = jest.fn();
    const onOpenProduct = jest.fn();
    render(<RoomScreen {...props({ onChangeView, onOpenProduct })} />);

    expect(screen.getByTestId('room-menu-screen')).toBeOnTheScreen();
    expect(screen.getByRole('tab', { name: 'Menu' })).toBeSelected();
    expect(screen.getByRole('tab', { name: 'People, 1 visible' })).not.toBeSelected();
    expect(screen.getByText('Mezcal Negroni')).toBeOnTheScreen();
    fireEvent.press(screen.getByRole('tab', { name: 'People, 1 visible' }));
    expect(onChangeView).toHaveBeenCalledWith('people');
  });

  it('renders visible people in predictable accessibility order', () => {
    const onOpenPerson = jest.fn();
    render(<RoomScreen {...props({ onOpenPerson, view: 'people' })} />);
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
    expect(screen.getByTestId('people-roster')).toBeOnTheScreen();
    expect(screen.UNSAFE_getAllByType(ScrollView)).toHaveLength(1);
    expect(screen.UNSAFE_getByType(ScrollView).props.horizontal).not.toBe(true);
    expect(screen.getByTestId(`person-image-${maya.pubkey}-profile-image`)).toHaveProp('source', { uri: profile.picture });
    fireEvent.press(screen.getByTestId(`person-${maya.pubkey}`));
    expect(onOpenPerson).toHaveBeenCalledWith(maya.pubkey);
  });

  it('adapts roster columns to compact, expanded, and large-text windows', () => {
    expect(getPeopleRosterLayout(320, 1).columns).toBe(3);
    expect(getPeopleRosterLayout(667, 1).columns).toBe(5);
    expect(getPeopleRosterLayout(360, 1.5).columns).toBe(2);
    expect(getPeopleRosterLayout(667, 1.5).columns).toBe(4);
  });

  it('explains an empty quiet roster without implying nobody is present', () => {
    render(<RoomScreen {...props({ people: [], view: 'people' })} />);
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

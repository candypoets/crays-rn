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
const post: RoomPost = { id: 'post-1', pubkey: maya.pubkey, content: 'Jazz starts at 20:30.', createdAt: 1, announcement: true, expiresAt: 2_000_000_000, images: [], participantPubkeys: [] };
const product: RoomProduct = { id: 'drink-1', address: `30402:${'a'.repeat(64)}:drink`, name: 'Mezcal Negroni', description: 'Smoky and bitter', price: 12, currency: 'EUR', section: 'Cocktails', productKind: 'drink', available: true, position: 0 };

function props(overrides: Partial<Parameters<typeof RoomScreen>[0]> = {}): Parameters<typeof RoomScreen>[0] {
  return {
    activeRoom, cartCount: 0, connected: true, loading: false, people: [{ ...maya, picture: profile.picture }], posts: [post], products: [product], profiles: new Map([[maya.pubkey, profile]]), reactions: [],
    view: 'menu', onCart: jest.fn(), onChangeView: jest.fn(), onComposePost: jest.fn(), onInviteFriend: jest.fn(), onLeave: jest.fn(), onLikePost: jest.fn(),
    onOpenPerson: jest.fn(), onOpenProduct: jest.fn(), onOpenThread: jest.fn(), onReplyPost: jest.fn(), onReportPost: jest.fn(), ...overrides,
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

  it('renders People, Menu, and Feed as text navigation with an underlined selected state', () => {
    const onChangeView = jest.fn();
    const onOpenProduct = jest.fn();
    render(<RoomScreen {...props({ onChangeView, onOpenProduct })} />);

    expect(screen.getByTestId('room-menu-screen')).toBeOnTheScreen();
    expect(screen.getByRole('tab', { name: 'Menu' })).toBeSelected();
    expect(screen.getByRole('tab', { name: 'People, 1 visible' })).not.toBeSelected();
    expect(screen.getByTestId('room-menu')).toHaveProp('className', expect.stringContaining('border-primary'));
    expect(screen.getByTestId('room-menu')).not.toHaveProp('className', expect.stringContaining('bg-primary'));
    expect(screen.getAllByRole('tab').map((tab) => tab.props.accessibilityLabel)).toEqual(['People, 1 visible', 'Menu', 'Room feed']);
    expect(screen.getByText('Mezcal Negroni')).toBeOnTheScreen();
    fireEvent.press(screen.getByRole('tab', { name: 'People, 1 visible' }));
    expect(onChangeView).toHaveBeenCalledWith('people');
  });

  it('renders visible people in predictable accessibility order', () => {
    const onOpenPerson = jest.fn();
    render(<RoomScreen {...props({ onOpenPerson, view: 'people' })} />);
    const expiryDate = new Date(activeRoom.leaveAt);
    const expiry = `${expiryDate.toLocaleDateString([], { day: 'numeric', month: 'short' })} · ${expiryDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
    expect(screen.getByText('Connected')).toBeOnTheScreen();
    expect(screen.getByText('People here (1)')).toBeOnTheScreen();
    expect(screen.getByLabelText(`Room status. Connected. Leaving by ${expiry}.`)).toBeOnTheScreen();
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
    expect(screen.queryByTestId(`person-profile-${maya.pubkey}`)).toBeNull();
    expect(screen.queryByText(maya.intent)).toBeNull();
  });

  it('adapts roster columns to compact, expanded, and large-text windows', () => {
    expect(getPeopleRosterLayout(320, 1).columns).toBe(4);
    expect(getPeopleRosterLayout(667, 1).columns).toBe(5);
    expect(getPeopleRosterLayout(360, 1.5).columns).toBe(2);
    expect(getPeopleRosterLayout(667, 1.5).columns).toBe(4);
  });

  it('explains an empty quiet roster without implying nobody is present', () => {
    render(<RoomScreen {...props({ people: [], view: 'people' })} />);
    expect(screen.getByText(/Only people who chose to be visible/)).toBeOnTheScreen();
  });

  it('keeps compact room chrome truthful while the relay is connecting', () => {
    render(<RoomScreen {...props({ connected: false, loading: true, people: [], view: 'people' })} />);

    expect(screen.getByText('Connecting…')).toBeOnTheScreen();
    expect(screen.getByRole('tab', { name: 'People, loading' })).toBeSelected();
    expect(screen.getByTestId('room-status')).toHaveProp('accessibilityLabel', expect.stringContaining('Leaving by'));
  });

  it('keeps quiet privacy and a ready order in Tonight with explicit actions', () => {
    const onBecomeVisible = jest.fn(); const onOpenOrder = jest.fn();
    const activeOrder = { id: 'order', awardId: 'award', orderRef: 'CR-42', product, status: 'ready' as const, createdAt: 1, updatedAt: 2, recipientPubkey: 'c'.repeat(64) };
    render(<RoomScreen {...props({ activeOrder, onBecomeVisible, onOpenOrder, view: 'people' })} />);
    expect(screen.getByText('Browsing quietly ·')).toBeOnTheScreen();
    expect(screen.getByText('Your order is ready')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Leave' })).toBeOnTheScreen();
    fireEvent.press(screen.getByTestId('become-visible'));
    fireEvent.press(screen.getByTestId('tonight-active-order'));
    expect(onBecomeVisible).toHaveBeenCalledTimes(1); expect(onOpenOrder).toHaveBeenCalledTimes(1);
  });

  it('offers a room-link invite below the people roster', () => {
    const onInviteFriend = jest.fn();
    render(<RoomScreen {...props({ onInviteFriend, view: 'people' })} />);

    expect(screen.getByText('Say hello to someone new')).toBeOnTheScreen();
    fireEvent.press(screen.getByTestId('invite-friend'));
    expect(onInviteFriend).toHaveBeenCalledTimes(1);
  });

  it('renders the room-only feed, announcement, and dedicated composer action', () => {
    render(<RoomScreen {...props({ view: 'feed', reportNotice: 'Relay rejected it.' })} />);
    expect(screen.getByText('Room feed')).toBeOnTheScreen();
    expect(screen.getByText('Chronological · locks when you leave')).toBeOnTheScreen();
    expect(screen.getByText('Post to this room')).toBeOnTheScreen();
    expect(screen.getByText('Write a note or share a photo')).toBeOnTheScreen();
    expect(screen.getByText('Announcement')).toBeOnTheScreen();
    expect(screen.getByText('Jazz starts at 20:30.')).toBeOnTheScreen();
    expect(screen.getByTestId(`post-${post.id}`)).toHaveProp('className', expect.stringContaining('rounded-2xl'));
    expect(screen.getByRole('button', { name: 'Open profile of Maya' })).toBeOnTheScreen();
    expect(screen.getByRole('alert')).toHaveTextContent('Relay rejected it.');
  });

  it('renders a plain kind-1 room note as a compact social card with fallback identity', () => {
    const guestPost = { ...post, id: 'guest-post', pubkey: 'c'.repeat(64), announcement: false, content: 'Anyone heading downstairs?' };
    render(<RoomScreen {...props({ posts: [guestPost], profiles: new Map(), view: 'feed' })} />);

    expect(screen.getByText('Room guest')).toBeOnTheScreen();
    expect(screen.getByText('Anyone heading downstairs?')).toBeOnTheScreen();
    expect(screen.getByLabelText('Message Room guest')).toBeOnTheScreen();
    expect(screen.getByLabelText('Report post by Room guest')).toBeOnTheScreen();
  });

  it('opens dedicated compose, reply, like, and thread actions with engagement counts', () => {
    const onComposePost = jest.fn();
    const onLikePost = jest.fn();
    const onOpenThread = jest.fn();
    const onReplyPost = jest.fn();
    const reply = { ...post, id: 'reply-1', announcement: false, replyToId: post.id, rootId: post.id, content: 'See you there.' };
    const reaction = { id: 'like-1', pubkey: 'd'.repeat(64), targetId: post.id, createdAt: 2, expiresAt: 2_000_000_000 };
    render(<RoomScreen {...props({ onComposePost, onLikePost, onOpenThread, onReplyPost, posts: [post, reply], reactions: [reaction], view: 'feed' })} />);

    fireEvent.press(screen.getByTestId('open-room-post-composer'));
    fireEvent.press(screen.getByTestId(`reply-post-${post.id}`));
    fireEvent.press(screen.getByTestId(`like-post-${post.id}`));
    fireEvent.press(screen.getByTestId(`open-thread-${post.id}`));
    expect(onComposePost).toHaveBeenCalledTimes(1);
    expect(onReplyPost).toHaveBeenCalledWith(post);
    expect(onLikePost).toHaveBeenCalledWith(post);
    expect(onOpenThread).toHaveBeenCalledWith(post);
    expect(screen.getByLabelText('Reply to Maya, 1 replies')).toBeOnTheScreen();
    expect(screen.getByLabelText('Like post by Maya, 1 likes')).toBeOnTheScreen();
    expect(screen.queryByText('See you there.')).toBeNull();
  });

  it('shows image notes and disables an already-liked post', () => {
    const imagePost = { ...post, announcement: false, images: [{ url: 'https://cdn.example/room.jpg', alt: 'Dance floor' }] };
    const reaction = { id: 'mine', pubkey: maya.pubkey, targetId: post.id, createdAt: 2, expiresAt: 2_000_000_000 };
    render(<RoomScreen {...props({ posts: [imagePost], reactions: [reaction], viewerPubkey: maya.pubkey, view: 'feed' })} />);

    expect(screen.getByLabelText('Dance floor')).toHaveProp('source', { uri: 'https://cdn.example/room.jpg' });
    expect(screen.getByTestId(`like-post-${post.id}`)).toBeDisabled();
    expect(screen.getByLabelText('Liked post by Maya, 1 likes')).toBeOnTheScreen();
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
    expect(screen.getByLabelText('Report post by Maya')).toBeDisabled();
  });
});

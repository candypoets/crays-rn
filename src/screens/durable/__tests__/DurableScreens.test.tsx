import { fireEvent, render } from '@testing-library/react-native';
import type { DurableTicket } from '@/access/tickets';
import { AddFundsScreen, countUsableEventAccess, hasUsableDurableAccess, MeScreen, WalletScreen, selectActiveOrder } from '@/screens/durable/AccountWalletScreens';
import { EventScreen, MembershipDetailScreen, MembershipOfferScreen, MembershipsScreen } from '@/screens/durable/MembershipEventScreens';
import { groupOrdersByLocalDate, MyNightScreen, OrderDetailScreen, OrdersScreen, orderVenueName, sortOrdersForDisplay } from '@/screens/durable/NightAndOrderScreens';
import { myNightDoorDestination, selectMyNightDoorItem } from '@/screens/durable/myNight';
import type { RoomCalendarEvent, RoomEntitlement, RoomMembershipOffer, RoomOrder } from '@/rooms/types';

jest.mock('@/components/durable/EntitlementPresentation', () => ({ EntitlementPresentation: () => null }));

const product = { id: 'product', address: `30009:${'a'.repeat(64)}:drink`, name: 'Negroni', description: 'Smoky', price: 12, currency: 'EUR', section: 'Cocktails', productKind: 'drink', available: true, position: 0 };
const order: RoomOrder = { id: 'order', awardId: 'award', orderRef: 'CR-42', product, status: 'ready', createdAt: 1, updatedAt: 2, recipientPubkey: 'b'.repeat(64) };
const membership: RoomMembershipOffer = { id: 'member', address: `30009:${'a'.repeat(64)}:member`, name: 'Skyline Regular', description: 'Monthly perks', price: 24, currency: 'EUR', billing: 'monthly', available: true };
const event: RoomCalendarEvent = { id: 'event', address: `31923:${'a'.repeat(64)}:jazz`, title: 'Rooftop Jazz', summary: 'Under the stars', location: 'Roof', start: 2_000_000_000, end: null, capacity: 18, price: 0, currency: 'EUR' };
const entitlement: RoomEntitlement = { awardId: 'c'.repeat(64), badgeAddress: membership.address, awardIssuerPubkey: 'd'.repeat(64), recipientPubkey: 'e'.repeat(64), definitionId: membership.id, definitionIssuerPubkey: 'a'.repeat(64), type: 'membership', name: membership.name, description: membership.description, billing: membership.billing, state: 'active', orderRef: 'member', createdAt: 1, activity: [], roomId: 'skyline', roomName: 'Skyline', relayUrl: 'wss://relay.example' };
const eventAccess: RoomEntitlement = { ...entitlement, awardId: 'f'.repeat(64), badgeAddress: `30402:${'a'.repeat(64)}:jazz-entry`, definitionId: 'jazz-entry', type: 'event_access', name: 'Rooftop Jazz entry', description: 'Door entry', eventAddress: event.address, state: 'available', orderRef: '' };
const ticket: DurableTicket = { id: 'ticket', eventAddress: event.address, eventId: event.id, title: event.title, summary: event.summary, location: event.location, start: event.start, end: event.end, roomId: 'skyline', roomName: 'Skyline', relayUrl: 'wss://relay.example', status: 'going', confirmedAt: 2 };
const account = {
  custody: 'device-only' as const,
  displayName: 'Maya QA',
  npub: `npub1${'q'.repeat(58)}`,
  picture: 'https://profiles.example/maya.jpg',
  pubkey: 'b'.repeat(64),
  setupComplete: true,
};

describe('durable screens', () => {
  it('prioritizes an event-access award and routes its exact award ID to the live ticket', () => { const doorItem = selectMyNightDoorItem({ entitlements: [eventAccess], events: [event], now: 1_900_000_000, roomId: 'skyline', tickets: [ticket] }); expect(doorItem).toEqual({ kind: 'credential', awardId: eventAccess.awardId, title: event.title, location: event.location }); expect(myNightDoorDestination(doorItem!)).toEqual({ pathname: '/ticket', params: { awardId: eventAccess.awardId } }); });
  it('labels calendar-only events as events instead of scanner credentials', () => { const doorItem = selectMyNightDoorItem({ entitlements: [], events: [event], now: 1_900_000_000, roomId: 'skyline', tickets: [] }); const view = render(<MyNightScreen doorItem={doorItem} roomName="Skyline" onBack={jest.fn()} onDoorItem={jest.fn()} onMembership={jest.fn()} onOrder={jest.fn()} />); expect(view.getByText('Coming up')).toBeTruthy(); expect(view.getByText('Roof · View event')).toBeTruthy(); expect(view.queryByText(/show at the door/i)).toBeNull(); });
  it('connects every My night object to its exact action without exposing references or stock venue claims', () => { const open = jest.fn(); const doorItem = selectMyNightDoorItem({ entitlements: [eventAccess], events: [event], now: 1_900_000_000, roomId: 'skyline', tickets: [] }); const view = render(<MyNightScreen doorItem={doorItem} membership={membership} order={order} roomName="Skyline" onBack={jest.fn()} onDoorItem={open} onMembership={jest.fn()} onOrder={jest.fn()} />); expect(view.getByRole('header', { name: 'My night' })).toBeTruthy(); fireEvent.press(view.getByTestId('my-night-event')); expect(open).toHaveBeenCalled(); expect(view.getByText('Live code ready', { exact: false })).toBeTruthy(); expect(view.getByText('Ready')).toBeTruthy(); expect(view.queryByText(order.orderRef, { exact: false })).toBeNull(); expect(view.queryByLabelText('Skyline at night')).toBeNull(); expect(view.getByTestId('my-night-back').props.className).toContain('min-h-12'); });
  it('uses signed room identity instead of fabricated urgency when nothing is actionable', () => { const view = render(<MyNightScreen roomName="Skyline" onBack={jest.fn()} onDoorItem={jest.fn()} onMembership={jest.fn()} onOrder={jest.fn()} />); expect(view.getByRole('header', { name: 'My night' })).toBeTruthy(); expect(view.getByText('Skyline')).toBeTruthy(); expect(view.getByText('Nothing needs you right now')).toBeTruthy(); expect(view.queryByText('Up next')).toBeNull(); expect(view.queryByText('This room. Right now.')).toBeNull(); });
  it('groups active orders, hides internal references, and opens relay-derived detail', () => { const open = jest.fn(); const view = render(<OrdersScreen orders={[order]} onBack={jest.fn()} onOpen={open} />); fireEvent.press(view.getByTestId(`order-row-${order.id}`)); expect(open).toHaveBeenCalledWith(order); expect(view.queryByText(order.orderRef, { exact: false })).toBeNull(); expect(view.getByTestId('orders-back').props.className).toContain('min-h-12'); });
  it('sorts orders by latest trusted update with a deterministic ID tie break', () => { const older = { ...order, id: 'z-order', updatedAt: 1 }; const tieA = { ...order, id: 'a-order', updatedAt: 3 }; const tieB = { ...order, id: 'b-order', updatedAt: 3 }; expect(sortOrdersForDisplay([older, tieB, tieA]).map((item) => item.id)).toEqual(['a-order', 'b-order', 'z-order']); });
  it('groups order history by local calendar date without changing deterministic order', () => {
    const firstDay = Math.floor(new Date(2026, 7, 11, 23, 15).getTime() / 1000);
    const secondDay = Math.floor(new Date(2026, 7, 12, 0, 15).getTime() / 1000);
    const groups = groupOrdersByLocalDate([
      { ...order, id: 'older', updatedAt: firstDay },
      { ...order, id: 'newer-b', updatedAt: secondDay },
      { ...order, id: 'newer-a', updatedAt: secondDay },
    ]);
    expect(groups).toHaveLength(2);
    expect(groups[0].orders.map((item) => item.id)).toEqual(['newer-a', 'newer-b']);
    expect(groups[1].orders.map((item) => item.id)).toEqual(['older']);
  });
  it('keeps an archived order venue after the active room changes or ends', () => { expect(orderVenueName({ roomName: 'Archive Room' }, 'Current Room')).toBe('Archive Room'); expect(orderVenueName(undefined, 'Current Room')).toBe('Current Room'); expect(orderVenueName()).toBe('Venue'); });
  it('keeps active and historical order states visually and textually distinct', () => { const fulfilled = { ...order, id: 'past', status: 'fulfilled' as const, updatedAt: 1 }; const view = render(<OrdersScreen orders={[fulfilled, order]} onBack={jest.fn()} onOpen={jest.fn()} />); expect(view.getByText('Active first. History stays.')).toBeTruthy(); expect(view.getByText('History')).toBeTruthy(); expect(view.getByText('Served')).toBeTruthy(); expect(view.getByLabelText(/Order progress: Ready for pickup/)).toBeTruthy(); });
  it('renders a complete empty order archive without substituting cart content', () => { const view = render(<OrdersScreen orders={[]} onBack={jest.fn()} onOpen={jest.fn()} />); expect(view.getByText('No active orders')).toBeTruthy(); expect(view.getByText('Your trusted venue order history is empty.')).toBeTruthy(); expect(view.queryByText('History')).toBeNull(); });
  it('keeps order loading, cached refresh, and offline states distinct from a confirmed empty archive', () => {
    const view = render(<OrdersScreen loading orders={[]} onBack={jest.fn()} onOpen={jest.fn()} />);
    expect(view.getByTestId('orders-loading')).toBeTruthy();
    expect(view.queryByText('No active orders')).toBeNull();
    expect(view.queryByText('Your trusted venue order history is empty.')).toBeNull();
    view.rerender(<OrdersScreen offline orders={[]} onBack={jest.fn()} onOpen={jest.fn()} />);
    expect(view.getByTestId('orders-offline')).toBeTruthy();
    expect(view.getByText('No saved active orders')).toBeTruthy();
    expect(view.getByText(/Saved order history is empty/)).toBeTruthy();
  });
  it('maps processing and cancellation states to customer language without internal terms', () => { const view = render(<OrderDetailScreen onBack={jest.fn()} order={{ ...order, status: 'processing' }} roomName="Skyline" />); expect(view.getByRole('header', { name: product.name })).toBeTruthy(); expect(view.getByText('For you · At Skyline')).toBeTruthy(); expect(view.getAllByText('Preparing').length).toBeGreaterThan(0); expect(view.getByText('The venue updates this status as your order moves forward.')).toBeTruthy(); expect(view.getByText('Payment details appear after payment is confirmed.')).toBeTruthy(); expect(view.queryByText(order.orderRef, { exact: false })).toBeNull(); expect(view.queryByText(/payment rail|venue relay/i)).toBeNull(); expect(view.queryByText('Delivered')).toBeNull(); expect(view.getByTestId('order-detail-back').props.className).toContain('min-h-12'); expect(view.queryByTestId('order-detail-screen-brand-header')).toBeNull(); view.unmount(); const cancelled = render(<OrderDetailScreen onBack={jest.fn()} order={{ ...order, status: 'cancelled' }} roomName="Skyline" />); expect(cancelled.getByText('The venue cancelled this order. Refund details will appear here when available.')).toBeTruthy(); expect(cancelled.queryByText(/payment rail|venue relay/i)).toBeNull(); });
  it.each([
    ['pending', 'Sent'],
    ['accepted', 'Accepted'],
    ['ready', 'Ready'],
    ['fulfilled', 'Served'],
  ] as const)('renders the %s order ladder as %s', (status, label) => { const view = render(<OrderDetailScreen onBack={jest.fn()} order={{ ...order, status }} roomName="Skyline" />); expect(view.getAllByText(label).length).toBeGreaterThan(0); expect(view.getByLabelText(`Current order status: ${label}`)).toBeTruthy(); });
  it('renders an unmatched order as unavailable and routes back without substituting another record', () => { const onBack = jest.fn(); const view = render(<OrderDetailScreen onBack={onBack} roomName="Skyline" />); expect(view.getByRole('header', { name: 'Order unavailable' })).toBeTruthy(); expect(view.getByText(/No substitute order is shown/)).toBeTruthy(); expect(view.queryByText(product.name)).toBeNull(); fireEvent.press(view.getByText('Back to orders')); expect(onBack).toHaveBeenCalledTimes(1); });
  it('waits for order hydration before declaring an exact route unavailable', () => {
    const view = render(<OrderDetailScreen loading onBack={jest.fn()} roomName="Skyline" />);
    expect(view.getByTestId('order-detail-loading')).toBeTruthy();
    expect(view.queryByText('Order unavailable')).toBeNull();
    view.rerender(<OrderDetailScreen offline onBack={jest.fn()} roomName="Skyline" />);
    expect(view.getByText(/venue is unavailable and no saved order matches/i)).toBeTruthy();
  });
  it('routes the current room and every urgency-ranked Me row without exposing internal or relay language', () => {
    const memberships = jest.fn(); const messages = jest.fn(); const orders = jest.fn(); const profile = jest.fn(); const room = jest.fn(); const tickets = jest.fn(); const wallet = jest.fn();
    const view = render(<MeScreen accountState={{ status: 'ready', account }} activeOrder={order} hasMembership onMemberships={memberships} onMessages={messages} onOrders={orders} onProfile={profile} onRoom={room} onTickets={tickets} onWallet={wallet} roomName="Skyline" ticketCount={1} />);
    expect(view.getByText('Ready for pickup')).toBeTruthy(); expect(view.getByText('1 saved ticket')).toBeTruthy(); expect(view.queryByText(order.orderRef, { exact: false })).toBeNull(); expect(view.queryByText(/relay-confirmed/i)).toBeNull();
    expect(view.getByText(account.displayName)).toBeTruthy(); expect(view.getByText('Protected on this device')).toBeTruthy(); expect(view.getByText('Settings & privacy')).toBeTruthy();
    expect(view.getByLabelText('Skyline. You’re inside. Return to room')).toBeTruthy();
    ['me-current-room', 'me-orders', 'me-memberships', 'me-tickets', 'me-wallet', 'me-messages', 'me-profile'].forEach((id) => fireEvent.press(view.getByTestId(id)));
    expect(room).toHaveBeenCalledTimes(1); expect(orders).toHaveBeenCalled(); expect(memberships).toHaveBeenCalled(); expect(tickets).toHaveBeenCalled(); expect(wallet).toHaveBeenCalled(); expect(messages).toHaveBeenCalled(); expect(profile).toHaveBeenCalled();
  });
  it('shows the validated local profile and expands its full public identity without exposing a secret', () => {
    const view = render(<MeScreen accountState={{ status: 'ready', account }} hasMembership={false} onMemberships={jest.fn()} onOrders={jest.fn()} onProfile={jest.fn()} onRoom={jest.fn()} onTickets={jest.fn()} onWallet={jest.fn()} ticketCount={0} />);
    const card = view.getByTestId('me-account-profile');
    expect(card).toHaveProp('accessibilityState', { expanded: false });
    expect(view.getByText(`${account.npub.slice(0, 12)}…${account.npub.slice(-8)}`)).toBeTruthy();
    expect(view.getByTestId('me-account-portrait-profile-image')).toHaveProp('source', { uri: account.picture });
    expect(view.queryByText(account.npub)).toBeNull();
    fireEvent.press(card);
    expect(card).toHaveProp('accessibilityState', { expanded: true });
    expect(view.getByText('Public identity')).toBeTruthy();
    expect(view.getByText(account.npub)).toHaveProp('selectable', true);
    expect(view.getByText(/secret key is never shown/i)).toBeTruthy();
    expect(view.queryByText(/nsec1/i)).toBeNull();
  });
  it('keeps protected-profile loading, failure, and invalid states separate from durable data', () => {
    const retry = jest.fn();
    const view = render(<MeScreen accountState={{ status: 'loading' }} hasMembership={false} onMemberships={jest.fn()} onOrders={jest.fn()} onProfile={jest.fn()} onRetryAccount={retry} onRoom={jest.fn()} onTickets={jest.fn()} onWallet={jest.fn()} ticketCount={0} />);
    expect(view.getByTestId('me-account-loading')).toBeTruthy();
    expect(view.getByText('No saved tickets')).toBeTruthy();
    view.rerender(<MeScreen accountState={{ status: 'error', message: 'Crays could not read the protected profile on this device.' }} hasMembership={false} onMemberships={jest.fn()} onOrders={jest.fn()} onProfile={jest.fn()} onRetryAccount={retry} onRoom={jest.fn()} onTickets={jest.fn()} onWallet={jest.fn()} ticketCount={0} />);
    fireEvent.press(view.getByTestId('me-account-retry'));
    expect(retry).toHaveBeenCalledTimes(1);
    view.rerender(<MeScreen accountState={{ status: 'invalid' }} hasMembership={false} onMemberships={jest.fn()} onOrders={jest.fn()} onProfile={jest.fn()} onRetryAccount={retry} onRoom={jest.fn()} onTickets={jest.fn()} onWallet={jest.fn()} ticketCount={0} />);
    expect(view.getByText('Profile could not be verified')).toBeTruthy();
    expect(view.getByText('No saved tickets')).toBeTruthy();
  });
  it('renders honest empty durable context without inventing an actionable room, ticket, or wallet balance', () => { const view = render(<MeScreen hasMembership={false} onMemberships={jest.fn()} onOrders={jest.fn()} onProfile={jest.fn()} onRoom={jest.fn()} onTickets={jest.fn()} onWallet={jest.fn()} ticketCount={0} />); expect(view.getByText('No room selected')).toBeTruthy(); expect(view.queryByTestId('me-current-room')).toBeNull(); expect(view.getByText('No saved tickets')).toBeTruthy(); expect(view.getByText('Setup required · balance unavailable')).toBeTruthy(); });
  it('does not announce empty durable categories while local archives are loading', () => {
    const view = render(<MeScreen hasMembership={false} loading onMemberships={jest.fn()} onOrders={jest.fn()} onProfile={jest.fn()} onRoom={jest.fn()} onTickets={jest.fn()} onWallet={jest.fn()} ticketCount={0} />);
    expect(view.getByTestId('me-durable-loading')).toBeTruthy();
    expect(view.getByText('Loading saved tickets…')).toBeTruthy();
    expect(view.queryByText('No saved tickets')).toBeNull();
  });
  it('does not turn an archived order venue into a current-room claim', () => { const view = render(<MeScreen activeOrder={{ ...order, roomName: 'Archive Room' }} hasMembership={false} onMemberships={jest.fn()} onOrders={jest.fn()} onProfile={jest.fn()} onRoom={jest.fn()} onTickets={jest.fn()} onWallet={jest.fn()} ticketCount={0} />); expect(view.getByText('No room selected')).toBeTruthy(); expect(view.queryByTestId('me-current-room')).toBeNull(); expect(view.getByText('Ready for pickup')).toBeTruthy(); expect(view.queryByText('Archive Room')).toBeNull(); });
  it('selects the most urgent active order deterministically', () => { const pending = { ...order, id: 'z-pending', status: 'pending' as const, updatedAt: 10 }; const preparing = { ...order, id: 'b-preparing', status: 'processing' as const, updatedAt: 2 }; const readyA = { ...order, id: 'a-ready', status: 'ready' as const, updatedAt: 3 }; const readyB = { ...order, id: 'b-ready', status: 'ready' as const, updatedAt: 3 }; const served = { ...order, id: 'served', status: 'fulfilled' as const, updatedAt: 99 }; expect(selectActiveOrder([pending, readyB, served, preparing, readyA])?.id).toBe('a-ready'); expect(selectActiveOrder([served])).toBeUndefined(); });
  it('uses only trusted usable entitlements for the Me membership-ready claim', () => { expect(hasUsableDurableAccess([entitlement])).toBe(true); expect(hasUsableDurableAccess([{ ...entitlement, state: 'revoked' }])).toBe(false); expect(hasUsableDurableAccess([{ ...entitlement, type: 'event_access' }])).toBe(false); });
  it('counts only usable trusted event access in the Me ticket summary', () => { expect(countUsableEventAccess([eventAccess, { ...eventAccess, awardId: 'x', state: 'revoked' }, entitlement])).toBe(1); });
  it('keeps membership purchase disabled without payment rails', () => { const view = render(<MembershipOfferScreen membership={membership} onBack={jest.fn()} onPaymentMethods={jest.fn()} roomName="Skyline" />); expect(view.getByTestId('membership-purchase-disabled').props.accessibilityState.disabled).toBe(true); });
  it('shows only published membership value and routes payment-method review without checkout', () => { const methods = jest.fn(); const view = render(<MembershipOfferScreen membership={membership} onBack={jest.fn()} onPaymentMethods={methods} roomName="Skyline" />); expect(view.getByText(membership.description)).toBeTruthy(); expect(view.getByText('€24.00 / monthly')).toBeTruthy(); expect(view.queryByText('Member nights and priority booking')).toBeNull(); fireEvent.press(view.getByTestId('membership-payment-methods')); expect(methods).toHaveBeenCalledTimes(1); });
  it('renders an exact no-offer state instead of substituting another definition', () => { const view = render(<MembershipOfferScreen onBack={jest.fn()} onPaymentMethods={jest.fn()} roomName="Skyline" />); expect(view.getByRole('header', { name: 'No membership offer' })).toBeTruthy(); expect(view.queryByTestId('membership-purchase-disabled')).toBeNull(); });
  it('shows explicit active membership and a presentation surface', () => { const view = render(<MembershipDetailScreen entitlement={entitlement} membership={membership} onBack={jest.fn()} roomName="Skyline" />); expect(view.getByText('Active')).toBeTruthy(); expect(view.getByText('Present membership')).toBeTruthy(); });
  it('keeps invalid membership history without door-ready wording', () => { const view = render(<MembershipDetailScreen entitlement={{ ...entitlement, state: 'revoked' }} membership={membership} onBack={jest.fn()} roomName="Skyline" />); expect(view.getByText('Revoked')).toBeTruthy(); expect(view.getByText(/No live code is shown while this access is revoked/)).toBeTruthy(); expect(view.getByText('No benefit uses recorded yet. The app never keeps a competing local counter.')).toBeTruthy(); });
  it('renders offer-only membership detail without an owned presentation claim', () => { const view = render(<MembershipDetailScreen membership={membership} onBack={jest.fn()} roomName="Skyline" />); expect(view.getByText('Offer available')).toBeTruthy(); expect(view.getByText(/Purchase is unavailable/)).toBeTruthy(); expect(view.queryByText(/Present membership/)).toBeNull(); });
  it('groups durable access and opens the exact award', () => { const open = jest.fn(); const pass = { ...entitlement, awardId: 'f'.repeat(64), type: 'pass' as const, name: 'Three visits', state: 'available' as const, maxUses: 3, remainingUses: 2 }; const view = render(<MembershipsScreen entitlements={[entitlement, pass]} onBack={jest.fn()} onOpen={open} />); expect(view.getByText(/2 uses left/)).toBeTruthy(); fireEvent.press(view.getByTestId(`entitlement-row-${pass.awardId}`)); expect(open).toHaveBeenCalledWith(pass); });
  it('separates inactive membership history and preserves relay-derived activity counts', () => { const used = { id: 'used', status: 'fulfilled' as const, contextKey: 'use:one', createdAt: 2 }; const pass = { ...entitlement, awardId: 'f'.repeat(64), type: 'pass' as const, name: 'Three visits', state: 'available' as const, maxUses: 3, remainingUses: 2, activity: [used] }; const archive = render(<MembershipsScreen entitlements={[{ ...entitlement, state: 'expired' }, pass]} onBack={jest.fn()} onOpen={jest.fn()} />); expect(archive.getByText('History & action needed')).toBeTruthy(); expect(archive.getByText('Expired')).toBeTruthy(); archive.unmount(); const detail = render(<MembershipDetailScreen entitlement={pass} onBack={jest.fn()} roomName="Skyline" />); expect(detail.getByText('2 of 3 uses remaining')).toBeTruthy(); expect(detail.getByText('Used')).toBeTruthy(); });
  it('publishes only through the RSVP action for a free event', () => { const rsvp = jest.fn(); const view = render(<EventScreen event={event} going={false} loading={false} onBack={jest.fn()} onRsvp={rsvp} roomName="Skyline" />); expect(view.getByRole('header', { name: 'Rooftop Jazz' })).toBeTruthy(); expect(view.getByText('Free RSVP')).toBeTruthy(); fireEvent.press(view.getByTestId('event-rsvp')); expect(rsvp).toHaveBeenCalledTimes(1); });
  it('locks event actions while pending and never enables deferred paid tickets', () => { const rsvp = jest.fn(); const view = render(<EventScreen event={event} going={false} loading onBack={jest.fn()} onRsvp={rsvp} roomName="Skyline" />); expect(view.getByText('Sending RSVP…')).toBeTruthy(); expect(view.getByTestId('event-rsvp')).toBeDisabled(); view.rerender(<EventScreen event={{ ...event, price: 24 }} going={false} loading={false} onBack={jest.fn()} onRsvp={rsvp} roomName="Skyline" />); expect(view.getByText('Ticket payment not configured')).toBeTruthy(); expect(view.getByTestId('event-rsvp')).toBeDisabled(); fireEvent.press(view.getByTestId('event-rsvp')); expect(rsvp).not.toHaveBeenCalled(); });
  it('labels a saved RSVP as non-scannable and preserves relay errors', () => { const view = render(<EventScreen error="The venue rejected this RSVP." event={event} going loading={false} onBack={jest.fn()} onRsvp={jest.fn()} roomName="Skyline" />); expect(view.getByText('Going · RSVP sent')).toBeTruthy(); expect(view.getByText('RSVP saved')).toBeTruthy(); expect(view.getByText('This RSVP is not a scannable door credential.')).toBeTruthy(); expect(view.getByText('The venue rejected this RSVP.')).toBeTruthy(); });
  it('renders an explicit unavailable state instead of substituting another event', () => { const back = jest.fn(); const view = render(<EventScreen going={false} loading={false} onBack={back} onRsvp={jest.fn()} roomName="Skyline" />); expect(view.getByText('Event unavailable')).toBeTruthy(); expect(view.queryByTestId('event-rsvp')).toBeNull(); fireEvent.press(view.getByTestId('event-back')); expect(back).toHaveBeenCalled(); });
  it('does not fabricate wallet money and routes only to the honest funding explanation', () => { const addFunds = jest.fn(); const wallet = render(<WalletScreen onAddFunds={addFunds} onBack={jest.fn()} />); expect(wallet.getByText('Unavailable')).toBeTruthy(); expect(wallet.queryByText(/€0|0 sats/i)).toBeNull(); expect(wallet.getByTestId('wallet-receive-disabled').props.accessibilityState.disabled).toBe(true); expect(wallet.getByTestId('wallet-activity-disabled').props.accessibilityState.disabled).toBe(true); expect(wallet.getAllByText('After wallet setup')).toHaveLength(2); expect(wallet.queryByTestId('wallet-screen-brand-header')).toBeNull(); fireEvent.press(wallet.getByTestId('wallet-add-funds')); expect(addFunds).toHaveBeenCalledTimes(1); wallet.unmount(); const funds = render(<AddFundsScreen onBack={jest.fn()} />); expect(funds.getByTestId('add-funds-disabled').props.accessibilityState.disabled).toBe(true); expect(funds.getByText(/No invoice, QR code, token, or spendable balance/)).toBeTruthy(); expect(funds.queryByTestId('add-funds-screen-brand-header')).toBeNull(); });
});

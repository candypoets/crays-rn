import { fireEvent, render } from '@testing-library/react-native';
import { InviteAcceptedScreen } from '@/screens/onboarding/InviteAcceptedScreen';
import { InvitePreviewScreen } from '@/screens/onboarding/InvitePreviewScreen';
import { LoginScreen } from '@/screens/onboarding/LoginScreen';

const preview = { claims: { v: 1 as const, nonce: 'n', badge: `30009:${'a'.repeat(64)}:members`, exp: 2_000_000_000, max: 1 }, community: { badge_issuer: 'a'.repeat(64), relay_url: 'wss://venue.test', required_badge: `30009:${'a'.repeat(64)}:members` }, serviceUrl: 'https://venue.test' };

describe('invite and login screens', () => {
  it('requires account creation without consuming the invite', () => { const create = jest.fn(); const view = render(<InvitePreviewScreen hasIdentity={false} loading={false} onAccept={jest.fn()} onBack={jest.fn()} onCreateAccount={create} onLogIn={jest.fn()} preview={preview} redeeming={false} room={null} />); fireEvent.press(view.getByTestId('invite-accept-button')); expect(create).toHaveBeenCalled(); expect(view.getByText(/never makes you visible/i)).toBeTruthy(); });
  it('allows an existing identity to accept', () => { const accept = jest.fn(); const view = render(<InvitePreviewScreen hasIdentity loading={false} onAccept={accept} onBack={jest.fn()} onCreateAccount={jest.fn()} onLogIn={jest.fn()} preview={preview} redeeming={false} room={null} />); fireEvent.press(view.getByTestId('invite-accept-button')); expect(accept).toHaveBeenCalled(); });
  it('keeps room entry explicit after success', () => { const join = jest.fn(); const view = render(<InviteAcceptedScreen eventId={'b'.repeat(64)} onJoinRoom={join} onMembership={jest.fn()} roomName="Skyline" />); expect(view.getByText(/not visible/i)).toBeTruthy(); fireEvent.press(view.getByTestId('invite-join-room')); expect(join).toHaveBeenCalled(); });
  it('shows honest disabled provider states and local unlock', () => { const unlock = jest.fn(); const view = render(<LoginScreen hasDeviceIdentity loading={false} onBack={jest.fn()} onCreateAccount={jest.fn()} onRecovery={jest.fn()} onUnlock={unlock} preservingInvite />); expect(view.getAllByText('Not configured')).toHaveLength(2); fireEvent.press(view.getByTestId('login-device-unlock')); expect(unlock).toHaveBeenCalled(); });
});

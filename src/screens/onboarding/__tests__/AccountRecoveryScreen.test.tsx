import { fireEvent, render, screen } from '@testing-library/react-native';

import { AccountRecoveryScreen } from '@/screens/onboarding/AccountRecoveryScreen';

jest.mock('react-native-qrcode-svg', () => () => null);

const baseProps = {
  onBack: jest.fn(),
  onBeginConnect: jest.fn(),
  onCancelConnection: jest.fn(),
  onConnectBunker: jest.fn(),
  onImportSecret: jest.fn(),
  onOpenSigner: jest.fn(),
};

describe('AccountRecoveryScreen', () => {
  beforeEach(() => jest.clearAllMocks());

  it('leads with remote signing and keeps key import advanced', () => {
    render(<AccountRecoveryScreen {...baseProps} />);

    expect(screen.getByRole('header', { name: 'Use your Nostr identity' })).toBeOnTheScreen();
    expect(screen.getByText('Recommended')).toBeOnTheScreen();
    expect(screen.getByText(/signer keeps the secret key/)).toBeOnTheScreen();
    expect(screen.getByText(/protected storage/)).toBeOnTheScreen();
    expect(screen.queryByText('Continue with Apple')).not.toBeOnTheScreen();
    expect(screen.queryByText('Continue with Google')).not.toBeOnTheScreen();
  });

  it('starts Nostr Connect, exposes the QR request, and accepts a bunker link', () => {
    render(
      <AccountRecoveryScreen
        {...baseProps}
        connecting
        connectionUrl={`nostrconnect://${'a'.repeat(64)}?relay=wss%3A%2F%2Frelay.example&secret=challenge`}
      />,
    );

    fireEvent.press(screen.getByTestId('nostr-connect-method'));
    expect(baseProps.onBeginConnect).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('header', { name: 'Connect your signer' })).toBeOnTheScreen();
    expect(screen.getByLabelText('Nostr Connect QR code ready to scan')).toBeOnTheScreen();
    expect(screen.getByText(/Waiting for approval/)).toBeOnTheScreen();

    fireEvent.press(screen.getByTestId('open-signer-button'));
    expect(baseProps.onOpenSigner).toHaveBeenCalledTimes(1);

    const bunker = `bunker://${'b'.repeat(64)}?relay=wss%3A%2F%2Frelay.example`;
    fireEvent.changeText(screen.getByTestId('bunker-url-input'), bunker);
    fireEvent.press(screen.getByTestId('connect-bunker-button'));
    expect(baseProps.onConnectBunker).toHaveBeenCalledWith(bunker);

    fireEvent.press(screen.getByTestId('back-button'));
    expect(baseProps.onCancelConnection).toHaveBeenCalledTimes(1);
    expect(baseProps.onBack).not.toHaveBeenCalled();
  });

  it('imports an nsec without ever rendering its value as ordinary text', () => {
    const secret = 'nsec1advancedsecret';
    render(<AccountRecoveryScreen {...baseProps} />);

    fireEvent.press(screen.getByTestId('secret-import-method'));
    expect(screen.getByRole('header', { name: 'Import a secret key' })).toBeOnTheScreen();
    expect(screen.getByText(/Never paste this key into a message or room/)).toBeOnTheScreen();
    fireEvent.changeText(screen.getByTestId('nsec-input'), secret);
    expect(screen.queryByText(secret)).not.toBeOnTheScreen();
    fireEvent.press(screen.getByTestId('import-secret-button'));
    expect(baseProps.onImportSecret).toHaveBeenCalledWith(secret);
  });
});

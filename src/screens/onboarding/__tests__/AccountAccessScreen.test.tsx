import { fireEvent, render, screen } from '@testing-library/react-native';

import { AccountAccessScreen } from '@/screens/onboarding/AccountAccessScreen';

const baseProps = {
  onBack: jest.fn(),
  onCreateOnDevice: jest.fn(),
  onLogIn: jest.fn(),
};

describe('AccountAccessScreen', () => {
  beforeEach(() => jest.clearAllMocks());

  it('states what local identity creation means, without provider buttons', () => {
    render(<AccountAccessScreen {...baseProps} />);

    expect(screen.getByRole('header', { name: 'Make a Crays identity' })).toBeOnTheScreen();
    expect(screen.getByText('Local and private')).toBeOnTheScreen();
    expect(screen.getByText(/identity lives on this device/)).toBeOnTheScreen();
    expect(screen.getByText('Built for real places')).toBeOnTheScreen();
    expect(screen.getByText(/Join verified rooms/)).toBeOnTheScreen();
    expect(screen.getByText('Already use Nostr?')).toBeOnTheScreen();
    expect(screen.getByText(/Connect your signer instead/)).toBeOnTheScreen();
    expect(screen.getAllByText('Create on this device')).toHaveLength(1);
    expect(screen.queryByText('Continue with Apple')).not.toBeOnTheScreen();
    expect(screen.queryByText('Continue with Google')).not.toBeOnTheScreen();
  });

  it('routes local creation and exposes recoverable errors', () => {
    render(<AccountAccessScreen {...baseProps} error="Secure identity creation failed." />);

    fireEvent.press(screen.getByTestId('create-on-device-button'));
    expect(baseProps.onCreateOnDevice).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Secure identity creation failed.')).toBeOnTheScreen();
  });

  it('locks the create action while creating the identity', () => {
    render(<AccountAccessScreen {...baseProps} loading />);

    expect(screen.getByTestId('create-on-device-button')).toBeDisabled();
    expect(screen.getByTestId('create-on-device-button')).toBeBusy();
  });

  it('hands back and existing-account actions to the router owner', () => {
    render(<AccountAccessScreen {...baseProps} />);

    fireEvent.press(screen.getByTestId('back-button'));
    fireEvent.press(screen.getByTestId('existing-account-button'));

    expect(baseProps.onBack).toHaveBeenCalledTimes(1);
    expect(baseProps.onLogIn).toHaveBeenCalledTimes(1);
  });
});

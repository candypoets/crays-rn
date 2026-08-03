import { fireEvent, render, screen } from '@testing-library/react-native';

import { AccountAccessScreen } from '@/screens/onboarding/AccountAccessScreen';

const baseProps = {
  onBack: jest.fn(),
  onCreateOnDevice: jest.fn(),
  onLogIn: jest.fn(),
};

describe('AccountAccessScreen', () => {
  beforeEach(() => jest.clearAllMocks());

  it('offers only local creation in the current slice', () => {
    render(<AccountAccessScreen {...baseProps} />);

    expect(screen.getByRole('header', { name: 'Create your Crays account' })).toBeOnTheScreen();
    expect(screen.getAllByText('Create on this device')).toHaveLength(2);
    expect(screen.queryByText('Continue with Apple')).not.toBeOnTheScreen();
    expect(screen.queryByText('Continue with Google')).not.toBeOnTheScreen();
  });

  it('routes local creation and exposes recoverable errors', () => {
    render(<AccountAccessScreen {...baseProps} error="Secure identity creation failed." />);

    fireEvent.press(screen.getByTestId('create-on-device-button'));
    expect(baseProps.onCreateOnDevice).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Secure identity creation failed.')).toBeOnTheScreen();
  });

  it('disables repeat actions while creating the identity', () => {
    render(<AccountAccessScreen {...baseProps} loading />);

    expect(screen.getByTestId('create-on-device-button')).toBeDisabled();
    expect(screen.getByTestId('create-on-device-choice')).toBeDisabled();
  });
});

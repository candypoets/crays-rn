import { fireEvent, render, screen } from '@testing-library/react-native';

import { AccountRecoveryScreen } from '@/screens/onboarding/AccountRecoveryScreen';

describe('AccountRecoveryScreen', () => {
  it('states the unavailable methods and the no-overwrite truth', () => {
    render(<AccountRecoveryScreen onBack={jest.fn()} />);

    expect(screen.getByRole('header', { name: 'Other ways to log in' })).toBeOnTheScreen();
    expect(
      screen.getByText(/Key import, remote signer, and provider recovery are not configured/),
    ).toBeOnTheScreen();
    expect(screen.getByText(/No local identity will be overwritten/)).toBeOnTheScreen();
  });

  it('offers only the way back, with no fake recovery or provider action', () => {
    const onBack = jest.fn();
    render(<AccountRecoveryScreen onBack={onBack} />);

    expect(screen.queryByText('Continue with Apple')).not.toBeOnTheScreen();
    expect(screen.queryByText('Continue with Google')).not.toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: /import|signer|biometric|apple|google/i })).not.toBeOnTheScreen();
    expect(screen.queryByTestId('finish-account-button')).not.toBeOnTheScreen();

    fireEvent.press(screen.getByRole('button', { name: 'Back to login' }));
    expect(onBack).toHaveBeenCalledTimes(1);

    fireEvent.press(screen.getByTestId('back-button'));
    expect(onBack).toHaveBeenCalledTimes(2);
  });
});

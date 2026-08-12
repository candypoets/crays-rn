import { fireEvent, render, screen } from '@testing-library/react-native';

import { RecoveryScreen } from '@/screens/onboarding/RecoveryScreen';

describe('RecoveryScreen', () => {
  it('states the device-only recovery consequence before completion', () => {
    render(<RecoveryScreen onBack={jest.fn()} onFinish={jest.fn()} />);

    expect(screen.getByRole('header', { name: 'Keep your account with you' })).toBeOnTheScreen();
    expect(screen.getByText('This device, for now')).toBeOnTheScreen();
    expect(screen.getByText(/private key stays protected on this device/)).toBeOnTheScreen();
    expect(screen.getByText(/Cross-device recovery is not enabled yet/)).toBeOnTheScreen();
    expect(screen.getByText(/Before you add money or buy a durable item/)).toBeOnTheScreen();
  });

  it('finishes only after an explicit action and disables repeat taps while saving', () => {
    const onFinish = jest.fn();
    const { rerender } = render(<RecoveryScreen onBack={jest.fn()} onFinish={onFinish} />);

    fireEvent.press(screen.getByRole('button', { name: 'Continue to Discover' }));
    expect(onFinish).toHaveBeenCalledTimes(1);

    rerender(<RecoveryScreen loading onBack={jest.fn()} onFinish={onFinish} />);
    expect(screen.getByTestId('finish-account-button')).toBeDisabled();
    expect(screen.getByTestId('finish-account-button')).toBeBusy();
  });

  it('surfaces completion errors and keeps Back with the router owner', () => {
    const onBack = jest.fn();
    render(<RecoveryScreen error="Crays could not finish the account." onBack={onBack} onFinish={jest.fn()} />);

    expect(screen.getByText('Crays could not finish the account.')).toBeOnTheScreen();
    fireEvent.press(screen.getByTestId('back-button'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});

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

  it('states remote-signer custody without claiming the key is on this device', () => {
    render(<RecoveryScreen custody="remote-signer" onBack={jest.fn()} onFinish={jest.fn()} />);
    expect(screen.getByRole('header', { name: 'Your signer keeps the key' })).toBeOnTheScreen();
    expect(screen.getByText('Connected with NIP-46')).toBeOnTheScreen();
    expect(screen.getByText(/secret key stays there/)).toBeOnTheScreen();
    expect(screen.getByText(/never receives your signer’s private key/)).toBeOnTheScreen();
    expect(screen.queryByText('This device, for now')).not.toBeOnTheScreen();
  });

  it('does not invent custody while the protected account is loading', () => {
    render(<RecoveryScreen custody={null} onBack={jest.fn()} onFinish={jest.fn()} />);
    expect(screen.getByRole('header', { name: 'Checking your signing setup' })).toBeOnTheScreen();
    expect(screen.getByRole('progressbar')).toBeOnTheScreen();
    expect(screen.queryByTestId('finish-account-button')).not.toBeOnTheScreen();
    expect(screen.queryByText(/private key stays protected/)).not.toBeOnTheScreen();
  });

  it('surfaces completion errors and keeps Back with the router owner', () => {
    const onBack = jest.fn();
    render(<RecoveryScreen error="Crays could not finish the account." onBack={onBack} onFinish={jest.fn()} />);

    expect(screen.getByText('Crays could not finish the account.')).toBeOnTheScreen();
    fireEvent.press(screen.getByTestId('back-button'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});

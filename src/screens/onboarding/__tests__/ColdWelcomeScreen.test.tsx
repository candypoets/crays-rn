import { fireEvent, render, screen } from '@testing-library/react-native';

import { ColdWelcomeScreen } from '@/screens/onboarding/ColdWelcomeScreen';

describe('ColdWelcomeScreen', () => {
  it('shows one promise, account actions, and the privacy reassurance', () => {
    render(<ColdWelcomeScreen onCreateAccount={jest.fn()} onLogIn={jest.fn()} />);

    expect(screen.getByRole('header', { name: /Your night/ })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Create account' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Log in' })).toBeOnTheScreen();
    expect(screen.getByText(/No public location/)).toBeOnTheScreen();
  });

  it('hands both entry actions to the router owner', () => {
    const onCreateAccount = jest.fn();
    const onLogIn = jest.fn();
    render(<ColdWelcomeScreen onCreateAccount={onCreateAccount} onLogIn={onLogIn} />);

    fireEvent.press(screen.getByRole('button', { name: 'Create account' }));
    fireEvent.press(screen.getByRole('button', { name: 'Log in' }));

    expect(onCreateAccount).toHaveBeenCalledTimes(1);
    expect(onLogIn).toHaveBeenCalledTimes(1);
  });
});

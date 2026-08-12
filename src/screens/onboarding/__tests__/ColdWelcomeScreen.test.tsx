import { fireEvent, render, screen } from '@testing-library/react-native';

import { ColdWelcomeScreen } from '@/screens/onboarding/ColdWelcomeScreen';

describe('ColdWelcomeScreen', () => {
  it('shows the Night Playlist promise, sample moments, account actions, and privacy reassurance', () => {
    render(<ColdWelcomeScreen onCreateAccount={jest.fn()} onLogIn={jest.fn()} />);

    expect(screen.getByRole('header', { name: 'Your night starts here' })).toBeOnTheScreen();
    expect(screen.getByText('Tonight moves.')).toBeOnTheScreen();
    expect(screen.getByText(/upcoming moments/i)).toBeOnTheScreen();
    expect(screen.getByText('Gallery Opening')).toBeOnTheScreen();
    expect(screen.getByText('Rooftop Jazz')).toBeOnTheScreen();
    expect(screen.getByText('After Hours')).toBeOnTheScreen();
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

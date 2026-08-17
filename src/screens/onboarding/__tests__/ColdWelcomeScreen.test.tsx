import { fireEvent, render, screen } from '@testing-library/react-native';

import { ColdWelcomeScreen } from '@/screens/onboarding/ColdWelcomeScreen';

describe('ColdWelcomeScreen', () => {
  it('shows the Night Playlist promise without inventing sample events', () => {
    render(<ColdWelcomeScreen onCreateAccount={jest.fn()} onLogIn={jest.fn()} />);

    expect(screen.getByRole('header', { name: 'Your night starts here' })).toBeOnTheScreen();
    expect(screen.getByText('Tonight moves.')).toBeOnTheScreen();
    expect(screen.getByText(/built for real rooms/i)).toBeOnTheScreen();
    expect(screen.getByText('Verified rooms')).toBeOnTheScreen();
    expect(screen.getByText('Your visibility')).toBeOnTheScreen();
    expect(screen.getByText('One place')).toBeOnTheScreen();
    expect(screen.queryByText('Gallery Opening')).toBeNull();
    expect(screen.queryByText('Rooftop Jazz')).toBeNull();
    expect(screen.queryByText('After Hours')).toBeNull();
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

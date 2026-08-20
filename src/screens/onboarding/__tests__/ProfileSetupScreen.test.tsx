import { fireEvent, render, screen } from '@testing-library/react-native';

import { ProfileSetupScreen } from '@/screens/onboarding/ProfileSetupScreen';

describe('ProfileSetupScreen', () => {
  it('requires a meaningful display name before continuing', () => {
    render(<ProfileSetupScreen onBack={jest.fn()} onContinue={jest.fn()} />);

    expect(screen.getByTestId('profile-continue-button')).toBeDisabled();
    fireEvent.changeText(screen.getByLabelText('Display name'), 'A');
    expect(screen.getByTestId('profile-continue-button')).toBeDisabled();
    fireEvent.changeText(screen.getByLabelText('Display name'), 'QA Alex');
    expect(screen.getByTestId('profile-continue-button')).toBeEnabled();
  });

  it('shows the persistent field label with a live character count', () => {
    render(<ProfileSetupScreen onBack={jest.fn()} onContinue={jest.fn()} />);

    expect(screen.getByText('Display name')).toBeOnTheScreen();
    expect(screen.getByText('0/50')).toBeOnTheScreen();
    fireEvent.changeText(screen.getByLabelText('Display name'), 'QA Alex');
    expect(screen.getByText('7/50')).toBeOnTheScreen();
  });

  it('keeps intent chips local and reversible, out of the submitted payload', () => {
    const onContinue = jest.fn();
    render(<ProfileSetupScreen onBack={jest.fn()} onContinue={onContinue} />);

    const music = screen.getByRole('button', { name: 'Music' });
    expect(music).not.toBeSelected();
    fireEvent.press(music);
    expect(screen.getByRole('button', { name: 'Music' })).toBeSelected();
    fireEvent.press(screen.getByRole('button', { name: 'Music' }));
    expect(screen.getByRole('button', { name: 'Music' })).not.toBeSelected();

    fireEvent.changeText(screen.getByLabelText('Display name'), 'QA Alex');
    fireEvent.press(screen.getByRole('button', { name: 'Create ID and continue' }));
    expect(onContinue).toHaveBeenCalledWith('QA Alex');
  });

  it('states that room sharing and visibility are chosen later', () => {
    render(<ProfileSetupScreen onBack={jest.fn()} onContinue={jest.fn()} />);

    expect(screen.getByRole('header', { name: 'What should people here call you?' })).toBeOnTheScreen();
    expect(screen.getByText(/protected on this device/)).toBeOnTheScreen();
    expect(screen.getByLabelText('Identity step 2 of 2')).toBeOnTheScreen();
  });

  it('submits the entered display name and renders signing errors', () => {
    const onContinue = jest.fn();
    render(
      <ProfileSetupScreen
        error="The profile signature could not be verified."
        onBack={jest.fn()}
        onContinue={onContinue}
      />,
    );

    fireEvent.changeText(screen.getByLabelText('Display name'), 'QA Alex');
    fireEvent.press(screen.getByRole('button', { name: 'Create ID and continue' }));

    expect(onContinue).toHaveBeenCalledWith('QA Alex');
    expect(screen.getByText('The profile signature could not be verified.')).toBeOnTheScreen();
  });

  it('normalizes surrounding and repeated whitespace before signing', () => {
    const onContinue = jest.fn();
    render(<ProfileSetupScreen onBack={jest.fn()} onContinue={onContinue} />);

    fireEvent.changeText(screen.getByLabelText('Display name'), '  QA   Alex  ');
    fireEvent.press(screen.getByRole('button', { name: 'Create ID and continue' }));

    expect(onContinue).toHaveBeenCalledWith('QA Alex');
  });
});

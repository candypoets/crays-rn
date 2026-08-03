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
    fireEvent.press(screen.getByRole('button', { name: 'Continue' }));

    expect(onContinue).toHaveBeenCalledWith('QA Alex');
    expect(screen.getByText('The profile signature could not be verified.')).toBeOnTheScreen();
  });
});

import { fireEvent, render, screen } from '@testing-library/react-native';

import { JoinPrivacyScreen } from '@/screens/discovery/JoinPrivacyScreen';

describe('JoinPrivacyScreen', () => {
  it('defaults to quiet and never implies presence publication', () => {
    const onEnter = jest.fn();
    render(<JoinPrivacyScreen onBack={jest.fn()} onEnter={onEnter} roomName="Skyline" />);
    expect(screen.getByTestId('visibility-quiet')).toHaveProp('accessibilityState', { selected: true });
    expect(screen.getByTestId('visibility-visible')).toHaveProp('accessibilityState', { selected: false });
    expect(screen.getByTestId('join-room-button')).toBeEnabled();
    fireEvent.press(screen.getByTestId('join-room-button'));
    expect(onEnter).toHaveBeenCalledWith({ visibility: 'quiet', intent: 'social', context: '', leaveAfterMinutes: 120 });
  });

  it('requires an explicit visible selection', () => {
    const onEnter = jest.fn();
    render(<JoinPrivacyScreen onBack={jest.fn()} onEnter={onEnter} roomName="Skyline" />);
    fireEvent.press(screen.getByTestId('visibility-visible'));
    expect(screen.getByTestId('visibility-visible')).toHaveProp('accessibilityState', { selected: true });
    fireEvent.press(screen.getByTestId('intent-business'));
    fireEvent.changeText(screen.getByTestId('join-context-input'), 'Here for the founders meetup');
    fireEvent.press(screen.getByTestId('leave-after-240'));
    fireEvent.press(screen.getByTestId('join-room-button'));
    expect(onEnter).toHaveBeenCalledWith({ visibility: 'visible', intent: 'business', context: 'Here for the founders meetup', leaveAfterMinutes: 240 });
  });

  it('names the visible access check and keeps a failed attempt retryable', () => {
    const { rerender } = render(<JoinPrivacyScreen loading onBack={jest.fn()} onEnter={jest.fn()} roomName="Test Room" />);
    fireEvent.press(screen.getByTestId('visibility-visible'));
    expect(screen.getByText('Confirming access…')).toBeTruthy();
    expect(screen.getByTestId('join-room-button')).toHaveProp('accessibilityState', { disabled: true, busy: true });

    rerender(<JoinPrivacyScreen error="The room did not confirm access. Try again." onBack={jest.fn()} onEnter={jest.fn()} roomName="Test Room" />);
    expect(screen.getByText('The room did not confirm access. Try again.')).toBeOnTheScreen();
    expect(screen.getByTestId('join-room-button')).toHaveProp('accessibilityState', { disabled: false, busy: false });
  });
});

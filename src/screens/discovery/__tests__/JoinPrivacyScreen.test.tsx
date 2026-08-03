import { fireEvent, render, screen } from '@testing-library/react-native';

import { JoinPrivacyScreen } from '@/screens/discovery/JoinPrivacyScreen';

describe('JoinPrivacyScreen', () => {
  it('defaults to quiet and never implies presence publication', () => {
    const onEnter = jest.fn();
    render(<JoinPrivacyScreen onBack={jest.fn()} onEnter={onEnter} roomName="Skyline" />);
    expect(screen.getByTestId('visibility-quiet')).toHaveProp('accessibilityState', { selected: true });
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
});

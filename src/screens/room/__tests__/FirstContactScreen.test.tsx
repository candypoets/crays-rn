import { fireEvent, render, screen } from '@testing-library/react-native';

import { FirstContactScreen } from '@/screens/room/FirstContactScreen';
import type { RoomPerson } from '@/rooms/types';

jest.mock('expo-router', () => ({ router: { replace: jest.fn() }, usePathname: () => '/person' }));

const person: RoomPerson = { pubkey: 'b'.repeat(64), name: 'Maya', about: '', intent: 'Open to chat', context: 'Here for the jazz', expiresAt: 2_000_000_000, createdAt: 1 };

it('keeps message primary and gates a non-anonymous drink until acceptance', () => {
  const onMessage = jest.fn();
  const onSendDrink = jest.fn();
  const onBlock = jest.fn(); const onHideInRoom = jest.fn(); const onReport = jest.fn();
  render(<FirstContactScreen onBack={jest.fn()} onBlock={onBlock} onHideInRoom={onHideInRoom} onMessage={onMessage} onReport={onReport} onSendDrink={onSendDrink} person={person} roomName="Skyline" />);
  expect(screen.getByText(/A drink is never anonymous/)).toBeOnTheScreen();
  fireEvent.press(screen.getByTestId('message-person'));
  fireEvent.press(screen.getByTestId('send-drink-person'));
  expect(onMessage).toHaveBeenCalledTimes(1);
  expect(onSendDrink).not.toHaveBeenCalled();
  fireEvent.press(screen.getByTestId('person-hide-room'));
  fireEvent.press(screen.getByTestId('first-contact-more'));
  expect(screen.getByTestId('first-contact-safety-menu')).toBeOnTheScreen();
  fireEvent.press(screen.getByTestId('person-block-global'));
  fireEvent.press(screen.getByTestId('person-report'));
  expect(onHideInRoom).toHaveBeenCalledTimes(1);
  expect(onBlock).toHaveBeenCalledTimes(1);
  expect(onReport).toHaveBeenCalledTimes(1);
});

it('allows a drink only for an accepted conversation', () => {
  const onSendDrink = jest.fn();
  render(<FirstContactScreen contactState="accepted" onBack={jest.fn()} onBlock={jest.fn()} onHideInRoom={jest.fn()} onMessage={jest.fn()} onReport={jest.fn()} onSendDrink={onSendDrink} person={person} roomName="Skyline" />);
  expect(screen.getByTestId('send-drink-person')).not.toBeDisabled();
  fireEvent.press(screen.getByTestId('send-drink-person'));
  expect(onSendDrink).toHaveBeenCalledTimes(1);
});

it('suppresses repeated contact while a request is pending', () => {
  const onMessage = jest.fn(); const onSendDrink = jest.fn();
  render(<FirstContactScreen contactState="requested" onBack={jest.fn()} onBlock={jest.fn()} onHideInRoom={jest.fn()} onMessage={onMessage} onReport={jest.fn()} onSendDrink={onSendDrink} person={person} roomName="Skyline" />);
  expect(screen.getByTestId('message-person')).toBeDisabled();
  expect(screen.getByTestId('send-drink-person')).toBeDisabled();
  expect(screen.getByText('Waiting for a response')).toBeOnTheScreen();
});

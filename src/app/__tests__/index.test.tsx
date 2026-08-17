import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

import EntryRoute from '@/app/index';
import { getEntryDestination } from '@/account/account';
import { getStoredActiveRoom } from '@/session/RoomSession';

jest.mock('expo-router', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { Text } = jest.requireActual<typeof import('react-native')>('react-native');
  return { Redirect: ({ href }: { href: string }) => React.createElement(Text, { testID: 'entry-redirect' }, href) };
});
jest.mock('@/account/account', () => ({ getEntryDestination: jest.fn() }));
jest.mock('@/session/RoomSession', () => ({ getStoredActiveRoom: jest.fn() }));

const getDestination = jest.mocked(getEntryDestination);
const getRoom = jest.mocked(getStoredActiveRoom);

describe('EntryRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getRoom.mockResolvedValue(null);
  });

  it('shows one static branded resolver and replaces into an active room', async () => {
    getDestination.mockResolvedValue('/discover');
    getRoom.mockResolvedValue({ id: 'room' } as never);
    const view = render(<EntryRoute />);
    expect(view.getByRole('progressbar', { name: 'Opening Crays' })).toBeTruthy();
    await waitFor(() => expect(view.getByTestId('entry-redirect')).toHaveTextContent('/room'));
  });

  it('keeps a protected-storage failure explicit and retries only on request', async () => {
    getDestination.mockRejectedValueOnce(new Error('storage unavailable')).mockResolvedValueOnce('/welcome');
    const view = render(<EntryRoute />);
    await waitFor(() => expect(view.getByRole('alert')).toBeTruthy());
    expect(view.getByText('Crays could not read the protected account state.')).toBeTruthy();
    expect(getDestination).toHaveBeenCalledTimes(1);
    await act(async () => fireEvent.press(view.getByTestId('entry-retry')));
    await waitFor(() => expect(view.getByTestId('entry-redirect')).toHaveTextContent('/welcome'));
    expect(getDestination).toHaveBeenCalledTimes(2);
  });
});

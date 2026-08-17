import { fireEvent, render } from '@testing-library/react-native';

import type { BlockRecord } from '@/safety/Safety';
import { SettingsScreen } from '@/screens/settings/SettingsScreen';
import { BLOCK_REMOVED_REFRESH_WARNING, unblockAndRefreshConversation, unblockConfirmationCopy } from '@/screens/settings/unblock';

const blocked: BlockRecord = { pubkey: 'a'.repeat(64), label: 'Jonas', scope: 'global', createdAt: 1 };

describe('SettingsScreen', () => {
  it('shows the honest empty and deferred boundaries', () => {
    const onBack = jest.fn();
    const view = render(<SettingsScreen blocks={[]} onBack={onBack} onUnblock={jest.fn()} />);
    expect(view.getByTestId('blocks-empty')).toBeTruthy();
    expect(view.getByText('Permission not requested')).toBeTruthy();
    expect(view.getAllByText('Not configured').length).toBeGreaterThan(0);
    expect(view.getByText('Presence defaults')).toBeTruthy();
    expect(view.getByText('Existing Nostr identity')).toBeTruthy();
    expect(view.queryByTestId('settings-screen-brand-header')).toBeNull();
    fireEvent.press(view.getByTestId('settings-back'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('distinguishes connected-signer custody from a device-held key', () => {
    const view = render(<SettingsScreen blocks={[]} custody="remote-signer" onBack={jest.fn()} onUnblock={jest.fn()} />);
    expect(view.getByText('Connected signer')).toBeTruthy();
    expect(view.getByText('NIP-46')).toBeTruthy();
    expect(view.getByText(/asks your connected signer/)).toBeTruthy();
    expect(view.queryByText(/nipworker keeps this signer/)).toBeNull();
  });

  it('states the uninstall consequence for a local nipworker signer', () => {
    const view = render(<SettingsScreen blocks={[]} custody="device-only" onBack={jest.fn()} onUnblock={jest.fn()} />);
    expect(view.getByText('Saved in Crays')).toBeTruthy();
    expect(view.getByText(/Removing the app removes local access/)).toBeTruthy();
  });

  it('names block scope and exposes an explicit unblock action', () => {
    const onUnblock = jest.fn();
    const view = render(<SettingsScreen blocks={[blocked]} onBack={jest.fn()} onUnblock={onUnblock} />);
    expect(view.getByText('Blocked everywhere')).toBeTruthy();
    fireEvent.press(view.getByTestId(`unblock-${blocked.pubkey}-global`));
    expect(onUnblock).toHaveBeenCalledWith(blocked);
  });

  it('keeps venue blocks scoped and surfaces storage failures accessibly', () => {
    const venueBlock = { ...blocked, scope: 'venue' as const, roomId: 'skyline' };
    const view = render(<SettingsScreen blocks={[venueBlock]} error="The block list could not be saved." onBack={jest.fn()} onUnblock={jest.fn()} />);
    expect(view.getByText('Hidden in room skyline')).toBeTruthy();
    expect(view.getByRole('alert')).toBeTruthy();
    expect(view.getByText('The block list could not be saved.')).toBeTruthy();
    expect(view.getByLabelText('Unblock Jonas in this room')).toBeTruthy();
  });

  it('locks unblock actions while one exact record is being removed', () => {
    const onUnblock = jest.fn();
    const key = `${blocked.pubkey}:${blocked.scope}:*`;
    const view = render(<SettingsScreen blocks={[blocked]} onBack={jest.fn()} onUnblock={onUnblock} unblockingKey={key} />);
    const action = view.getByTestId(`unblock-${blocked.pubkey}-global`);
    expect(action).toBeDisabled();
    expect(action.props.accessibilityState.busy).toBe(true);
    expect(view.getByText('Removing…')).toBeTruthy();
    fireEvent.press(action);
    expect(onUnblock).not.toHaveBeenCalled();
  });

  it('keeps hydration and read failure distinct from a confirmed empty block list', () => {
    const view = render(<SettingsScreen blocks={[]} loading onBack={jest.fn()} onUnblock={jest.fn()} />);
    expect(view.getByTestId('blocks-loading')).toBeTruthy();
    expect(view.queryByText('Nobody is blocked')).toBeNull();
    view.rerender(<SettingsScreen blocks={[]} blocksError="The protected block list could not be read on this device." onBack={jest.fn()} onUnblock={jest.fn()} />);
    expect(view.getByTestId('blocks-unavailable')).toBeTruthy();
    expect(view.getByRole('alert')).toBeTruthy();
    expect(view.queryByText('Nobody is blocked')).toBeNull();
  });

  it('names the exact person and scope in unblock confirmation copy', () => {
    expect(unblockConfirmationCopy(blocked)).toEqual({
      message: 'Jonas will be able to appear in rooms and contact you again.',
      title: 'Unblock Jonas everywhere?',
    });
    expect(unblockConfirmationCopy({ ...blocked, scope: 'venue', roomId: 'skyline' })).toEqual({
      message: 'Jonas will be visible in this room again. Any global block remains in place.',
      title: 'Unblock Jonas in this room?',
    });
  });

  it('distinguishes successful unblock from a failed conversation refresh', async () => {
    const unblock = jest.fn().mockResolvedValue(undefined);
    const refreshConversation = jest.fn().mockRejectedValue(new Error('storage failure'));
    await expect(unblockAndRefreshConversation({ record: blocked, refreshConversation, unblock })).resolves.toBe(BLOCK_REMOVED_REFRESH_WARNING);
    expect(unblock).toHaveBeenCalledWith(blocked.pubkey, 'global', undefined);
    expect(refreshConversation).toHaveBeenCalledWith(blocked.pubkey);
  });

  it('does not refresh conversations for a venue-only unblock', async () => {
    const record = { ...blocked, scope: 'venue' as const, roomId: 'skyline' };
    const unblock = jest.fn().mockResolvedValue(undefined);
    const refreshConversation = jest.fn();
    await expect(unblockAndRefreshConversation({ record, refreshConversation, unblock })).resolves.toBeNull();
    expect(refreshConversation).not.toHaveBeenCalled();
  });
});

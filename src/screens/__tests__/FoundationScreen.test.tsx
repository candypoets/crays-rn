import { render, screen } from '@testing-library/react-native';

import { FoundationScreen } from '@/screens/FoundationScreen';

describe('FoundationScreen', () => {
  it('presents the Crays promise and a ready native Nostr runtime', () => {
    render(<FoundationScreen engineStatus="ready" />);

    expect(screen.getByRole('header', { name: 'Crays' })).toBeOnTheScreen();
    expect(screen.getByText('C').props.className).toContain('text-attention');
    expect(screen.getByText('Your night, in one place.')).toBeOnTheScreen();
    expect(screen.getByLabelText('Nostr engine ready')).toBeOnTheScreen();
  });

  it('makes a missing native runtime visible instead of rendering a blank app', () => {
    render(<FoundationScreen engineStatus="unavailable" />);

    expect(screen.getByLabelText('Nostr engine unavailable')).toBeOnTheScreen();
  });

  it('makes native runtime initialization errors visible', () => {
    render(<FoundationScreen engineStatus="error" />);

    expect(screen.getByLabelText('Nostr engine failed to start')).toBeOnTheScreen();
  });
});

import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet, Text } from 'react-native';

import {
  EdgeTabs,
  getAtlasLayout,
  NightCard,
  PortraitImage,
  stablePortraitIndex,
  TempoRail,
  VenueImage,
} from '@/components/night/NightPrimitives';

describe('NightPrimitives', () => {
  it('preserves the tall source-cell geometry of the portrait atlas', () => {
    render(<PortraitImage className="h-[104px] w-[92px]" index={5} testID="portrait" />);

    fireEvent(screen.getByTestId('portrait'), 'layout', {
      nativeEvent: { layout: { height: 104, width: 92 } },
    });

    expect(StyleSheet.flatten(screen.getByTestId('portrait-image').props.style)).toMatchObject({
      height: 368,
      left: -92,
      top: -224,
      width: 368,
    });
  });

  it('covers a wide venue frame with one square source cell without stretching it', () => {
    render(<VenueImage className="h-44 w-[320px]" index={1} testID="venue" />);

    fireEvent(screen.getByTestId('venue'), 'layout', {
      nativeEvent: { layout: { height: 176, width: 320 } },
    });

    expect(StyleSheet.flatten(screen.getByTestId('venue-image').props.style)).toMatchObject({
      height: 640,
      left: -320,
      top: -72,
      width: 640,
    });
  });

  it('returns no atlas geometry until a destination has measurable bounds', () => {
    expect(getAtlasLayout({ column: 0, columns: 4, height: 0, row: 0, rows: 2, width: 92 })).toBeNull();
  });

  it('uses a kind-0 picture and falls back to one stable pubkey illustration', () => {
    const identity = 'b'.repeat(64);
    const picture = 'https://profiles.example/jonas.jpg';
    render(<PortraitImage className="h-20 w-16" identity={identity} picture={picture} testID="profile" />);

    expect(screen.getByTestId('profile-profile-image')).toHaveProp('source', { uri: picture });
    fireEvent(screen.getByTestId('profile-profile-image'), 'error');
    fireEvent(screen.getByTestId('profile'), 'layout', {
      nativeEvent: { layout: { height: 80, width: 64 } },
    });
    expect(screen.getByTestId('profile-image')).toBeOnTheScreen();
    expect(stablePortraitIndex(identity)).toBe(stablePortraitIndex(identity));
    expect(stablePortraitIndex(identity)).toBeGreaterThanOrEqual(0);
    expect(stablePortraitIndex(identity)).toBeLessThan(8);
  });

  it('keeps decorative tempo and edge marks out of the accessibility tree', () => {
    render(
      <>
        <TempoRail testID="tempo-rail" />
        <EdgeTabs testID="edge-tabs" />
      </>,
    );

    const tempoRail = screen.getByTestId('tempo-rail', { includeHiddenElements: true });
    const edgeTabs = screen.getByTestId('edge-tabs', { includeHiddenElements: true });
    expect(tempoRail).toHaveProp('importantForAccessibility', 'no-hide-descendants');
    expect(tempoRail.children).toHaveLength(4);
    expect(edgeTabs).toHaveProp('importantForAccessibility', 'no-hide-descendants');
    expect(edgeTabs.children).toHaveLength(3);
  });

  it('exposes an interactive Night card as a named button', () => {
    const onPress = jest.fn();
    render(
      <NightCard onPress={onPress}>
        <Text>Open moment</Text>
      </NightCard>,
    );

    fireEvent.press(screen.getByRole('button', { name: 'Open moment' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

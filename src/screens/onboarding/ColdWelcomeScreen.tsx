import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import {
  BrandMark,
  OnboardingShell,
  PrimaryButton,
} from '@/components/onboarding/OnboardingPrimitives';
import { colors } from '@/theme/colors';

/**
 * THESIS: A cold launch feels like stepping into one coherent night, not beginning a tutorial.
 * OWN-WORLD: Pale lilac paper field, plum mark, coral handwritten cue, one blue committed action.
 * STORY: The headline promises the night; the moments rail proves it is about real rooms.
 * FIRST VIEWPORT: Mark and cue lead; centered headline, upcoming-moments rail, then actions.
 * FORM: Night Playlist board 02 panel 01 — static sample rail, no carousel, no fake live data.
 */

type ColdWelcomeScreenProps = {
  onCreateAccount: () => void;
  onLogIn: () => void;
};

type UpcomingMoment = {
  icon: keyof typeof Ionicons.glyphMap;
  time: string;
  title: string;
  tone: string;
  venue: string;
};

const upcomingMoments: UpcomingMoment[] = [
  { icon: 'star', time: '8:00\nPM', title: 'Gallery Opening', tone: 'bg-commitment', venue: 'The Mercer Loft' },
  { icon: 'musical-notes', time: '9:30\nPM', title: 'Rooftop Jazz', tone: 'bg-verified', venue: 'The Skyline Room' },
  { icon: 'globe', time: '11:30\nPM', title: 'After Hours', tone: 'bg-attention', venue: 'Basement Sessions' },
];

function MomentRow({ moment }: { moment: UpcomingMoment }) {
  return (
    <View className="flex-row items-center gap-3">
      <Text className="w-11 text-right text-[11px] font-semibold leading-[14px] text-muted">
        {moment.time}
      </Text>
      <View className="w-3 items-center justify-center self-stretch">
        <View className="absolute bottom-0 top-0 w-px bg-edge" />
        <View className="h-3 w-3 rounded-full border-2 border-ink/30 bg-surface" />
      </View>
      <View className="flex-1 flex-row items-center gap-3 rounded-2xl border border-edge bg-surface px-4 py-3 shadow-sm">
        <View className={`h-11 w-11 items-center justify-center rounded-full ${moment.tone}`}>
          <Ionicons color={colors.ink} name={moment.icon} size={20} />
        </View>
        <View className="flex-1">
          <Text className="text-base font-bold text-base-content">{moment.title}</Text>
          <Text className="mt-0.5 text-sm text-muted">{moment.venue}</Text>
        </View>
      </View>
    </View>
  );
}

export function ColdWelcomeScreen({ onCreateAccount, onLogIn }: ColdWelcomeScreenProps) {
  return (
    <OnboardingShell testID="cold-welcome-screen">
      <View className="flex-row items-start justify-between">
        <BrandMark size={40} />
        <Text className="mt-3 -rotate-6 text-xl font-semibold italic text-commitment">
          Tonight moves.
        </Text>
      </View>

      <Text
        accessibilityRole="header"
        className="mt-8 text-center text-[38px] font-extrabold leading-[42px] tracking-[-1px] text-base-content"
        testID="cold-welcome-heading"
      >
        Your night starts here
      </Text>

      <View className="mt-8">
        <Text className="text-center text-xs font-bold uppercase tracking-[2px] text-muted">
          Upcoming moments
        </Text>
        <View className="mt-4 gap-2">
          {upcomingMoments.map((moment) => (
            <MomentRow key={moment.title} moment={moment} />
          ))}
        </View>
      </View>

      <View className="mt-auto pt-8">
        <PrimaryButton label="Create account" onPress={onCreateAccount} testID="create-account-button" />
        <Pressable
          accessibilityRole="button"
          className="mt-1 min-h-12 items-center justify-center active:opacity-70"
          onPress={onLogIn}
          testID="log-in-button"
        >
          <Text className="text-lg font-semibold text-base-content">Log in</Text>
        </Pressable>
        <Text className="mt-3 text-center text-sm leading-5 text-muted">
          No public location. You choose when you’re visible.
        </Text>
      </View>
    </OnboardingShell>
  );
}

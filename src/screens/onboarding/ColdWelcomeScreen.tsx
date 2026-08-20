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
 * STORY: The headline promises the night; three product truths explain how Crays behaves.
 * FIRST VIEWPORT: Mark and cue lead; centered headline, trust rail, then actions.
 * FORM: Night Playlist board 02 panel 01 — compact truth rail, no sample events or fake live data.
 */

type ColdWelcomeScreenProps = {
  onCreateAccount: () => void;
  onLogIn: () => void;
};

type WelcomeTruth = {
  body: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  tone: string;
};

const welcomeTruths: WelcomeTruth[] = [
  { body: 'Room details come from the venue.', icon: 'shield-checkmark', title: 'Verified rooms', tone: 'bg-commitment' },
  { body: 'Browse quietly or choose to be seen.', icon: 'eye-outline', title: 'Your visibility', tone: 'bg-verified' },
  { body: 'Tickets, orders, and access stay together.', icon: 'ticket-outline', title: 'One place', tone: 'bg-attention' },
];

function TruthRow({ item }: { item: WelcomeTruth }) {
  return (
    <View className="flex-row items-center gap-3 rounded-2xl border border-edge bg-surface px-4 py-3 shadow-sm">
        <View className={`h-11 w-11 items-center justify-center rounded-full ${item.tone}`}>
          <Ionicons color={colors.ink} name={item.icon} size={20} />
        </View>
      <View className="min-w-0 flex-1">
        <Text className="text-base font-bold text-base-content">{item.title}</Text>
        <Text className="mt-0.5 text-sm text-muted">{item.body}</Text>
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
          Built for real rooms
        </Text>
        <View className="mt-4 gap-2">
          {welcomeTruths.map((item) => (
            <TruthRow item={item} key={item.title} />
          ))}
        </View>
      </View>

      <View className="mt-auto pt-8">
        <PrimaryButton label="Create my Crays ID" onPress={onCreateAccount} testID="create-account-button" />
        <Pressable
          accessibilityRole="button"
          className="mt-1 min-h-12 items-center justify-center active:opacity-70"
          onPress={onLogIn}
          testID="log-in-button"
        >
          <Text className="text-lg font-semibold text-base-content">Use an existing Nostr ID</Text>
        </Pressable>
        <Text className="mt-3 text-center text-sm leading-5 text-muted">
          No public location. You choose when you’re visible.
        </Text>
      </View>
    </OnboardingShell>
  );
}

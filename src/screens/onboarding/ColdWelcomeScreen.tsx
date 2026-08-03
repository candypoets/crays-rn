import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import {
  BrandMark,
  OnboardingShell,
  PaperCard,
  PrimaryButton,
} from '@/components/onboarding/OnboardingPrimitives';
import { colors } from '@/theme/colors';

/**
 * THESIS: A cold launch feels like stepping into one coherent night, not beginning a tutorial.
 * OWN-WORLD: Wine-black space, warm ticket paper, a coaster, and one coral committed action.
 * STORY: Understand the promise, trust the privacy boundary, then choose create or login.
 * FIRST VIEWPORT: Brand and headline lead; tactile room artifacts bridge promise to actions.
 * FORM: Incumbent canonical Screen 06 composition, adapted to native flow and accessibility.
 */

type ColdWelcomeScreenProps = {
  onCreateAccount: () => void;
  onLogIn: () => void;
};

export function ColdWelcomeScreen({ onCreateAccount, onLogIn }: ColdWelcomeScreenProps) {
  return (
    <OnboardingShell testID="cold-welcome-screen">
      <View className="flex-row items-center justify-between">
        <BrandMark size={58} />
        <Text className="text-xs font-bold uppercase tracking-[2px] text-muted">Crays</Text>
      </View>

      <View className="mt-8">
        <Text
          accessibilityRole="header"
          className="max-w-[460px] text-[48px] font-extrabold leading-[48px] tracking-[-1.2px] text-base-content"
          testID="cold-welcome-heading"
        >
          Your night,{`\n`}in one place.
        </Text>
        <Text className="mt-4 max-w-[500px] text-lg leading-7 text-muted">
          Meet the room. Order from the bar. Carry every ticket and membership.
        </Text>
      </View>

      <View className="my-8 min-h-52 flex-row items-center justify-center">
        <View className="z-10 h-44 w-44 -rotate-6 items-center justify-center rounded-full border border-primary/60 bg-base-200 shadow-xl">
          <BrandMark size={58} />
          <Text className="mt-3 text-center text-xs font-bold uppercase tracking-[2px] text-base-content">
            The Skyline Room
          </Text>
          <Text className="mt-1 text-sm text-muted">Rooftop jazz</Text>
        </View>
        <PaperCard className="-ml-7 w-44 rotate-6 py-5">
          <Text className="text-xs font-bold uppercase tracking-[2px] text-base-200">Tonight</Text>
          <View className="my-3 h-px bg-base-300/30" />
          <Text className="text-lg font-bold text-base-200">Doors 20:30</Text>
          <Text className="mt-1 text-sm text-base-300">One room. Your choice.</Text>
        </PaperCard>
      </View>

      <View className="mt-auto gap-2">
        <PrimaryButton
          icon={<BrandMark size={26} />}
          label="Create account"
          onPress={onCreateAccount}
          testID="create-account-button"
        />
        <Pressable
          accessibilityRole="button"
          className="min-h-12 items-center justify-center active:opacity-70"
          onPress={onLogIn}
          testID="log-in-button"
        >
          <Text className="text-lg font-semibold text-base-content">Log in</Text>
        </Pressable>
        <View className="mt-4 flex-row items-center justify-center gap-2">
          <Ionicons color={colors.accent} name="location-outline" size={18} />
          <Text className="text-center text-sm text-muted">
            No public location. You choose when you’re visible.
          </Text>
        </View>
      </View>
    </OnboardingShell>
  );
}

import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';

import {
  BackButton,
  BrandMark,
  ErrorBanner,
  OnboardingShell,
  PaperCard,
  PrimaryButton,
  StageLabel,
} from '@/components/onboarding/OnboardingPrimitives';
import { colors } from '@/theme/colors';

type ProfileSetupScreenProps = {
  error?: string | null;
  initialName?: string;
  loading?: boolean;
  onBack: () => void;
  onContinue: (displayName: string) => void;
};

export function ProfileSetupScreen({
  error,
  initialName = '',
  loading = false,
  onBack,
  onContinue,
}: ProfileSetupScreenProps) {
  const [displayName, setDisplayName] = useState(initialName);
  const valid = displayName.trim().length >= 2 && displayName.trim().length <= 50;

  return (
    <OnboardingShell keyboard testID="profile-setup-screen">
      <BackButton onPress={onBack} />
      <StageLabel>Account · 1 of 2</StageLabel>
      <Text
        accessibilityRole="header"
        className="text-[45px] font-extrabold leading-[47px] tracking-[-1.2px] text-base-content"
      >
        What should people call you?
      </Text>

      <View className="my-7 items-center">
        <View className="h-32 w-32 items-center justify-center rounded-full border-2 border-base-content bg-base-200">
          <Ionicons color={colors.accent} name="person-outline" size={56} />
        </View>
        <Text className="mt-3 text-sm font-semibold text-primary">Photo can wait</Text>
      </View>

      <ErrorBanner message={error} />
      <View className="rounded-2xl border border-base-300 bg-base-200 px-5 py-4 focus:border-primary">
        <Text className="text-sm font-semibold text-muted">Display name</Text>
        <TextInput
          accessibilityLabel="Display name"
          autoCapitalize="words"
          autoComplete="name"
          className="mt-1 min-h-12 text-2xl font-semibold text-base-content"
          maxLength={50}
          onChangeText={setDisplayName}
          placeholder="Alex"
          placeholderTextColor={colors.placeholder}
          returnKeyType="done"
          selectionColor={colors.accent}
          testID="display-name-input"
          value={displayName}
        />
      </View>
      <Text className="mb-7 mt-3 text-sm leading-5 text-muted">
        You can add a photo and room-specific context later.
      </Text>

      <PrimaryButton
        disabled={!valid}
        label="Continue"
        loading={loading}
        onPress={() => onContinue(displayName)}
        testID="profile-continue-button"
      />

      <PaperCard className="mt-8">
        <View className="flex-row items-start gap-4">
          <View className="h-12 w-12 items-center justify-center rounded-full bg-base-200">
            <BrandMark size={34} />
          </View>
          <View className="flex-1">
            <Text className="text-lg font-bold text-base-200">Your account, your key</Text>
            <Text className="mt-2 text-base leading-6 text-base-300">
              Crays protects your account on this device. We’ll explain recovery next.
            </Text>
          </View>
        </View>
      </PaperCard>
    </OnboardingShell>
  );
}

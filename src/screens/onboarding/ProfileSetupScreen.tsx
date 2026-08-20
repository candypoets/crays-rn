import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { normaliseDisplayName } from '@/account/state';
import {
  BackButton,
  BrandMark,
  ErrorBanner,
  OnboardingShell,
  PrimaryButton,
} from '@/components/onboarding/OnboardingPrimitives';
import { colors } from '@/theme/colors';

/**
 * THESIS: Setup asks one question — what the room should call you — and nothing more.
 * OWN-WORLD: Pale lilac field, plum mark, blue step dots, bright reversible intent chips.
 * STORY: Name first, optional intents second, then one calm promise about room visibility.
 * FIRST VIEWPORT: Back and mark lead; prompt, field, chips, lock note, then Continue.
 * FORM: Night Playlist board 02 panel 03 — intents stay local; nothing is published here.
 */

type ProfileSetupScreenProps = {
  error?: string | null;
  initialName?: string;
  loading?: boolean;
  onBack: () => void;
  onContinue: (displayName: string) => void;
};

type Intent = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
};

const intents: Intent[] = [
  { icon: 'musical-notes-outline', label: 'Music' },
  { icon: 'color-palette-outline', label: 'Art' },
  { icon: 'sparkles-outline', label: 'Dance' },
  { icon: 'chatbubble-outline', label: 'Talks' },
  { icon: 'restaurant-outline', label: 'Food' },
  { icon: 'heart-outline', label: 'Vibes' },
];

function StepDots({ active }: { active: number }) {
  return (
    <View accessibilityLabel={`Identity step ${active} of 2`} accessible className="flex-row items-center gap-2">
      {[1, 2].map((step) => (
        <View className={`h-2.5 w-2.5 rounded-full ${step === active ? 'bg-primary' : 'bg-base-300'}`} key={step} />
      ))}
    </View>
  );
}

export function ProfileSetupScreen({
  error,
  initialName = '',
  loading = false,
  onBack,
  onContinue,
}: ProfileSetupScreenProps) {
  const [displayName, setDisplayName] = useState(initialName);
  const [selectedIntents, setSelectedIntents] = useState<string[]>([]);
  const normalizedName = normaliseDisplayName(displayName);
  const valid = normalizedName.length >= 2 && normalizedName.length <= 50;

  const toggleIntent = (label: string) => {
    setSelectedIntents((current) =>
      current.includes(label) ? current.filter((item) => item !== label) : [...current, label],
    );
  };

  return (
    <OnboardingShell keyboard testID="profile-setup-screen">
      <View className="flex-row items-start justify-between">
        <BackButton onPress={onBack} />
        <View className="mt-4">
          <StepDots active={2} />
        </View>
        <BrandMark size={40} />
      </View>

      <Text
        accessibilityRole="header"
        className="mt-4 text-[36px] font-extrabold leading-[40px] tracking-[-1px] text-base-content"
      >
        What should people here call you?
      </Text>

      <View className="mt-8">
        <ErrorBanner message={error} />
        <Text className="text-xs font-bold uppercase tracking-[2px] text-muted">Display name</Text>
        <View className="mt-2 flex-row items-center rounded-2xl border border-edge bg-surface px-4 focus:border-primary">
          <TextInput
            accessibilityLabel="Display name"
            autoCapitalize="words"
            autoComplete="name"
            className="min-h-14 flex-1 text-lg text-base-content"
            maxLength={50}
            onChangeText={setDisplayName}
            placeholder="Alex"
            placeholderTextColor={colors.placeholder}
            returnKeyType="done"
            selectionColor={colors.primary}
            testID="display-name-input"
            value={displayName}
          />
          <Text className="ml-3 text-sm text-muted">{displayName.length}/50</Text>
        </View>
      </View>

      <Text className="mt-7 text-base font-bold text-base-content">
        What brings you out tonight? <Text className="font-normal text-muted">(optional)</Text>
      </Text>
      <View className="mt-3 flex-row flex-wrap gap-3">
        {intents.map((intent) => {
          const selected = selectedIntents.includes(intent.label);
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected }}
              className={`min-h-12 flex-row items-center gap-2 rounded-full px-4 py-3 ${
                selected ? 'border-2 border-primary bg-surface' : 'border border-edge bg-surface'
              }`}
              key={intent.label}
              onPress={() => toggleIntent(intent.label)}
            >
              <Ionicons color={selected ? colors.primary : colors.ink} name={intent.icon} size={18} />
              <Text className={`text-base font-bold ${selected ? 'text-primary' : 'text-base-content'}`}>
                {intent.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View className="mt-7 flex-row items-start gap-3 rounded-2xl bg-surface-soft p-4">
        <Ionicons color={colors.ink} name="lock-closed-outline" size={20} />
        <Text className="flex-1 text-sm leading-5 text-ink-muted">
          Your new Nostr identity is protected on this device. You decide what each room can see.
        </Text>
      </View>

      <View className="mt-auto pt-6">
        <PrimaryButton
          disabled={!valid}
          label="Create ID and continue"
          loading={loading}
          onPress={() => onContinue(normalizedName)}
          testID="profile-continue-button"
        />
      </View>
    </OnboardingShell>
  );
}

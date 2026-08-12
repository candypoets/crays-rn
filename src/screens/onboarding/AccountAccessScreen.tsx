import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import {
  BackButton,
  BrandMark,
  ErrorBanner,
  OnboardingShell,
  PrimaryButton,
  TextAction,
} from '@/components/onboarding/OnboardingPrimitives';
import { colors } from '@/theme/colors';

/**
 * THESIS: Identity creation is a pre-show checklist, not a wall of competing choices.
 * OWN-WORLD: Pale lilac field, plum mark, soft lilac icon discs, one blue committed action.
 * STORY: Read the three boundaries, understand providers are absent, then create locally.
 * FIRST VIEWPORT: Back and mark lead; headline, checklist, then the single create action.
 * FORM: Night Playlist board 02 panel 02 — one local method; providers explained, not rendered.
 */

type AccountAccessScreenProps = {
  error?: string | null;
  loading?: boolean;
  onBack: () => void;
  onCreateOnDevice: () => void;
  onLogIn: () => void;
};

type ChecklistRow = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
};

const checklist: ChecklistRow[] = [
  {
    icon: 'lock-closed-outline',
    title: 'Local and private',
    body: 'Your identity lives on this device. It’s not published anywhere.',
  },
  {
    icon: 'person-outline',
    title: 'Built for real places',
    body: 'Join verified rooms. Your presence isn’t shown before you enter.',
  },
  {
    icon: 'ban-outline',
    title: 'Provider login isn’t available',
    body: 'Apple and Google sign-in aren’t configured in this build.',
  },
];

export function AccountAccessScreen({
  error,
  loading = false,
  onBack,
  onCreateOnDevice,
  onLogIn,
}: AccountAccessScreenProps) {
  return (
    <OnboardingShell testID="account-access-screen">
      <View className="flex-row items-start justify-between">
        <BackButton onPress={onBack} />
        <BrandMark size={40} />
      </View>

      <Text
        accessibilityRole="header"
        className="mt-4 text-[36px] font-extrabold leading-[40px] tracking-[-1px] text-base-content"
      >
        Make a Crays identity
      </Text>

      <View className="mt-8 gap-6">
        {checklist.map((row) => (
          <View className="flex-row items-center gap-4" key={row.title}>
            <View className="h-12 w-12 items-center justify-center rounded-full bg-surface-soft">
              <Ionicons color={colors.ink} name={row.icon} size={24} />
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-base-content">{row.title}</Text>
              <Text className="mt-1 text-sm leading-5 text-muted">{row.body}</Text>
            </View>
          </View>
        ))}
      </View>

      <View className="mt-auto pt-8">
        <ErrorBanner message={error} />
        <PrimaryButton
          label="Create on this device"
          loading={loading}
          onPress={onCreateOnDevice}
          testID="create-on-device-button"
        />
        <TextAction label="I already have an account" onPress={onLogIn} testID="existing-account-button" />
      </View>
    </OnboardingShell>
  );
}

// THESIS: Permission follows a concrete benefit and names its limits.
// OWNED WORLD: Nearby is a doorway sensor, never an invisible attendance tracker.
// STORY: Explain discovery → state what is not shared → continue or use Map.
// FIRST VIEWPORT: The purpose and privacy boundary are readable before the action.
// FORM: Denial keeps Map, links, Messages, and Me usable.
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { BrandMark, OnboardingShell, PrimaryButton, TextAction } from '@/components/onboarding/OnboardingPrimitives';
import { colors } from '@/theme/colors';

export function BluetoothRationaleScreen({ error, loading, onContinue, onMap }: { error?: string | null; loading?: boolean; onContinue: () => void; onMap: () => void }) {
  return <OnboardingShell testID="bluetooth-rationale-screen"><View className="items-center pt-8"><BrandMark size={72} /><View className="mt-8 h-36 w-36 items-center justify-center rounded-full border border-base-300 bg-base-200"><Ionicons color={colors.accent} name="bluetooth" size={70} /></View></View><Text accessibilityRole="header" className="mt-8 text-center text-[42px] font-extrabold leading-[44px] text-base-content">Find the room you’re in</Text><Text className="mt-4 text-center text-lg leading-7 text-muted">Nearby Devices lets Crays recognize participating rooms around you.</Text>
    <View className="mt-8 gap-3"><View className="flex-row items-start gap-4"><Ionicons color={colors.primary} name="eye-off-outline" size={26} /><Text className="flex-1 text-base leading-6 text-base-content">It does not make you visible to people.</Text></View><View className="flex-row items-start gap-4"><Ionicons color={colors.primary} name="navigate-outline" size={26} /><Text className="flex-1 text-base leading-6 text-base-content">It does not publish your exact location.</Text></View><View className="flex-row items-start gap-4"><Ionicons color={colors.primary} name="hand-left-outline" size={26} /><Text className="flex-1 text-base leading-6 text-base-content">You still choose the room and whether to appear.</Text></View></View>
    {error ? <View accessibilityRole="alert" className="mt-5 rounded-2xl border border-error/40 bg-error/10 p-4"><Text className="leading-5 text-error">{error}</Text></View> : null}<View className="mt-10"><PrimaryButton label="Continue" loading={loading} onPress={onContinue} testID="bluetooth-continue-button" /><TextAction label="Use Map instead" onPress={onMap} testID="use-map-button" /></View></OnboardingShell>;
}

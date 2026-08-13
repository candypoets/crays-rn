import { Ionicons } from '@expo/vector-icons';
import type { PropsWithChildren, ReactNode } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { EdgeTabs } from '@/components/night/NightPrimitives';
import { colors } from '@/theme/colors';

type OnboardingShellProps = PropsWithChildren<{
  keyboard?: boolean;
  showEdgeTabs?: boolean;
  testID: string;
}>;

export function OnboardingShell({ children, keyboard = false, showEdgeTabs = true, testID }: OnboardingShellProps) {
  const insets = useSafeAreaInsets();
  const content = (
    <ScrollView
      automaticallyAdjustKeyboardInsets
      contentContainerClassName="grow px-6 pt-3"
      contentContainerStyle={{ paddingBottom: 32 + insets.bottom }}
      keyboardShouldPersistTaps="handled"
      scrollIndicatorInsets={{ bottom: insets.bottom }}
      showsVerticalScrollIndicator={false}
    >
      <View className="mx-auto w-full max-w-[560px] grow">{children}</View>
    </ScrollView>
  );

  return (
    <SafeAreaView className="flex-1 bg-base-100" edges={['top', 'right', 'left']} testID={testID}>
      {showEdgeTabs ? <EdgeTabs /> : null}
      {keyboard ? (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1"
        >
          {content}
        </KeyboardAvoidingView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

export function BrandMark({ size = 64 }: { size?: number }) {
  return (
    <View
      accessible={false}
      className="items-center justify-center rounded-full bg-ink"
      style={{ height: size, width: size }}
    >
      <Text className="font-black text-attention" style={{ fontSize: Math.max(14, size * 0.52), lineHeight: size * 0.72 }}>
        C
      </Text>
    </View>
  );
}

export function BackButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityLabel="Back"
      accessibilityRole="button"
      className="mb-5 h-12 w-12 items-center justify-center rounded-full active:bg-base-200"
      hitSlop={8}
      onPress={onPress}
      testID="back-button"
    >
      <Ionicons color={colors.ink} name="arrow-back" size={28} />
    </Pressable>
  );
}

type PrimaryButtonProps = {
  disabled?: boolean;
  icon?: ReactNode;
  label: string;
  loading?: boolean;
  loadingLabel?: string;
  onPress: () => void;
  testID?: string;
  tone?: 'commitment' | 'primary';
};

export function PrimaryButton({
  disabled = false,
  icon,
  label,
  loading = false,
  loadingLabel = 'Working…',
  onPress,
  testID,
  tone = 'primary',
}: PrimaryButtonProps) {
  const unavailable = disabled || loading;
  const backgroundColor = unavailable
    ? colors.mutedAction
    : tone === 'commitment'
      ? colors.commitment
      : colors.primary;
  const foregroundColor = tone === 'commitment' ? colors.ink : colors.surface;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: unavailable, busy: loading }}
      className="min-h-14 overflow-hidden rounded-2xl active:opacity-80"
      disabled={unavailable}
      onPress={onPress}
      testID={testID}
    >
      <View style={{ backgroundColor, minHeight: 56 }}>
        <View className="min-h-14 flex-row items-center justify-center gap-3 px-6 py-3">
          {loading ? <ActivityIndicator color={foregroundColor} /> : icon}
          <Text className="text-center text-base font-extrabold" style={{ color: foregroundColor }}>
            {loading ? loadingLabel : label}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export function TextAction({
  label,
  onPress,
  testID,
}: {
  label: string;
  onPress: () => void;
  testID?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      className="min-h-12 items-center justify-center px-4 active:opacity-70"
      onPress={onPress}
      testID={testID}
    >
      <Text className="text-base font-bold text-primary">{label}</Text>
    </Pressable>
  );
}

export function StageLabel({ children }: PropsWithChildren) {
  return (
    <Text className="mb-4 text-xs font-bold uppercase tracking-[2px] text-primary">{children}</Text>
  );
}

export function PaperCard({ children, className = '' }: PropsWithChildren<{ className?: string }>) {
  return (
    <View
      className={`rounded-2xl border border-edge bg-surface p-6 ${className}`}
      style={{ elevation: 2, shadowColor: colors.shadow, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 8 }}
    >
      {children}
    </View>
  );
}

export function ErrorBanner({ message }: { message?: string | null }) {
  if (!message) return null;

  return (
    <View
      accessibilityLabel={message}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      accessible
      className="mb-4 flex-row items-start gap-3 rounded-2xl border border-error/50 bg-error/10 p-4"
      testID="error-banner"
    >
      <Ionicons color={colors.error} name="alert-circle" size={22} />
      <Text className="flex-1 text-sm leading-5 text-base-content">{message}</Text>
    </View>
  );
}

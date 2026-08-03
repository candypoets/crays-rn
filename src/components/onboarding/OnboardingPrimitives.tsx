import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { PropsWithChildren, ReactNode } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/theme/colors';

type OnboardingShellProps = PropsWithChildren<{
  keyboard?: boolean;
  testID: string;
}>;

export function OnboardingShell({ children, keyboard = false, testID }: OnboardingShellProps) {
  const content = (
    <ScrollView
      automaticallyAdjustKeyboardInsets
      contentContainerClassName="grow px-6 pb-8 pt-3"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View className="mx-auto w-full max-w-[560px] grow">{children}</View>
    </ScrollView>
  );

  return (
    <SafeAreaView className="flex-1 bg-base-100" edges={['top', 'right', 'bottom', 'left']} testID={testID}>
      <View className="absolute -right-28 top-28 h-72 w-72 rounded-full bg-primary/5" />
      <View className="absolute -left-24 bottom-16 h-56 w-56 rounded-full bg-accent/5" />
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
    <Image
      accessibilityIgnoresInvertColors
      accessible={false}
      resizeMode="contain"
      source={require('../../../assets/branding/crays-icon.png')}
      style={{ height: size, width: size }}
    />
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
      <Ionicons color={colors.paper} name="arrow-back" size={30} />
    </Pressable>
  );
}

type PrimaryButtonProps = {
  disabled?: boolean;
  icon?: ReactNode;
  label: string;
  loading?: boolean;
  onPress: () => void;
  testID?: string;
};

export function PrimaryButton({
  disabled = false,
  icon,
  label,
  loading = false,
  onPress,
  testID,
}: PrimaryButtonProps) {
  const unavailable = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: unavailable, busy: loading }}
      className="min-h-14 overflow-hidden rounded-full active:opacity-80"
      disabled={unavailable}
      onPress={onPress}
      testID={testID}
    >
      <LinearGradient
        colors={unavailable ? [colors.mutedAction, colors.mutedAction] : [colors.primary, colors.accent]}
        end={{ x: 1, y: 0.5 }}
        start={{ x: 0, y: 0.5 }}
        style={{ minHeight: 56, borderRadius: 999 }}
      >
        <View className="min-h-14 flex-row items-center justify-center gap-3 px-6 py-3">
          {loading ? <ActivityIndicator color={colors.night} /> : icon}
          <Text className="text-center text-lg font-bold text-base-content">
            {loading ? 'Working…' : label}
          </Text>
        </View>
      </LinearGradient>
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
      <Text className="text-base font-semibold text-base-content underline">{label}</Text>
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
      className={`rounded-2xl bg-base-content p-6 shadow-lg ${className}`}
      style={{ elevation: 5, shadowColor: colors.shadow, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.28, shadowRadius: 10 }}
    >
      {children}
    </View>
  );
}

export function ErrorBanner({ message }: { message?: string | null }) {
  if (!message) return null;

  return (
    <View
      accessibilityLiveRegion="polite"
      className="mb-4 flex-row items-start gap-3 rounded-2xl border border-error/50 bg-error/10 p-4"
      testID="error-banner"
    >
      <Ionicons color={colors.accent} name="alert-circle" size={22} />
      <Text className="flex-1 text-sm leading-5 text-base-content">{message}</Text>
    </View>
  );
}

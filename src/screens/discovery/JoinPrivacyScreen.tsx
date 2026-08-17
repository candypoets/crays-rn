// THESIS: Joining a venue relay and volunteering social presence are separate decisions.
// OWNED WORLD: Two equal white door cards make quiet and visible entry consequences tangible.
// STORY: Compare both choices → select deliberately → configure only what the choice needs → enter.
// FIRST VIEWPORT: Quiet is the safe default while both choices remain fully readable.
// FORM: A relay failure preserves every draft choice and never produces false visible state.
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { BackButton, OnboardingShell, PrimaryButton, TextAction } from '@/components/onboarding/OnboardingPrimitives';
import type { RoomIntent, RoomJoinPreferences } from '@/rooms/types';
import { colors } from '@/theme/colors';

type Visibility = 'quiet' | 'visible';
const INTENTS: { label: string; value: RoomIntent }[] = [
  { label: 'Social', value: 'social' },
  { label: 'Business', value: 'business' },
  { label: 'Dating', value: 'dating' },
  { label: 'Just curious', value: 'curious' },
];
const LEAVE_TIMES = [60, 120, 240] as const;

type JoinPrivacyScreenProps = {
  error?: string | null;
  loading?: boolean;
  onBack: () => void;
  onEnter: (preferences: RoomJoinPreferences) => void;
  roomName: string;
};

export function JoinPrivacyScreen({ error, loading, onBack, onEnter, roomName }: JoinPrivacyScreenProps) {
  const [choice, setChoice] = useState<Visibility>('quiet');
  const [intent, setIntent] = useState<RoomIntent>('social');
  const [context, setContext] = useState('');
  const [leaveAfterMinutes, setLeaveAfterMinutes] = useState<RoomJoinPreferences['leaveAfterMinutes']>(120);
  const submit = () => {
    onEnter({ visibility: choice, intent, context: choice === 'visible' ? context.trim() : '', leaveAfterMinutes });
  };

  return (
    <OnboardingShell keyboard showEdgeTabs={false} testID="join-privacy-screen">
      <BackButton onPress={onBack} />
      <Text className="text-center text-xs font-black uppercase tracking-[0.7px] text-primary">Joining · {roomName}</Text>
      <Text accessibilityRole="header" className="mt-3 text-center text-[34px] font-black leading-[36px] tracking-[-0.8px] text-ink">How do you want to enter?</Text>
      <Text className="mt-3 text-center text-base leading-6 text-muted">You can change this anytime. Joining and visibility are separate.</Text>

      <View className="mt-7 gap-4">
        {([
          { value: 'quiet' as const, icon: 'glasses-outline' as const, title: 'Browse quietly', copy: 'Explore and participate without showing you’re here.', note: 'No presence event is published. Great for checking out the vibe.' },
          { value: 'visible' as const, icon: 'person-outline' as const, title: 'Be visible', copy: 'Others in the room can see you’re here.', note: 'Great for connecting with people.' },
        ]).map((option) => {
          const selected = choice === option.value;
          return (
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              className={`rounded-2xl border-2 bg-surface p-5 ${selected ? 'border-primary' : 'border-edge'}`}
              key={option.value}
              onPress={() => setChoice(option.value)}
              testID={`visibility-${option.value}`}
            >
              <View className="flex-row items-center gap-4">
                <View className="h-14 w-14 items-center justify-center rounded-full bg-primary">
                  <Ionicons color={colors.surface} name={option.icon} size={28} />
                </View>
                <View className="min-w-0 flex-1">
                  <Text className="text-xl font-black text-ink">{option.title}</Text>
                  <Text className="mt-1 text-sm leading-5 text-muted">{option.copy}</Text>
                </View>
                <Ionicons color={selected ? colors.primary : colors.inkMuted} name={selected ? 'checkmark-circle' : 'chevron-forward'} size={25} />
              </View>
              <Text className="mt-4 text-sm leading-5 text-muted">{option.note}</Text>
            </Pressable>
          );
        })}
      </View>

      {choice === 'visible' ? (
        <View className="mt-8" testID="visible-presence-options">
          <Text className="text-xl font-black text-ink">What brings you here?</Text>
          <Text className="mt-1 leading-6 text-muted">People will see this with your room profile.</Text>
          <View accessibilityRole="radiogroup" className="mt-4 flex-row flex-wrap gap-2">
            {INTENTS.map((option) => {
              const selected = intent === option.value;
              return (
                <Pressable accessibilityRole="radio" accessibilityState={{ selected }} className={`min-h-12 justify-center rounded-xl border px-4 ${selected ? 'border-primary bg-primary' : 'border-edge bg-surface'}`} key={option.value} onPress={() => setIntent(option.value)} testID={`intent-${option.value}`}>
                  <Text className={`font-bold ${selected ? 'text-white' : 'text-ink'}`}>{option.label}</Text>
                </Pressable>
              );
            })}
          </View>
          <Text className="mt-6 font-bold text-ink">One-line context <Text className="font-normal text-muted">· optional</Text></Text>
          <TextInput accessibilityHint="Shown only in this room while your presence is active" className="mt-2 min-h-14 rounded-2xl border border-edge bg-surface px-4 py-3 text-base text-ink" maxLength={80} onChangeText={setContext} placeholder="Here for the jazz set" placeholderTextColor={colors.placeholder} returnKeyType="done" testID="join-context-input" value={context} />
          <Text className="mt-2 text-right text-xs text-muted">{context.length}/80</Text>
        </View>
      ) : null}

      <View className="mt-8">
        <Text className="text-xl font-black text-ink">Leave automatically</Text>
        <Text className="mt-1 leading-6 text-muted">The room and feed lock at this time. You can leave sooner.</Text>
        <View accessibilityRole="radiogroup" className="mt-4 flex-row gap-2">
          {LEAVE_TIMES.map((minutes) => {
            const selected = leaveAfterMinutes === minutes;
            const label = minutes === 60 ? '1 hour' : `${minutes / 60} hours`;
            return (
              <Pressable accessibilityRole="radio" accessibilityState={{ selected }} className={`min-h-12 flex-1 items-center justify-center rounded-xl border ${selected ? 'border-primary bg-primary/10' : 'border-edge bg-surface'}`} key={minutes} onPress={() => setLeaveAfterMinutes(minutes)} testID={`leave-after-${minutes}`}>
                <Text className={`font-bold ${selected ? 'text-primary' : 'text-ink'}`}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {error ? <View accessibilityRole="alert" className="mt-5 rounded-2xl border border-error/40 bg-error/10 p-4"><Text className="text-sm font-semibold leading-5 text-error">{error}</Text></View> : null}
      <View className="mt-8">
        <PrimaryButton label={choice === 'quiet' ? 'Enter quietly' : 'Enter and be visible'} loading={loading} loadingLabel={choice === 'quiet' ? 'Entering quietly…' : 'Confirming access…'} onPress={submit} testID="join-room-button" />
        <Text className="mt-3 text-center text-sm leading-5 text-muted">Automatic leave: {leaveAfterMinutes === 60 ? '1 hour' : `${leaveAfterMinutes / 60} hours`} after entry.</Text>
        <TextAction label="Back" onPress={onBack} />
      </View>
    </OnboardingShell>
  );
}

// THESIS: Entering a venue relay and becoming socially visible are separate acts.
// OWNED WORLD: Two door tickets make the privacy consequence tangible.
// STORY: Compare quiet/visible → select one → enter exactly one room.
// FIRST VIEWPORT: Both privacy choices and their consequences fit before commit.
// FORM: Publish failure leaves the room unselected and supports retry or quiet entry.
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { OnboardingShell, PrimaryButton, StageLabel, TextAction } from '@/components/onboarding/OnboardingPrimitives';
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

export function JoinPrivacyScreen({ error, loading, onBack, onEnter, roomName }: { error?: string | null; loading?: boolean; onBack: () => void; onEnter: (preferences: RoomJoinPreferences) => void; roomName: string }) {
  const [choice, setChoice] = useState<Visibility>('quiet');
  const [intent, setIntent] = useState<RoomIntent>('social');
  const [context, setContext] = useState('');
  const [leaveAfterMinutes, setLeaveAfterMinutes] = useState<RoomJoinPreferences['leaveAfterMinutes']>(120);
  const preferences: RoomJoinPreferences = { visibility: choice, intent, context: context.trim(), leaveAfterMinutes };
  return <OnboardingShell keyboard testID="join-privacy-screen"><StageLabel>Joining · {roomName}</StageLabel><Text accessibilityRole="header" className="text-[42px] font-extrabold leading-[44px] text-base-content">How do you want to enter?</Text><Text className="mt-3 text-base leading-6 text-muted">You can order, read announcements and use tickets either way.</Text>
    <View className="mt-7 gap-4">{([
      { value: 'quiet' as const, icon: 'eye-off-outline' as const, title: 'Browse quietly', copy: 'Do not appear in the People view. No presence event is published.' },
      { value: 'visible' as const, icon: 'people-outline' as const, title: 'Be visible', copy: 'Appear with your name and intent until you leave or time expires.' },
    ]).map((option) => { const selected = choice === option.value; return <Pressable accessibilityRole="radio" accessibilityState={{ selected }} className={`rounded-2xl border p-5 ${selected ? 'border-primary bg-primary/10' : 'border-base-300 bg-base-200'}`} key={option.value} onPress={() => setChoice(option.value)} testID={`visibility-${option.value}`}><View className="flex-row items-start gap-4"><View className="h-12 w-12 items-center justify-center rounded-full border border-base-300"><Ionicons color={selected ? colors.primary : colors.accent} name={option.icon} size={25} /></View><View className="min-w-0 flex-1"><Text className="text-xl font-bold text-base-content">{option.title}</Text><Text className="mt-2 text-sm leading-5 text-muted">{option.copy}</Text></View><Ionicons color={selected ? colors.primary : colors.placeholder} name={selected ? 'radio-button-on' : 'radio-button-off'} size={25} /></View></Pressable>; })}</View>
    {choice === 'visible' ? <View className="mt-8" testID="visible-presence-options">
      <Text className="text-xl font-black text-base-content">What brings you here?</Text>
      <Text className="mt-1 leading-6 text-muted">People will see this with your room profile.</Text>
      <View accessibilityRole="radiogroup" className="mt-4 flex-row flex-wrap gap-2">{INTENTS.map((option) => { const selected = intent === option.value; return <Pressable accessibilityRole="radio" accessibilityState={{ selected }} className={`min-h-12 justify-center rounded-full border px-4 ${selected ? 'border-primary bg-primary' : 'border-base-300 bg-base-200'}`} key={option.value} onPress={() => setIntent(option.value)} testID={`intent-${option.value}`}><Text className={`font-bold ${selected ? 'text-white' : 'text-base-content'}`}>{option.label}</Text></Pressable>; })}</View>
      <Text className="mt-6 font-bold text-base-content">One-line context <Text className="font-normal text-muted">· optional</Text></Text>
      <TextInput accessibilityHint="Shown only in this room while your presence is active" className="mt-2 min-h-14 rounded-2xl border border-base-300 bg-base-200 px-4 py-3 text-base text-base-content" maxLength={80} onChangeText={setContext} placeholder="Here for the jazz set" placeholderTextColor={colors.placeholder} returnKeyType="done" testID="join-context-input" value={context} />
      <Text className="mt-2 text-right text-xs text-muted">{context.length}/80</Text>
    </View> : null}
    <View className="mt-8">
      <Text className="text-xl font-black text-base-content">Leave automatically</Text>
      <Text className="mt-1 leading-6 text-muted">The room and feed lock at this time. You can leave sooner.</Text>
      <View accessibilityRole="radiogroup" className="mt-4 flex-row gap-2">{LEAVE_TIMES.map((minutes) => { const selected = leaveAfterMinutes === minutes; const label = minutes === 60 ? '1 hour' : `${minutes / 60} hours`; return <Pressable accessibilityRole="radio" accessibilityState={{ selected }} className={`min-h-12 flex-1 items-center justify-center rounded-2xl border ${selected ? 'border-primary bg-primary/10' : 'border-base-300 bg-base-200'}`} key={minutes} onPress={() => setLeaveAfterMinutes(minutes)} testID={`leave-after-${minutes}`}><Text className={`font-bold ${selected ? 'text-primary' : 'text-base-content'}`}>{label}</Text></Pressable>; })}</View>
    </View>
    {error ? <View accessibilityRole="alert" className="mt-5 rounded-2xl border border-error/40 bg-error/10 p-4"><Text className="text-sm font-semibold leading-5 text-error">{error}</Text></View> : null}
    <View className="mt-8"><PrimaryButton label={choice === 'quiet' ? 'Enter quietly' : 'Enter and be visible'} loading={loading} onPress={() => onEnter(preferences)} testID="join-room-button" /><Text className="mt-3 text-center text-sm leading-5 text-muted">Automatic leave: {leaveAfterMinutes === 60 ? '1 hour' : `${leaveAfterMinutes / 60} hours`} after entry.</Text><TextAction label="Back" onPress={onBack} /></View></OnboardingShell>;
}

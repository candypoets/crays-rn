import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { AppShell } from '@/components/app/AppShell';
import { colors } from '@/theme/colors';

const METHODS = [
  { id: 'Wallet', icon: 'wallet-outline' as const, detail: 'Cashu wallet · setup required' },
  { id: 'Apple Pay', icon: 'logo-apple' as const, detail: 'Not connected in this pilot' },
  { id: 'Google Pay', icon: 'logo-google' as const, detail: 'Not connected in this pilot' },
  { id: 'Card', icon: 'card-outline' as const, detail: 'Processor not connected in this pilot' },
];

export function PaymentMethodsScreen({ onBack, onSelect, selected }: { onBack: () => void; onSelect: (method: string) => void; selected: string }) {
  return <AppShell eyebrow="Checkout" testID="payment-methods-screen" title="Payment methods"><Pressable accessibilityRole="button" className="mt-1 flex-row items-center gap-2 self-start" onPress={onBack}><Ionicons color={colors.accent} name="arrow-back" size={18} /><Text className="font-bold text-primary">Review</Text></Pressable><Text className="mt-5 text-base leading-6 text-muted">Choose how you would pay when the venue enables that rail. Selection does not initiate a charge.</Text><View className="mt-6 gap-3">{METHODS.map((method) => <Pressable accessibilityRole="radio" accessibilityState={{ selected: selected === method.id }} className={`min-h-20 flex-row items-center rounded-[22px] border p-4 ${selected === method.id ? 'border-primary bg-primary/10' : 'border-base-300 bg-base-200'}`} key={method.id} onPress={() => onSelect(method.id)} testID={`payment-${method.id.toLowerCase().replace(/ /g, '-')}`}><View className="h-12 w-12 items-center justify-center rounded-2xl bg-base-300"><Ionicons color={colors.accent} name={method.icon} size={24} /></View><View className="ml-4 flex-1"><Text className="text-lg font-extrabold text-base-content">{method.id}</Text><Text className="mt-1 text-sm text-muted">{method.detail}</Text></View><Ionicons color={selected === method.id ? colors.primary : colors.radioMuted} name={selected === method.id ? 'radio-button-on' : 'radio-button-off'} size={24} /></Pressable>)}</View></AppShell>;
}

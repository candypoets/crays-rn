import { router } from 'expo-router';

import { AccountRecoveryScreen } from '@/screens/onboarding/AccountRecoveryScreen';

export default function AccountRecoveryRoute() {
  return <AccountRecoveryScreen onBack={() => router.back()} />;
}

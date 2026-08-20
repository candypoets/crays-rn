import { router } from 'expo-router';

import { ColdWelcomeScreen } from '@/screens/onboarding/ColdWelcomeScreen';

export default function WelcomeRoute() {
  return (
    <ColdWelcomeScreen
      onCreateAccount={() => router.push('/profile')}
      onLogIn={() => router.push('/login')}
    />
  );
}

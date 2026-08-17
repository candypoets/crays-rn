import { router, useLocalSearchParams } from 'expo-router';

import { PaymentMethodsScreen } from '@/screens/commerce/PaymentMethodsScreen';

export default function PaymentMethodsRoute() {
  const { selected = 'Choose a method', returnTo } = useLocalSearchParams<{ selected?: string; returnTo?: string }>();
  const pathname = returnTo === 'gift-review' ? '/gift-review' : '/review-pay';
  return <PaymentMethodsScreen onBack={() => router.back()} onSelect={(method) => router.dismissTo({ pathname: pathname as never, params: { method } })} selected={selected} />;
}

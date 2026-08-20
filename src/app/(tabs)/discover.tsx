import { Redirect, useLocalSearchParams } from 'expo-router';

export default function DiscoverRoute() {
  const params = useLocalSearchParams<{ relay?: string; room?: string; nearby?: string }>();
  return <Redirect href={{ pathname: '/room', params } as never} />;
}

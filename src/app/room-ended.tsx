import { Redirect } from 'expo-router';

/** Compatibility route: settled room state now lives inside the Tonight tab. */
export default function RoomEndedRoute() {
  return <Redirect href="/room" />;
}

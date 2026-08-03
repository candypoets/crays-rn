import { Platform } from 'react-native';

export const DEV_TEST_ROOM_ID = process.env.EXPO_PUBLIC_CRAYS_TEST_ROOM_ID || 'crays-test-room';

export const DEV_TEST_RELAY_URL = process.env.EXPO_PUBLIC_CRAYS_TEST_RELAY_URL || Platform.select({
  android: 'ws://10.0.2.2:8787',
  default: 'ws://127.0.0.1:8787',
}) || 'ws://127.0.0.1:8787';

export const DEV_TEST_ROOM_INVITE_URL = process.env.EXPO_PUBLIC_CRAYS_TEST_ROOM_INVITE_URL
  || `${DEV_TEST_RELAY_URL.replace(/^ws/, 'http').replace(/\/$/, '')}/invite`;

import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Linking } from 'react-native';

import {
  cancelPendingSignerConnection,
  connectNip46Signer,
  importNostrSecret,
} from '@/account/account';
import {
  createBunkerConnection,
  createNostrConnectRequest,
  type NostrConnectRequest,
} from '@/account/nostrConnect';
import { NOSTR_CONNECT_RELAYS } from '@/config/nostrConnect';
import { AccountRecoveryScreen } from '@/screens/onboarding/AccountRecoveryScreen';

export default function AccountRecoveryRoute() {
  const params = useLocalSearchParams<{ resume?: string }>();
  const [connecting, setConnecting] = useState(false);
  const [connection, setConnection] = useState<NostrConnectRequest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);

  const cancelConnection = () => {
    const controller = controllerRef.current;
    controller?.abort();
    controllerRef.current = null;
    if (controller) cancelPendingSignerConnection();
    setConnecting(false);
    setConnection(null);
    setError(null);
  };

  useEffect(() => () => {
    controllerRef.current?.abort();
    if (controllerRef.current) cancelPendingSignerConnection();
  }, []);

  const finishConnection = async (request: NostrConnectRequest, controller: AbortController) => {
    if (controller.signal.aborted) return;
    setConnection(request);
    setConnecting(true);
    setError(null);
    try {
      await connectNip46Signer({ ...request, signal: controller.signal });
      if (controller.signal.aborted) return;
      controllerRef.current = null;
      router.replace({ pathname: '/profile', params: { resume: params.resume } });
    } catch (cause) {
      if (!controller.signal.aborted) {
        setError(cause instanceof Error ? cause.message : 'The signer could not be connected.');
      }
    } finally {
      if (controllerRef.current === controller) controllerRef.current = null;
      if (!controller.signal.aborted) setConnecting(false);
    }
  };

  const beginConnect = async () => {
    cancelConnection();
    const controller = new AbortController();
    controllerRef.current = controller;
    setConnecting(true);
    try {
      const request = await createNostrConnectRequest('Crays', NOSTR_CONNECT_RELAYS);
      void finishConnection(request, controller);
    } catch (cause) {
      if (controller.signal.aborted) return;
      setError(cause instanceof Error ? cause.message : 'Crays could not prepare the signer connection.');
      setConnecting(false);
      if (controllerRef.current === controller) controllerRef.current = null;
    }
  };

  const connectBunker = async (input: string) => {
    cancelConnection();
    const controller = new AbortController();
    controllerRef.current = controller;
    setConnecting(true);
    try {
      const request = await createBunkerConnection(input);
      void finishConnection(request, controller);
    } catch (cause) {
      if (controller.signal.aborted) return;
      setError(cause instanceof Error ? cause.message : 'The bunker link could not be used.');
      setConnecting(false);
      if (controllerRef.current === controller) controllerRef.current = null;
    }
  };

  const importSecret = async (nsec: string) => {
    setImporting(true);
    setError(null);
    try {
      await importNostrSecret(nsec);
      router.replace({ pathname: '/profile', params: { resume: params.resume } });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The secret key could not be imported.');
    } finally {
      setImporting(false);
    }
  };

  const openSigner = async () => {
    if (!connection) return;
    try {
      await Linking.openURL(connection.url);
    } catch {
      setError('No signer app opened this request. Scan the QR code or paste a bunker link instead.');
    }
  };

  return (
    <AccountRecoveryScreen
      connecting={connecting}
      connectionUrl={connection?.url}
      error={error}
      importing={importing}
      onBack={() => router.back()}
      onBeginConnect={() => void beginConnect()}
      onCancelConnection={cancelConnection}
      onConnectBunker={(url) => void connectBunker(url)}
      onImportSecret={(nsec) => void importSecret(nsec)}
      onOpenSigner={() => void openSigner()}
    />
  );
}

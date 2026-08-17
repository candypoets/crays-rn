// THESIS: Existing Nostr users see signer custody first and raw-key custody only on request.
// OWNED WORLD: The Night Playlist backstage becomes a quiet handoff between two devices.
// STORY: Choose the safer signer path → approve outside Crays → confirm the room-facing profile.
// FIRST VIEWPORT: Identity promise, recommended signer action, then one subdued advanced route.
// FORM: One progressive surface with method, signer-waiting, and secret-import states.
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import {
  BackButton,
  BrandMark,
  ErrorBanner,
  OnboardingShell,
  PrimaryButton,
  TextAction,
} from '@/components/onboarding/OnboardingPrimitives';
import { colors } from '@/theme/colors';

type LoginMethod = 'connect' | 'import' | 'methods';

type AccountRecoveryScreenProps = {
  connecting?: boolean;
  connectionUrl?: string | null;
  error?: string | null;
  importing?: boolean;
  onBack: () => void;
  onBeginConnect: () => void;
  onCancelConnection: () => void;
  onConnectBunker: (url: string) => void;
  onImportSecret: (nsec: string) => void;
  onOpenSigner: () => void;
};

function MethodRow({
  body,
  icon,
  label,
  onPress,
  recommended = false,
  testID,
}: {
  body: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  recommended?: boolean;
  testID: string;
}) {
  return (
    <Pressable
      accessibilityHint={body}
      accessibilityRole="button"
      className="min-h-20 flex-row items-center border-b border-edge px-4 py-4 last:border-b-0 active:bg-surface-soft"
      onPress={onPress}
      testID={testID}
    >
      <View className="h-12 w-12 items-center justify-center rounded-2xl bg-surface-soft">
        <Ionicons color={colors.ink} name={icon} size={24} />
      </View>
      <View className="ml-4 min-w-0 flex-1">
        <View className="flex-row flex-wrap items-center gap-2">
          <Text className="text-base font-extrabold text-base-content">{label}</Text>
          {recommended ? (
            <View className="rounded-full bg-primary/10 px-2.5 py-1">
              <Text className="text-xs font-extrabold text-primary">Recommended</Text>
            </View>
          ) : null}
        </View>
        <Text className="mt-1 text-sm leading-5 text-muted">{body}</Text>
      </View>
      <Ionicons color={colors.inkMuted} name="chevron-forward" size={20} />
    </Pressable>
  );
}

export function AccountRecoveryScreen({
  connecting = false,
  connectionUrl,
  error,
  importing = false,
  onBack,
  onBeginConnect,
  onCancelConnection,
  onConnectBunker,
  onImportSecret,
  onOpenSigner,
}: AccountRecoveryScreenProps) {
  const [method, setMethod] = useState<LoginMethod>('methods');
  const [bunkerUrl, setBunkerUrl] = useState('');
  const [secret, setSecret] = useState('');

  const returnToMethods = () => {
    if (method === 'connect') onCancelConnection();
    setBunkerUrl('');
    setSecret('');
    setMethod('methods');
  };
  const handleBack = method === 'methods' ? onBack : returnToMethods;

  return (
    <OnboardingShell keyboard testID="account-recovery-screen">
      <View className="flex-row items-start justify-between">
        <BackButton onPress={handleBack} />
        <BrandMark size={40} />
      </View>

      {method === 'methods' ? (
        <>
          <View accessibilityElementsHidden className="mt-4 h-20 w-20 items-center justify-center rounded-full bg-surface-soft" importantForAccessibility="no-hide-descendants">
            <Ionicons color={colors.ink} name="key-outline" size={32} />
          </View>
          <Text accessibilityRole="header" className="mt-6 text-[36px] font-extrabold leading-[40px] tracking-[-1px] text-base-content">
            Use your Nostr identity
          </Text>
          <Text className="mt-3 text-lg leading-7 text-muted">
            There is no Crays password. Connect the signer you already use, then choose what rooms call you.
          </Text>
          <View className="mt-7 overflow-hidden rounded-2xl border border-edge bg-surface">
            <MethodRow
              body="Your signer keeps the secret key and approves Crays requests."
              icon="phone-portrait-outline"
              label="Connect a signer"
              onPress={() => {
                setMethod('connect');
                onBeginConnect();
              }}
              recommended
              testID="nostr-connect-method"
            />
            <MethodRow
              body="Store an existing nsec key in this device’s protected storage."
              icon="download-outline"
              label="Import a secret key"
              onPress={() => setMethod('import')}
              testID="secret-import-method"
            />
          </View>
          <View className="mt-5 flex-row items-start gap-3 rounded-2xl bg-surface-soft p-4">
            <Ionicons color={colors.ink} name="shield-checkmark-outline" size={20} />
            <Text className="flex-1 text-sm leading-5 text-ink-muted">
              Crays never asks a connected signer for your secret key. This setup will not run if an identity is already stored here.
            </Text>
          </View>
        </>
      ) : method === 'connect' ? (
        <>
          <Text accessibilityRole="header" className="mt-4 text-[36px] font-extrabold leading-[40px] tracking-[-1px] text-base-content">
            Connect your signer
          </Text>
          <Text className="mt-3 text-lg leading-7 text-muted">
            Open this request in your signer app, or scan it from another device. Approve the connection there.
          </Text>
          <View className="mt-6"><ErrorBanner message={error} /></View>
          <View
            accessibilityLabel={connectionUrl ? 'Nostr Connect QR code ready to scan' : 'Preparing Nostr Connect QR code'}
            accessible
            className="min-h-64 items-center justify-center rounded-2xl bg-surface p-6"
            testID="nostr-connect-qr"
          >
            {connectionUrl ? <QRCode backgroundColor={colors.surface} color={colors.ink} quietZone={8} size={212} value={connectionUrl} /> : <ActivityIndicator color={colors.primary} size="large" />}
          </View>
          <View className="mt-5">
            <PrimaryButton
              disabled={!connectionUrl}
              icon={<Ionicons color={colors.paper} name="open-outline" size={21} />}
              label="Open signer app"
              onPress={onOpenSigner}
              testID="open-signer-button"
            />
          </View>
          <View accessibilityLiveRegion="polite" className="mt-4 flex-row items-center justify-center gap-2">
            {connecting ? <ActivityIndicator color={colors.primary} size="small" /> : null}
            <Text className="text-center text-sm font-semibold text-muted">
              {connecting ? 'Waiting for approval in your signer…' : 'Connection paused. Try the request again.'}
            </Text>
          </View>

          <View className="mt-8 border-t border-edge pt-6">
            <Text className="text-base font-extrabold text-base-content">Already have a bunker link?</Text>
            <Text className="mt-1 text-sm leading-5 text-muted">Paste the bunker:// link supplied by your signer.</Text>
            <View className="mt-3 rounded-2xl border border-edge bg-surface px-4">
              <TextInput
                accessibilityLabel="Bunker connection link"
                autoCapitalize="none"
                autoCorrect={false}
                className="min-h-14 text-base text-base-content"
                onChangeText={setBunkerUrl}
                placeholder="bunker://…"
                placeholderTextColor={colors.placeholder}
                testID="bunker-url-input"
                value={bunkerUrl}
              />
            </View>
            <TextAction
              label="Connect bunker link"
              onPress={() => onConnectBunker(bunkerUrl.trim())}
              testID="connect-bunker-button"
            />
          </View>
        </>
      ) : (
        <>
          <Text accessibilityRole="header" className="mt-4 text-[36px] font-extrabold leading-[40px] tracking-[-1px] text-base-content">
            Import a secret key
          </Text>
          <Text className="mt-3 text-lg leading-7 text-muted">
            Use this only when you cannot connect a signer. Your nsec will be protected on this device and used to sign here.
          </Text>
          <View className="mt-6"><ErrorBanner message={error} /></View>
          <Text className="mt-2 text-xs font-bold uppercase tracking-[2px] text-muted">Nostr secret key</Text>
          <View className="mt-2 rounded-2xl border border-edge bg-surface px-4">
            <TextInput
              accessibilityLabel="Nostr secret key"
              autoCapitalize="none"
              autoCorrect={false}
              className="min-h-14 text-base text-base-content"
              editable={!importing}
              onChangeText={setSecret}
              placeholder="nsec1…"
              placeholderTextColor={colors.placeholder}
              secureTextEntry
              testID="nsec-input"
              value={secret}
            />
          </View>
          <View className="mt-4 flex-row items-start gap-3 rounded-2xl bg-surface-soft p-4">
            <Ionicons color={colors.ink} name="warning-outline" size={20} />
            <Text className="flex-1 text-sm leading-5 text-ink-muted">
              Never paste this key into a message or room. Crays will not display it again.
            </Text>
          </View>
          <View className="mt-auto pt-8">
            <PrimaryButton
              disabled={!secret.trim()}
              label="Import and continue"
              loading={importing}
              loadingLabel="Importing securely…"
              onPress={() => {
                const value = secret.trim();
                setSecret('');
                onImportSecret(value);
              }}
              testID="import-secret-button"
            />
          </View>
        </>
      )}
    </OnboardingShell>
  );
}

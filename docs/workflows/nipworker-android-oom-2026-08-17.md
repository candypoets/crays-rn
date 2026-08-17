# nipworker Android callback OOM — 2026-08-17

Status: handed to the nipworker coordinator for upstream triage.

## Impact and scope

The crash blocks the Crays Android Maestro scenario before it can exercise the
room cold-resume assertions. It is separate from the Test Room empty-state bug:
independent Nostr queries confirmed that the hosted room had data, and the app
bug was traced to retaining nipworker's asynchronous restored-signer callback
before the protected relay lease. This incident concerns the separate native
`nipworker` event-data callback crash during app startup.

## Environment

- Crays commit: `0ff95759a2311cf021a2f90c76461edd63218cd8`, with the
  uncommitted Test Room fix present
- Expo `~57.0.8`
- React Native `0.86.2`
- `@candypoets/nipworker` installed and built at `0.99.6`
- Android development client, debug build
- React Native new architecture enabled; Hermes enabled
- Android 34 Google APIs x86_64 AVD named `google`
- Node `v22.12.0`; OpenJDK 17.0.18

The Android Gradle build completed successfully. The failure occurs at runtime,
after Metro serves the app and before the Maestro flow reaches the room join
screen.

## Reproduction

From `/root/code/crays-rn`:

1. Install the lockfile dependency state with `npm install --ignore-scripts`.
2. Build the development client with `cd android && ./gradlew app:assembleDebug`.
3. Install the APK on the Android 34 x86_64 `google` AVD.
4. Start Metro with `npm run start:maestro -- --clear` and reverse port 8085.
5. Run `scenario:01-people`.
6. Observe the Expo development-client error before `join-privacy-screen` is
   rendered.

This occurred on repeated clean scenario attempts. The scenario teardown and
reserved-relay cleanup still completed successfully.

## Observed failure

Several native callback threads fail in a burst with:

```text
java.lang.OutOfMemoryError: bad_array_new_length
  at com.facebook.react.bridge.CxxCallbackImpl.nativeInvoke(Native Method)
  at com.facebook.react.bridge.CxxCallbackImpl.invoke(CxxCallbackImpl.kt:18)
  at com.candypoets.nipworker.reactnative.NativeNipworkerReactNativeSpec.emitOnData(...:38)
  at com.candypoets.nipworker.reactnative.NipworkerReactNativeModule.emitData(...:512)
  at com.candypoets.nipworker.reactnative.NipworkerReactNativeModule.emitRuntimeData(...:496)
  at com.candypoets.nipworker.reactnative.NipworkerReactNativeModule.ensureRuntimeListener$lambda$1(...:405)
  at com.candypoets.nipworker.reactnative.NipworkerRuntime.dispatch(...:214)
  at com.candypoets.nipworker.reactnative.NipworkerReactNativeModule$Companion.onNativeData(...:276)
```

The `bad_array_new_length` message may represent an invalid/corrupted size at
the React Native boundary rather than ordinary heap exhaustion. That is a
triage hypothesis, not a confirmed cause.

## Retained evidence

- Crash report:
  `/root/.maestro/tests/2026-08-17_131023/01-people/logs/crash-report.txt`
- Full device logcat:
  `/root/.maestro/tests/2026-08-17_131023/01-people/logs/device-logcat.txt`
- Error-screen capture:
  `/root/.maestro/tests/2026-08-17_131023/01-people/screenshots/step-013-assertCondition-join-privacy-screen.png`
- Maestro command trace:
  `/root/.maestro/tests/2026-08-17_131023/01-people/commands.json`

The first retained OOM begins near line 1345 of `device-logcat.txt`; more
failures from the same callback path occur on Threads 9–14.

## Suggested upstream checks

1. Reproduce with the React Native new architecture and Hermes on Android 34
   x86_64, then compare `nipworker` 0.99.6 with the current release.
2. Audit the native buffer length, lifetime, and ownership passed through
   `emitRuntimeData` and `emitOnData`.
3. Check whether callbacks can enter the React event emitter concurrently from
   multiple native runtime threads.
4. Add an Android startup/stress regression that exercises a burst of runtime
   messages through the React Native consumer boundary.

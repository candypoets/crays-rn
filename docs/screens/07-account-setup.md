# Screen 07 — Create Crays ID

The second and final first-run screen asks **What should people here call you?** Display name is required (2–50 normalized characters). Optional interest chips are local, reversible UI hints and are not published. The protected-device note states what the action creates. **Create ID and continue** is disabled for invalid input and busy while native identity creation, signed kind-0 profile storage, and onboarding completion run in sequence.

Failure preserves the name/chips and names the recovery action; it never silently replaces a partial identity. Success resumes the saved entry context or replaces with Tonight. The screen exposes “Identity step 2 of 2” because Welcome is the first explicit identity decision and this is the final setup step. Unit tests cover invalid/ready/loading/error, normalization, chips, action, and accessibility. Native journey coverage verifies one device-held identity and signed profile.

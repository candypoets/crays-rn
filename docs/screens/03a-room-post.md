# 03a — Room post composer

## Entry and purpose

Enter as a modal from **Post to this room** for a root note or **Reply** for a selected kind-1 note. The active room must still exist; otherwise the route returns to Discover. A reply target must still be present in the active room projection. Missing or expired targets produce a blocking explanation and Close, never a silently converted root post.

## Interaction and navigation

The header names **New post** or **Reply**, the exact room, Close, and one Post action. The modal shows the room audience/expiry consequence before the editor. Reply mode shows the selected author and a three-line parent preview. The plain-text draft is limited to 500 characters and remains in component state across selection, upload, relay rejection, and timeout. Successful relay acknowledgement dismisses exactly this modal back to the existing feed or thread stack entry.

**Add photos** first explains that selection is local and upload happens only after Post. It requests media-library permission from that user action, accepts up to four images, shows removable previews, and permits an image-only post. Permission denial, picker failure, missing local files, explicitly unsupported MIME, files over 10 MB, Blossom rejection, signer timeout, and relay rejection all keep the draft and selected previews available for correction or retry. A picker asset without MIME metadata uses its recognized extension or a binary fallback. Close is disabled while upload/publish outcome is uncertain; system dismissal cancels the operation so a completed background upload cannot later publish.

## Relay and Blossom behavior

Root notes use `roomFeedTemplate`; replies use preferred marked NIP-10 through `roomReplyTemplate`. Both are kind 1 with `h=<room id>`, `client=life.crays`, and NIP-40 expiration equal to the automatic-leave boundary. Direct replies carry one root marker. Nested replies carry ordered root and reply markers and deduplicated participant `p` tags. Success occurs after the pinned room relay returns one true acknowledgement; false status and 12-second timeout return the modal to idle without clearing content.

Photos upload sequentially to `https://blossom.nuts.cash` by default, avoiding concurrent remote-signer prompts. Each selected image is read only after Post, limited before upload, SHA-256 hashed, and authorized with a signed BUD-11 kind-24242 event scoped by `t=upload`, `x=<hash>`, and one-hour expiration. The room lease is checked again after uploads and before relay publication. The binary PUT uses `/upload`, its MIME type or safe fallback, and `X-SHA-256`. The resulting HTTPS URL is appended to note content and represented by a NIP-94 `imeta` tag carrying URL, MIME, dimensions, hash, and alt fallback. No generic Crays API stores the photo.

## States and accessibility

- idle empty/typed/image-only/reply; selecting; permission denied; selected one-to-four;
- uploading, publishing, confirmed dismiss, upload failure, relay rejection, timeout, expired room, and missing reply target;
- Post announces disabled/busy state and cannot double-submit; editor and removal controls lock while pending;
- controls are at least 48dp, previews have labels, errors are alerts, text scales/reflows, and keyboard avoidance preserves the editor and primary action.

## QA

`RoomPostScreen.test.tsx` covers root/reply, empty, image-only, attachment removal, all busy phases, missing target, retained error draft, and the 500-character boundary. `blossom.test.ts` covers BUD-11 construction, native file hashing/upload request shape, metadata projection, missing-MIME fallback, and failure classes. `protocol.test.ts` covers media, direct reply, and nested reply event construction. The registered `scenario:03-room-feed` owns modal navigation, the Android system picker boundary, a signed upload against the isolated Blossom adapter, and real signed root/reply/image relay writes. Its independent verifier validates the kind-24242 authorization, the app's subsequent blob fetch, and the resulting kind-1 `imeta` hash.

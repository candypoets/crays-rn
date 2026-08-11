# Night Playlist screen index

This is the implementation inventory derived from `src/app/`, `src/screens/`,
and `docs/screens/`. Routes that are only guards or QA utilities are listed at
the bottom and do not need a visual mockup.

| Route / screen | Source component | Night Playlist brief | Mockup |
| --- | --- | --- | --- |
| `/` entry router | `src/app/index.tsx` | [entry-router.md](screens/entry-router.md) | Entry board |
| `/welcome` cold welcome | `ColdWelcomeScreen` | [06-cold-welcome.md](screens/06-cold-welcome.md) | Entry · 01 |
| `/account-access` | `AccountAccessScreen` | [06b-account-access.md](screens/06b-account-access.md) | Entry · 02 |
| `/profile` account setup | `ProfileSetupScreen` | [07-account-setup.md](screens/07-account-setup.md) | Entry · 03 |
| `/recovery` account recovery | `RecoveryScreen` | [07b-account-recovery.md](screens/07b-account-recovery.md) | Entry · 08 |
| `/login` returning login | `LoginScreen` | [09-returning-login.md](screens/09-returning-login.md) | Entry · 08 |
| `/account-recovery` unavailable recovery | inline route state | [account-recovery.md](screens/account-recovery.md) | Entry · 08 variant |
| `/invite` invite preview | `InvitePreviewScreen` | [08-invite-preview.md](screens/08-invite-preview.md) | Entry · 04 |
| `/invite-accepted` invite accepted | `InviteAcceptedScreen` | [08b-invite-accepted.md](screens/08b-invite-accepted.md) | Entry · 04 variant |
| `/discover` Discover rooms | `DiscoverHandoffScreen` | [27-discover.md](screens/27-discover.md) | Discovery · 01 |
| `/bluetooth-rationale` | `BluetoothRationaleScreen` | [10b-bluetooth-rationale.md](screens/10b-bluetooth-rationale.md) | Discovery · 02 |
| `/room-preview` | `RoomPreviewScreen` | [10-room-preview.md](screens/10-room-preview.md) | Discovery · 03 |
| `/join-room` | `JoinPrivacyScreen` | [11-join-privacy.md](screens/11-join-privacy.md) | Discovery · 04 |
| `/switch-room` | `SwitchRoomScreen` | [28-switch-room.md](screens/28-switch-room.md) | Discovery · 05 |
| `/event` | `EventScreen` | [20-room-event.md](screens/20-room-event.md) | Discovery · 06 |
| `/room` People | `RoomScreen` | [01-people.md](screens/01-people.md) | Room · 02 |
| `/room` Room feed | `RoomScreen` | [03-room-feed.md](screens/03-room-feed.md) | Room · 03 |
| `/person` person card | `FirstContactScreen` | [02-first-contact.md](screens/02-first-contact.md) | Room · 04 |
| `/messages` Messages tab | `MessagesScreen` | [messages.md](screens/messages.md) | Commerce · 06 variant |
| `/menu` room menu | `MenuScreen` | [12-menu.md](screens/12-menu.md) | Commerce · 01 |
| `/item` item detail | `ItemScreen` | [13-item.md](screens/13-item.md) | Commerce · 02 |
| `/review-pay` review and pay | `ReviewPayScreen` | [14-review-pay.md](screens/14-review-pay.md) | Commerce · 03 |
| `/payment-methods` | `PaymentMethodsScreen` | [24-payment-methods.md](screens/24-payment-methods.md) | Commerce · 04 |
| `/message-request` | `MessageRequestScreen` | [22-message-request.md](screens/22-message-request.md) | Commerce · 05 |
| `/conversation` | `ConversationScreen` | [messages.md](screens/messages.md) | Commerce · 06 |
| `/gift-select` | `GiftSelectScreen` | [04-gift-select.md](screens/04-gift-select.md) | Commerce · 07 |
| `/gift-review` | `GiftReviewScreen` | [23-gift-review.md](screens/23-gift-review.md) | Commerce · 07 |
| `/order` | `OrderDetailScreen` | [15-order-detail.md](screens/15-order-detail.md) | Commerce · 08 |
| `/my-night` | `MyNightScreen` | [05-my-night.md](screens/05-my-night.md) | Durable · 02 |
| `/me` | `MeScreen` | [16-me.md](screens/16-me.md) | Durable · 01 |
| `/orders` | `OrdersScreen` | [17-orders.md](screens/17-orders.md) | Durable · 03 |
| `/tickets` | `TicketsScreen` | [20b-tickets.md](screens/20b-tickets.md) | Durable · 04 |
| `/ticket` | `TicketDetailScreen` | [20c-ticket-detail.md](screens/20c-ticket-detail.md) | Durable · 04 |
| `/memberships` | `MembershipsScreen` | [memberships.md](screens/memberships.md) | Durable · 05 |
| `/membership-offer` | `MembershipOfferScreen` | [18-membership-offer.md](screens/18-membership-offer.md) | Durable · 05 |
| `/membership-detail` | `MembershipDetailScreen` | [19-membership-detail.md](screens/19-membership-detail.md) | Durable · 05 |
| `/wallet` | `WalletScreen` | [25-wallet.md](screens/25-wallet.md) | Durable · 06 |
| `/add-funds` | `AddFundsScreen` | [26-add-funds.md](screens/26-add-funds.md) | Durable · 06 |
| `/settings` | `SettingsScreen` | [settings.md](screens/settings.md) | Durable · 08 |
| `/leave-room` | `LeaveRoomScreen` | [leave-room.md](screens/leave-room.md) | Durable · 07 |
| `/room-ended` | `RoomEndedScreen` | [21-room-ended.md](screens/21-room-ended.md) | Durable · 07 |
| primary tabs | `src/app/(tabs)/_layout.tsx` | [primary-tabs.md](screens/primary-tabs.md) | All boards |
| runtime foundation | `FoundationScreen` | [00-foundation.md](screens/00-foundation.md) | Entry family |

`/account-recovery` is a small unavailable-provider state owned by the login
flow and `/qa-seed` is test-only; neither needs a separate visual concept.

# Messages and conversation

Messages is durable and reachable with or without an active room. Each portrait-led archive row shows the exact person, latest text, originating room, a real local timestamp (time today, short date otherwise), and textual request state. Empty and relay-error states may coexist because cached conversations remain readable. A row opens the exact retained conversation.

Outgoing requests show Waiting and cannot accept or send again. Incoming requests expose Accept and Not now. Accepted threads expose ordered messages and a 2,000-character reply field. Block and venue Report remain labelled. Missing records render not-found rather than substituting another thread. Large text reflows; rows and controls meet 48dp; errors are announced.

The existing nipworker owners subscribe to inbound/outbound kind-4 filters with relay-scoped stable IDs, narrow before reading decrypted content, and persist only minimal confirmed projections. Any intended relay `OK` settles publishing; failed/false/error and timeout preserve action state; unmount stops handles. Unit tests cover archive empty/error/open/timestamp/waiting and conversation consent, safety, reply, ignored, blocked, and pending states. Registered journeys decrypt and verify the real acceptance/reply chain and venue report independently.

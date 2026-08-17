#!/usr/bin/env node
// Complement to maestro/flows/11c-join-relay-unavailable.yaml: against a dead
// relay the app must not consume a room definition, record room access, or project
// any room data for the unavailable room. Assertions are scoped to ROOM_ID:
// in __DEV__ the Discover tab legitimately consumes the development Test Room
// definition (when one is running on the host), which is out of scope here.
// (Logcat was cleared by the scenario runner before the flow.)
import { execFileSync } from 'node:child_process';
import { assert } from './relay-lib.mjs';

const roomId = process.env.ROOM_ID;
assert(roomId, 'ROOM_ID env is required so absence checks are scoped to the unavailable room');
const logcat = execFileSync('adb', ['logcat', '-d'], { maxBuffer: 64 * 1024 * 1024 }).toString();
const roomLines = (marker) => logcat.split('\n').filter((line) => line.includes(marker) && line.includes(roomId));
assert(roomLines('[crays-room-definition]').length === 0, 'app never consumed a room definition from the unavailable relay');
assert(roomLines('[crays-room-access-granted]').length === 0, 'app never recorded room access for the unavailable relay');
assert(!logcat.includes('[crays-room-data]'), 'app projected no room data from the unavailable relay');
console.log('CRAYS JOIN UNAVAILABLE VERIFY PASS');

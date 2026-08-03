#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';

const pidPath = process.env.CRAYS_TEST_ROOM_PID || '/tmp/crays-manual-test-room.pid';
if (!existsSync(pidPath)) {
  console.log('Crays Test Room is not running.');
  process.exit(0);
}
const pid = Number(readFileSync(pidPath, 'utf8').trim());
if (!Number.isInteger(pid) || pid < 2) throw new Error(`invalid Test Room PID in ${pidPath}`);
try {
  process.kill(pid, 'SIGTERM');
  console.log(`Stopping Crays Test Room process ${pid}.`);
} catch (error) {
  if (error.code !== 'ESRCH') throw error;
  console.log('Crays Test Room process was already stopped.');
}

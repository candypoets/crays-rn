export function roomInviteContent(roomName: string, relayUrl: string, roomId: string) {
  const url = `crays:///join-room?relay=${encodeURIComponent(relayUrl)}&room=${encodeURIComponent(roomId)}`;
  return {
    message: `Join me in ${roomName} on Crays: ${url}`,
    url,
  };
}

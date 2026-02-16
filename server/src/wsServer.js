import { WebSocketServer } from 'ws';
import { setupWSConnection, setPersistence } from 'y-websocket/bin/utils';
import { getPersistence } from './persistence.js';
import { verifyToken } from './auth.js';

const wss = new WebSocketServer({ noServer: true });

// Set up persistence if database is available
const persistence = getPersistence();
if (persistence) {
  setPersistence(persistence);
  console.log('Yjs persistence enabled');
}

wss.on('connection', (ws, req, { docName }) => {
  setupWSConnection(ws, req, { docName });
});

// Room cleanup timeouts
const roomCleanupTimers = new Map();

export async function handleUpgrade(req, socket, head) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const match = url.pathname.match(/^\/ws\/(.+)$/);

  if (!match) {
    socket.destroy();
    return;
  }

  const boardId = match[1];

  // Verify auth token if Clerk is configured
  if (process.env.CLERK_SECRET_KEY) {
    const token = url.searchParams.get('token');
    const decoded = await verifyToken(token);
    if (!decoded) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }
  }

  // Cancel cleanup timer if someone reconnects
  if (roomCleanupTimers.has(boardId)) {
    clearTimeout(roomCleanupTimers.get(boardId));
    roomCleanupTimers.delete(boardId);
  }

  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit('connection', ws, req, { docName: boardId });
  });
}

export { wss };

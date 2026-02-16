const CURSOR_PALETTE = [
  '#e74c3c', '#3498db', '#2ecc71', '#9b59b6',
  '#e67e22', '#1abc9c', '#e84393', '#00b894',
  '#fdcb6e', '#6c5ce7', '#00cec9', '#d63031',
];

const SEND_INTERVAL = 1000 / 15; // 15Hz
const LERP_FACTOR = 0.15;

export class CursorManager {
  constructor(awareness, localUser = {}) {
    this.awareness = awareness;
    this.localUser = localUser;
    this.remoteCursors = new Map();
    this.lastSendTime = 0;

    // Set local user info
    awareness.setLocalStateField('user', {
      name: localUser.name || 'Anonymous',
      color: CURSOR_PALETTE[awareness.clientID % CURSOR_PALETTE.length],
    });

    // Listen for awareness changes
    this._onAwarenessChange = this._onAwarenessChange.bind(this);
    awareness.on('change', this._onAwarenessChange);
  }

  sendCursor(wx, wy) {
    const now = Date.now();
    if (now - this.lastSendTime < SEND_INTERVAL) return;
    this.lastSendTime = now;
    this.awareness.setLocalStateField('cursor', { x: wx, y: wy });
  }

  getCursors() {
    const result = [];
    const now = Date.now();
    for (const [clientId, cursor] of this.remoteCursors) {
      // Lerp toward target
      cursor.currentX += (cursor.targetX - cursor.currentX) * LERP_FACTOR;
      cursor.currentY += (cursor.targetY - cursor.currentY) * LERP_FACTOR;
      // Remove stale cursors (5s timeout)
      if (now - cursor.lastUpdate > 5000) continue;
      result.push({
        x: cursor.currentX,
        y: cursor.currentY,
        name: cursor.name,
        color: cursor.color,
        clientId,
      });
    }
    return result;
  }

  _onAwarenessChange() {
    const states = this.awareness.getStates();
    const localClientId = this.awareness.clientID;

    // Remove clients that left
    for (const clientId of this.remoteCursors.keys()) {
      if (!states.has(clientId)) {
        this.remoteCursors.delete(clientId);
      }
    }

    // Update remote cursors
    for (const [clientId, state] of states) {
      if (clientId === localClientId) continue;
      if (!state.cursor) continue;

      const existing = this.remoteCursors.get(clientId);
      const user = state.user || {};
      const color = user.color || CURSOR_PALETTE[clientId % CURSOR_PALETTE.length];

      if (existing) {
        existing.targetX = state.cursor.x;
        existing.targetY = state.cursor.y;
        existing.name = user.name || 'Anonymous';
        existing.color = color;
        existing.lastUpdate = Date.now();
      } else {
        this.remoteCursors.set(clientId, {
          targetX: state.cursor.x,
          targetY: state.cursor.y,
          currentX: state.cursor.x,
          currentY: state.cursor.y,
          name: user.name || 'Anonymous',
          color,
          lastUpdate: Date.now(),
        });
      }
    }
  }

  destroy() {
    this.awareness.off('change', this._onAwarenessChange);
  }
}

import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { ObjectStore } from './ObjectStore.js';

export class BoardManager {
  constructor(boardId, options = {}) {
    this.boardId = boardId;
    this.doc = new Y.Doc();
    this.objectStore = new ObjectStore(this.doc);

    // Determine WebSocket URL
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${location.host}/ws`;

    this.provider = new WebsocketProvider(wsUrl, boardId, this.doc, {
      params: options.token ? { token: options.token } : {},
    });

    this.awareness = this.provider.awareness;
    this.onStatusChange = options.onStatusChange || null;

    this.provider.on('status', ({ status }) => {
      this.onStatusChange?.(status);
    });
  }

  getObjectStore() {
    return this.objectStore;
  }

  getAwareness() {
    return this.awareness;
  }

  getDoc() {
    return this.doc;
  }

  destroy() {
    this.provider.disconnect();
    this.doc.destroy();
  }
}

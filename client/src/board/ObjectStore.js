import { nanoid } from 'nanoid';
import * as Y from 'yjs';

export class ObjectStore {
  constructor(doc) {
    this.doc = doc;
    this.objectsMap = doc.getMap('objects');
    this.zOrder = doc.getArray('zOrder');
  }

  createObject(type, x, y, width, height, extra = {}) {
    const id = nanoid(12);
    const obj = { id, type, x, y, width, height, text: '', color: type === 'sticky' ? 'yellow' : '#4361ee', ...extra };

    this.doc.transact(() => {
      const yObj = new Y.Map();
      for (const [key, val] of Object.entries(obj)) {
        yObj.set(key, val);
      }
      this.objectsMap.set(id, yObj);
      this.zOrder.push([id]);
    });

    return obj;
  }

  moveObject(id, x, y) {
    const yObj = this.objectsMap.get(id);
    if (!yObj) return;
    this.doc.transact(() => {
      yObj.set('x', x);
      yObj.set('y', y);
    });
  }

  resizeObject(id, x, y, width, height) {
    const yObj = this.objectsMap.get(id);
    if (!yObj) return;
    this.doc.transact(() => {
      yObj.set('x', x);
      yObj.set('y', y);
      yObj.set('width', width);
      yObj.set('height', height);
    });
  }

  updateText(id, text) {
    const yObj = this.objectsMap.get(id);
    if (!yObj) return;
    yObj.set('text', text);
  }

  updateColor(id, color) {
    const yObj = this.objectsMap.get(id);
    if (!yObj) return;
    yObj.set('color', color);
  }

  deleteObject(id) {
    this.doc.transact(() => {
      this.objectsMap.delete(id);
      // Remove from zOrder
      for (let i = 0; i < this.zOrder.length; i++) {
        if (this.zOrder.get(i) === id) {
          this.zOrder.delete(i, 1);
          break;
        }
      }
    });
  }

  bringToFront(id) {
    this.doc.transact(() => {
      for (let i = 0; i < this.zOrder.length; i++) {
        if (this.zOrder.get(i) === id) {
          this.zOrder.delete(i, 1);
          this.zOrder.push([id]);
          break;
        }
      }
    });
  }

  getObject(id) {
    const yObj = this.objectsMap.get(id);
    if (!yObj) return null;
    return this._yMapToObj(yObj);
  }

  getAll() {
    const result = [];
    for (let i = 0; i < this.zOrder.length; i++) {
      const id = this.zOrder.get(i);
      const yObj = this.objectsMap.get(id);
      if (yObj) {
        result.push(this._yMapToObj(yObj));
      }
    }
    return result;
  }

  _yMapToObj(yMap) {
    const obj = {};
    yMap.forEach((val, key) => {
      obj[key] = val;
    });
    return obj;
  }
}

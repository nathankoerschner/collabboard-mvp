export class TextEditor {
  constructor(canvasEl, camera, callbacks) {
    this.canvasEl = canvasEl;
    this.camera = camera;
    this.callbacks = callbacks; // { onTextChange }
    this.input = null;
    this.editingId = null;
  }

  startEditing(obj) {
    this.stopEditing();
    this.editingId = obj.id;

    const input = document.createElement('textarea');
    input.className = 'text-editor-overlay';
    input.value = obj.text || '';

    this._positionInput(input, obj);

    input.addEventListener('input', () => {
      this.callbacks.onTextChange?.(this.editingId, input.value);
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.stopEditing();
      }
      if (e.key === 'Escape') {
        this.stopEditing();
      }
    });

    input.addEventListener('blur', () => {
      // Delay to allow click events to process
      setTimeout(() => this.stopEditing(), 100);
    });

    this.canvasEl.parentElement.appendChild(input);
    this.input = input;
    input.focus();
    input.select();
  }

  stopEditing() {
    if (this.input) {
      this.input.remove();
      this.input = null;
      this.editingId = null;
    }
  }

  isEditing() {
    return this.editingId !== null;
  }

  getEditingId() {
    return this.editingId;
  }

  updatePosition(obj) {
    if (this.input && this.editingId === obj.id) {
      this._positionInput(this.input, obj);
    }
  }

  _positionInput(input, obj) {
    const { x: sx, y: sy } = this.camera.worldToScreen(obj.x, obj.y);
    const scale = this.camera.scale;

    input.style.position = 'absolute';
    input.style.left = `${sx + 10 * scale}px`;
    input.style.top = `${sy + 10 * scale}px`;
    input.style.width = `${(obj.width - 20) * scale}px`;
    input.style.height = `${(obj.height - 20) * scale}px`;
    input.style.fontSize = `${14 * scale}px`;
    input.style.lineHeight = `${18 * scale}px`;
    input.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    input.style.border = 'none';
    input.style.outline = 'none';
    input.style.background = 'transparent';
    input.style.resize = 'none';
    input.style.overflow = 'hidden';
    input.style.padding = '0';
    input.style.margin = '0';
    input.style.wordWrap = 'break-word';
    input.style.whiteSpace = 'pre-wrap';
    input.style.zIndex = '10';
    input.style.color = '#1a1a2e';
  }

  destroy() {
    this.stopEditing();
  }
}

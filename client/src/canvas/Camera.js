export class Camera {
  constructor() {
    this.offsetX = 0;
    this.offsetY = 0;
    this.scale = 1;
    this.minScale = 0.1;
    this.maxScale = 5.0;
  }

  applyTransform(ctx) {
    ctx.setTransform(this.scale, 0, 0, this.scale, this.offsetX, this.offsetY);
  }

  screenToWorld(sx, sy) {
    return {
      x: (sx - this.offsetX) / this.scale,
      y: (sy - this.offsetY) / this.scale,
    };
  }

  worldToScreen(wx, wy) {
    return {
      x: wx * this.scale + this.offsetX,
      y: wy * this.scale + this.offsetY,
    };
  }

  pan(dx, dy) {
    this.offsetX += dx;
    this.offsetY += dy;
  }

  zoom(factor, cx, cy) {
    const newScale = Math.min(this.maxScale, Math.max(this.minScale, this.scale * factor));
    const actualFactor = newScale / this.scale;
    this.offsetX = cx - (cx - this.offsetX) * actualFactor;
    this.offsetY = cy - (cy - this.offsetY) * actualFactor;
    this.scale = newScale;
  }
}

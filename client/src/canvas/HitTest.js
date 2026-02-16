const HANDLE_SIZE = 8;

export function pointInRect(px, py, x, y, w, h) {
  return px >= x && px <= x + w && py >= y && py <= y + h;
}

export function hitTestObjects(wx, wy, objects) {
  // Reverse iteration for topmost first
  for (let i = objects.length - 1; i >= 0; i--) {
    const obj = objects[i];
    if (pointInRect(wx, wy, obj.x, obj.y, obj.width, obj.height)) {
      return obj;
    }
  }
  return null;
}

export function hitTestHandle(wx, wy, obj) {
  if (!obj) return null;

  const hs = HANDLE_SIZE / 2; // half-size in world (adjusted by caller's scale if needed)
  const handles = getHandlePositions(obj);

  for (const [name, hx, hy] of handles) {
    if (Math.abs(wx - hx) <= hs * 2 && Math.abs(wy - hy) <= hs * 2) {
      return name;
    }
  }
  return null;
}

export function getHandlePositions(obj) {
  const { x, y, width: w, height: h } = obj;
  return [
    ['nw', x, y],
    ['n', x + w / 2, y],
    ['ne', x + w, y],
    ['e', x + w, y + h / 2],
    ['se', x + w, y + h],
    ['s', x + w / 2, y + h],
    ['sw', x, y + h],
    ['w', x, y + h / 2],
  ];
}

export { HANDLE_SIZE };

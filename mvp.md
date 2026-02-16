# CollabBoard MVP Specification

## Guiding Principle

A simple whiteboard with bulletproof multiplayer beats a feature-rich board with broken sync.

---

## Checklist

- [ ] Infinite board with pan/zoom (zoom limits enforced)
- [ ] Sticky notes with single-line editable text
- [ ] Resizable rectangles
- [ ] Create, move, resize, and delete objects
- [ ] Real-time CRDT sync between 2+ users (up to 10-20 concurrent)
- [ ] Multiplayer cursors with name labels
- [ ] Presence awareness (online user list)
- [ ] User authentication via Clerk
- [ ] Landing page, dashboard, and board views
- [ ] Deployed on Railway and publicly accessible

---

## Architecture

### Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla Canvas 2D API (no framework on the canvas) |
| Sync engine | Yjs (CRDT library) over custom WebSocket server |
| Presence | Yjs Awareness protocol (ephemeral, not persisted) |
| Backend | Node.js with `ws` library |
| Persistence | PostgreSQL (Railway managed) — Yjs doc snapshots stored as binary |
| Auth | Clerk (OAuth/magic link, managed hosted UI) |
| Deployment | Railway or Render |

### Data Model (Yjs Document Structure)

Each board is a single Yjs document containing:

- **`objects`** — `Y.Map<string, Y.Map>`: Keyed by object ID (nanoid). Each value is a `Y.Map` with:
  - `type`: `"sticky"` | `"rectangle"`
  - `x`, `y`: number (position)
  - `width`, `height`: number (dimensions)
  - `text`: string (for sticky notes; single-line plain text)
  - `color`: string (fixed `"#fef08a"` for stickies, configurable later)
  - `createdBy`: string (Clerk user ID)
- **`zOrder`** — `Y.Array<string>`: Array of object IDs defining front-to-back render order. Last element renders on top.

### Persistence Strategy

- Yjs document state is stored in PostgreSQL as binary blobs.
- On each Yjs update, incremental updates are appended to a `board_updates` table.
- Periodically (or on threshold), compact updates into a single snapshot in a `board_snapshots` table.
- On server start / board load, restore from latest snapshot + any subsequent incremental updates.

### Reconnection

- Uses Yjs built-in incremental sync via state vectors.
- On reconnect, only missing updates are exchanged between client and server.
- No full page reload required.

---

## Real-Time Sync

### Cursor Sync

- Cursor positions broadcast via **Yjs Awareness protocol** (ephemeral, not part of the doc).
- Client-side: throttle outgoing cursor updates to **10-15 Hz**.
- Receiving clients: **interpolate** cursor positions with lerp/easing for visual smoothness.
- Each cursor renders with the user's display name (from Clerk) and a unique color.

### Object Sync

- All object mutations (create, move, resize, delete, edit text) go through Yjs document operations.
- Yjs handles CRDT merge — simultaneous edits converge automatically.
- Deletion uses **Yjs native delete** (library handles tombstone GC internally).

### Conflict Resolution

- **CRDT merge** via Yjs for all object state. No manual conflict resolution.
- Simultaneous drags on the same object: both position updates merge via LWW-Register semantics within Yjs.
- No object locking.

---

## User Interface

### Visual Style

- **Polished / modern**: subtle shadows, rounded corners, clean typography.
- Light canvas background.
- Desktop only (no touch/mobile support in MVP).

### Views

1. **Landing Page** (`/`)
   - Marketing/intro page with Clerk "Sign In" button.
   - Unauthenticated users see this page only.

2. **Dashboard** (`/dashboard`)
   - Requires Clerk authentication.
   - Lists boards the user has created or visited.
   - "Create Board" button generates a new board with a random nanoid URL.
   - Boards display their name (editable) and last-modified timestamp.

3. **Board** (`/board/:id`)
   - Requires Clerk authentication.
   - Full-screen infinite canvas.
   - Toolbar at top or side.
   - Online users list (avatars/names from Clerk).

### Board Access Model

- **Flat access**: anyone with the board URL who is signed in can view and edit.
- **Link sharing**: board creator can share the URL. No invite system or role-based permissions.
- Unauthenticated visitors hitting a board URL are redirected to Clerk sign-in, then back to the board.

### Toolbar

Three tools (mutually exclusive selection):

1. **Select** (default) — Click to select objects. Drag to move. Drag corner handles to resize. `Delete`/`Backspace` to remove selected object.
2. **Sticky Note** — Click on canvas to place a new sticky note at that position. Enters text edit mode immediately.
3. **Rectangle** — Click on canvas to place a new rectangle at a default size.

### Infinite Canvas

- **Pan**: Click-drag on empty canvas space (in Select mode).
- **Zoom**: Mouse scroll wheel. Zoom is continuous/smooth with enforced min/max limits (e.g., 10% to 500%).
- No explicit pan tool in toolbar — panning is implicit via drag on empty space.

### Sticky Notes

- Fixed yellow color (`#fef08a` or similar warm yellow).
- Default size on creation (e.g., 200x150).
- Resizable via corner handles.
- Single-line plain text, editable on double-click.
- Subtle drop shadow, rounded corners.

### Rectangles

- Default size on creation (e.g., 200x150).
- Resizable via corner handles (4 corners + 4 edge midpoints).
- Stroke-only (no fill) or light fill. Configurable later.
- Can be moved by dragging.

### Presence

- **Cursors**: Colored cursors with name labels for each connected user. Colors auto-assigned.
- **Online list**: Small panel (top-right or side) showing avatars/names of currently connected users. Data sourced from Yjs Awareness + Clerk user profiles.
- No selection highlights or typing indicators in MVP.

---

## Canvas Rendering

- **Canvas 2D API** — all objects rendered via `CanvasRenderingContext2D`.
- Render loop redraws all objects each frame (no viewport culling in MVP; optimize later).
- Hit testing via manual coordinate math (point-in-rect for objects, proximity for resize handles).
- Z-order determined by the `zOrder` Y.Array — render in array order (index 0 = back, last = front).
- Transform matrix handles pan (translate) and zoom (scale).

---

## Authentication (Clerk)

- Clerk handles sign-up, sign-in, session management, and user profiles.
- Frontend uses Clerk's JavaScript SDK (or React SDK if wrapping the app in minimal React).
- Backend validates Clerk session tokens on WebSocket connection handshake.
- User display name and avatar from Clerk profile are used for cursors and presence.

---

## Persistence (PostgreSQL)

### Schema

```sql
CREATE TABLE boards (
  id TEXT PRIMARY KEY,           -- nanoid
  name TEXT DEFAULT 'Untitled',
  created_by TEXT NOT NULL,      -- Clerk user ID
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE board_snapshots (
  board_id TEXT REFERENCES boards(id),
  snapshot BYTEA NOT NULL,       -- Yjs encoded document state
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (board_id)
);

CREATE TABLE board_updates (
  id SERIAL PRIMARY KEY,
  board_id TEXT REFERENCES boards(id),
  update_data BYTEA NOT NULL,    -- Yjs incremental update
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_board_updates_board_id ON board_updates(board_id);
```

### Compaction

- After N incremental updates (e.g., 100), merge them into the snapshot and delete the processed updates.
- Compaction can run in-process on a timer or after a threshold is hit.

---

## Deployment

- **Platform**: Railway (or Render as fallback).
- Single service running the Node.js WebSocket server + serving static frontend assets.
- Railway managed PostgreSQL instance for persistence.
- Clerk hosted — no auth infrastructure to deploy.
- Environment variables: `DATABASE_URL`, `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`.
- TLS handled by Railway's built-in HTTPS.

---

## Scale Target

- **10-20 concurrent users per board**.
- Cursor throttling at 10-15 Hz + client-side interpolation keeps bandwidth manageable.
- Single Node.js process sufficient at this scale. No horizontal scaling needed for MVP.

---

## Build Priority Order

1. **Canvas foundation** — Infinite pan/zoom canvas with transform matrix. Render a test rectangle.
2. **Yjs integration** — Set up Yjs doc, connect to custom WS server, sync a shared Y.Map.
3. **Cursor sync** — Yjs Awareness for multiplayer cursors with throttle + interpolation.
4. **Object CRUD** — Create/move/resize/delete sticky notes and rectangles via Yjs.
5. **Text editing** — Single-line text input on sticky notes (inline on canvas).
6. **Persistence** — PostgreSQL storage of Yjs doc state. Survive server restarts.
7. **Reconnection** — Incremental Yjs sync on disconnect/reconnect.
8. **Auth** — Clerk integration. Landing page, sign-in flow, protected routes.
9. **Dashboard** — Board listing, creation, navigation.
10. **Polish** — Visual styling, presence UI, handle edge cases.
11. **Deploy** — Railway setup, environment config, DNS.

---

## Out of Scope (MVP)

- Touch / mobile support
- Rich text editing (bold, lists, etc.)
- Multiple shape types beyond rectangles
- Freehand drawing
- Undo/redo
- Export (PNG, PDF)
- Comments or chat
- Version history
- Role-based permissions / viewer mode
- Viewport culling / spatial indexing
- Offline support

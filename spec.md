# CollabBoard Spec

## Board Features

| Feature      | Requirements                                          |
| ------------ | ----------------------------------------------------- |
| Workspace    | Infinite board with smooth pan/zoom                   |
| Sticky Notes | Create, edit text, change colors                      |
| Shapes       | Rectangles, circles, lines with solid colors          |
| Connectors   | Lines/arrows connecting objects                       |
| Text         | Standalone text elements                              |
| Frames       | Group and organize content areas                      |
| Transforms   | Move, resize, rotate objects                          |
| Selection    | Single and multi-select (shift-click, drag-to-select) |
| Operations   | Delete, duplicate, copy/paste                         |

## Real-Time Collaboration

| Feature     | Requirements                                                 |
| ----------- | ------------------------------------------------------------ |
| Cursors     | Multiplayer cursors with names, real-time movement           |
| Sync        | Object creation/modification appears instantly for all users |
| Presence    | Clear indication of who's currently on the board             |
| Conflicts   | Handle simultaneous edits (last-write-wins acceptable)       |
| Resilience  | Graceful disconnect/reconnect handling                       |
| Persistence | Board state survives all users leaving and returning         |

## Performance Targets

| Metric              | Target                                       |
| ------------------- | -------------------------------------------- |
| Frame rate          | 60 FPS during pan, zoom, object manipulation |
| Object sync latency | <100ms                                       |
| Cursor sync latency | <50ms                                        |
| Object capacity     | 500+ objects without performance drops       |
| Concurrent users    | 5+ without degradation                       |

## AI Board Agent

### Required: 6+ distinct commands across these categories

**Creation** — Create sticky notes, shapes, frames with specified properties
**Manipulation** — Move, resize, recolor objects
**Layout** — Arrange elements in grids, space evenly
**Complex** — Multi-step templates (SWOT analysis, retro boards, journey maps)

### Tool Schema (Minimum)

```
createStickyNote(text, x, y, color)
createShape(type, x, y, width, height, color)
createFrame(title, x, y, width, height)
createConnector(fromId, toId, style)
moveObject(objectId, x, y)
resizeObject(objectId, width, height)
updateText(objectId, newText)
changeColor(objectId, color)
getBoardState()
```

### AI Agent Performance

| Metric           | Target                              |
| ---------------- | ----------------------------------- |
| Response latency | <2 seconds for single-step commands |
| Command breadth  | 6+ command types                    |
| Complexity       | Multi-step operation execution      |
| Reliability      | Consistent, accurate execution      |

### Shared AI State

- All users see AI-generated results in real-time
- Multiple users can issue AI commands simultaneously without conflict

## Testing Scenarios

1. 2 users editing simultaneously in different browsers
2. One user refreshing mid-edit (state persistence)
3. Rapid creation and movement of objects (sync performance)
4. Network throttling and disconnection recovery
5. 5+ concurrent users without degradation

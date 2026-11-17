# MONO — Charting Workspace

MONO is a charting-first technical-analysis workspace. The initial product is broker-independent and does not place orders.

## Product direction

- Design 03 / Deep Ocean visual system, compact density.
- Left navigation rail and searchable multi-instrument watchlist.
- Chart-edge drawing toolbar.
- Docked or floating inspector; side panels can be independently collapsed, including hiding the full inspector.
- Single-chart default workspace with multi-chart layouts planned.
- Local persistence for workspace preferences and drawings.
- Bar replay controls and chart overlays.

## Development checklist

This checklist is the source of truth for implementation progress. Mark an item complete only after implementation and verification; do not mark a feature complete because a control or placeholder exists.

### Foundation and chart engine
- [x] React/Vite application foundation and Deep Ocean design system.
- [x] Lightweight Charts candlestick chart engine.
- [x] Volume histogram and moving-average overlay.
- [x] Instrument-specific illustrative OHLC price scaling.
- [x] Searchable instrument watchlist and timeframe selector.
- [x] Resizable chart container and responsive chart rendering.
- [ ] Live exchange market-data adapter (public market data only).
- [ ] Historical candle retrieval and pagination.
- [ ] Correct exchange timestamps and timezone controls.
- [ ] Connection status, reconnect/backoff and stale-data handling.

### Drawing engine
- [x] Chart time/price anchored drawing coordinates.
- [x] Trend line and horizontal line.
- [x] Rectangle and text note.
- [x] Brush point capture and chart-coordinate rendering.
- [x] Parallel channel rendering.
- [x] Select drawings from the chart and object tree.
- [x] Drag selected drawings to reposition them.
- [x] Drawing color, opacity and line-width properties.
- [x] Undo/redo history for drawing changes.
- [ ] Reliable hit testing for every drawing geometry.
- [x] Anchor handles and endpoint editing for drawing endpoints.
- [x] Drawing visibility and lock controls in the object tree.
- [x] Keyboard shortcuts: Ctrl/Cmd+Z, Ctrl/Cmd+Y, Delete/Backspace and Escape.
- [ ] Rectangle/channel resize and geometry editing.
- [ ] Drawing lock, hide/show and z-order controls.
- [ ] Multi-select and group operations.
- [ ] Keyboard shortcuts and escape/cancel behavior.
- [x] IndexedDB persistence with schema versioning and localStorage fallback.
- [ ] Storage migration recovery, backup/restore and corruption diagnostics.
- [ ] Automated interaction tests for drawing tools and persistence.

### Workspace and chart controls
- [x] Collapsible watchlist and inspector.
- [x] Docked/floating inspector modes.
- [x] Local workspace preference persistence.
- [x] Workspace JSON export.
- [ ] Real independent multi-chart panes (2/4/6/8 layouts).
- [ ] Per-pane symbol, timeframe, overlays and drawing state.
- [ ] Linked crosshair, symbol and timeframe options.
- [ ] Functional zoom, fit-content and chart-type controls.
- [ ] Indicator configuration and multiple indicator instances.
- [ ] Distraction-free/full-screen chart mode.
- [ ] Workspace save, rename, duplicate and restore.

### Replay and analysis
- [x] Local illustrative-bar replay controls.
- [ ] Historical-data replay with deterministic stepping.
- [ ] Replay speed, step forward/back and jump controls.
- [ ] Persisted replay position and replay session state.
- [ ] Alert rules backed by a live data source.
- [ ] Additional practical technical-analysis tools and annotations.

### Quality and release
- [x] Unit tests for deterministic demo OHLC generation and price anchoring.
- [x] GitHub Actions dependency install, unit-test and production-build workflow.
- [ ] Automated component and browser interaction tests.
- [ ] Accessibility and keyboard-navigation pass.
- [ ] Performance profiling with large candle histories and many drawings.
- [ ] Error boundaries, diagnostics and import/export validation.
- [ ] Windows install/launch package and user documentation.
- [ ] Release checklist and verified downloadable build.

## Current implementation and data limitations

The frontend uses React, Vite, and TradingView's open-source Lightweight Charts engine for native candlestick, volume histogram, moving-average, crosshair, price-scale, and time-scale rendering. It includes deterministic illustrative OHLC data, selectable instruments and timeframes, a chart-coordinate drawing overlay, IndexedDB-backed drawing persistence with localStorage fallback, basic drawing selection/movement/style editing and undo/redo, replay controls, workspace export, and inspector/object-tree controls.

**Market data is illustrative, not live.** The application does not yet connect to an exchange feed. Replay currently steps through the local illustrative bar series. No order-entry or broker functionality is included.

Some controls and roadmap items remain incomplete. The checklist above distinguishes working functionality from planned work.

## Run locally

```bash
npm install
npm run dev
```

## Verify

```bash
npm test
npm run build
```

GitHub Actions runs unit tests and the production build on pushes and pull requests to `main`.

## Stack

- React 18
- Vite 6
- Lightweight Charts 5
- Lucide icons
- CSS, no UI framework

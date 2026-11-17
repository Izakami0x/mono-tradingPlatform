# MONO — Charting Workspace

MONO is a charting-first technical-analysis workspace. The initial product is broker-independent and does not place orders.

## Product direction

- Design 03 / Deep Ocean visual system, compact density.
- Left navigation rail and searchable multi-instrument watchlist.
- Chart-edge drawing toolbar.
- Docked or floating inspector; side panels can be independently collapsed, including hiding the full inspector.
- Single-chart default workspace with functional two-, four-, six- and eight-chart layouts.
- Local persistence for workspace preferences, named workspace snapshots, pane settings and drawings.
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
- [x] Public Binance USDⓈ-M Futures REST history and WebSocket kline adapter (no credentials/order endpoints).
- [x] Incremental live candle updates use series-level last-bar updates when timestamps remain stable; structural history changes reset the series.
- [x] Historical candle retrieval with bounded pagination.
- [ ] Correct exchange timestamps and timezone controls.
- [x] Connection status, exponential reconnect/backoff and stale-feed detection.

### Drawing engine
- [x] Chart time/price anchored drawing coordinates.
- [x] Trend line and horizontal line.
- [x] Rectangle and text note.
- [x] Brush point capture and chart-coordinate rendering.
- [x] Parallel channel rendering.
- [x] Forward ray, extended line and horizontal ray tools.
- [x] Fibonacci retracement with standard 0 / 23.6 / 38.2 / 50 / 61.8 / 78.6 / 100% levels and price labels.
- [x] Price-range measurement with signed price delta and percentage change.
- [x] Date/time and bar-count measurement tools; candle counts are inclusive and derived from loaded chart timestamps.
- [x] Select drawings from the chart and object tree.
- [x] Drag selected drawings to reposition them.
- [x] Drawing color, opacity, line-width and solid/dashed/dotted line-style properties.
- [x] Editable text annotation content in the properties inspector.
- [x] Three-anchor Fibonacci extension with 0 / 61.8 / 100 / 161.8 / 261.8% projection levels and editable anchors.
- [x] Undo/redo history for drawing changes.
- [x] Geometry-aware hit testing for trend lines, horizontal lines, rectangles, channels, text and brush strokes.
- [x] Spatial broad-phase hit-test index with reverse-layer candidate ordering and overflow handling for long drawings.
- [x] 5,000-object spatial-index correctness regression test.
- [x] Anchor handles and endpoint editing for drawing endpoints, including diagonal rectangle resizing.
- [x] Drawing visibility and lock controls in the object tree.
- [x] Keyboard shortcuts: Ctrl/Cmd+Z, Ctrl/Cmd+Y, Delete/Backspace and Escape; pointer cancellation discards unfinished drawing edits.
- [x] Rectangle resizing through endpoint handles; channel centerline endpoint editing.
- [x] Drawing lock and hide/show controls.
- [x] Bring-forward/send-backward layer ordering controls in the object tree.
- [x] Shift-click multi-select and group movement for unlocked drawings; grouped moves commit as one undoable change.
- [x] Pointer cancellation discards in-progress drawings and drag edits without committing partial work.
- [x] IndexedDB persistence with schema versioning and localStorage fallback.
- [ ] Storage migration recovery, backup/restore and corruption diagnostics.
- [ ] Automated interaction tests for drawing tools and persistence.

### Workspace and chart controls
- [x] Collapsible watchlist and inspector.
- [x] Docked/floating inspector modes.
- [x] Local workspace preference persistence.
- [x] Workspace JSON export.
- [x] Real independent multi-chart panes (2/4/6/8 layouts); each layout renders separate charts.
- [x] Per-pane symbol, timeframe, overlays and drawing state (each secondary pane has its own market stream, selectable timeframe/symbol, overlays, editable drawings and persisted pane settings).
- [x] Optional linked symbol selection across chart panes.
- [x] Optional linked timeframe selection across chart panes.
- [x] Synchronized crosshair time across panes when matching candle timestamps are available.
- [x] Optional synchronized visible time-range and horizontal scrolling across panes (time-based; requires overlapping time data).
- [x] Functional zoom in/out controls using the chart's visible logical range.
- [x] Fit-to-data control for all currently loaded bars.
- [x] Candlestick, close-line and area chart display modes (main chart).
- [x] Indicator manager with independently configurable, multiple SMA, EMA and VWAP instances (period, visibility and color; main chart overlays); SMA overlays update from the latest rolling window during live candle ticks, while EMA and UTC-session VWAP use cached prior-candle state to update only the latest point; historical corrections trigger safe full recalculation.
- [x] Distraction-free/full-screen chart mode for the complete chart workspace, with browser fullscreen state tracking and an exit control.
- [x] Named workspaces: save new, overwrite current, rename, duplicate, delete and restore.
- [x] Workspace snapshots include main chart settings, indicators, drawings, linked-chart preferences, layout, and saved secondary-pane symbols/timeframes/drawings.
- [x] Active named workspace selection and workspace library persist locally across reloads.
- [x] Workspace JSON export includes the complete current workspace snapshot.

### Replay and analysis
- [x] Replay controls over loaded exchange history or demo fallback.
- [x] Historical-data replay with deterministic stepping.
- [x] Replay speed, step forward/back and timeline jump controls.
- [ ] Persisted replay position and replay session state.
- [ ] Alert rules backed by a live data source.
- [ ] Fibonacci expansion presets, configurable level sets and extension direction options.


### Quality and release
- [x] Unit tests for deterministic demo OHLC generation and price anchoring.
- [x] Unit tests for SMA, EMA and session-based VWAP calculations, including latest-value SMA parity and incremental EMA/VWAP parity across repeated ticks, appends, UTC session boundaries and historical resets.
- [x] GitHub Actions dependency install, safe npm audit remediation, actionable high/critical audit gate, unit tests and production build.
- [ ] Automated component and browser interaction tests.
- [ ] Accessibility and keyboard-navigation pass.
- [x] 50k-candle SMA correctness regression test and informational SMA/EMA/VWAP benchmark in CI.
- [x] Spatial hit-test broad-phase correctness stress test with 5,000 drawings (timing remains informational, not a brittle CI gate).
- [ ] Profile full SVG rendering and hit-test latency with large drawings; measure incremental indicator performance on large live histories.
- [ ] Error boundaries, diagnostics and import/export validation.
- [ ] Windows install/launch package and user documentation.
- [ ] Release checklist and verified downloadable build.

## Dependency security

Vite is pinned to the maintained 6.4 line. CI applies non-breaking npm audit fixes and fails on critical findings or high-severity findings with a safe non-breaking fix. High-severity upstream advisories without a safe published fix are reported explicitly rather than forcing an unsupported major downgrade; they remain open security follow-up items until upstream remediation is available.

## Current implementation and data limitations

The frontend uses React, Vite, and TradingView's open-source Lightweight Charts engine for native candlestick, close-line and area display modes, volume histogram, moving-average, crosshair, price-scale, and time-scale rendering. The main chart includes a configurable overlay manager supporting multiple SMA, EMA and cumulative VWAP instances, each with independent period (where applicable), visibility and color settings. Main-chart zoom in/out adjusts the visible logical range, while Fit restores the full loaded history. It includes paginated public exchange history, a reconnecting WebSocket market-data adapter with stale-feed detection and illustrative fallback, selectable instruments and timeframes, a chart-coordinate drawing overlay, IndexedDB-backed drawing persistence with localStorage fallback, geometry-aware drawing selection, multi-select/group movement with single-step undo, safe pointer cancellation, endpoint editing, ray/extended-line/horizontal-ray tools, labeled Fibonacci retracements and three-anchor extensions, price-range, date/time and inclusive bar-count measurements with elapsed-time labels, editable annotation text and line styles, layer ordering, style editing and undo/redo, replay controls, complete workspace JSON export, named workspace save/restore/rename/duplicate/delete, and inspector/object-tree controls.

**Market data:** MONO now attempts to load public Binance USDⓈ-M Futures candles and subscribe to its public kline WebSocket, without API keys or trading permissions. If the exchange is unreachable or blocks the connection, the chart falls back to deterministic illustrative data and labels that fallback. Replay uses the currently loaded historical exchange bars when available, with speed selection, single-bar stepping and timeline scrubbing; otherwise it uses the local illustrative series. No order-entry or broker functionality is included.

Crosshair synchronization is time-based: when panes have different intervals or missing candle timestamps, a corresponding crosshair may not be available in every pane. Visible-range synchronization is available as a separate optional link; panes need overlapping time data for the same visible interval to render meaningfully.

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
npm run benchmark
```

GitHub Actions runs unit tests and the production build on pushes and pull requests to `main`.

## Stack

- React 18
- Vite 6
- Lightweight Charts 5
- Lucide icons
- CSS, no UI framework

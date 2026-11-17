# MONO — Charting Workspace

MONO is a charting-first technical-analysis workspace. The initial product is broker-independent and does not place orders.

## Product direction

- Design 03 / Deep Ocean visual system, compact density.
- Left navigation rail and searchable multi-instrument watchlist.
- Chart-edge drawing toolbar.
- Docked or floating inspector; side panels can be independently collapsed, including hiding the full inspector.
- Single-chart default workspace with layout controls.
- Local persistence for workspace preferences and drawings.
- Bar replay controls and chart overlays.

## Current implementation

The current frontend is an interactive UI foundation built with React and Vite. It includes deterministic illustrative OHLC candles, selectable instruments and timeframes, crosshair, trend/horizontal/rectangle/text/brush drawing modes, local drawing persistence, volume and moving-average toggles, bar replay, workspace export, and inspector/object-tree controls.

**Market data is illustrative, not live.** The application does not yet connect to an exchange feed. Replay currently steps through the local illustrative bar series. No order-entry or broker functionality is included.

## Run locally

```bash
npm install
npm run dev
```

## Verify

```bash
npm run build
```

A GitHub Actions workflow runs the production build on pushes and pull requests to `main`.

## Stack

- React 18
- Vite 6
- Lucide icons
- CSS, no UI framework

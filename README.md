# mushi-jingi-deck-builder (Vue 3 migration workspace)

This folder is an isolated Vue 3 + TypeScript + Vite migration workspace.

## Commands

- `npm run dev`
- `npm run build`
- `npm run preview`

## Implemented parity scope

- Deck slots: 20
- Add / remove / clear deck
- URL sync with query params: `c01` ... `c20`
- Initial restore from URL on page load
- Card library filters (set/color/type/rarity/cost)
- Hover preview (large card image)

## URL sync verification checklist

1. Open app with no query: deck starts empty.
2. Add 1 card: URL gets `?c01=...`.
3. Add multiple cards: URL expands with `c02`, `c03`, ...
4. Remove one card: URL updates and reorders according to deck sort.
5. Click deck clear: all `cXX` params are removed.
6. Reload page with populated query: deck restores exactly from URL.
7. Copy URL from deck area and open in new tab: same deck should appear.

## Data and assets

- Card data: `src/data/cards.json`
- Small card images: `public/img/sc`
- Large card images: `public/img/lc`

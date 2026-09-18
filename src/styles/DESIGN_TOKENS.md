# Design tokens — UI Redesign P0 (SPEC v2)

Source: `/workspace/rap-app-design/REDESIGN-SPEC.md` (LOCKED CoS 18 Sep 2026)

## Colors
| Token | Hex | Role |
|-------|-----|------|
| void / `--background` | `#0A0A0B` | page |
| elevated / `--surface` | `#141416` | cards |
| ink / `--foreground` | `#F5F5F4` | primary text |
| `--muted` | `#A1A1AA` | meta |
| `--accent` | `#C8FF3D` | ONLY accent |
| `--accent-fg` | `#0A0A0B` | text on accent |
| `--border` | `#2A2A2E` | hairline |
| `--danger` | `#F87171` | sold / error |
| `--warning` | `#FBBF24` | uncleared |

## Fonts (`next/font/google`)
- Display H*: **Be Vietnam Pro** 600–800 · `--font-be-vietnam-pro`
- Body: **Inter** 400–500 · `--font-inter`
- Subsets: `vietnamese` + `latin`
- No Phudu. PNG mood only — SPEC tokens win if hex differs.

## Motion / layout
- Fade 150–200ms · ease-out · no bounce
- Cover radius 12–16 · r-sm/md/lg/pill = 8/12/16/999
- Tap ≥44px · content max 480px (mobile, centered `mx-auto`); md ≥768 → ~768px; lg ≥1024 → ~1100px · home grid 2→3→4 cols

## Buyer rule
Buyer UI never shows take-rate / quỹ / platform fee.

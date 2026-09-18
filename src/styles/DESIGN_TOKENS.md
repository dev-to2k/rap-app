# Design tokens hook (prep — awaiting Design artifact)

## Where theme lives
- CSS variables: `src/app/globals.css` (`:root` — background/surface/accent/…)
- Tailwind map: `tailwind.config.ts` → `theme.extend.colors` + `borderRadius`
- App shell: `src/components/AppShell.tsx`

## Fonts
- UI today: Geist via `next/font/local` in `src/app/layout.tsx`
  - files: `src/app/fonts/GeistVF.woff`, `GeistMonoVF.woff`
  - CSS vars: `--font-geist-sans`, `--font-geist-mono`
- VN-capable file already in repo: `assets/fonts/NotoSans-Regular.ttf` (PDF license today)
- Slot reserved: `--font-ui` in `globals.css` (points at Geist until Design picks VN display font)

## Do not ship until
Design delivers Figma/token/font brief via CoS. Then implement on this branch (or successor), PR ≠ main push if CI required.

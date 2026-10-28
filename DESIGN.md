# RepoPilot Design System

## Direction

Use the supplied Vercel style reference as the primary visual system, with the whitespace and editorial restraint seen in the Ardor reference. Treat this as a developer tool that feels like a terminal printed on paper: precise, quiet, readable, and evidence-led. Do not copy Vercel's logo or wordmark. RepoPilot needs its own simple wordmark; a small geometric ▲ may be used as a product motif, but it must not imitate the Vercel identity.

The Vercel reference takes priority over the earlier exploratory idea of an electric-blue accent. Keep the product monochrome except for accessible semantic success feedback. Do not use the MindCloud blue gradient in the MVP. Avoid decorative photography, 3D art, glassmorphism, large gradients, and unnecessary animation. Use terminal output and real product UI as the visual proof.

## Color tokens

| Token | Value | Use |
|---|---|---|
| `--color-paper-white` | `#fafafa` | Main page canvas |
| `--color-pure-white` | `#ffffff` | Inputs and content cards |
| `--color-hairline` | `#ebebeb` | Borders and separators |
| `--color-ash` | `#c9c9c9` | Disabled elements only |
| `--color-smoke` | `#a8a8a8` | Placeholders and tertiary icons |
| `--color-graphite` | `#8f8f8f` | Secondary metadata |
| `--color-slate` | `#7d7d7d` | Low-priority labels |
| `--color-stone` | `#666666` | Captions and helper text |
| `--color-charcoal` | `#4d4d4d` | Body copy |
| `--color-obsidian` | `#171717` | Main text, headings, primary buttons, dark panels |
| `--color-carbon` | `#000000` | Small geometric brand mark or icon artwork only |
| `--color-terminal-green` | `#297a3a` | Success confirmation only; never the sole way to convey state |
| `--color-warning-surface` | `#fff9e6` | Warning badge/banner background (border `#fae29c`, text `#7d5700`) |
| `--color-success-surface` | `#eaf5ed` | Success badge/banner background (border `#c3e6cd`, text `#297a3a`) |

No blue accent or decorative gradient in the MVP. Errors and warnings must remain accessible through text, icons, and labels, not color alone. Do not use pure black for normal text; reserve it for small graphic marks.

## Typography

Use Geist Sans and Geist Mono when available. Use Inter as the sans-serif fallback and JetBrains Mono as the monospace fallback. Do not block the build if the preferred fonts cannot be loaded.

| Role | Family | Size | Weight | Line height | Tracking |
|---|---|---:|---:|---:|---:|
| Eyebrow / metadata label | Geist Mono | 11px | 400 | 1.5 | 0.071em |
| Caption | Geist Sans | 13px | 400 | 1.54 | normal |
| Body | Geist Sans | 16px | 400 | 1.5 | normal |
| Section heading | Geist Sans | 30px | 400 | 1.1 | -1.5px |
| Large heading | Geist Sans | 56px | 400–450 | 1.0 | -3.36px |
| Display heading | Geist Sans | 64px | 400–450 | 1.0 | -3.84px |
| Code / terminal | Geist Mono | 12–13px | 400 | 1.4–1.6 | normal |

Use monospace for uppercase eyebrows, technical metadata, file paths, keyboard shortcuts, and terminal output. Keep labels compact but readable; do not shrink essential text below 11px. Body text should use the neutral text scale. Do not use heavy bold display headlines.

## Spacing, layout, and shape

Use a 4px spacing rhythm. Core values: 4, 6, 8, 12, 16, 20, 24, 32, 40, and 44px. Set the centered page max-width to 1280px with 24–48px horizontal padding. Use 96–128px between major marketing sections on wide screens, then reduce proportionally on smaller screens. Keep application workspaces denser than the landing page. Default card padding is 16px; common control gap is 12px; card grids use 16–24px gaps.

### App Shell Dimensions

- **Sidebar**: 260px expanded, 56px collapsed (icon rail). Persist collapse state in storage/preferences.
- **Top bar**: 48px inside app/session workspaces (64px remains for public marketing pages).
- **Chat column**: 768px centered max-width.
- **Overview / Documents / Blueprint canvas**: Up to 1000px max-width.
- **Composer**: Minimum height 56px, 1px `#ebebeb` hairline border, 6px radius, no shadow, `#171717` focus ring.
- **Suggestion Chips**: 12px Geist Mono, 1px hairline border, 6px radius, keyboard reachable.
- **File Drawer**: Right-docked slide-over panel with focus trap, backdrop, and Escape listener.

Use 6px radius for cards, buttons, and bordered panels; 2px for compact navigation details; full-pill radius only for a deliberately compact pill control. Prefer hairline borders to shadows. If a subtle ring is needed, use `0 0 0 1px rgba(0,0,0,0.08), 0 0 0 2px #fafafa`. Avoid drop shadows.

## Components

### Navigation

A minimal 64px top bar on the paper-white canvas. Keep the RepoPilot wordmark left, useful navigation in the middle when space allows, and one primary action at the right. Use a subtle hairline only when it helps orientation; no heavy shadow. On mobile, collapse navigation accessibly without hiding the main repository input.

### Hero and repository input

Use a large, calm headline with tight tracking and a short supporting explanation. The main interaction is a prominent GitHub repository URL field paired with a black primary action. The field must show validation, loading, and error states clearly. A compact terminal-style example can demonstrate the product, but it must use truthful sample output and be labelled as a demo if not live.

### Buttons

Primary: `#171717` fill, white text, 6px radius, 14px regular sans text, approximately 12px vertical and 20px horizontal padding. Secondary: transparent or white fill, `#4d4d4d` text, 1px `#ebebeb` border, 6px radius. Text links use an underline or clear hover/focus change and no container. Provide visible keyboard focus. Disabled state must not rely only on a color change.

### Cards and workspace

Use white cards on `#fafafa`, 1px hairline borders, 6px corners, and 16–24px padding. Avoid ornamental shadows. A single inverted `#171717` panel may be used for terminal output or one important callout, but use it sparingly. The analyzed repository workspace should prioritize information hierarchy: repository identity and analysis coverage first, then Overview, Ask the Repository, Project Documents, and Innovation Blueprint. Tabs and selected states must be obvious without relying on color alone.

### Terminal and code panels

Use white or paper-white surfaces, hairline borders, 6px radius, and Geist Mono at 12–13px. Prefix illustrative commands with `▲` only as a RepoPilot motif, not as copied Vercel branding. Use `✓` with terminal green for successful checks and include explicit status text. Code and file references should wrap or scroll without breaking the page layout.

### Innovation Blueprint

Present three comparable opportunity cards. Each should show the user problem, expected value, complexity, repository evidence, assumptions, and risks. Keep score or status badges restrained and textual. The selected idea should open a detailed implementation plan with a clear copy/export action. Do not imply that ideas are objectively novel or guaranteed to be valuable.

## Motion and accessibility

Prefer static layouts. Use only short, subtle transitions for hover, focus, and loading; respect `prefers-reduced-motion`. Meet WCAG AA contrast where applicable, use semantic HTML, visible focus rings, accessible labels, keyboard-operable controls, and announce asynchronous status changes. Pair every status color with text or an icon. Verify at mobile, tablet, and desktop widths.

## Do not

Do not add electric-blue accents, MindCloud-style gradients, rainbow gradients, decorative photos, 3D illustrations, glassmorphism, large drop shadows, excessive rounded cards, or animation for its own sake. Do not make every section a card. Do not copy Vercel's exact logo or wordmark. Do not sacrifice readability to achieve a tiny terminal aesthetic.

## CSS starter tokens

```css
:root {
  --color-paper-white: #fafafa;
  --color-pure-white: #ffffff;
  --color-hairline: #ebebeb;
  --color-ash: #c9c9c9;
  --color-smoke: #a8a8a8;
  --color-graphite: #8f8f8f;
  --color-slate: #7d7d7d;
  --color-stone: #666666;
  --color-charcoal: #4d4d4d;
  --color-obsidian: #171717;
  --color-carbon: #000000;
  --color-terminal-green: #297a3a;
  --font-sans: 'Geist Sans', Inter, ui-sans-serif, system-ui, sans-serif;
  --font-mono: 'Geist Mono', 'JetBrains Mono', ui-monospace, monospace;
  --text-eyebrow: 11px;
  --text-caption: 13px;
  --text-body: 16px;
  --text-heading: 30px;
  --text-heading-lg: 56px;
  --text-display: 64px;
  --radius-nav: 2px;
  --radius-card: 6px;
  --radius-button: 6px;
  --radius-pill: 9999px;
  --page-max-width: 1280px;
  --card-padding: 16px;
  --element-gap: 12px;
}
```

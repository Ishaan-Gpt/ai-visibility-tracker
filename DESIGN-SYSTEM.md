# OMNI SEO — Design System v1

Single source of truth for the landing page AND the Studio. If a value isn't here, don't invent it — add it here first.
Direction: Explee-style (measured from explee.com computed styles, 2026-10-04): warm off-white canvas, white rounded cards, near-black pill/rounded buttons, one calm accent, light-weight large headlines, generous whitespace. **Minimal. No gradients, no glow, no glass, no scroll-jacking.**

Tokens live in `app/design-tokens.css` (`--ds-*`). Never hardcode hex/px in components.

## 1. Principles
1. One accent, used sparingly (primary highlight word in H1, links, active states, key data).
2. Hierarchy comes from size, weight-contrast and whitespace — not color or shadow.
3. White cards on warm canvas; separation via 1px hairline border, not shadow.
4. Same components in landing and Studio. Studio is the same system, denser.
5. Motion is functional only: 150–200ms ease-out for hover/focus/open. No parallax, no stagger spectacles.

## 2. Color
| Token | Value | Use |
|---|---|---|
| `--ds-canvas` | `#F6F5F3` | page background (Explee: rgb 246,245,243) |
| `--ds-surface` | `#FFFFFF` | cards, inputs, popovers |
| `--ds-surface-muted` | `rgba(0,0,0,0.04)` | pills, stat tiles, table header, hover |
| `--ds-ink` | `#0B0B0B` | headings, body-strong |
| `--ds-ink-2` | `#777777` | body secondary, descriptions |
| `--ds-ink-3` | `#A3A3A3` | placeholder, disabled, meta |
| `--ds-line` | `rgba(0,0,0,0.08)` | all borders/dividers |
| `--ds-btn` | `#161616` | primary button bg (text `#F7F7F7`) |
| `--ds-accent` | `#E86A00` | OMNI orange (existing brand + logomark) |
| `--ds-accent-hover` | `#CF5F00` | |
| `--ds-accent-soft` | `#FFF1E6` | accent tint backgrounds/badges |
| `--ds-success` | `#0D9467` | good/up/passing (Explee brand-600) |
| `--ds-warning` | `#D97706` | |
| `--ds-danger` | `#DC2626` | |
Rule: accent ≠ success. Orange = brand/emphasis, green = positive status. Dark mode is out of scope for v1.

> Decision for you: Explee's accent is green. I kept OMNI's orange so brand stays yours. Changing `--ds-accent` re-skins everything.

## 3. Typography
Fonts: **Geist Sans** (UI + headings, same as Explee) and **Geist Mono** (code, numeric tables, keywords). Remove Fraunces, Instrument Sans, Inter Tight from the app.
Headings are **weight 400** (Explee signature) with tight tracking; emphasis via weight 500 only in UI.

| Role | Size / line-height | Weight | Tracking |
|---|---|---|---|
| Display (hero H1) | 60/60 (mobile 40/42) | 400 | -0.03em |
| H2 (section) | 36/40 (mobile 28/32) | 400 | -0.02em |
| H3 (card title) | 20/28 | 500 | -0.01em |
| Body L | 18/28 | 400 | 0 |
| Body | 16/24 | 400 | 0 |
| Small / pill | 14/20 | 400–500 | 0 |
| Caption / label | 12/16 | 500 | 0.02em |
| Mono | 13/20 | 400 | 0 |
Body copy color = `ink-2`; headings = `ink`. Max line length 62ch. One H1 per page.

## 4. Spacing, layout, radius
- Base unit 4px. Scale: 4, 8, 12, 16, 20, 24, 32, 48, 64, 96, 128.
- Container max-width 1120px (landing), side padding 24px (mobile 16px). Section vertical padding 96px (mobile 64px).
- Studio: fixed 240px sidebar, content max-width 1200px, page padding 32px.
- Radius: `--ds-r-sm` 8px (small controls), `--ds-r-md` 10px (buttons, inputs), `--ds-r-lg` 16px (cards, modals), `--ds-r-full` pills/avatars.
- Borders: 1px `--ds-line`. Shadows: none by default; popovers/dropdowns only `0 8px 24px rgba(0,0,0,0.08)`.
- Icons: lucide-react, 16px in UI / 20px in features, stroke 1.5, color `ink-2`.

## 5. Components (spec)
- **Button primary:** h48 (Studio h36), px32, bg `btn`, text `#F7F7F7`, radius 10, weight 500. Hover: bg `#000`. Focus: 2px ring `ink` offset 2.
- **Button secondary:** same size, bg surface, 1px line border, text ink. **Ghost:** no bg, text ink, hover `surface-muted`. **Accent button:** only one per screen, for the single paid CTA.
- **Pill / badge:** h32 (small h24), px16, bg `surface-muted`, radius full, 14px. Status pills use success/warning/danger text on 10% tint.
- **Input:** h48 (Studio h40), surface bg, 1px line border, radius 12, px16; the hero URL input is a "command bar": surface, radius 16, 1px ink-tint border, with inline primary button at right. Focus = ink ring.
- **Card:** surface, 1px line, radius 16, padding 24. Testimonial/feature variant: header (avatar 48 + name 500 + role ink-2), body, then 2 stat tiles (`surface-muted`, radius 12, number 28/500, label 14 ink-2).
- **Stat tile:** surface-muted, radius 12, centered number + label.
- **Nav:** transparent on canvas, h64, logo left, links right (Products ▾ dropdown, Pricing, Sign in) + primary button. No border until scrolled.
- **Accordion (FAQ):** divider rows, 16px/500 question, chevron, content ink-2.
- **Table (Studio):** header row `surface-muted` 12px/500 uppercase-free, row h48, 1px line dividers, numeric cols Geist Mono right-aligned.
- **Sidebar (Studio):** surface bg, 1px right line, items h36 radius 8, active = `surface-muted` + ink text + accent 2px left marker.
- **Empty state, toast, modal:** surface, radius 16, centered, one primary action.

## 5b. Landing page structure (follows Explee's rhythm)
1. Nav → 2. Social-proof pill ("N brands tracked") → 3. H1 with one accent phrase → 4. sub (ink-2, 2 lines) → 5. two benefit pills → 6. URL command bar (try the free tool, no login) → 7. Results/testimonials as white cards with 2 stat tiles → 8. "Entire pipeline" feature steps (alternating rows, product screenshot in card) → 9. "Three things nobody else has" → 10. Pricing (pay-as-you-go / 3 tiers) → 11. FAQ accordion → 12. Footer.
Real data only: no invented logos/testimonials.

## 6. Do / Don't
Do: weight 400 headings, whitespace, hairlines, one accent, real screenshots.
Don't: gradients, glassmorphism, blur reveals, Lenis/scroll-jack, fake stats, >2 fonts, shadows on cards, emoji icons, more than one accent color.

## 7. Implementation rules
- Tokens only via `--ds-*` / Tailwind classes mapped in `@theme`. Build primitives in `components/ds/` (Button, Pill, Card, Input, StatTile, Nav, Accordion, Table, Sidebar) once; pages compose them.
- Legacy components keep working until each page is rebuilt; migrate page by page (landing first, then Studio).
- Every new component must be reviewable on a `/design` route (living style guide).

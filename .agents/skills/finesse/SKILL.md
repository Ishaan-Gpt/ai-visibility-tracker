---
name: finesse
description: Rules and guidelines for visual design refinement, spacing, layout alignment, text wrapping, and mobile responsiveness.
---
# Finesse Design and Layout Guidelines

This skill is triggered when designing, creating, or modifying layout pages and components to ensure they meet visual criteria, proper content alignment, smart line wrapping, and mobile responsiveness.

## 1. Visual Spacing & Containment
- **No Cropping**: Ensure no elements, texts, or cards are cropped or clipped on overflow. Never use hard-coded container heights (`h-[400px]`, etc.) that cut off text when content grows. Prefer `min-h-*` or auto height with proper padding.
- **Appropriate Margin & Padding**: Maintain visual breathing room.
  - Large sections should have consistent top/bottom padding (e.g., `py-16` to `py-24` on desktop, scaled down to `py-12` to `py-16` on mobile).
  - Component elements should use standard padding tokens (`p-6` or `p-8` for cards) and not feel cramped or overly spaced.

## 2. Alignment & Positioning Rules
- **Desktop/PC Layout**: 
  - Heading block layout alignment must follow the standard design theme.
  - Left-Aligned Text: Used for multi-column grids or side-by-side split sections. Keep headings, body text, and actions consistently left-aligned.
  - Center-Aligned Text: Used for single-column focal elements, hero hooks, or FAQ intros. Ensure both title and subtitle are center-aligned.
- **Consistency**: Do not mix left-aligned titles with center-aligned subtitles in the same container.

## 3. Smart Wrapping (Aesthetics of Text Layout)
- **Sister Size matching**: Match font sizes (`text-3xl`, `md:text-5xl`) and weights (`font-bold`) with counterpart sister layouts.
- **Lengthwise Space Occupation**: Occupy the available horizontal space before wrapping. If a heading or short text can comfortably fit on a single line on desktop without exceeding design boundaries, let it fit on one line rather than wrapping it prematurely.
- **Consistent/Balanced Wrapping**: If a sentence is too long and must wrap:
  - **Left-aligned wrapping**: Wrap naturally but avoid orphan words (e.g. a single short word wrapped to a new line). Keep lines relatively balanced.
  - **Center-aligned wrapping**: Wrap strictly to maintain a balanced block of text. For instance, if you have 15 words, balance them evenly (e.g. 7 words on the first line and 8 on the second line) instead of wrapping 13 words on the first line and leaving 2 words isolated on the second line. Use React-safe non-breaking spaces (`\u00a0` or `&nbsp;`) or `<br className="hidden md:inline" />` to control line breaks.
- **Forced One-Line Subtexts**: Short uppercase descriptor headings or subheadings must be locked to exactly 1 line on desktop using `md:whitespace-nowrap` if needed.

## 4. Mobile Responsiveness & Mobile-Specific Layouts
- **Responsive Layout Adapters**: Ensure every custom component adapts gracefully to mobile viewports. Use Tailwind's responsive prefixes (e.g. `grid-cols-1 md:grid-cols-3` or `px-4 md:px-8`).
- **Mobile-Specific Variants**: Where desktop layouts are too complex for a standard flex/grid wrap, implement mobile-specific structural branches (e.g. rendering a mobile-optimized slider/carousel instead of a complex desktop horizontal card view).
- **Desktop Commands Cleanup**: Avoid using hardcoded horizontal desktop dimensions (e.g. `w-[800px]`) on elements without responsive overrides (e.g. `w-full max-w-[800px]`), which break mobile scrolling layout.

## 5. Structural Symmetry & Grid Balance
- **Symmetrical Grid Layouts**: Never layout grids with unbalanced rows (e.g., 5 cards in a 4-column grid, leaving a single card in the second row).
  - If a grid has an odd number of items (like 5), present them as a combination (e.g., a row of 3 columns and a second centered row of 2 cards) to maintain perfect symmetry.
  - Alternatively, choose a layout pattern (e.g. linear process lists, vertical accordions, or custom centered flex wraps) that naturally preserves visual balance.

## 6. Layout Containment & Heading Wrapping
- **Avoid Premature Heading Wraps**: Headings must occupy the available width space correctly and should not wrap into 3 lines if there is space for 2 lines. 
- **Check Container Width Limits**: Do not apply narrow constraints like `max-w-3xl` on heading containers unless the text is small. Let heading containers expand to `max-w-4xl` or `max-w-5xl` to keep formatting clean.
- **Hero Title Line Limits**: Hero titles must occupy a maximum of 3 lines on desktop and 3-4 lines on mobile. Scale font sizes (e.g. `xl:text-5xl` or `xl:text-6xl`) and use responsive `<br className="hidden md:inline" />` tags instead of absolute breaks.
- **Non-Overlapping Sticky Layouts**: Sibling components inside sticky sections must flow using relative flex vertical structures (`flex flex-col justify-between h-screen py-16`) to dynamically distribute space and prevent headers from overlapping with scroll elements.

## 7. Content Fidelity (No Omissions)
- **100% Content Retention**: Use 100% of the text provided in the user's copy document. Do not summarize, shorten, or combine sentences to fit component slots. Choose components that dynamically expand to accommodate the full copy length.
- **Verbatim List Labels**: Always check that list category labels (e.g., `B2B & Lead Generation`, `Medical & Healthcare`) match the original document capitalization and symbol usage exactly.

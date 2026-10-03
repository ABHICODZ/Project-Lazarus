---
name: Archival Folio
colors:
  surface: '#faf9f5'
  surface-dim: '#dbdad6'
  surface-bright: '#faf9f5'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f4f0'
  surface-container: '#efeeea'
  surface-container-high: '#e9e8e4'
  surface-container-highest: '#e3e2df'
  on-surface: '#1b1c1a'
  on-surface-variant: '#444748'
  inverse-surface: '#2f312e'
  inverse-on-surface: '#f2f1ed'
  outline: '#747878'
  outline-variant: '#c4c7c7'
  surface-tint: '#5f5e5e'
  primary: '#151616'
  on-primary: '#ffffff'
  primary-container: '#2a2a2a'
  on-primary-container: '#929191'
  inverse-primary: '#c8c6c5'
  secondary: '#605e5a'
  on-secondary: '#ffffff'
  secondary-container: '#e3dfd9'
  on-secondary-container: '#64625e'
  tertiary: '#350100'
  on-tertiary: '#ffffff'
  tertiary-container: '#560e05'
  on-tertiary-container: '#dc7360'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e4e2e1'
  primary-fixed-dim: '#c8c6c5'
  on-primary-fixed: '#1b1c1c'
  on-primary-fixed-variant: '#474746'
  secondary-fixed: '#e6e2dc'
  secondary-fixed-dim: '#c9c6c0'
  on-secondary-fixed: '#1c1c18'
  on-secondary-fixed-variant: '#484742'
  tertiary-fixed: '#ffdad4'
  tertiary-fixed-dim: '#ffb4a7'
  on-tertiary-fixed: '#400200'
  on-tertiary-fixed-variant: '#7e2b1e'
  background: '#faf9f5'
  on-background: '#1b1c1a'
  surface-variant: '#e3e2df'
typography:
  headline-xl:
    fontFamily: EB Garamond
    fontSize: 2.75rem
    fontWeight: '400'
    lineHeight: 3.25rem
    letterSpacing: -0.01em
  headline-xl-mobile:
    fontFamily: EB Garamond
    fontSize: 2rem
    fontWeight: '400'
    lineHeight: 2.5rem
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: EB Garamond
    fontSize: 2rem
    fontWeight: '400'
    lineHeight: 2.5rem
    letterSpacing: -0.005em
  headline-lg-mobile:
    fontFamily: EB Garamond
    fontSize: 1.625rem
    fontWeight: '400'
    lineHeight: 2.125rem
    letterSpacing: -0.005em
  headline-md:
    fontFamily: EB Garamond
    fontSize: 1.5rem
    fontWeight: '500'
    lineHeight: 2rem
    letterSpacing: '0'
  headline-sm:
    fontFamily: EB Garamond
    fontSize: 1.25rem
    fontWeight: '500'
    lineHeight: 1.75rem
    letterSpacing: '0'
  body-lg:
    fontFamily: EB Garamond
    fontSize: 1.25rem
    fontWeight: '400'
    lineHeight: 2.125rem
    letterSpacing: 0.01em
  body-md:
    fontFamily: EB Garamond
    fontSize: 1.125rem
    fontWeight: '400'
    lineHeight: 1.875rem
    letterSpacing: 0.01em
  body-sm:
    fontFamily: EB Garamond
    fontSize: 1rem
    fontWeight: '400'
    lineHeight: 1.625rem
    letterSpacing: 0.01em
  label-md:
    fontFamily: Courier Prime
    fontSize: 0.875rem
    fontWeight: '400'
    lineHeight: 1.375rem
    letterSpacing: 0.03em
  label-sm:
    fontFamily: Courier Prime
    fontSize: 0.75rem
    fontWeight: '400'
    lineHeight: 1.125rem
    letterSpacing: 0.05em
spacing:
  gutter: 2rem
  margin: 2rem
  space-xs: 0.5rem
  space-sm: 1rem
  space-md: 1.5rem
  space-lg: 2.5rem
  space-xl: 4rem
---

## Brand & Style

The design system embodies the tactile stillness and permanence of an archival reading room. It is designed for scholars, essayists, independent researchers, and collectors of slow thought who treat the web as a quiet library rather than a reactive stream. The emotional resonance is calm, contemplative, physical, and patient—eschewing digital sheen, floating cards, dashboards, or futuristic terminal mechanics in favor of a timeless literary artifact.

Drawing inspiration from editorial publishing, letterpress typography, and fine-bound codices, the design system adopts a **Minimalist Tactile-Editorial** aesthetic:
- **Paper Metaphor:** The canvas behaves as an uncoated rag sheet with high visual warmth, soaking in type rather than projecting light.
- **Physical Restraint:** Elevation is created strictly through typographic contrast, spacing, and faint ink rules. Floating panels, glass treatments, and drop shadows are entirely omitted.
- **Centering & Solitude:** The viewport strips away auxiliary sidebars and chrome, positioning the reader inside an intimate, single-column field of thought with generous marginalia.

## Colors

The palette simulates physical ink absorbed into heavy, uncoated cotton paper. Contrast is intentional and soft, eliminating harsh digital black and clinical pure white.

- **Canvas Neutral (`#F9F8F4`):** The primary paper substrate. A matte, warm archival ground with warm yellow-gray undertones that preserves reading comfort over extended hours.
- **Primary Ink (`#2A2A2A`):** Deep, soft charcoal ink. Carries high legibility for headlines, body prose, and core reading material while avoiding the clinical bite of `#000000`.
- **Secondary Graphite (`#7A7873`):** Muted lead pencil and aging graphite. Assigned to marginalia, timestamps, metadata, footnotes, and subtle rule dividers.
- **Tertiary Accent (`#9E4334`):** Faded brick red / terracotta stamp ink. Used sparingly for interactive hyperlinks, asterisks, critical margin markers, and reference anchors.

### Functional Mapping & Subdued Inks
- **Paper Surface Subtle (`#F2EFE9`):** Tone-on-tone tint for code block substrates, citation insets, and search bar backgrounds.
- **Hairline Rule (`#E5E0D8`):** Muted deckle and divider tone used for 1px hairline rules without mechanical hardness.
- **Interactive Hover (`#7D3427`):** Deeper, dry crimson for active pointer states on links and metadata toggles.
- **Selection Highlight (`#EFE6D8`):** Washed linen tint for textual selection and find states.

## Typography

The typography creates a deliberate dialogue between two classical instruments: the handset literary press (**EB Garamond**) and the mechanical typewriter ribbon (**Courier Prime**).

- **Literary Serif (EB Garamond):** Serves as the primary voice. All essays, notes, headings, and conversational narratives reside here. Generous line heights (`1.6` to `1.85`) allow eyes to traverse the page without fatigue, mirroring the proportions of classic trade paperbacks.
- **Typewriter Monospace (Courier Prime):** Reserved strictly for structural indexation: publish dates, reading durations, bibliographic tags, footnotes, and side marginalia. It introduces a physical, cataloged texture without evoking developer terminals.
- **Hyperlink Treatment:** Links do not use saturated blues or standard browser underlines. They use muted brick red (`#9E4334`) paired with an understated `text-decoration`: a 1px dotted or low-contrast solid underline offset by `4px` (`text-underline-offset: 4px`), fading softly into primary ink upon visited state.
- **Numerals & Italics:** Numbers inside running prose leverage oldstyle proportional figures where supported. Italicized Garamond serves as the primary instrument for emphasis, marginal glosses, and pulled citations.

## Layout & Spacing

The layout adopts a **Fixed-Column Book Page** model. Rather than stretching to fill panoramic viewports or splintering into asymmetric multi-pane dashboards, content is gathered into a single, focused column reminiscent of a fine monograph.

- **Reading Column Width:** The primary text column never exceeds `68ch` (approximately `680px` to `720px`). This guarantees optimal typographic measure.
- **Marginalia Gutter System:** On desktop viewports (`1200px` and above), a secondary column (`220px` wide) opens in the right margin, separated by a `3rem` gutter. This space houses typewriter footnotes, reference anchors, and contextual citations parallel to their reference paragraph.
- **Vertical Rhythm:** Paragraphs and section headings adhere to generous rhythmic intervals. Headings feature substantial top spacing (`space-xl`) to establish architectural breaks between thoughts, while sub-elements use tight baseline increments.
- **Responsive Adaptations:**
  - **Desktop (1200px+):** Centered reading column with active right-hand margin for typewriter annotations.
  - **Tablet (768px – 1199px):** Pure centered column; marginalia collapse into inline bibliographic callouts tucked directly below relevant paragraphs.
  - **Mobile (< 768px):** Outer margins contract to `1.25rem` (`margin-sm`), font sizes taper slightly via mobile typography tokens, and margins collapse completely into linear flow.

## Elevation & Depth

This design system deliberately eschews digital z-axis elevation. There are no box-shadows, layered floating panels, or frosted blur overlays.

- **Flat Deckle Depth:** Hierarchy is communicated entirely through 2D structural relationships: font weight, scale, tint gradation, and whitespace.
- **Hairline Surface Dividers:** When separation is necessary, the design uses crisp `1px` solid rules styled with the muted border tone (`#E5E0D8`). These mimic book signatures and chapter rules.
- **Tonal Insets:** Quoted manuscripts, code transcripts, and excerpted fragments receive a flat background shift to Paper Surface Subtle (`#F2EFE9`), inset with padding rather than raised by drop shadows.
- **Overlay State:** If an overlay (such as a search index) must occur, it replaces or floods the canvas with a full-sheet wash of `#F9F8F4`, preventing the perception of floating app windows.

## Shapes

The shape language is strictly **Sharp (`0`)**. Every element conforms to the rectilinear geometry of cut paper and letterpress printing blocks.

- **Zero Border Radius:** Buttons, input fields, quotation insets, code blocks, and metadata tags possess clean `0px` corners.
- **Physical Integrity:** Rounding elements softens the editorial weight and introduces an app-like vernacular that contradicts the archival identity. Corners remain unclipped, rectangular, and architectural.
- **Rule Lines:** Separators, underlines, and input bounds are rendered as true sharp geometric hairlines.

## Components

### Buttons
- **Primary:** Flat rectangular block with soft charcoal fill (`#2A2A2A`) and warm paper text (`#F9F8F4`). Typographic label in Courier Prime (`label-md`). Hover state transitions subtly to faded brick red (`#9E4334`) without lift.
- **Secondary / Text:** Borderless button styled in primary ink with an archival underline. On hover, the underline and text shift to tertiary brick red. Zero rounded corners.

### Chips & Tags
- Set in Courier Prime (`label-sm`).
- Styled as clean text brackets (e.g., `[archival/history]`) or encased in a 1px border of `#E5E0D8` with `0px` radius.
- Background remains transparent; never uses pill-shaped or bubbly badges.

### Lists
- **Prose Lists:** Prefixed by classical asterisks (`*`) or faded brick em-dashes (`—`) in tertiary accent ink (`#9E4334`), not synthetic bullet points.
- **Index Lists:** Two-column tabular ledger format where the entry title sits on the left in EB Garamond and the date/classification sits on the right in Courier Prime, connected by a subtle dotted baseline leader (`. . . . .`).

### Checkboxes & Radio Buttons
- **Checkboxes:** Sharp `14px` squares bounded by a 1px charcoal line (`#2A2A2A`). Checked state is marked with a simple typewriter `X` or solid charcoal inner fill block.
- **Radio Buttons:** Sharp diamond glyphs (`◇` / `◆`) or small unrounded square markers, rejecting the standard circular UI control.

### Input Fields
- Single-line and multiline fields are styled as flat baseline rules (`border-bottom: 1px solid #7A7873`) on the neutral paper background, evoking ruled legal pads.
- Focus state deepens the bottom border to `#2A2A2A` and accents it with a 1px brick red caret. No outer glowing rings or rounded containment boxes.
- Placeholder text is set in Courier Prime (`label-md`) colored with muted graphite (`#7A7873`).

### Cards & Grouping Containers
- Traditional self-contained cards are completely avoided.
- Content groupings are delineated through generous vertical whitespace (`space-lg`) or separated by a subtle centered horizontal divider (a single `* * *` printer's mark or 1px hairline rule).
- When content must be encased (e.g., primary source citations), it sits inside an unrounded rectangular block with a left border of `2px solid #9E4334` and a paper subtle background (`#F2EFE9`).

### Archival Marginalia & Footnotes
- Sits in the desktop gutter or collapses between prose blocks on mobile screens.
- Typeset in Courier Prime at `label-sm` using graphite ink (`#7A7873`).
- Numeric superscripts in the body text are set in faded brick red (`#9E4334`) and directly reference the corresponding margin note.
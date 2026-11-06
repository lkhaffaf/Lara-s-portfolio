# Vellum — design vocabulary

The design system for Lara Al-Khaffaf's portfolio. Named after architectural tracing
paper: **glass** for the interface, **paper** for the drawings, **renders** for the light.

Read this before any visual change. Every colour, size, radius, duration and easing in
`styles.css` is a token defined here. If a decision isn't covered, make it, then write it
down here before shipping it.

Sources: Emil Kowalski's design-engineering and Apple-design skills
(github.com/emilkowalski/skills, MIT), Apple's *Designing Fluid Interfaces* and
*Details of UI Typography*, and the reference reel (visionOS-style glass dashboard).

---

## 1. Principles

1. **The work is the hero.** Renders and drawings carry every page. The interface recedes:
   if a viewer remembers the UI before the buildings, it's too loud.
2. **Glass for chrome, paper for drawings.** Navigation, controls and windows are glass.
   Drawings always sit on paper. Never put a light glass surface on another light glass surface.
3. **Every value is a token.** No one-off pixel values for colour, radius, spacing, type or motion.
4. **Motion explains; it never decorates something seen often.** See the frequency table (§6).
5. **Direct and interruptible.** Respond on press. Drags track the pointer 1:1 and carry
   their velocity. Nothing locks input while it animates.
6. **Plain, specific words.** First person, British English, real numbers with units.

## 2. The slop list — never ship these

| Tell | Do this instead |
| --- | --- |
| Vanity stat cards ("4 projects", "100% passion") | Say it once in a sentence, or show the work. Real figures only (7 ha, 0.24 ha). |
| An icon in a tinted circle on every row | Icons only where they aid recognition: nav, dock, controls. |
| Uppercase tracked eyebrow above every heading | One eyebrow per page, at most. Sentence case everywhere else. |
| Gradient text, purple-blue AI gradients, glows | Colour comes from the renders. Tints are identity markers only. |
| Em-dash chains in copy | Full stops. One idea per sentence. |
| Hype words: passionate, innovative, stunning, elevate, seamless, journey, crafted | Concrete facts: tools, places, sizes, outcomes. |
| Every block wrapped in a card | Group with space first, hairlines second, surfaces last. |
| Bouncy hovers, tilt-on-hover, cursor trails, parallax everything | Hover lift ≤ 2px, `--d-hover`, ease. Bounce only after a flick. |
| An arrow-in-a-circle button on every card | The whole card is the link. |
| `transition: all`, `ease-in`, `scale(0)` entrances | Exact properties, `--ease-out`, `scale(0.95)` + opacity. |
| Long centred text | Left-aligned, max 65ch. Centre only one-line headlines. |
| Placeholder or borrowed imagery | Only Lara's work. Credit sources; label AI-assisted renders. |
| 3D for its own sake | 3D only when it explains a structure better than a drawing does. |

## 3. Layout

**Grid.** 12 columns, 16px gutter. Content max width 1240px. On desktop, 112px on the left
for the dock. Breakpoints: 560px (phone), 900px (tablet: dock hides, tab bar moves to the
bottom), 1100px (small laptop).

**Space** — 4pt scale. Use the token, never the number.

| Token | px | Use |
| --- | --- | --- |
| `--space-1` | 4 | icon to label |
| `--space-2` | 8 | inside controls, chip gaps |
| `--space-3` | 12 | heading to its text, caption gap |
| `--space-4` | 16 | gap between windows, grid gutter |
| `--space-5` | 24 | panel padding, text to media |
| `--space-6` | 32 | window padding (desktop) |
| `--space-7` | 48 | hero breathing room |
| `--space-8` | 64 | section breaks |
| `--space-9` | 96 | top of page under the nav |

**Radius — concentric.** A nested surface's radius = outer radius − inset, when the inset is
≤ 16px. With larger insets, use `--r-media`.

| Token | px | Use |
| --- | --- | --- |
| `--r-window` | 32 | windows (project header, chapters, hero frame) |
| `--r-panel` | 24 | panels, cards |
| `--r-media` | 16 | images inside panels |
| `--r-control` | 12 | inputs, small frames |
| `--r-pill` | 999 | buttons, tabs, segmented controls |

**Composition.**
- One focal element per viewport. If two things compete, one becomes smaller or quieter.
- Drawings: `object-fit: contain` on paper. Never crop a drawing.
- Renders: `object-fit: cover`. Crop with intent; keep the building's base in frame.
- Media spans: full, two-thirds, half, third. Mix at most two spans per row.

## 4. Typography

System font first: SF Pro on Apple devices (it switches between Text and Display optical
sizes automatically), Inter as the fallback elsewhere.

| Token | Size | Leading | Tracking | Weight | Use |
| --- | --- | --- | --- | --- | --- |
| `display` | 48 → 96 | 1.02 | −0.032em | 600 | Name on Home, project titles |
| `title-1` | 36 → 60 | 1.08 | −0.026em | 600 | Page titles |
| `title-2` | 24 → 32 | 1.15 | −0.018em | 600 | Chapter titles |
| `title-3` | 20 | 1.25 | −0.012em | 600 | Panel titles, index rows |
| `headline` | 17 | 1.3 | −0.008em | 600 | List items, emphasis |
| `body` | 17 | 1.55 | −0.008em | 400 | Paragraphs |
| `callout` | 15 | 1.5 | 0 | 400 | Secondary text, card summaries |
| `footnote` | 13 | 1.4 | 0 | 500 | Meta, captions, labels |
| `caption` | 12 | 1.35 | +0.01em | 500 | Smallest text. Never smaller. |

Rules:
- Tracking is size-specific: tighten as size grows, never one value for everything.
- Hierarchy comes from size, weight and colour together. At most three sizes per component.
- Body copy maxes out at 65ch.
- Numbers in lists, counters and dates use `font-variant-numeric: tabular-nums`.
- Over glass, text at 13px or below is weight 500 and at least `--ink-3` (vibrancy rule).
- Sentence case everywhere. The single permitted eyebrow uses `--tr-eyebrow` uppercase.

## 5. Colour and materials

**Ink** (text on glass): `--ink-1` #fff for titles, `--ink-2` 78% for body, `--ink-3` 62% for
meta. On paper: `--ink-on-paper` #1d1d1f. Hairlines: `--hairline` 14%, `--hairline-strong` 24%.

**Materials.** Bigger surfaces read as thicker: more blur, deeper shadow.

| Material | Fill | Blur | Use |
| --- | --- | --- | --- |
| Thin | rgba(44,44,50,.30) | 16px | Chips, tooltips, inline controls |
| Regular | rgba(34,34,40,.42) | 32px | Windows, panels, nav, dock |
| Thick | rgba(24,24,28,.64) | 40px | Overlays: lightbox bar, toast, menus over busy imagery |
| Paper | #fff | none | Drawings, plans, sections |
| Scrim | gradient to 62% black | none | Over the backdrop render, guarantees text contrast |

Every glass surface gets the light edge (`inset 0 1px 0 rgba(255,255,255,.2)`), so it
reads as material catching light rather than as a grey box.

**Project tints** — identity only: a dot, or a wash at ≤ 30% alpha on that project's card.
Never on text, never as a page background.

| Project | Tint |
| --- | --- |
| 01 Residential Renovation | `--tint-blue` |
| 02 Interior Design | `--tint-amber` |
| 03 Landscape Architecture | `--tint-green` |
| 04 Construction Studies | `--tint-violet` |

**Accessibility.** Body text must stay ≥ 4.5:1 over the scrimmed backdrop. Honour
`prefers-reduced-transparency` (glass becomes solid) and `prefers-contrast: more`
(near-solid fills, visible borders).

## 6. Motion

**Easing**

| Token | Curve | When |
| --- | --- | --- |
| `--ease-out` | cubic-bezier(0.23, 1, 0.32, 1) | Anything entering, appearing, responding. The default. |
| `--ease-in-out` | cubic-bezier(0.77, 0, 0.175, 1) | Something already on screen moving to a new place (tab pill, slider snap). |
| `--ease-drawer` | cubic-bezier(0.32, 0.72, 0, 1) | Sheets, lightbox slides, throws. |
| `ease` | built in | Hover colour and background changes only. |

Never `ease-in` for UI. Never `linear` except constant motion.

**Duration**

| Token | ms | Use |
| --- | --- | --- |
| `--d-press` | 140 | Press feedback |
| `--d-hover` | 200 | Hover |
| `--d-small` | 200 | Tooltips, toasts, small popovers |
| `--d-move` | 300 | Tab pill, segmented thumb, slider snap, lightbox slide |
| `--d-exit` | 160 | Leaving a page, closing overlays (exits are faster than entrances) |
| `--d-reveal` | 520 | Windows materialising on a new page |
| `--d-backdrop` | 900 | Backdrop render dissolving between pages (rare, explanatory) |
| `--stagger` | 40 | Between siblings entering together. Max 6 staggered items. |

**Should it animate?**

| How often it's seen | Decision |
| --- | --- |
| Constantly (keyboard nav, arrow keys in the lightbox) | No animation. |
| Often (hover, tab switches) | Subtle and fast (≤ 200ms). |
| Occasionally (page change, lightbox, compare slider) | Standard. |
| Rarely (first load, 3D intro turn) | Can carry delight. |

**Named motions.** Use these names in code comments and requests.

- **Materialise** — a glass window enters: opacity 0 → 1, translate 10px → 0, scale 0.985 → 1, `--d-reveal`, `--ease-out`, staggered.
- **Dissolve** — the backdrop render crossfades with a slow settle from scale 1.04 to 1.
- **Press** — `scale(0.97)` on `:active`, `--d-press`, `--ease-out`. Cards press to 0.985.
- **Lift** — hover only on fine pointers: translateY(−2px), `--d-hover`.
- **Slide-follow** — the tab pill or segmented thumb moves to the new item, `--d-move`, `--ease-in-out`.
- **Reveal** — clip-path wipes between existing and proposed drawings, tracking the pointer 1:1.
- **Blur-swap** — an image swap with a 2px blur during the crossfade, so two states never overlap visibly.
- **Rubber-band** — dragging past an edge moves less the further you go, then springs back.
- **Throw** — a drag released faster than 0.11 px/ms commits (dismiss, next image), whatever the distance.
- **Turntable intro** — a 3D model eases 30° into its resting angle once, on first view. Never loops.
- **Rise** — proposed buildings grow up from the ground in sequence (≈500ms, 7% offsets) when a model switches from Existing to Proposal. Explanatory, so it may run longer than UI motion; the reverse is the same path.
- **Layer fade** — a map layer fades in or out over ≈300ms ease-out. Layers never slide.

**Reduced motion.** Keep opacity and colour changes. Remove translation, scale, blur,
the backdrop zoom and the 3D intro turn.

## 7. Interaction

- **Press feedback** happens on pointer-down (`:active`). Every pressable thing has it.
- **Hover** styles live inside `@media (hover: hover) and (pointer: fine)`.
- **Tooltips** wait 400ms the first time, then appear instantly while the pointer moves
  between dock items, and stay "warm" for 600ms after leaving.
- **Compare slider.** Pointer-down anywhere on the drawing jumps the divider there, then tracks 1:1
  with pointer capture. Arrow keys move it 5%, Home and End go to the ends. The labels
  "Existing" and "Proposed" snap it to either end with Slide-follow. An expand button opens the lightbox.
- **Lightbox.** A modal, so it opens from the centre (scale 0.96 + opacity, `--d-small`) and closes in
  `--d-exit`. Horizontal drag tracks 1:1, rubber-bands at the first and last image, and moves
  to the next image after a Throw or a 25% drag. Vertical drag dims the backdrop as you go and
  dismisses after a Throw or 120px. Arrow keys change images instantly, with no animation.
- **3D viewer.**
  - Drag to orbit, with inertia on release. On touch, horizontal drags orbit and vertical
    swipes scroll the page (`touch-action: pan-y`). No scroll-wheel zoom, because it traps page scrolling.
  - Render on demand. Pause when off screen. Dispose of the scene when leaving the page.
  - If WebGL is unavailable, show Lara's drawing in its place.
  - Models built for the site are captioned as diagrams made for the website, never as Lara's own models.
  - A model exported from SketchUp (`.glb`) can replace a diagram (see README).
  - **Segmented control** chooses one state (Existing / Proposal, Building / Structure / Envelope).
    **Layer chips** toggle independent layers on and off; a pressed chip is white with dark text, and its
    colour dot matches the layer. Never use chips for exclusive choices or a segmented control for layers.
  - **Interior models** are cut like a section: any wall between the camera and the room fades out (≈200ms),
    its cut top drawn as dark poché. Elevation presets (A–D) match the labels on Lara's drawings and use
    the camera focus move (700ms ease-in-out). Turning the model by hand clears the preset.
  - **New work is blue**, as in Lara's drawings: the "New work" layer tints new brickwork and roofs blue.
  - **Site models** use architectural-model materials: a clay plinth, pale context buildings and trees,
    white proposed buildings with charcoal roofs, and site woodland in green. Constraint layers use the colours from
    Lara's own map legend, and are drawn over the canopy so they read like the map.
- **Keyboard parity.** Every gesture has a keyboard path, and every control has a visible focus ring.

## 8. Imagery

- Drawings on paper with a 3% inset. Never crop, tint or round them beyond the frame radius.
- Renders fill their frame. Captions sit under the image in sentence case, ideally 8 words or fewer.
- Label AI-assisted renders as such. Don't use third-party photographs. Cite academic sources at chapter end.
- Backdrops come from Lara's own renders, one per page, scrimmed.

## 9. Voice

- First person for Lara ("I produced…"), British spelling (modelling, visualisation).
- Numbers with units and real precision: 7 ha, 0.24 ha, 3.05 m, 60 ft.
- Ranges: an en dash with spaces between words ("May – Dec 2025"), unspaced between numbers ("2022–2025").
- Prefer: drawings, scheme, proposal, site, model, detail. Avoid the hype words in §2.
- Buttons are verbs: "View work", "Download CV", "Copy email".

## 10. Review checklist

- [ ] Nothing on the slop list (§2).
- [ ] Every new value is a token, and the token is in this file.
- [ ] Type follows the scale. No text under 12px. Body ≤ 65ch.
- [ ] Hovers are gated. Every pressable element presses.
- [ ] No `transition: all`, no `ease-in`, no `scale(0)`. UI motion ≤ 300ms.
- [ ] Exits are faster than entrances. Stagger ≤ 40ms.
- [ ] Drags track 1:1, accept Throws and rubber-band at edges.
- [ ] Reduced motion, reduced transparency and more contrast all checked.
- [ ] Works at 375px with no horizontal scroll. The tab bar never covers a control.
- [ ] Every image has alt text, and every drawing sits on paper.

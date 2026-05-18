---
name: Habitual
description: Personal fitness and language tracking PWA — warm navy, personal, ritual-first.
colors:
  bg: "#00090e"
  surface: "#00131d"
  surface-2: "#001c2b"
  surface-3: "#002539"
  border: "#003049"
  text-primary: "#fdf0d5"
  text-secondary: "#85afc9"
  text-tertiary: "#477fa2"
  football: "#c1121f"
  strength: "#f5ae22"
  speed: "oklch(0.67 0.20 38deg)"
  cardio: "oklch(0.63 0.17 150deg)"
  language: "#669bbc"
  injured: "oklch(0.73 0.16 62deg)"
  cancelled: "oklch(0.57 0.21 22deg)"
typography:
  title:
    fontFamily: "Space Grotesk, sans-serif"
    fontSize: "16px"
    fontWeight: 700
    lineHeight: 1.2
  body:
    fontFamily: "Space Grotesk, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Space Grotesk, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1
  mono-data:
    fontFamily: "JetBrains Mono, monospace"
    fontSize: "11px"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "0.1em"
rounded:
  sm: "8px"
  md: "10px"
  lg: "12px"
  xl: "14px"
  modal: "24px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
components:
  session-card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.xl}"
    padding: "12px 14px"
  status-pill:
    backgroundColor: "transparent"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.md}"
    padding: "8px 6px"
  status-pill-done:
    backgroundColor: "#22c55e14"
    textColor: "{colors.cardio}"
    rounded: "{rounded.md}"
    padding: "8px 6px"
  felt-btn:
    backgroundColor: "transparent"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.md}"
    padding: "8px 4px"
  felt-btn-active:
    backgroundColor: "#f5ae2214"
    textColor: "{colors.strength}"
    rounded: "{rounded.md}"
    padding: "8px 4px"
  week-nav-btn:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "8px 14px"
  stat-card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.xl}"
    padding: "14px"
  modal-cta:
    backgroundColor: "linear-gradient(135deg, #c1121f, #f5ae22)"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "12px 24px"
---

# Design System: Habitual

## 1. Overview

**Creative North Star: "The Training Log"**

Habitual is a record, not a motivator. It holds what happened without comment. You open it before a session to see your plan; you open it after to mark it done. The interface asks nothing of you beyond that. A field notebook doesn't clap when you write in it.

The palette is Naval Ink: deep warm navy with a hint of the sea, topped by papaya-cream text and five bright category voices. No cold-violet surfaces. No cobalt accents. No gradient that looks like an LLM product. The physical scene forces the answer: Connor unlocks his phone post-session, tired, thumb on glass. The interface reads warm, direct, and recognisably personal — like a tool he built for himself, not one he's borrowing from a startup.

Five category colors — Brick Red (football), Warm Gold (strength), Speed Amber, Cardio Emerald, Steel Blue (language) — carry all the visual energy. Their `color-mix` tints extend each voice at low opacity only. Outside the five voices and their tints, the surface is near-monochrome naval blue. The red-to-gold gradient on the progress bar is the one reward metaphor — fire building as the week fills up. This system explicitly rejects: gamified fitness app chrome (MyFitnessPal, Strava), productivity SaaS aesthetic (Notion, ClickUp), and AI product palettes (cobalt-to-violet gradients, cold dark surfaces, glowing blue accents, anything that reads "LLM interface").

**Key Characteristics:**
- Naval Ink foundation: deep warm navy in four tiers, zero box-shadows
- Papaya cream primary text against navy — warm and readable, not clinical white
- Five closed-vocabulary category colors; only `color-mix` tints at 4–15% opacity extend them
- Two-typeface system: Space Grotesk for UI, JetBrains Mono for data
- Red-to-gold gradient as the sole reward metaphor; no other gradients
- Bottom-sheet modals as the detail surface; no inline accordions
- Touch-first: 44px+ tap targets, safe-area insets, iPhone PWA optimised

## 2. Colors: The Naval Ink Palette

Warm navy depths, papaya cream warmth, and five categorical accents that earn their saturation by carrying meaning.

### Primary
- **Brick Red** (`#c1121f`): The main event. Football sessions and the de facto interactive signal across the whole app. Competitive, intense, completely non-AI. Focus rings, selected states, the today badge, the CTA button gradient anchor — wherever the app says "active" or "selected," it uses this.

### Secondary
- **Warm Gold** (`#f5ae22`): Strength sessions and the active state for felt-quality buttons across all physical session types. Power, achievement, weight. The gold end of the red-to-gold gradient. Against the navy surface it reads as warm firelight, not tech-gold.

### Tertiary
- **Speed Amber** (`oklch(0.67 0.20 38deg)`): Speed and sprint sessions only. Warm orange-amber — movement, energy, the colour of effort. Distinct from Warm Gold: amber is orange-dominant, gold is yellow-dominant.
- **Cardio Emerald** (`oklch(0.63 0.17 150deg)`): Cardio sessions and the done/completed state. Deep pitch emerald — deliberate and muted. Double duty: type identifier and primary success signal.
- **Steel Blue** (`#669bbc`): Chinese, Pimsleur, and Anki sessions. Calm, measured, cool. The one cool-toned voice; never repurposed for interactive state.

### Neutral
- **Abyss Navy** (`#00090e`): Page background. Deep warm navy — not purple-black, not grey-black. From the deep_space_blue palette.
- **Deep Shell** (`#00131d`): Primary surface. Session cards, bottom tab bar, stat cards.
- **Navy Shell** (`#001c2b`): Elevated overlays. Modal sheet background; desktop tab-switcher background.
- **Lifted Navy** (`#002539`): Embedded elements. Notes textarea, day-toggle buttons, callouts.
- **Slate Border** (`#003049`): All borders, dividers, progress tracks, button borders.
- **Papaya Cream** (`#fdf0d5`): Primary text. Warm parchment — not clinical white, not cold near-white. From the papaya_whip palette.
- **Steel Mist** (`#85afc9`): Secondary text and the skipped-session colour. Dusty mid-blue — readable against navy, warm enough to feel cohesive.
- **Gunmetal Blue** (`#477fa2`): Tertiary text. Date strings, arrow icons, placeholder copy, dim context.

### Status Signals
- **Injury Amber** (`oklch(0.73 0.16 62deg)`): Injured-session border override and status pill. Reserved exclusively for this state.
- **Cancelled Crimson** (`oklch(0.57 0.21 22deg)`): Cancelled-session indicator. Warmer and more orange-dominant than Brick Red — distinguishable even on a football card.

### Named Rules
**The Five Voices Rule.** Brick Red, Warm Gold, Speed Amber, Cardio Emerald, and Steel Blue are a closed vocabulary. No sixth accent color. The only permitted extension is `color-mix(in oklch, <voice> X%, transparent)` at 4–15% opacity — these are derived tints, not new colors. Category colors are never repurposed for UI states outside their defined roles.

**The Fire Gradient Rule.** Exactly one gradient exists: `linear-gradient(90deg, #c1121f, #f5ae22)` on the progress fill; `linear-gradient(135deg, #c1121f, #f5ae22)` on the modal CTA. Red to gold — fire building through the week. All other surfaces and buttons are flat solids. No cobalt-to-violet, no cool gradients, nothing that reads AI.

## 3. Typography

**UI Font:** Space Grotesk (Space Grotesk, sans-serif)
**Data Font:** JetBrains Mono (JetBrains Mono, monospace)

**Character:** Space Grotesk is warm-geometric — structured enough for a precision tool, approachable enough to open at 6am. JetBrains Mono is precision instrument — fixed-width characters make timestamps and percentages scannable at a glance. Against the papaya cream and navy palette, the pairing reads personal and athletic, not tech-startup.

### Hierarchy
- **Stat Value** (700, 28px, 1.0, JetBrains Mono): Large numbers in the history stats grid. The one "display" scale moment.
- **Modal Title** (700, 22px, Space Grotesk): Bottom-sheet and dialog headings.
- **Title** (700, 16px, Space Grotesk): Current week range in the header.
- **Card Name** (600, 15px, Space Grotesk): Session name inside each card; the text seen most often.
- **Body** (400, 14px, 1.5, Space Grotesk): Modal supplementary prose. Rare in this UI.
- **Label** (600, 12px, Space Grotesk): Status pills, felt buttons, week summary pills, modal section headings.
- **Mono Data** (500, 11px, `letter-spacing: 0.1em`, uppercase, JetBrains Mono): Timestamps, dates, duration badges, percentages, section dividers, HABITUAL wordmark.

### Named Rules
**The Mono Reserve Rule.** JetBrains Mono appears only on: timestamps and time slots, dates, percentages, duration badges, section dividers formatted as data headings, and the HABITUAL wordmark. All interactive labels use Space Grotesk. Mixing the two on a single interactive element is prohibited.

## 4. Elevation

The system uses tonal layering exclusively. No `box-shadow`. Depth is expressed through four warm navy surface tiers:

1. **Abyss Navy (`#00090e`)**: Base canvas. Nothing sits on it directly.
2. **Deep Shell (`#00131d`)**: Primary content — session cards, tab bar, stat cards.
3. **Navy Shell (`#001c2b`)**: Overlays — modal bottom sheet, desktop tab-switcher.
4. **Lifted Navy (`#002539`)**: Embedded elements — notes textarea, day toggles, modal callouts.

The modal overlay uses `backdrop-filter: blur(6px)` with `rgba(0,9,14,0.85)` — structural separation, not decorative.

### Named Rules
**The Shadow-Free Rule.** No `box-shadow`. Depth is surface tier only. The modal backdrop blur is structural, used exactly once, not replicated elsewhere.

## 5. Components

### Session Card
The primary unit of the interface.

- **Shape:** 14px radius. 1.5px full border in the category color.
- **Background:** Deep Shell (`#00131d`).
- **Type Accent:** 10px category-color dot in header, reinforced by the full category-color border. Note: full four-sided border is under evaluation — do not replicate on new components without deliberate review.
- **Status states:** `done` fades to 55% opacity; `cancelled` and `skipped` to 45%; `injured` overrides borders to Injury Amber.
- **Interaction:** Tap opens Session Modal. Quick-done circle in header toggles done/pending without opening modal.
- **Indicator:** A `>` chevron (14px SVG, Gunmetal Blue) signals tappability.
- **Tap target:** Minimum 44px height.

### Session Modal (The Briefing Room)
Bottom sheet on mobile (24px top corners), centered dialog on desktop (20px all corners). Tap in, get your plan, act, tap out.

- **Header (fixed):** Session name (18px/700/Space Grotesk, Papaya Cream), time slot input (11px/JetBrains Mono, Gunmetal Blue), bottom border as `1.5px solid color-mix(in oklch, <typeColor> 25%, #003049)`.
- **Body (scrollable):** Status pills → Felt rating (physical only) → Notes textarea → Workout Plan panel (physical only).
- **Max height:** 88vh; body `overflow-y: auto`; header fixed via flex `shrink-0`.

### Workout Plan Panel
Read-only exercise brief for football, strength, speed, cardio sessions.

- **Shape:** 12px radius. Border: `color-mix(in oklch, <typeColor> 20%, #003049)`.
- **Header strip:** `color-mix(in oklch, <typeColor> 6%, #00131d)` background. Plan title (13px/700/Space Grotesk, Papaya Cream) left; duration badge (10px/JetBrains Mono/uppercase, category-color tint) right.
- **Exercise rows:** Number (11px/JetBrains Mono, Gunmetal Blue), name (13px/Space Grotesk, Papaya Cream), detail (11px/JetBrains Mono, category color, right-aligned). Division Line dividers between rows.
- **Tip footer:** 4% category-color tint background. 12px/Space Grotesk/italic, Steel Mist.
- **Plan selection:** Deterministic via `session.id % plan_count`. Consistent per session.

### Status Pills
Inside the Session Modal.

- **Default:** 1.5px Slate Border border, transparent, Steel Mist text, 10px radius, 8px 6px padding.
- **Active:** Matching status color for border, text, and 8% opacity tint. Variants: done (Cardio Emerald), injured (Injury Amber), cancelled (Cancelled Crimson), skipped (Steel Mist).
- **Physical:** four pills (Done, Injured, Cancelled, Pending). Chinese: three pills (Done, Skipped, Pending).

### Felt Buttons
Quality rating (Great / Good / Okay / Tough). Physical sessions only, inside Session Modal.

- **Default:** 1.5px Slate Border border, transparent, Steel Mist text, 10px radius.
- **Active:** Warm Gold (`#f5ae22`) border, text, and 14% opacity tint — consistent across all physical session types.
- **Hover:** Warm Gold at reduced opacity.

### Notes Textarea
Autosaved after 900ms debounce.

- **Background:** Lifted Navy (`#002539`); 1.5px Slate Border border; 10px radius.
- **Focus:** Brick Red at 30% opacity border shift — the only focus ring in the system.
- **Placeholder:** Gunmetal Blue. Text: "Add a note…"
- **Resize:** disabled.

### Week Navigation Buttons
Header prev/next controls.

- **Default:** Navy Shell background, 1px Slate Border border, Papaya Cream text, 10px radius.
- **Hover:** Lifted Navy background.

### Modal CTA Button
Full-width primary action on bottom-sheet modals.

- **Background:** `linear-gradient(135deg, #c1121f, #f5ae22)` — the Fire Gradient, the only component permitted to carry it.
- **Text:** `#ffffff`, 13px/600/Space Grotesk.
- **Active:** Opacity 0.90.

### Bottom Tab Bar
Mobile-only; hidden at `md` breakpoint.

- **Background:** Deep Shell; 1px Slate Border top border.
- **Inactive:** Gunmetal Blue icon and label.
- **Active:** Brick Red icon and label.
- **Safe area:** `env(safe-area-inset-bottom)`.

### Stat Card
- **Shape:** 14px radius; 1px Slate Border border; 14px padding.
- **Value:** 28px/700/JetBrains Mono; Papaya Cream.
- **Label:** 12px/400/Space Grotesk; Steel Mist; 4px top margin.

### Progress Bar
- **Track:** 3px height, Slate Border background, 2px radius, `overflow: hidden`.
- **Fill:** `linear-gradient(90deg, #c1121f, #f5ae22)`; `transition: width 0.4s ease`. Width only — no layout property animated.

## 6. Do's and Don'ts

### Do:
- **Do** use the five category colors exactly as defined: Football `#c1121f`, Strength `#f5ae22`, Speed `oklch(0.67 0.20 38deg)`, Cardio `oklch(0.63 0.17 150deg)`, Language `#669bbc`. Their meaning is established; deviation silently breaks the vocabulary.
- **Do** extend category colors only via `color-mix(in oklch, <color> X%, transparent)` at 4–15% opacity.
- **Do** use JetBrains Mono only for data. Every interactive label uses Space Grotesk.
- **Do** express depth through surface tier escalation only. No shadows.
- **Do** keep tap targets at minimum 44×44px.
- **Do** use opacity shifts (45–55%) to convey done/cancelled/skipped states.
- **Do** treat the Session Modal as a briefing room: fast entry, clear hierarchy, fast exit.

### Don't:
- **Don't** add gamified elements: streaks, rings, confetti, motivational copy. Anti-references: MyFitnessPal, Strava.
- **Don't** use the productivity SaaS aesthetic: light theme, card grids, hero-metric templates. Anti-references: Notion, ClickUp.
- **Don't** use any palette that reads "AI product": cobalt-to-violet gradients, cold blue-purple dark surfaces, glowing accents. Anti-reference: Cursor, Perplexity, any LLM interface. The app uses AI as a tool; it must not look like one.
- **Don't** add a sixth category color or repurpose the existing five for new UI states.
- **Don't** use gradient text (`background-clip: text`). The Fire Gradient lives on the progress fill and CTA only.
- **Don't** use glassmorphism beyond the modal overlay blur.
- **Don't** use `box-shadow` for any purpose.
- **Don't** introduce a light theme.
- **Don't** animate layout properties.
- **Don't** open session detail inline. The accordion pattern is retired.
- **Don't** replicate the full-border category-color card pattern on new components without deliberate review.

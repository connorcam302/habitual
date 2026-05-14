---
name: Habitual
description: Personal fitness and language tracking PWA — dark, precise, ritual-first.
colors:
  bg: "#080810"
  surface: "#0f0f1c"
  surface-2: "#16162a"
  surface-3: "#1e1e35"
  border: "#2a2a45"
  text-primary: "oklch(0.94 0.008 275deg)"
  text-secondary: "oklch(0.53 0.018 276deg)"
  text-tertiary: "oklch(0.40 0.014 276deg)"
  football: "oklch(0.57 0.24 258deg)"
  strength: "oklch(0.58 0.27 297deg)"
  speed: "oklch(0.67 0.20 38deg)"
  cardio: "oklch(0.63 0.17 150deg)"
  language: "oklch(0.70 0.14 207deg)"
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
    padding: "13px 14px"
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
    rounded: "{rounded.sm}"
    padding: "7px 4px"
  felt-btn-active:
    backgroundColor: "#a855f714"
    textColor: "{colors.strength}"
    rounded: "{rounded.sm}"
    padding: "7px 4px"
  week-nav-btn:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "8px 14px"
  stat-card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.xl}"
    padding: "14px"
---

# Design System: Habitual

## 1. Overview

**Creative North Star: "The Performance Shell"**

The interface has one job: disappear. Habitual is built for daily use by one person — a morning glance, an evening tap, a quiet record of accumulated effort. Every decision in this system asks whether it helps the user log a session faster and exit cleanly, or adds weight to what should be a frictionless ritual.

The palette is deep Midnight Ink: near-black with a cold violet undertone that reads dark and deliberate under bedroom lighting at 7am and office fluorescents at 9pm. No light mode; the physical scene forces the answer. Connor unlocks his phone post-session, tired, thumb on glass. The interface needs to be readable, tappable, and forgettable in the best sense.

Five category colors — Football Blue, Strength Purple, Speed Orange, Cardio Green, Language Cyan — are the only color that isn't functional infrastructure. They earn their saturation by carrying semantic meaning. Outside of them, the system is near-monochrome: tinted blacks, one gradient progress fill that earns its place as the sole visual reward metaphor. This system explicitly rejects the gamified fitness app aesthetic (streaks, rings, confetti, motivational copy) and the productivity SaaS chrome (card grids, light-mode defaults, feature-heavy interfaces designed to impress a demo rather than support a habit).

**Key Characteristics:**
- Midnight Ink foundation with four tonal surface depths; no box-shadows
- Five closed-vocabulary category colors; no other accents
- Two-typeface system: Space Grotesk for all UI copy, JetBrains Mono for data only
- Touch-first: 44px+ tap targets, safe-area inset awareness, iOS PWA optimized
- Component states use opacity and tint shifts; never shape or size changes

## 2. Colors: The Midnight Ink Palette

A near-black neutral ramp with a persistent cold violet undertone, anchored by five semantic category accents and two status signals.

### Primary
- **Football Cobalt** (`oklch(0.57 0.24 258deg)`): The de facto interactive signal. Deep cobalt indigo — not sky blue, not Tailwind default. Progress fill, active tab state, selected office-day indicators, today badge, textarea focus ring. Wherever the UI needs to communicate "current" or "selected."

### Secondary
- **Strength Violet** (`oklch(0.58 0.27 297deg)`): Strength session type; the active color for felt-quality buttons (all physical session types, regardless of their own type color). Electric violet, pulled toward UV rather than lavender. Paired with Football Cobalt in the one permitted gradient.

### Tertiary
- **Speed Amber** (`oklch(0.67 0.20 38deg)`): Speed and sprint sessions only. Amber-coral rather than construction orange; warm contrast against the cold neutral base; never used for interactive state signals.
- **Cardio Emerald** (`oklch(0.63 0.17 150deg)`): Cardio sessions and the done/completed state across all session types. Deep pitch emerald — less neon, more deliberate. Double duty: type identifier and primary success signal.
- **Language Arctic** (`oklch(0.70 0.14 207deg)`): Chinese, Pimsleur, and Anki sessions. Arctic precision cyan; never repurposed for interactive state.

### Neutral
- **Midnight Void** (`#080810`): The deepest canvas. Page background only; nothing sits on it directly. Slightly violet-tinted — never pure black.
- **Obsidian Shell** (`#0f0f1c`): Primary surface. Session cards, bottom tab bar, stat cards, week history rows.
- **Lifted Surface** (`#16162a`): Elevated overlays. Modal sheet background; desktop inline tab-switcher background.
- **Inset Surface** (`#1e1e35`): Embedded elements. Notes textarea, day-toggle buttons, modal note callouts.
- **Division Line** (`#2a2a45`): All borders, dividers, progress tracks, icon-button borders.
- **Titanium White** (`oklch(0.94 0.008 275deg)`): Primary text. Violet-tinted near-white; belongs to the same hue family as the surface ramp.
- **Muted Slate** (`oklch(0.53 0.018 276deg)`): Secondary text. Violet-tinted mid gray — not a neutral gray pasted from another system. Time slots, subtitles, inactive navigation labels. Doubles as the Skipped-status color.
- **Dim Slate** (`oklch(0.40 0.014 276deg)`): Tertiary text. Same violet undertone, darker. Date strings, chevrons, placeholder copy, disabled context.

### Status Signals
- **Injury Amber** (`oklch(0.73 0.16 62deg)`): Deep amber with more character than generic yellow-amber. Injured-session border override and status pill. Reserved strictly for this state.
- **Cancelled Crimson** (`oklch(0.57 0.21 22deg)`): Deep red-orange crimson. More intentional than flat red. Cancelled-session indicator; never used decoratively.

### Named Rules
**The Five Voices Rule.** Football, Strength, Speed, Cardio, and Language are a closed vocabulary. They identify session types and map to status signals; they are never repurposed for decoration or UI state outside their defined roles. No sixth accent color is permitted.

**The Gradient Exception Rule.** Exactly one gradient exists: `linear-gradient(90deg, #3b82f6, #a855f7)` on the progress fill; `linear-gradient(135deg, #3b82f6, #a855f7)` on the modal CTA. These are the system's sole reward metaphor. All other surfaces, buttons, and containers are flat solids.

## 3. Typography

**UI Font:** Space Grotesk (Space Grotesk, sans-serif)
**Data Font:** JetBrains Mono (JetBrains Mono, monospace)

**Character:** Space Grotesk is warm-geometric: structured enough for a precision tool, approachable enough to open at 6am. JetBrains Mono reads as precision instrument; fixed-width characters make timestamps and percentages scannable at a glance. The pairing reads athletic-professional, not tech-startup.

### Hierarchy
- **Stat Value** (700, 28px, 1.0 line-height, JetBrains Mono): Large numbers in the history stats grid. The one "display" scale moment; confined to this context.
- **Modal Title** (700, 22px, Space Grotesk): Sheet and dialog headings.
- **Title** (700, 16px, Space Grotesk): Current week range in the header. Not used for body content.
- **Card Name** (600, 15px, Space Grotesk): Session name inside each card; the text seen most often.
- **Body** (400, 14px, 1.5 line-height, Space Grotesk): Modal subtitles and supplementary prose. Rare in this UI.
- **Label** (600, 12px, Space Grotesk): Status pills, felt buttons, week summary pills. All interactive labels.
- **Mono Data** (500, 11px, `letter-spacing: 0.1em`, uppercase, JetBrains Mono): Day labels, time slots, dates, section dividers, the HABITUAL wordmark, percentage readouts.

### Named Rules
**The Mono Reserve Rule.** JetBrains Mono appears only on: timestamps and time slots, dates and date ranges, percentage values, the HABITUAL wordmark, and section dividers formatted as data headings. Interactive copy (buttons, pills, tab labels) always uses Space Grotesk. Mixing the two faces on a single interactive element is prohibited.

## 4. Elevation

The system uses tonal layering exclusively. No `box-shadow` declarations appear anywhere. Depth is expressed through four surface tiers, each progressively lighter:

1. **Midnight Void (`#080810`)**: The base canvas. Nothing lives here except the page background itself.
2. **Obsidian Shell (`#0f0f1c`)**: Primary content surfaces — session cards, tab bar, stat cards, week history rows.
3. **Lifted Surface (`#16162a`)**: Overlays above content — the office-day modal sheet, the desktop tab-switcher pill.
4. **Inset Surface (`#1e1e35`)**: Elements embedded within a surface — notes textarea, day toggles, modal note callouts.

The modal overlay additionally uses `backdrop-filter: blur(6px)` with `rgba(8, 8, 16, 0.85)` — functional frosting that separates the sheet from content behind it, not a decorative pattern.

### Named Rules
**The Shadow-Free Rule.** No `box-shadow` in this system. A component appearing to "float" is achieved by assigning it a higher surface tier, not by adding a shadow beneath it. The sole exception is `backdrop-filter: blur(6px)` on the modal overlay — structural, used exactly once, not to be replicated decoratively.

## 5. Components

### Session Card
The primary unit of the entire interface. Every design decision should serve or defer to it.

- **Shape:** Generously rounded (14px radius). 1px Division Line border.
- **Background:** Obsidian Shell (`#0f0f1c`).
- **Type Accent:** 4px left-border in the category color, reinforced by an 8px type dot in the card header. Note: the left-stripe is a legacy pattern and the one deviation from the Shadow-Free/anti-stripe doctrine; future iterations should replace it with increased type-dot prominence alone.
- **Status states:** `done` fades to 55% opacity; `cancelled` and `skipped` to 45%; `injured` overrides the left-border to Injury Amber. States use opacity and border-color; no shape or size change.
- **Expansion:** CSS `grid-template-rows` animation (`0fr` to `1fr`), 280ms ease. Not a height or max-height animation.
- **Tap target:** Full card surface is tappable; inner padding ensures minimum 44px height.

### Status Pills
Inline status selectors inside an expanded session card.

- **Default:** 1.5px Division Line border, transparent background, Muted Slate text, 10px radius, 8px 6px padding.
- **Active:** Matching status color for border, text, and 14% opacity background tint. Variants: done (Cardio Green), injured (Injury Amber), cancelled (Cancelled Red), skipped (Muted Slate).
- **Physical sessions:** four pills (Done, Injured, Cancelled, Pending). Chinese sessions: two pills (Done, Skipped).

### Felt Buttons
Subjective session-quality rating for physical sessions only (Great / Good / Okay / Tough).

- **Default:** 1.5px Division Line border, transparent, 8px radius, 7px 4px padding, Muted Slate text.
- **Active:** Strength Purple (`#a855f7`) border and tint — consistent across all physical session types. The felt system uses a single accent regardless of session type.
- **Hover:** Strength Purple at 40% opacity border, Strength Purple text.

### Notes Textarea
Full-width freeform field at the bottom of every expanded card.

- **Background:** Inset Surface (`#1e1e35`); border: 1.5px Division Line; radius 10px.
- **Focus:** Football Blue at 25% opacity (`#3b82f640`) border shift. The only focus ring in the system; no outline or glow.
- **Placeholder:** Dim Slate (`#4b5563`).

### Week Navigation Buttons
Header prev/next week controls.

- **Shape:** 10px radius; 8px 14px padding.
- **Default:** Lifted Surface background, 1px Division Line border, Titanium White text (18px unicode ‹ ›).
- **Hover:** Inset Surface background.
- No icon library dependency.

### Modal CTA Button
The one full-width primary action in the system (Start Week / Save Changes).

- **Shape:** 14px radius; 100% width; 16px padding.
- **Background:** `linear-gradient(135deg, #3b82f6, #a855f7)` — the only component permitted to carry the gradient.
- **Text:** `#ffffff`, 16px/700/Space Grotesk.
- **Active:** Opacity 0.85.

### Bottom Tab Bar
Mobile-only navigation (hidden at desktop breakpoint ≥ 768px; replaced by inline header pill).

- **Background:** Obsidian Shell; top border: 1px Division Line.
- **Inactive:** Dim Slate icon (emoji, 20px) and label (11px/600/Space Grotesk).
- **Active:** Football Blue icon and label.
- **Safe area:** Bottom padding respects `env(safe-area-inset-bottom)` for iPhone.

### Stat Card
Read-only data container in the All Time view.

- **Shape:** 14px radius; 1px Division Line border; 14px padding.
- **Value:** 28px/700/JetBrains Mono; Titanium White.
- **Label:** 12px/400/Space Grotesk; Muted Slate; `margin-top: 4px`.
- **Grid:** 2-column mobile; 4-column desktop (≥ 768px).

### Progress Bar
The only animating element in the weekly view.

- **Track:** 3px height, Division Line background, 2px radius, `overflow: hidden`.
- **Fill:** `linear-gradient(90deg, #3b82f6, #a855f7)`; `transition: width 0.5s ease`. Width change is a style update, not a layout animation.

## 6. Do's and Don'ts

### Do:
- **Do** use the five category colors exactly as defined: Football `#3b82f6`, Strength `#a855f7`, Speed `#f97316`, Cardio `#22c55e`, Language `#06b6d4`. Their meaning is established across the app; any deviation silently breaks the vocabulary.
- **Do** use JetBrains Mono only for data: timestamps, dates, percentages, section dividers formatted as headings, and the HABITUAL wordmark. Every other label, button, or UI copy uses Space Grotesk.
- **Do** express depth through surface tier escalation (bg → surface → surface-2 → surface-3). Surface tier is the only depth tool.
- **Do** keep all tap targets at a minimum 44x44px. This is an iPhone PWA used post-workout; precision is unreliable.
- **Do** use opacity shifts (45–55%) to convey completed or inactive session states. Shape, size, and the color palette itself stay constant.
- **Do** let the category colors do the visual work. They are the only saturation in the palette; they do not need competition from decorative accents.

### Don't:
- **Don't** add gamified elements: streaks, completion rings, animated confetti, "Great job!" copy, motivational nudges. The explicit anti-references are MyFitnessPal and Strava. Habitual records; it does not celebrate or congratulate.
- **Don't** use the productivity SaaS aesthetic: a light theme, identical card grids, the hero-metric template (large number, gradient accent, sub-stats beneath). The app is a tool for one person, not a dashboard for a team.
- **Don't** add a sixth category color or repurpose existing category colors for new UI states. The Five Voices Rule is non-negotiable.
- **Don't** use gradient text (`background-clip: text`). The Football-to-Purple gradient lives on the progress fill and modal CTA only; it does not appear on type.
- **Don't** use glassmorphism beyond the modal overlay blur. Blurred-background cards, tooltips, or nav elements are prohibited.
- **Don't** extend the `border-left` side-stripe pattern to new components. The session card's left accent is a legacy pattern to phase out, not replicate.
- **Don't** introduce a light theme or theme toggle. The Midnight Ink palette is non-negotiable for this use case.
- **Don't** use `box-shadow` for any purpose. The Shadow-Free Rule is absolute.

---
product: Habitual
standard: 2
theme: warm-dark
languages:
  - en
  - zh-CN
categories:
  - strength
  - cardio
  - sport
  - mobility
  - recovery
  - learning
  - lifestyle
  - other
---

# Habitual Design Standard

## Creative North Star

Habitual should feel like a quiet personal weekly ledger: focused, warm, and easy to return to. It is a private planning tool, not a social fitness app, generic productivity dashboard, or AI chat product.

The interface should foreground the user's week and next action. AI remains a useful planning capability behind clear controls, never the visual personality of the product.

## Experience Principles

### Make the week legible

- The current week is the primary surface.
- Activity name, day, time, duration, category, and status should be scannable.
- Session briefs appear when the user opens a session, not as dense card copy.
- Empty states should explain the next action clearly.

### Keep profiles approachable

- Guided setup should break the profile into understandable sections.
- Repeated items such as goals, activities, and availability use consistent row patterns.
- Required information and validation errors appear near the relevant field.
- Profile editing in Settings uses the same language and controls as setup.

### Support any activity

- Custom activity names are always more prominent than broad categories.
- Category treatment provides orientation without making assumptions about the activity.
- Do not use football, gym, or any other specific routine as a universal visual model.
- Status and tracking controls may differ only where the distinction is meaningful.

### Build trust in planning

- Label plan creation and adjustment clearly.
- Show proposed changes for review before applying them.
- Keep exceptions, limitations, and temporary notes visible during planning.
- Use plain language for errors and never imply a failed plan was applied.

## Information Architecture

The main product surfaces are:

1. **Profile setup**: required onboarding for goals, activities, commitments, availability, and planning details.
2. **Week**: the primary schedule and tracking view.
3. **Plan or adjust week**: weekly exceptions, proposal review, and apply flow.
4. **Session detail**: actionable brief and outcome tracking.
5. **History**: recent activity and completion patterns.
6. **Settings**: profile editing, language, account, and owner controls.

Navigation should remain shallow. The user should be able to reach the week, history, and settings without navigating through AI-specific screens.

## Visual Foundation

### Color

The interface uses a warm dark neutral foundation with restrained semantic accents.

| Role | Token | Use |
| --- | --- | --- |
| App background | `--bg` | Page background |
| Primary surface | `--surface` | Cards and panels |
| Raised surface | `--surface-2` | Interactive and nested panels |
| Selected surface | `--surface-3` | Selected and active states |
| Border | `--border` | Dividers and outlines |
| Primary text | `--text` | Main content |
| Secondary text | `--text-muted` | Supporting content |
| Tertiary text | `--text-dim` | Low-emphasis metadata |

Category color is a compact cue, not a full-card fill:

| Category | Semantic treatment |
| --- | --- |
| Strength | Gold |
| Cardio | Emerald |
| Sport | Brick red |
| Mobility | Amber |
| Recovery | Recovery amber |
| Learning | Steel blue |
| Lifestyle | Muted neutral |
| Other | Border neutral |

Status colors must remain distinct from category colors. Red is reserved for destructive actions, cancellation, or important warnings. Avoid blue-violet AI gradients and decorative glow.

### Typography

- Use Space Grotesk for interface text and headings.
- Use JetBrains Mono for compact times, durations, scores, and technical metadata.
- Prefer sentence case.
- Keep headings concise and informative.
- Maintain readable line lengths and avoid dense all-caps labels.

### Layout and spacing

- Design mobile-first with a comfortable single-column reading order.
- Use consistent spacing steps and align related controls.
- Maintain at least 44 by 44 pixel touch targets.
- Keep primary actions easy to reach without crowding secondary actions.
- Use borders and surface contrast for hierarchy; avoid decorative shadows.

### Motion

- Motion should clarify state changes, selection, or navigation.
- Keep transitions brief and subtle.
- Respect reduced-motion preferences.
- Avoid decorative loops, excessive celebration, and motion that delays interaction.

## Component Standards

### Profile setup and editor

- Present goals, preferred activities, recurring commitments, availability, and planning details as distinct sections.
- Use consistent add, edit, and remove patterns for repeated rows.
- Explain the minimum completion requirements.
- Preserve entered values when validation fails.
- Long forms should remain easy to scan on mobile.

### Week header and planner actions

- Make the displayed week and user context unambiguous.
- Use one clear action for creating or adjusting the week.
- Weekly exceptions should be editable before proposal generation.
- Do not present the planner as an open-ended chat interface.

### Session cards

- Lead with the custom activity name.
- Show category, scheduled time, duration, and status as supporting information.
- Use category color sparingly as an edge, marker, or compact label.
- Keep status readable without relying on color alone.

### Session detail

- Show the AI-generated session brief as concise actionable guidance.
- Physical activity categories may record Done, Injured, Cancelled, or Pending.
- Learning and lifestyle activities may record Done, Skipped, or Pending.
- Tracking controls must use clear labels and comfortable touch targets.

### Proposal review

- Clearly distinguish existing sessions, proposed additions, replacements, and removals.
- Give users a final review step before applying.
- Describe conflicts and validation errors in plain language.
- Never visually imply success before the server confirms the transaction.

### History

- Group and summarize custom activities without assuming fixed routines.
- Show completion and felt ratings where available.
- Use category and status consistently with the week view.
- Keep the view useful for reflection, not competition.

## Language and Content

- Every user-facing workflow must support English and Simplified Chinese.
- Translation keys should express meaning, not mirror English word order.
- Allow layouts to expand for translated labels.
- Dates, weekdays, and times should follow the user's locale where practical.
- Use supportive, direct language. Avoid shame, hype, and sports clichés.

## Accessibility

- Meet WCAG AA contrast for text and interactive controls.
- Do not communicate category, status, or validation using color alone.
- Provide visible focus states and semantic labels.
- Keep keyboard navigation functional for all forms and dialogs.
- Ensure dialogs trap focus and return it to the triggering control.
- Announce loading, success, and error states appropriately.

## Design Review Checklist

- Does the screen work for an arbitrary custom activity?
- Is the current user and week clear?
- Is the primary action obvious without dominating the screen?
- Are profile and planning requirements explained in plain language?
- Does the flow work in English and Simplified Chinese?
- Are touch targets, contrast, focus, and error states accessible?
- Does AI feel like a planning capability rather than the product's visual identity?
- Has any old user-specific or routine-specific assumption leaked into the design?

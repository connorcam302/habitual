# Weekly Plan — Project Brief

## Overview

A personal PWA to track a fixed weekly fitness and language learning schedule. Built from scratch, deployable on a self-hosted Dokploy server, installable on iPhone as a home screen app, and accessible on Windows PC in a browser.

---

## Weekly Schedule

| Day | Type | Session | Time |
|-----|------|---------|------|
| Monday | Speed | Dynamic warmup | 7:30 – 7:50 |
| Monday | Speed | Sprint & plyo block | 7:50 – 8:10 |
| Monday | Strength | Lower body strength | 8:10 – 8:40 |
| Monday | Chinese | Anki | 21:30 – 21:40 |
| Tuesday | Football | 5-a-side football | 19:00 – 20:00 |
| Tuesday | Chinese | Anki | 21:30 – 21:40 |
| Wednesday | Strength | Upper body & core | Before work |
| Wednesday | Chinese | Pimsleur (commute) | Commute × 2 |
| Wednesday | Cardio | Zone 2 jog | 19:30 – 20:00 |
| Wednesday | Football | Ball mastery drills | 20:00 – 20:30 |
| Thursday | Chinese | Pimsleur (commute) | Commute × 2 |
| Thursday | Football | 5-a-side football | 20:00 – 21:00 |
| Thursday | Chinese | Anki | 21:30 – 21:40 |
| Friday | Chinese | Pimsleur (commute) | Commute × 2 |
| Sunday | Football | 11-a-side match | 10:30 |

> Saturday is always free. Pimsleur commute sessions are only generated on office days.

---

## Session Types & Colours

| Type | Colour |
|------|--------|
| Football | Blue |
| Strength | Purple |
| Speed | Orange |
| Cardio | Green |
| Chinese | Cyan |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Database | PostgreSQL |
| API | Node.js / Express |
| Frontend | Vanilla HTML / CSS / JS — no framework, no build step |
| Styling | Tailwind CSS via CDN |
| Deployment | Dokploy (self-hosted home server) |
| Tunnel | Cloudflare Tunnels (HTTPS handled automatically) |
| Mobile | iPhone PWA via Safari → Add to Home Screen |
| Desktop | Windows PC browser |

---

## Repo Structure

```
weekly-plan/
  api/
    server.js
    package.json
    Dockerfile
  db/
    schema.sql
  frontend/
    index.html
    manifest.json
  widget/
    weekly-plan.js
  README.md
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/sessions?week=YYYY-MM-DD` | Get all sessions for a week |
| `POST` | `/api/seed?week=YYYY-MM-DD` | Seed a week with sessions |
| `POST` | `/api/seed-auto` | Auto-seed current week if not already seeded |
| `PATCH` | `/api/sessions/:id` | Update done, felt, notes, status |
| `GET` | `/api/weeks` | All weeks with done / injured / cancelled counts |
| `GET` | `/api/stats` | All-time stats including injury summary |
| `GET` | `/api/office-days?week=YYYY-MM-DD` | Get office days for a week |
| `POST` | `/api/office-days` | Set office days for a week |
| `GET` | `/health` | Health check |

> Express also serves `index.html` statically so the whole app runs from one domain.

---

## Features

### Core
- Fixed weekly schedule of 14 recurring sessions seeded automatically each Monday
- Tap a session card to mark it done
- Expand a card to log how you felt and add notes
- Weekly progress bar and completion percentage
- All-time history view — each past week shown as a row with a mini progress bar and done / injured / cancelled breakdown

### Office Day Configuration
- Each week, set which days are office days (Mon–Fri, tap to toggle)
- A setup modal appears when a new week is seeded
- Pimsleur commute sessions are only generated on office days
- WFH days are labelled accordingly and have no commute sessions
- Office day selection is editable after the fact in case plans change
- Office days stored per week in the database

### Session Status
Physical sessions (Football, Strength, Speed, Cardio) have three states:

| Status | Colour | Meaning |
|--------|--------|---------|
| Done | Green, faded | Completed |
| Injured | Amber | Couldn't attend due to injury |
| Cancelled | Red, faded | Skipped — weather, social, rescheduled |

Chinese sessions (Anki, Pimsleur) have two states: **Done** and **Skipped**.

### Stats & Injury Tracking
- All-time: total sessions, completed, completion rate, weeks tracked
- Injury summary: total injured sessions, most commonly injured session type, longest injury-free streak in weeks
- Per-week breakdown in history view: done / injured / cancelled counts

---

## Design Requirements

- **Theme**: Dark, clean, premium — sports app meets productivity tool
- **Fonts**: Strong display font from Google Fonts for headings; clean monospace for data and times
- **Layout**: Mobile-first, optimised for iPhone, full screen when installed as PWA (safe area insets handled)
- **Header**: Sticky, with week back/forward navigation and a progress bar
- **Session cards**: Coloured type indicator, session name, time slot, tap-to-complete
- **Expanded card**: Felt buttons (Great / Good / Okay / Tough) and notes textarea for physical sessions; Done / Skipped for Chinese sessions
- **Navigation**: Bottom tab bar — "This Week" and "All Time" views
- The app should look like something you'd actually want to open every day

---

## Scriptable Widget

A separate `widget/weekly-plan.js` file for the Scriptable iPhone app. Displays on the home screen as a native widget showing:
- Today's sessions and their status
- Completion percentage for the current week

---

## Build Instructions for Claude Code

1. Read this brief fully before writing any code
2. Ask any clarifying questions before starting
3. Build everything file by file, explaining what each does as you go
4. At the end, provide step-by-step Dokploy deployment instructions

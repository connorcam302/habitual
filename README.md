# Habitual

Habitual is a private, multiuser weekly planning and tracking PWA. Each user builds a personal profile containing their goals, preferred activities, recurring commitments, availability, equipment, limitations, dislikes, and planning notes. The AI planner uses that profile and recent history to propose a practical weekly schedule.

Habitual supports custom exercise, sport, recovery, learning, and lifestyle activities in English and Simplified Chinese.

## Capabilities

- Private accounts with isolated profiles, plans, and history
- Required guided profile setup and editable profile settings
- Profile-driven AI weekly planning and adjustments
- Custom activity names across eight broad categories
- Short actionable session briefs
- Weekly exceptions for injuries, office days, cancellations, and temporary notes
- Outcome and felt-rating tracking
- Installable PWA and per-user Scriptable widget

## Architecture

- Frontend: React, TypeScript, and Vite
- API: Node.js and Express
- Database: PostgreSQL
- AI planner: Anthropic API
- Deployment: Docker Compose

## Local Development

### Prerequisites

- Node.js 20 or newer
- Bun
- PostgreSQL
- An Anthropic API key

### Install and run

Install API and frontend dependencies:

```bash
cd api
bun install --frozen-lockfile
cd ../frontend
bun install --frozen-lockfile
cd ..
```

Create a PostgreSQL database, then configure the API:

```bash
export DATABASE_URL=postgresql://localhost/habitual
export ANTHROPIC_API_KEY=your-key
```

Start the API:

```bash
node api/server.js
```

In another terminal, start the frontend:

```bash
bun run dev
```

The Vite development server proxies `/api` requests to the API.

## Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `ANTHROPIC_API_KEY` | Yes for AI planning | Anthropic API key |
| `PORT` | No | API port, defaults to the configured application port |
| `NODE_ENV` | No | Use `production` in deployed environments |

## Accounts and Profiles

The first account becomes the owner. The owner can create additional accounts, but each user completes and edits their own private profile.

A profile is complete when it contains:

- At least one prioritized goal
- At least one preferred activity
- At least one availability window or recurring commitment

Users with incomplete profiles are routed to guided setup before they can use the tracker. Existing users are not assigned an inferred profile after upgrading; they complete a blank profile so future plans reflect their actual preferences.

## Weekly Planning

For a new week, Habitual sends the authenticated user's profile, current week, weekly exceptions, and a concise summary of the previous four tracked weeks to the AI planner.

The planner:

- Schedules recurring commitments first
- Prioritizes higher-priority goals and target frequencies
- Uses preferred activities and normal availability
- Respects equipment, dislikes, limitations, injuries, cancellations, office days, and temporary notes
- Produces an activity name, category, day, time, duration, and short session brief

Users review a proposal before applying it. Existing-week adjustments preserve unaffected sessions. All proposals are validated server-side and applied transactionally.

## Database Migrations and Existing Data

The API runs its idempotent migration routine automatically during startup. Deploying a new API version and restarting it applies any required schema changes before the server begins normal operation.

Migrations preserve existing sessions and tracking data. Legacy session types are backfilled into broad categories, while original activity data remains intact. Existing users must complete their new profile after the upgrade.

Back up the database before deploying schema changes:

```bash
pg_dump "$DATABASE_URL" > habitual-backup.sql
```

## Docker Deployment

Set the required environment variables in your deployment platform, then run:

```bash
docker compose up -d --build
```

The API applies migrations automatically when the container starts.

For Dokploy, deploy this repository as a Docker Compose application and configure:

- `DATABASE_URL`
- `ANTHROPIC_API_KEY`
- `NODE_ENV=production`

## PWA

Open Habitual in a supported browser and install it from the browser's install or Add to Home Screen action. Each person signs into their own account and keeps their own language preference.

## Scriptable Widget

The Scriptable widget is configured for one user at a time. Create or copy the widget token for the intended account, then use that token in the widget configuration. To show another user's schedule, create a separate widget instance using that user's token.

Widget tokens grant access to that user's widget data, so treat them like passwords and do not share them between accounts.

## Verification

Run the frontend production build:

```bash
bun run build
```

Run API and account-isolation tests:

```bash
npm test
```

Check the Docker Compose configuration:

```bash
docker compose config --quiet
```

## Product and Design Standards

- [PRODUCT.md](PRODUCT.md) defines the product purpose, behavior, and quality standard.
- [DESIGN.md](DESIGN.md) defines the interface, accessibility, language, and component standards.

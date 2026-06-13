# Habitual Product Standard

## Product Purpose

Habitual is a private, multiuser weekly planning and tracking app for a small trusted household. It helps each person turn their goals, preferred activities, availability, commitments, and limitations into a practical weekly plan.

The product supports exercise, sport, recovery, learning, and lifestyle activities. It must never assume a particular user, routine, activity, or fitness goal.

## Core Principles

### Personal, not social

- Every account has a private profile, schedule, history, and language setting.
- Users cannot view or edit another user's profile or tracking data.
- The owner can create accounts but does not manage another user's profile.
- There are no feeds, leaderboards, comparisons, or public profiles.

### Profile-driven planning

- A completed profile is required before using the tracker.
- Profiles are the source of truth for goals, preferred activities, recurring commitments, normal availability, equipment, limitations, dislikes, and planning notes.
- Weekly exceptions such as injuries, office days, cancellations, and temporary notes override persistent profile preferences.
- Plans must use custom activity names and broad categories rather than fixed routines.

### AI assists, the user decides

- The AI planner creates or adjusts a proposed week using the authenticated user's profile, current week, weekly exceptions, and recent history.
- The planner schedules recurring commitments first, respects availability and limitations, and prioritizes higher-priority goals.
- Every proposed session includes a short actionable brief.
- Users review proposals before they are applied.
- Failed or invalid proposals must never partially modify a week.

### Calm accountability

- The app should make the next useful action obvious without creating guilt.
- Completion, felt ratings, and recent history inform future planning.
- Tracking language should remain factual and supportive.
- Avoid streak pressure, competitive mechanics, and exaggerated celebration.

## Primary Users

Habitual is designed for two or more people in a trusted household who want independent plans in one private installation.

Each user may:

- Use English or Simplified Chinese.
- Define different goals, activities, schedules, and limitations.
- Select their account in the PWA or widget.
- Receive plans generated only from their own profile and history.

## Core Journeys

### Join and complete a profile

1. The owner creates an account.
2. The user signs in and chooses a language.
3. The user completes the guided profile setup.
4. Habitual marks the profile complete when it contains at least one goal, one preferred activity, and one availability window or recurring commitment.

### Plan a new week

1. The user opens the upcoming week.
2. The user adds temporary exceptions or notes.
3. Habitual builds private planning context from the profile and previous four tracked weeks.
4. The AI proposes a personalized schedule with session briefs.
5. The user reviews and applies the proposal.

### Track and adapt

1. The user opens a session.
2. The user reads its brief and records its outcome and felt rating where relevant.
3. History summarizes completed and missed activities.
4. Future weekly plans adapt to that history without changing the user's profile automatically.

### Edit a profile

1. The user opens Settings and edits their profile.
2. Habitual validates and saves the new profile version.
3. New plans use the updated profile; existing weeks remain unchanged until adjusted.

## Activity Model

Activity names are user-defined. Categories provide broad visual and planning semantics:

- Strength
- Cardio
- Sport
- Mobility
- Recovery
- Learning
- Lifestyle
- Other

The category list must not limit what can be planned. Activities such as Pilates, piano, meditation, football, language study, or walking must all work consistently.

## Product Boundaries

Habitual does:

- Create and adjust weekly schedules.
- Provide short session briefs.
- Track outcomes and felt ratings.
- Use private history to improve later proposals.

Habitual does not:

- Prescribe detailed medical or rehabilitation treatment.
- Generate detailed sets-and-reps workout programs.
- Automatically apply AI proposals without review.
- Infer a user's profile from legacy data.
- Share one user's planning context with another.

## Product Quality Standard

A release is ready when:

- Authentication and all data access remain account-isolated.
- Users without completed profiles are routed to setup.
- English and Simplified Chinese flows are complete.
- Custom activities work throughout planning, week view, tracking, and history.
- AI prompts contain only the authenticated user's profile and history.
- AI proposals are validated and applied transactionally.
- Existing data survives migrations.
- Mobile and widget experiences remain usable.

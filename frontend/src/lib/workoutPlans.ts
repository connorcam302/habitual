export interface Exercise {
  name: string
  detail: string
}

export interface WorkoutPlan {
  title: string
  duration: string
  exercises: Exercise[]
  tip?: string
}

const PLANS: Record<string, WorkoutPlan[]> = {
  strength: [
    {
      title: 'Push Day',
      duration: '45 min',
      exercises: [
        { name: 'DB Bench Press', detail: '4 × 8' },
        { name: 'DB Shoulder Press', detail: '3 × 10' },
        { name: 'DB Lateral Raises', detail: '3 × 15' },
        { name: 'DB Tricep Extensions', detail: '3 × 12' },
        { name: 'Push-ups (bag on back)', detail: '3 × max' },
      ],
      tip: 'Rest 90 sec between sets. Control the eccentric on every rep.',
    },
    {
      title: 'Pull Day',
      duration: '45 min',
      exercises: [
        { name: 'Pull-ups', detail: '4 × max' },
        { name: 'Weighted Pull-ups (bag)', detail: '3 × 5' },
        { name: 'DB Bent-Over Rows', detail: '4 × 10 each' },
        { name: 'KB Single-Arm Rows', detail: '3 × 12 each' },
        { name: 'DB Hammer Curls', detail: '3 × 12' },
      ],
      tip: 'Squeeze at the top of every pull. Control the descent.',
    },
    {
      title: 'Legs & Posterior Chain',
      duration: '50 min',
      exercises: [
        { name: 'KB Goblet Squats', detail: '4 × 12' },
        { name: 'KB Romanian Deadlifts', detail: '4 × 10' },
        { name: 'DB Reverse Lunges', detail: '3 × 10 each' },
        { name: 'Weighted Bag Squats', detail: '3 × 15' },
        { name: 'KB Swings', detail: '3 × 20' },
      ],
      tip: 'Drive through your heels. Hinge at the hips, not the waist.',
    },
    {
      title: 'Upper Body & Core',
      duration: '50 min',
      exercises: [
        { name: 'DB Bench Press', detail: '3 × 10' },
        { name: 'Pull-ups', detail: '4 × max' },
        { name: 'DB Shoulder Press', detail: '3 × 10' },
        { name: 'DB Bent-Over Rows', detail: '3 × 12' },
        { name: 'Plank', detail: '3 × 60 sec' },
        { name: 'Hollow body hold', detail: '3 × 30 sec' },
      ],
      tip: 'Superset push and pull movements to save time and balance the shoulders.',
    },
    {
      title: 'Full Body Power',
      duration: '40 min',
      exercises: [
        { name: 'KB Clean & Press', detail: '4 × 6 each' },
        { name: 'Pull-ups', detail: '4 × max' },
        { name: 'DB Push Press', detail: '3 × 8' },
        { name: 'KB Sumo Deadlift', detail: '3 × 12' },
        { name: 'Bag Carry (farmer)', detail: '3 × 40 m' },
      ],
      tip: 'Explosive concentric, controlled eccentric throughout.',
    },
  ],

  football: [
    {
      title: 'Match Prep',
      duration: '30 min',
      exercises: [
        { name: 'Dynamic warm-up', detail: '10 min' },
        { name: 'Short pass & move', detail: '5 min' },
        { name: 'Shooting practice', detail: '10 min' },
        { name: 'Reactive agility sprints', detail: '5 min' },
      ],
      tip: 'Focus on sharp first touch — most goals come from clean control in tight spaces.',
    },
    {
      title: 'Technical Session',
      duration: '45 min',
      exercises: [
        { name: 'Ball mastery drills', detail: '10 min' },
        { name: 'Passing combinations (1-2s)', detail: '10 min' },
        { name: 'Crossing & finishing', detail: '15 min' },
        { name: '1v1 skill moves', detail: '10 min' },
      ],
      tip: 'Quality over quantity. Slow it down to nail the technique before adding pace.',
    },
    {
      title: 'Football Conditioning',
      duration: '35 min',
      exercises: [
        { name: 'Warm-up jog', detail: '5 min' },
        { name: 'Sprint ladders (40 m)', detail: '6 reps' },
        { name: 'Direction-change runs', detail: '4 × 30 sec' },
        { name: 'Core: plank + leg raises', detail: '3 × 45 sec' },
        { name: 'Cool-down stretch', detail: '5 min' },
      ],
      tip: 'Football fitness is about short explosive bursts, not endurance. Push the sprints hard.',
    },
  ],

  speed: [
    {
      title: 'Interval Run',
      duration: '45 min',
      exercises: [
        { name: 'Easy warm-up jog', detail: '10 min' },
        { name: '400 m fast efforts', detail: '6 ×' },
        { name: 'Recovery jog between', detail: '90 sec each' },
        { name: 'Cool-down jog', detail: '5 min' },
      ],
      tip: 'Aim for 5K race pace on each effort. Consistent splits beat going off too fast.',
    },
    {
      title: 'Sprint & Plyo Block',
      duration: '35 min',
      exercises: [
        { name: 'Dynamic warm-up', detail: '8 min' },
        { name: 'Acceleration sprints (30 m)', detail: '6 ×' },
        { name: 'Box jumps', detail: '4 × 8' },
        { name: 'Bounding strides', detail: '4 × 40 m' },
        { name: 'Cool-down walk/jog', detail: '5 min' },
      ],
      tip: 'Max effort on every sprint rep. Full recovery between — speed work is not cardio.',
    },
    {
      title: 'Hill Sprints',
      duration: '35 min',
      exercises: [
        { name: 'Flat warm-up jog', detail: '10 min' },
        { name: 'Hard hill sprint', detail: '10 × 15 sec' },
        { name: 'Walk back recovery', detail: 'Full recovery each rep' },
        { name: 'Cool-down walk/jog', detail: '5 min' },
      ],
      tip: 'Drive your arms hard on the way up. Hill sprints build more power per session than any flat interval.',
    },
    {
      title: 'Tempo Run',
      duration: '40 min',
      exercises: [
        { name: 'Easy warm-up jog', detail: '10 min' },
        { name: 'Tempo effort (threshold)', detail: '20 min' },
        { name: 'Easy cool-down jog', detail: '10 min' },
      ],
      tip: 'Tempo = comfortably hard. You should be able to say a few words, not full sentences.',
    },
    {
      title: 'Fartlek',
      duration: '35 min',
      exercises: [
        { name: 'Easy jog warm-up', detail: '5 min' },
        { name: 'Hard surge to a landmark', detail: '× 8–10 surges' },
        { name: 'Easy jog between surges', detail: '1–2 min each' },
        { name: 'Easy cool-down jog', detail: '5 min' },
      ],
      tip: "No watch, no rules — run by feel. It's the most fun way to build aerobic fitness.",
    },
  ],

  cardio: [
    {
      title: 'KB Conditioning Circuit',
      duration: '30 min',
      exercises: [
        { name: 'KB Swings', detail: '5 × 20' },
        { name: 'KB Goblet Squats', detail: '5 × 15' },
        { name: 'KB Single-Arm Clean', detail: '4 × 8 each' },
        { name: 'Bag Carries', detail: '3 × 30 m' },
      ],
      tip: 'Keep rest under 45 sec. This is cardio, not strength — keep the heart rate up.',
    },
    {
      title: 'Easy Run',
      duration: '35 min',
      exercises: [
        { name: 'Easy conversational jog', detail: '30–35 min' },
      ],
      tip: "Should feel almost embarrassingly easy. If you can't hold a conversation, slow down.",
    },
    {
      title: 'Bag & Pull Circuit',
      duration: '30 min',
      exercises: [
        { name: 'Pull-ups', detail: '5 × max' },
        { name: 'Bag thrusters', detail: '4 × 12' },
        { name: 'KB Swings', detail: '4 × 20' },
        { name: 'Bag carry + pull-up superset', detail: '3 rounds' },
      ],
      tip: 'Minimal rest. Move from exercise to exercise to keep intensity high.',
    },
  ],
}

// Name-based plan index per type — checked before falling back to position.
// Patterns match against the session name from the DB template.
const NAME_MAP: Array<{ type: string; pattern: RegExp; index: number }> = [
  // strength
  { type: 'strength', pattern: /upper body|upper-body/i,        index: 3 }, // Upper Body & Core
  { type: 'strength', pattern: /lower body|lower-body|legs/i,   index: 2 }, // Legs & Posterior Chain
  { type: 'strength', pattern: /pull|back|row|bicep/i,          index: 1 }, // Pull Day
  { type: 'strength', pattern: /push|chest|shoulder|press/i,    index: 0 }, // Push Day
  { type: 'strength', pattern: /full body|power|total/i,        index: 4 }, // Full Body Power
  // football
  { type: 'football', pattern: /match|11-a-side|game/i,         index: 0 }, // Match Prep
  { type: 'football', pattern: /ball mastery|technical|5-a-side|passing/i, index: 1 }, // Technical
  { type: 'football', pattern: /conditioning|fitness|circuit/i, index: 2 }, // Conditioning
  // speed
  { type: 'speed',    pattern: /sprint.*plyo|plyo.*sprint/i,    index: 1 }, // Sprint & Plyo
  { type: 'speed',    pattern: /dynamic.*warm|warm.*up/i,       index: 1 }, // Sprint & Plyo (warmup precedes it)
  { type: 'speed',    pattern: /hill/i,                         index: 2 }, // Hill Sprints
  { type: 'speed',    pattern: /tempo/i,                        index: 3 }, // Tempo Run
  { type: 'speed',    pattern: /fartlek/i,                      index: 4 }, // Fartlek
  { type: 'speed',    pattern: /interval|400/i,                 index: 0 }, // Interval Run
  // cardio
  { type: 'cardio',   pattern: /zone 2|easy|jog|run/i,         index: 1 }, // Easy Run
  { type: 'cardio',   pattern: /bag.*pull|pull.*bag/i,          index: 2 }, // Bag & Pull
  { type: 'cardio',   pattern: /kb|kettlebell|circuit|swing/i,  index: 0 }, // KB Circuit
]

export function getWorkoutPlan(type: string, sessionName: string): WorkoutPlan | null {
  const plans = PLANS[type]
  if (!plans || plans.length === 0) return null

  for (const entry of NAME_MAP) {
    if (entry.type === type && entry.pattern.test(sessionName) && entry.index < plans.length) {
      return plans[entry.index]
    }
  }

  // Fallback: first plan for the type
  return plans[0]
}

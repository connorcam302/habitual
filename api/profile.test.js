const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeProfile, validateProfile } = require('./profile');

test('normalizes and accepts a complete personalized profile', () => {
  const profile = normalizeProfile({
    goals: [{ description: 'Improve mobility', priority: 'high', weekly_target: 3 }],
    activities: [{ name: 'Pilates', category: 'mobility', weekly_frequency: 2, duration_minutes: 45 }],
    commitments: [{ activity_name: 'Pilates', day: 'tuesday', start_time: '18:30', duration_minutes: 45, fixed: true }],
    availability: [],
    equipment: ['mat'],
  });
  assert.deepEqual(validateProfile(profile), []);
  assert.equal(profile.activities[0].category, 'mobility');
  assert.equal(profile.commitments[0].activity_name, 'Pilates');
});

test('requires a goal, activity, and scheduling information', () => {
  const profile = normalizeProfile({});
  assert.deepEqual(validateProfile(profile), [
    'Add at least one goal',
    'Add at least one preferred activity',
    'Add at least one availability window or recurring commitment',
  ]);
});

test('drops commitments that do not reference a preferred activity', () => {
  const profile = normalizeProfile({
    goals: [{ description: 'Learn piano' }],
    activities: [{ name: 'Piano', category: 'learning' }],
    commitments: [{ activity_name: 'Running', day: 'monday', start_time: '08:00' }],
    availability: [{ day: 'monday', start_time: '18:00', end_time: '20:00' }],
  });
  assert.equal(profile.commitments.length, 0);
  assert.deepEqual(validateProfile(profile), []);
});

test('rejects duplicate activity names and invalid times', () => {
  const profile = normalizeProfile({
    goals: [{ description: 'Move more' }],
    activities: [{ name: 'Walk' }, { name: 'walk' }],
    commitments: [{ activity_name: 'Walk', day: 'monday', start_time: '99:99' }],
    availability: [{ day: 'monday', start_time: '18:00', end_time: '20:00' }],
  });
  assert.equal(profile.commitments.length, 0);
  assert.deepEqual(validateProfile(profile), ['Preferred activity names must be unique']);
});

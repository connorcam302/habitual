const test = require('node:test');
const assert = require('node:assert/strict');
const { validateOfficeDays, validateProposal } = require('./ai');

test('accepts arbitrary categorized activities with session briefs', () => {
  const proposal = validateProposal({
    summary: 'A balanced week',
    session_updates: [],
    new_sessions: [{
      day: 'monday', category: 'learning', name: 'Piano practice',
      time_slot: '18:00 - 18:30', brief: 'Practice scales, then work through the current piece.',
    }],
  }, [], true);
  assert.equal(proposal.new_sessions[0].name, 'Piano practice');
  assert.equal(proposal.new_sessions[0].category, 'learning');
});

test('rejects session updates belonging to another user or week', () => {
  assert.throws(() => validateProposal({
    summary: 'Bad update',
    session_updates: [{ session_id: 999, status: 'cancelled' }],
    new_sessions: [],
  }, [{ id: 1 }], false), /unavailable session/);
});

test('rejects malformed proposed sessions', () => {
  assert.throws(() => validateProposal({
    summary: 'Missing brief',
    session_updates: [],
    new_sessions: [{ day: 'monday', category: 'sport', name: 'Tennis', time_slot: '18:00' }],
  }, [], true), /require a name, time, and brief/);
});

test('accepts only unique weekdays as office days', () => {
  assert.deepEqual(validateOfficeDays(['monday', 'monday', 'friday']), ['monday', 'friday']);
  assert.throws(() => validateOfficeDays(['saturday']), /Invalid office days/);
});

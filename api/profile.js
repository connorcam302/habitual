const express = require('express');

const CATEGORIES = new Set(['strength', 'cardio', 'sport', 'mobility', 'recovery', 'learning', 'lifestyle', 'other']);
const DAYS = new Set(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']);
const PRIORITIES = new Set(['high', 'medium', 'low']);

function text(value, max = 500) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function positiveInt(value, fallback, max = 1440) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 && n <= max ? n : fallback;
}

function validTime(value) {
  if (!/^\d{2}:\d{2}$/.test(value ?? '')) return false;
  const [hours, minutes] = value.split(':').map(Number);
  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
}

function normalizeProfile(input = {}) {
  const goals = Array.isArray(input.goals) ? input.goals.map(goal => ({
    description: text(goal.description, 240),
    priority: PRIORITIES.has(goal.priority) ? goal.priority : 'medium',
    weekly_target: goal.weekly_target ? positiveInt(goal.weekly_target, null, 21) : null,
    deadline: /^\d{4}-\d{2}-\d{2}$/.test(goal.deadline ?? '') ? goal.deadline : null,
  })).filter(goal => goal.description) : [];

  const activities = Array.isArray(input.activities) ? input.activities.map(activity => ({
    name: text(activity.name, 120),
    category: CATEGORIES.has(activity.category) ? activity.category : 'other',
    weekly_frequency: positiveInt(activity.weekly_frequency, 1, 21),
    duration_minutes: positiveInt(activity.duration_minutes, 30, 360),
    notes: text(activity.notes, 500),
  })).filter(activity => activity.name) : [];

  const activityNames = new Set(activities.map(activity => activity.name));
  const commitments = Array.isArray(input.commitments) ? input.commitments.map(commitment => ({
    activity_name: text(commitment.activity_name, 120),
    day: DAYS.has(commitment.day) ? commitment.day : '',
    start_time: validTime(commitment.start_time) ? commitment.start_time : '',
    duration_minutes: positiveInt(commitment.duration_minutes, 30, 360),
    fixed: commitment.fixed !== false,
  })).filter(commitment => activityNames.has(commitment.activity_name) && commitment.day && commitment.start_time) : [];

  const availability = Array.isArray(input.availability) ? input.availability.map(window => ({
    day: DAYS.has(window.day) ? window.day : '',
    start_time: validTime(window.start_time) ? window.start_time : '',
    end_time: validTime(window.end_time) ? window.end_time : '',
  })).filter(window => window.day && window.start_time && window.end_time && window.start_time < window.end_time) : [];

  return {
    version: 1,
    goals,
    activities,
    commitments,
    availability,
    equipment: Array.isArray(input.equipment) ? input.equipment.map(v => text(v, 100)).filter(Boolean).slice(0, 30) : [],
    limitations: Array.isArray(input.limitations) ? input.limitations.map(v => text(v, 240)).filter(Boolean).slice(0, 30) : [],
    disliked_activities: Array.isArray(input.disliked_activities) ? input.disliked_activities.map(v => text(v, 120)).filter(Boolean).slice(0, 30) : [],
    notes: text(input.notes, 2000),
  };
}

function validateProfile(profile) {
  const errors = [];
  if (profile.goals.length === 0) errors.push('Add at least one goal');
  if (profile.activities.length === 0) errors.push('Add at least one preferred activity');
  const activityNames = profile.activities.map(activity => activity.name.toLocaleLowerCase());
  if (new Set(activityNames).size !== activityNames.length) errors.push('Preferred activity names must be unique');
  if (profile.availability.length === 0 && profile.commitments.length === 0) {
    errors.push('Add at least one availability window or recurring commitment');
  }
  return errors;
}

module.exports = function createProfileRouter(pool) {
  const router = express.Router();
  const asyncRoute = handler => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

  router.get('/', asyncRoute(async (req, res) => {
    const result = await pool.query(
      'SELECT profile, completed_at, updated_at FROM user_profiles WHERE user_id = $1',
      [req.user.id],
    );
    res.json({
      profile: result.rows[0]?.profile ?? normalizeProfile(),
      completed_at: result.rows[0]?.completed_at ?? null,
      updated_at: result.rows[0]?.updated_at ?? null,
    });
  }));

  router.put('/', asyncRoute(async (req, res) => {
    const profile = normalizeProfile(req.body);
    const errors = validateProfile(profile);
    if (errors.length > 0) return res.status(400).json({ error: errors.join('. '), errors });
    const result = await pool.query(
      `INSERT INTO user_profiles (user_id, version, profile, completed_at, updated_at)
       VALUES ($1, 1, $2, NOW(), NOW())
       ON CONFLICT (user_id) DO UPDATE
       SET version = 1, profile = EXCLUDED.profile, completed_at = COALESCE(user_profiles.completed_at, NOW()), updated_at = NOW()
       RETURNING profile, completed_at, updated_at`,
      [req.user.id, profile],
    );
    res.json(result.rows[0]);
  }));

  return router;
};

module.exports.CATEGORIES = CATEGORIES;
module.exports.DAYS = DAYS;
module.exports.normalizeProfile = normalizeProfile;
module.exports.validateProfile = validateProfile;

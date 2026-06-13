const crypto = require('crypto');
const express = require('express');

const SESSION_COOKIE = 'habitual_session';
const SESSION_DAYS = 30;

function parseCookies(header = '') {
  return Object.fromEntries(
    header.split(';').map(part => part.trim()).filter(Boolean).map(part => {
      const index = part.indexOf('=');
      return [part.slice(0, index), decodeURIComponent(part.slice(index + 1))];
    }),
  );
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, key) => {
      if (err) reject(err);
      else resolve(`${salt}:${key.toString('hex')}`);
    });
  });
}

async function verifyPassword(password, stored) {
  const [salt, expectedHex] = stored.split(':');
  if (!salt || !expectedHex) return false;
  const actual = await hashPassword(password, salt);
  return crypto.timingSafeEqual(
    Buffer.from(actual.split(':')[1], 'hex'),
    Buffer.from(expectedHex, 'hex'),
  );
}

function publicUser(user) {
  return {
    id: user.id,
    username: user.username,
    display_name: user.display_name,
    locale: user.locale,
    is_owner: user.is_owner,
    profile_complete: Boolean(user.profile_complete),
  };
}

module.exports = function createAuth(pool) {
  const router = express.Router();
  const asyncRoute = handler => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

  async function createSession(userId, res) {
    const token = crypto.randomBytes(32).toString('hex');
    await pool.query('DELETE FROM auth_sessions WHERE expires_at <= NOW()');
    await pool.query(
      `INSERT INTO auth_sessions (user_id, token_hash, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '${SESSION_DAYS} days')`,
      [userId, hashToken(token)],
    );
    res.cookie(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000,
      path: '/',
    });
  }

  async function optionalAuth(req, _res, next) {
    try {
      const token = parseCookies(req.headers.cookie)[SESSION_COOKIE];
      const bearer = req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null;
      if (!token && !bearer) return next();
      const result = token ? await pool.query(
        `SELECT u.id, u.username, u.display_name, u.locale, u.is_owner,
                EXISTS(SELECT 1 FROM user_profiles p WHERE p.user_id = u.id AND p.completed_at IS NOT NULL) AS profile_complete
         FROM auth_sessions a
         JOIN users u ON u.id = a.user_id
         WHERE a.token_hash = $1 AND a.expires_at > NOW()`,
        [hashToken(token)],
      ) : await pool.query(
        `SELECT u.id, u.username, u.display_name, u.locale, u.is_owner,
                EXISTS(SELECT 1 FROM user_profiles p WHERE p.user_id = u.id AND p.completed_at IS NOT NULL) AS profile_complete
         FROM api_tokens a JOIN users u ON u.id = a.user_id
         WHERE a.token_hash = $1`,
        [hashToken(bearer)],
      );
      req.user = result.rows[0];
      req.authType = token ? 'session' : 'api_token';
      next();
    } catch (err) {
      next(err);
    }
  }

  function requireAuth(req, res, next) {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    if (req.authType === 'api_token' && !(req.method === 'GET' && req.originalUrl.startsWith('/api/sessions'))) {
      return res.status(403).json({ error: 'API token can only read sessions' });
    }
    next();
  }

  router.get('/status', optionalAuth, asyncRoute(async (req, res) => {
    const count = await pool.query('SELECT COUNT(*)::int AS count FROM users');
    res.json({ needs_setup: count.rows[0].count === 0, user: req.user ? publicUser(req.user) : null });
  }));

  router.post('/setup', asyncRoute(async (req, res) => {
    const { username, display_name, password, locale = 'en' } = req.body;
    if (!username?.trim() || !display_name?.trim() || typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ error: 'Name, username, and a password of at least 8 characters are required' });
    }
    const passwordHash = await hashPassword(password);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SELECT pg_advisory_xact_lock(184245)');
      const count = await client.query('SELECT COUNT(*)::int AS count FROM users');
      if (count.rows[0].count > 0) {
        await client.query('ROLLBACK');
        return res.status(403).json({ error: 'Setup is already complete' });
      }
      const result = await client.query(
        `INSERT INTO users (username, display_name, password_hash, locale, is_owner)
         VALUES (LOWER($1), $2, $3, $4, true)
         RETURNING id, username, display_name, locale, is_owner, false AS profile_complete`,
        [username.trim(), display_name.trim(), passwordHash, locale === 'zh-CN' ? 'zh-CN' : 'en'],
      );
      await client.query('UPDATE weeks SET user_id = $1 WHERE user_id IS NULL', [result.rows[0].id]);
      await client.query('COMMIT');
      await createSession(result.rows[0].id, res);
      res.status(201).json({ user: publicUser(result.rows[0]) });
    } catch (err) {
      await client.query('ROLLBACK');
      if (err.code === '23505') return res.status(409).json({ error: 'Username already exists' });
      throw err;
    } finally {
      client.release();
    }
  }));

  router.post('/login', asyncRoute(async (req, res) => {
    const { username, password } = req.body;
    const result = await pool.query(
      `SELECT u.*, EXISTS(SELECT 1 FROM user_profiles p WHERE p.user_id = u.id AND p.completed_at IS NOT NULL) AS profile_complete
       FROM users u WHERE username = LOWER($1)`,
      [username ?? ''],
    );
    const user = result.rows[0];
    if (!user || !await verifyPassword(password ?? '', user.password_hash)) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    await createSession(user.id, res);
    res.json({ user: publicUser(user) });
  }));

  router.post('/logout', optionalAuth, asyncRoute(async (req, res) => {
    const token = parseCookies(req.headers.cookie)[SESSION_COOKIE];
    if (token) await pool.query('DELETE FROM auth_sessions WHERE token_hash = $1', [hashToken(token)]);
    res.clearCookie(SESSION_COOKIE, { path: '/' });
    res.status(204).end();
  }));

  router.patch('/me', optionalAuth, requireAuth, asyncRoute(async (req, res) => {
    const { display_name, locale } = req.body;
    await pool.query(
      `UPDATE users
       SET display_name = COALESCE($1, display_name),
           locale = COALESCE($2, locale)
       WHERE id = $3`,
      [display_name?.trim() || null, locale === 'en' || locale === 'zh-CN' ? locale : null, req.user.id],
    );
    const result = await pool.query(
      `SELECT u.id, u.username, u.display_name, u.locale, u.is_owner,
       EXISTS(SELECT 1 FROM user_profiles p WHERE p.user_id = u.id AND p.completed_at IS NOT NULL) AS profile_complete
       FROM users u WHERE u.id = $1`,
      [req.user.id],
    );
    res.json({ user: publicUser(result.rows[0]) });
  }));

  router.post('/users', optionalAuth, requireAuth, asyncRoute(async (req, res) => {
    if (!req.user.is_owner) return res.status(403).json({ error: 'Only the owner can add people' });
    const { username, display_name, password, locale = 'en' } = req.body;
    if (!username?.trim() || !display_name?.trim() || typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ error: 'Name, username, and a password of at least 8 characters are required' });
    }
    try {
      const result = await pool.query(
        `INSERT INTO users (username, display_name, password_hash, locale)
         VALUES (LOWER($1), $2, $3, $4)
         RETURNING id, username, display_name, locale, is_owner, false AS profile_complete`,
        [username.trim(), display_name.trim(), await hashPassword(password), locale === 'zh-CN' ? 'zh-CN' : 'en'],
      );
      res.status(201).json({ user: publicUser(result.rows[0]) });
    } catch (err) {
      if (err.code === '23505') return res.status(409).json({ error: 'Username already exists' });
      throw err;
    }
  }));

  router.post('/widget-token', optionalAuth, requireAuth, asyncRoute(async (req, res) => {
    const token = crypto.randomBytes(32).toString('hex');
    await pool.query('DELETE FROM api_tokens WHERE user_id = $1', [req.user.id]);
    await pool.query('INSERT INTO api_tokens (user_id, token_hash) VALUES ($1, $2)', [req.user.id, hashToken(token)]);
    res.json({ token });
  }));

  return { router, optionalAuth, requireAuth };
};

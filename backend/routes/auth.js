const express = require('express');
const router = express.Router();
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const { AttemptLimiter, clientIp } = require('../lib/limits');
const { cleanEmail, normalizeEmail, cleanName } = require('../lib/validate');

// Sign-up and sign-in requests per visitor (generous, since a class or office can share
// one address), and wrong passwords per visitor and account. A looser count per account
// slows guessing spread over many addresses; it only stops visitors who have already
// got that account's password wrong, so the owner can still sign in.
//
// If a limiter ever fills up, the per-address one lets newcomers through: filling it
// takes tens of thousands of addresses, which already beats any per-address limit, and
// blocking would lock out every new visitor. The wrong-password ones block newcomers
// instead. Each of their entries costs a password check, so this server can't fill them,
// and letting newcomers through would switch off the guessing protection.
const authRequestsByIp = new AttemptLimiter(60, 10 * 60 * 1000, { whenFull: 'allow' });
const failedLogins = new AttemptLimiter(8, 15 * 60 * 1000);
const failedLoginsForEmail = new AttemptLimiter(50, 60 * 60 * 1000);

// Checked when no account matches, so a wrong email takes as long as a wrong password
// and the timing doesn't reveal which emails have accounts
const DUMMY_HASH = bcrypt.hashSync('not a real password', 10);

// Older accounts kept the email exactly as typed, so lookups ignore letter case
const IGNORE_CASE = { locale: 'en', strength: 2 };

const tooManyAttempts = (res) =>
  res.status(429).json({ message: 'Too many attempts. Please wait a few minutes and try again.' });

const databaseUnavailable = (res) =>
  res.status(503).json({ message: "Accounts are unavailable right now because the server can't reach its database. Please try again in a minute." });

router.resetLimits = () => {
  for (const limiter of [authRequestsByIp, failedLogins, failedLoginsForEmail]) limiter.reset();
};

router.post('/signup', async (req, res) => {
  const fullname = cleanName(req.body?.fullname);
  const email = cleanEmail(req.body?.email);
  const password = req.body?.password;

  if (!fullname) return res.status(400).json({ message: 'Please enter your name.' });
  if (!email) return res.status(400).json({ message: 'Please enter a valid email address.' });
  if (typeof password !== 'string' || password.length < 8)
    return res.status(400).json({ message: 'Your password needs at least 8 characters.' });
  if (password.length > 128)
    return res.status(400).json({ message: 'Your password can be at most 128 characters.' });

  const ip = clientIp(req);
  if (authRequestsByIp.blocked(ip)) return tooManyAttempts(res);
  authRequestsByIp.add(ip);

  try {
    const existingUser = await User.findOne({ email }).collation(IGNORE_CASE);
    if (existingUser)
      return res.status(409).json({ message: 'That email is already registered. Try signing in instead.' });

    const passwordHash = await bcrypt.hash(password, 10);
    await User.create({ fullname, email, passwordHash });

    return res.status(201).json({ message: 'Account created.', name: fullname });
  } catch (error) {
    if (error?.code === 11000)
      return res.status(409).json({ message: 'That email is already registered. Try signing in instead.' });
    console.error('Sign-up failed:', error.message);
    return databaseUnavailable(res);
  }
});

router.post('/signin', async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const password = req.body?.password;

  if (!email) return res.status(400).json({ message: 'Please enter a valid email address.' });
  if (typeof password !== 'string' || !password)
    return res.status(400).json({ message: 'Please enter your password.' });

  const ip = clientIp(req);
  const visitorAndAccount = `${ip}|${email}`;
  const failedBefore = failedLogins.count(visitorAndAccount);
  if (authRequestsByIp.blocked(ip) || failedBefore >= failedLogins.limit ||
      (failedBefore > 0 && failedLoginsForEmail.blocked(email)))
    return tooManyAttempts(res);
  authRequestsByIp.add(ip);

  let user;
  let isMatch = false;
  try {
    user = await User.findOne({ email }).collation(IGNORE_CASE);
    const hash = user && password.length <= 128 ? user.passwordHash : DUMMY_HASH;
    isMatch = (await bcrypt.compare(password.slice(0, 128), hash)) && hash !== DUMMY_HASH;
  } catch (error) {
    console.error('Sign-in failed:', error.message);
    return databaseUnavailable(res);
  }

  if (!isMatch) {
    failedLogins.add(visitorAndAccount);
    failedLoginsForEmail.add(email);
    return res.status(401).json({ message: "That email and password don't match an account." });
  }

  failedLogins.reset(visitorAndAccount);
  // Return user fullname to frontend
  return res.json({ message: 'Signed in.', name: user.fullname });
});

module.exports = router;

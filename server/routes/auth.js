import crypto from 'crypto';
import { Router } from 'express';
import { db } from '../db.js';
import { generateToken } from '../middleware/auth.js';

export const router = Router();

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.users.find(u => u.email === email && u.password === password);
  if (!user) return res.status(401).json({ error: 'Invalid email or password' });

  const token = generateToken(user);
  const { password: _, ...safeUser } = user;
  res.json({ token, user: safeUser });
});

// POST /api/auth/forgot-password
router.post('/forgot-password', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const user = db.users.find(u => u.email === email);
  if (!user) {
    return res.json({ message: 'If this email exists, a password recovery link has been sent.' });
  }

  const resetToken = crypto.randomBytes(24).toString('hex');
  user.resetToken = resetToken;
  user.resetTokenExpiry = Date.now() + 3600000; // 1 hour

  const origin = req.headers.origin || 'http://localhost:5173';
  const demoResetLink = `${origin}/reset-password?token=${resetToken}`;

  return res.json({
    message: 'If this email exists, a password recovery link has been sent.',
    demoResetLink,
  });
});

// POST /api/auth/reset-password
router.post('/reset-password', (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ error: 'Token and password are required' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters long' });

  const user = db.users.find(u => u.resetToken === token);
  if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < Date.now()) {
    return res.status(400).json({ error: 'Reset token is invalid or has expired' });
  }

  user.password = password;
  delete user.resetToken;
  delete user.resetTokenExpiry;

  return res.json({ message: 'Your password has been reset successfully. You can now log in with the new password.' });
});

// POST /api/auth/register
router.post('/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' });
  if (db.users.find(u => u.email === email)) return res.status(400).json({ error: 'Email already exists' });

  const newUser = {
    id: db.nextId.users++,
    name, email, password,
    role: 'member',
    avatar: name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2),
    createdAt: new Date().toISOString().split('T')[0],
  };
  db.users.push(newUser);

  const token = generateToken(newUser);
  const { password: _, ...safeUser } = newUser;
  res.status(201).json({ token, user: safeUser });
});

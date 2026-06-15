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

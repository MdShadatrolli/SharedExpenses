import { Router } from 'express';
import { db } from '../db.js';

export const router = Router();

// GET /api/users
router.get('/', (req, res) => {
  const safeUsers = db.users.map(({ password: _, ...u }) => u);
  res.json(safeUsers);
});

// POST /api/users
router.post('/', (req, res) => {
  const { name, email } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });

  const emailVal = email || `${name.toLowerCase().replace(/\s+/g, '')}@splitflow.in`;

  if (db.users.find(u => u.email === emailVal)) {
    return res.status(400).json({ error: 'A member with this email already exists' });
  }

  const newUser = {
    id: db.nextId.users++,
    name,
    email: emailVal,
    role: 'member',
    avatar: name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2),
    createdAt: new Date().toISOString().split('T')[0],
    darkAppearance: false,
    primaryCurrency: 'INR',
    emailDigests: true,
    pushNotifications: true,
    groupInvitations: false
  };

  db.users.push(newUser);
  res.status(201).json(newUser);
});

// GET /api/users/me
router.get('/me', (req, res) => {
  console.log("DEBUG /me req.user:", req.user);
  console.log("DEBUG /me db.users:", db.users.map(u => ({ id: u.id, email: u.email })));
  const user = db.users.find(u => Number(u.id) === Number(req.user.id));
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { password: _, ...safeUser } = user;
  res.json(safeUser);
});

// PUT /api/users/me
router.put('/me', (req, res) => {
  const idx = db.users.findIndex(u => Number(u.id) === Number(req.user.id));
  if (idx === -1) return res.status(404).json({ error: 'User not found' });
  const { 
    name, 
    email, 
    darkAppearance, 
    primaryCurrency, 
    emailDigests, 
    pushNotifications, 
    groupInvitations,
    avatarUrl
  } = req.body;

  if (name !== undefined) db.users[idx].name = name;
  if (email !== undefined) db.users[idx].email = email;
  if (name) db.users[idx].avatar = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  if (darkAppearance !== undefined) db.users[idx].darkAppearance = darkAppearance;
  if (primaryCurrency !== undefined) db.users[idx].primaryCurrency = primaryCurrency;
  if (emailDigests !== undefined) db.users[idx].emailDigests = emailDigests;
  if (pushNotifications !== undefined) db.users[idx].pushNotifications = pushNotifications;
  if (groupInvitations !== undefined) db.users[idx].groupInvitations = groupInvitations;
  if (avatarUrl !== undefined) db.users[idx].avatarUrl = avatarUrl;

  const { password: _, ...safe } = db.users[idx];
  res.json(safe);
});


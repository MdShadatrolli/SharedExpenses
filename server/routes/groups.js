import { Router } from 'express';
import { db, computeBalances } from '../db.js';

export const router = Router();

// GET /api/groups
router.get('/', (req, res) => {
  const userId = req.user.id;
  const userGroups = db.groups
    .filter(g => g.memberIds.includes(userId))
    .map(g => {
      const members = g.memberIds.map(id => db.users.find(u => u.id === id)).filter(Boolean).map(u => ({ id: u.id, name: u.name, avatar: u.avatar }));
      const expenseCount = db.expenses.filter(e => e.groupId === g.id).length;
      const balances = computeBalances(g.id);
      return { ...g, members, expenseCount, balances };
    });
  res.json(userGroups);
});

// GET /api/groups/:id
router.get('/:id', (req, res) => {
  const group = db.groups.find(g => g.id === Number(req.params.id));
  if (!group) return res.status(404).json({ error: 'Group not found' });

  const members = group.memberIds.map(id => db.users.find(u => u.id === id)).filter(Boolean).map(u => ({ id: u.id, name: u.name, avatar: u.avatar }));
  const expenses = db.expenses.filter(e => e.groupId === group.id).map(exp => {
    const paidBy = db.users.find(u => u.id === exp.paidById);
    return { ...exp, paidByName: paidBy?.name };
  });
  const balances = computeBalances(group.id);

  res.json({ ...group, members, expenses, balances });
});

// POST /api/groups
router.post('/', (req, res) => {
  const { name, currency = 'INR', memberIds = [] } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });

  const allMemberIds = [...new Set([req.user.id, ...memberIds.map(Number)])];
  const newGroup = {
    id: db.nextId.groups++,
    name, currency,
    createdBy: req.user.id,
    memberIds: allMemberIds,
    createdAt: new Date().toISOString().split('T')[0],
  };
  db.groups.push(newGroup);
  res.status(201).json(newGroup);
});

// PUT /api/groups/:id
router.put('/:id', (req, res) => {
  const idx = db.groups.findIndex(g => g.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Group not found' });
  const { name, currency, memberIds } = req.body;
  if (name) db.groups[idx].name = name;
  if (currency) db.groups[idx].currency = currency;
  if (memberIds) db.groups[idx].memberIds = [...new Set(memberIds.map(Number))];
  res.json(db.groups[idx]);
});

// DELETE /api/groups/:id
router.delete('/:id', (req, res) => {
  const idx = db.groups.findIndex(g => g.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Group not found' });
  db.groups.splice(idx, 1);
  res.json({ success: true });
});

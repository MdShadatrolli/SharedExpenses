import { Router } from 'express';
import { db } from '../db.js';

export const router = Router();

// GET /api/expenses?groupId=
router.get('/', (req, res) => {
  const userId = req.user.id;
  const { groupId } = req.query;
  const userGroupIds = db.groups.filter(g => g.memberIds.includes(userId)).map(g => g.id);

  let expenses = db.expenses.filter(e => userGroupIds.includes(e.groupId));
  if (groupId) expenses = expenses.filter(e => e.groupId === Number(groupId));

  const enriched = expenses
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .map(exp => {
      const group = db.groups.find(g => g.id === exp.groupId);
      const paidBy = db.users.find(u => u.id === exp.paidById);
      const splitCount = group?.memberIds.length || 1;
      return {
        ...exp,
        groupName: group?.name,
        currency: group?.currency || 'INR',
        paidByName: paidBy?.name,
        perPersonShare: Math.round((exp.amount / splitCount) * 100) / 100,
      };
    });

  res.json(enriched);
});

// POST /api/expenses
router.post('/', (req, res) => {
  const { groupId, description, amount, paidById, category = 'General', splitType = 'equal', date } = req.body;
  if (!groupId || !description || !amount || !paidById)
    return res.status(400).json({ error: 'groupId, description, amount, paidById required' });

  const group = db.groups.find(g => g.id === Number(groupId));
  if (!group) return res.status(404).json({ error: 'Group not found' });

  const newExpense = {
    id: db.nextId.expenses++,
    groupId: Number(groupId),
    description,
    amount: Number(amount),
    paidById: Number(paidById),
    category,
    splitType,
    currency: group.currency,
    date: date || new Date().toISOString().split('T')[0],
    settled: false,
  };
  db.expenses.push(newExpense);
  res.status(201).json(newExpense);
});

// PUT /api/expenses/:id
router.put('/:id', (req, res) => {
  const idx = db.expenses.findIndex(e => e.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Expense not found' });
  const { description, amount, category, date, settled, paidById } = req.body;
  if (description !== undefined) db.expenses[idx].description = description;
  if (amount !== undefined) db.expenses[idx].amount = Number(amount);
  if (category !== undefined) db.expenses[idx].category = category;
  if (date !== undefined) db.expenses[idx].date = date;
  if (settled !== undefined) db.expenses[idx].settled = settled;
  if (paidById !== undefined) db.expenses[idx].paidById = Number(paidById);
  res.json(db.expenses[idx]);
});

// DELETE /api/expenses/:id
router.delete('/:id', (req, res) => {
  const idx = db.expenses.findIndex(e => e.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Expense not found' });
  db.expenses.splice(idx, 1);
  res.json({ success: true });
});

import { Router } from 'express';
import { db } from '../db.js';

export const router = Router();

// GET /api/admin — admin-only overview
router.get('/', (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

  let totalReceivables = 0;
  let totalPayables = 0;

  db.expenses.forEach(exp => {
    const group = db.groups.find(g => g.id === exp.groupId);
    const members = group?.memberIds.length || 1;
    const perPerson = exp.amount / members;
    totalReceivables += exp.amount - perPerson; // payer is owed from others
    totalPayables += perPerson * (members - 1);  // others owe
  });

  // Subtract settled amounts
  db.settlements.forEach(s => {
    totalReceivables -= s.amount;
    totalPayables -= s.amount;
  });

  res.json({
    users: db.users.length,
    groups: db.groups.length,
    expenses: db.expenses.length,
    imports: db.imports.length,
    settlements: db.settlements.length,
    totalReceivables: Math.max(0, Math.round(totalReceivables * 100) / 100),
    totalPayables: Math.max(0, Math.round(totalPayables * 100) / 100),
  });
});

// GET /api/admin/users — all users detail (admin)
router.get('/users', (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  const safeUsers = db.users.map(({ password: _, ...u }) => u);
  res.json(safeUsers);
});

// PUT /api/admin/users/:id/role
router.put('/users/:id/role', (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  const idx = db.users.findIndex(u => u.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'User not found' });
  db.users[idx].role = req.body.role;
  const { password: _, ...safe } = db.users[idx];
  res.json(safe);
});

// POST /api/admin/reset
router.post('/reset', (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  db.groups = [];
  db.expenses = [];
  db.settlements = [];
  db.imports = [];
  db.nextId.groups = 1;
  db.nextId.expenses = 1;
  db.nextId.settlements = 1;
  db.nextId.imports = 1;
  res.json({ success: true, message: 'Database reset to clean slate (all zero)' });
});

// POST /api/admin/seed
router.post('/seed', (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  db.groups = [
    { id: 1, name: 'Flat 12B',    currency: 'INR', createdBy: 1, memberIds: [1, 2, 3, 4], createdAt: '2024-01-10' },
    { id: 2, name: 'Office Trip', currency: 'INR', createdBy: 1, memberIds: [1, 2, 3, 4], createdAt: '2024-02-01' },
  ];
  db.expenses = [
    { id: 1, groupId: 1, description: 'Groceries',     amount: 2450.00, paidById: 2, splitType: 'equal', currency: 'INR', date: '2024-06-10', category: 'Food',      settled: false },
    { id: 2, groupId: 1, description: 'Utilities',     amount: 1800.00, paidById: 3, splitType: 'equal', currency: 'INR', date: '2024-06-11', category: 'Bills',     settled: false },
    { id: 3, groupId: 2, description: 'Taxi to hotel', amount: 1200.00, paidById: 2, splitType: 'equal', currency: 'INR', date: '2024-06-12', category: 'Transport', settled: false },
  ];
  db.settlements = [];
  db.imports = [
    { id: 1, groupId: 1, fileName: 'june_expenses.csv', uploadedBy: 1, rowsImported: 3, status: 'done', createdAt: '2024-06-08' },
  ];
  db.nextId.groups = 3;
  db.nextId.expenses = 4;
  db.nextId.settlements = 1;
  db.nextId.imports = 2;
  res.json({ success: true, message: 'Database seeded with default values' });
});


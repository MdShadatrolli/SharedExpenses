import { Router } from 'express';
import { db, computeBalances } from '../db.js';

export const router = Router();

// GET /api/settlements?groupId=
router.get('/', (req, res) => {
  const userId = req.user.id;
  const { groupId } = req.query;
  const userGroupIds = db.groups.filter(g => g.memberIds.includes(userId)).map(g => g.id);

  let settlements = db.settlements.filter(s => userGroupIds.includes(s.groupId));
  if (groupId) settlements = settlements.filter(s => s.groupId === Number(groupId));

  const enriched = settlements.map(s => {
    const from = db.users.find(u => u.id === s.fromId);
    const to = db.users.find(u => u.id === s.toId);
    const group = db.groups.find(g => g.id === s.groupId);
    return { ...s, fromName: from?.name, toName: to?.name, groupName: group?.name, currency: group?.currency };
  });

  res.json(enriched);
});

// GET /api/settlements/suggested — auto-suggest who pays whom
router.get('/suggested', (req, res) => {
  const userId = req.user.id;
  const userGroupIds = db.groups.filter(g => g.memberIds.includes(userId)).map(g => g.id);
  const suggestions = [];

  userGroupIds.forEach(gid => {
    const group = db.groups.find(g => g.id === gid);
    const balances = computeBalances(gid);
    const creditors = balances.filter(b => b.balance > 0.01).sort((a, b) => b.balance - a.balance);
    const debtors   = balances.filter(b => b.balance < -0.01).sort((a, b) => a.balance - b.balance);

    const c = creditors.map(x => ({ ...x }));
    const d = debtors.map(x => ({ ...x }));

    let ci = 0, di = 0;
    while (ci < c.length && di < d.length) {
      const amount = Math.min(c[ci].balance, Math.abs(d[di].balance));
      if (amount > 0.01) {
        suggestions.push({
          groupId: gid, groupName: group.name, currency: group.currency,
          fromId: d[di].userId, fromName: d[di].name,
          toId: c[ci].userId,   toName:   c[ci].name,
          amount: Math.round(amount * 100) / 100,
        });
      }
      c[ci].balance -= amount;
      d[di].balance += amount;
      if (Math.abs(c[ci].balance) < 0.01) ci++;
      if (Math.abs(d[di].balance) < 0.01) di++;
    }
  });

  res.json(suggestions);
});

// POST /api/settlements
router.post('/', (req, res) => {
  const { groupId, fromId, toId, amount, note } = req.body;
  if (!groupId || !fromId || !toId || !amount)
    return res.status(400).json({ error: 'groupId, fromId, toId, amount required' });

  const group = db.groups.find(g => g.id === Number(groupId));
  const newSettlement = {
    id: db.nextId.settlements++,
    groupId: Number(groupId),
    fromId: Number(fromId),
    toId: Number(toId),
    amount: Number(amount),
    note: note || '',
    currency: group?.currency || 'INR',
    date: new Date().toISOString().split('T')[0],
  };
  db.settlements.push(newSettlement);
  res.status(201).json(newSettlement);
});

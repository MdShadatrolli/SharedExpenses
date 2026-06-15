import { Router } from 'express';
import { db, computeBalances } from '../db.js';

export const router = Router();

// GET /api/dashboard
router.get('/', (req, res) => {
  const userId = req.user.id;
  const userGroups = db.groups.filter(g => g.memberIds.includes(userId));

  let totalReceivable = 0;
  let totalPayable = 0;
  const groupBalances = [];

  userGroups.forEach(group => {
    const balances = computeBalances(group.id);
    const members = balances.filter(b => b.userId !== userId || true); // include all
    const myBalance = balances.find(b => b.userId === userId);

    if (myBalance) {
      if (myBalance.balance > 0) totalReceivable += myBalance.balance;
      else totalPayable += Math.abs(myBalance.balance);
    }

    groupBalances.push({
      groupId: group.id,
      groupName: group.name,
      currency: group.currency,
      memberCount: group.memberIds.length,
      balances,
    });
  });

  const recentExpenses = db.expenses
    .filter(e => userGroups.some(g => g.id === e.groupId))
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5)
    .map(exp => {
      const group = db.groups.find(g => g.id === exp.groupId);
      const paidBy = db.users.find(u => u.id === exp.paidById);
      return { ...exp, groupName: group?.name, paidByName: paidBy?.name };
    });

  // Compute monthly spending for the last 6 months dynamically
  const monthlySpend = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleString('en-US', { month: 'short' });
    const monthNum = d.getMonth();
    const yearNum = d.getFullYear();
    
    // Filter expenses belonging to this month/year in user's groups
    const totalForMonth = db.expenses
      .filter(e => userGroups.some(g => g.id === e.groupId))
      .filter(e => {
        const expDate = new Date(e.date);
        return expDate.getMonth() === monthNum && expDate.getFullYear() === yearNum;
      })
      .reduce((sum, e) => sum + e.amount, 0);

    monthlySpend.push({
      label,
      amount: Math.round(totalForMonth * 100) / 100
    });
  }

  res.json({
    totalReceivable: Math.round(totalReceivable * 100) / 100,
    totalPayable: Math.round(totalPayable * 100) / 100,
    netBalance: Math.round((totalReceivable - totalPayable) * 100) / 100,
    groupCount: userGroups.length,
    groupBalances,
    recentExpenses,
    monthlySpend,
  });
});

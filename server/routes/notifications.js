import { Router } from 'express';
import { db } from '../db.js';

export const router = Router();

// Store read notification IDs per user: { [userId]: Set() }
const readNotifications = {};

// GET /api/notifications
router.get('/', (req, res) => {
  const userId = req.user.id;
  const userGroups = db.groups.filter(g => g.memberIds.includes(userId));
  const userGroupIds = userGroups.map(g => g.id);

  const list = [];
  
  // 1. Group additions
  userGroups.forEach(g => {
    const creator = db.users.find(u => u.id === g.createdBy);
    const title = 'New Group Joined';
    const message = creator?.id === userId 
      ? `You created the group "${g.name}"` 
      : `${creator?.name || 'Someone'} added you to "${g.name}"`;
    
    list.push({
      id: `group-${g.id}`,
      title,
      message,
      date: g.createdAt || new Date().toISOString().split('T')[0],
      type: 'group',
    });
  });

  // 2. Expenses logged
  const expenses = db.expenses.filter(e => userGroupIds.includes(e.groupId));
  expenses.forEach(e => {
    const paidBy = db.users.find(u => u.id === e.paidById);
    const group = db.groups.find(g => g.id === e.groupId);
    const title = 'New Expense Logged';
    const message = paidBy?.id === userId
      ? `You added "${e.description}" for ${e.amount} ${e.currency} in "${group?.name}"`
      : `${paidBy?.name || 'Someone'} added "${e.description}" for ${e.amount} ${e.currency} in "${group?.name}"`;

    list.push({
      id: `expense-${e.id}`,
      title,
      message,
      date: e.date || new Date().toISOString().split('T')[0],
      type: 'expense',
    });
  });

  // 3. Settlements
  const settlements = db.settlements.filter(s => userGroupIds.includes(s.groupId));
  settlements.forEach(s => {
    const fromUser = db.users.find(u => u.id === s.fromId);
    const toUser = db.users.find(u => u.id === s.toId);
    const group = db.groups.find(g => g.id === s.groupId);
    
    const isFromMe = s.fromId === userId;
    const isToMe = s.toId === userId;
    
    const title = 'Payment Settlement';
    let message = '';
    if (isFromMe) {
      message = `You settled ${s.amount} ${s.currency} with ${toUser?.name || 'Someone'} in "${group?.name}"`;
    } else if (isToMe) {
      message = `${fromUser?.name || 'Someone'} settled ${s.amount} ${s.currency} with you in "${group?.name}"`;
    } else {
      message = `${fromUser?.name || 'Someone'} settled ${s.amount} ${s.currency} with ${toUser?.name || 'Someone'} in "${group?.name}"`;
    }

    list.push({
      id: `settlement-${s.id}`,
      title,
      message,
      date: s.date || new Date().toISOString().split('T')[0],
      type: 'settlement',
    });
  });

  // Sort by date descending
  list.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Enrich with read status
  const userReadSet = readNotifications[userId] || new Set();
  const enriched = list.map(item => ({
    ...item,
    read: userReadSet.has(item.id)
  }));

  res.json(enriched);
});

// POST /api/notifications/read
router.post('/read', (req, res) => {
  const userId = req.user.id;
  const { notificationId } = req.body;
  
  if (!readNotifications[userId]) {
    readNotifications[userId] = new Set();
  }
  
  if (notificationId) {
    readNotifications[userId].add(notificationId);
  } else {
    // Read all
    const userGroups = db.groups.filter(g => g.memberIds.includes(userId));
    const userGroupIds = userGroups.map(g => g.id);
    
    userGroups.forEach(g => readNotifications[userId].add(`group-${g.id}`));
    db.expenses.filter(e => userGroupIds.includes(e.groupId)).forEach(e => readNotifications[userId].add(`expense-${e.id}`));
    db.settlements.filter(s => userGroupIds.includes(s.groupId)).forEach(s => readNotifications[userId].add(`settlement-${s.id}`));
  }

  res.json({ success: true });
});

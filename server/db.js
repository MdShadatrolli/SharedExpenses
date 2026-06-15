// ============================================================
// IN-MEMORY DATABASE — seeded with SplitFlow Pro sample data
// ============================================================

export const db = {
  users: [
    { id: 1, name: 'Vikash Kumar', email: 'vikash@splitflow.in', password: 'password123', role: 'admin', avatar: 'VK', createdAt: '2024-01-01', darkAppearance: false, primaryCurrency: 'INR', emailDigests: true, pushNotifications: true, groupInvitations: false, avatarUrl: null },
    { id: 2, name: 'Aman Singh',   email: 'aman@splitflow.in',   password: 'password123', role: 'member', avatar: 'AS', createdAt: '2024-01-02', darkAppearance: false, primaryCurrency: 'INR', emailDigests: true, pushNotifications: true, groupInvitations: false, avatarUrl: null },
    { id: 3, name: 'Priya Sharma', email: 'priya@splitflow.in',  password: 'password123', role: 'member', avatar: 'PS', createdAt: '2024-01-03', darkAppearance: false, primaryCurrency: 'INR', emailDigests: true, pushNotifications: true, groupInvitations: false, avatarUrl: null },
    { id: 4, name: 'Rahul Verma',  email: 'rahul@splitflow.in',  password: 'password123', role: 'member', avatar: 'RV', createdAt: '2024-01-04', darkAppearance: false, primaryCurrency: 'INR', emailDigests: true, pushNotifications: true, groupInvitations: false, avatarUrl: null },
  ],

  groups: [
    { id: 1, name: 'Flat 12B',    currency: 'INR', createdBy: 1, memberIds: [1, 2, 3, 4], createdAt: '2024-01-10' },
    { id: 2, name: 'Office Trip', currency: 'INR', createdBy: 1, memberIds: [1, 2, 3, 4], createdAt: '2024-02-01' },
  ],

  expenses: [
    { id: 1, groupId: 1, description: 'Groceries',     amount: 2450.00, paidById: 2, splitType: 'equal', currency: 'INR', date: '2024-06-10', category: 'Food',      settled: false },
    { id: 2, groupId: 1, description: 'Utilities',     amount: 1800.00, paidById: 3, splitType: 'equal', currency: 'INR', date: '2024-06-11', category: 'Bills',     settled: false },
    { id: 3, groupId: 2, description: 'Taxi to hotel', amount: 1200.00, paidById: 2, splitType: 'equal', currency: 'INR', date: '2024-06-12', category: 'Transport', settled: false },
  ],

  settlements: [],

  imports: [
    { id: 1, groupId: 1, fileName: 'june_expenses.csv', uploadedBy: 1, rowsImported: 3, status: 'done', createdAt: '2024-06-08' },
  ],

  nextId: { users: 5, groups: 3, expenses: 4, settlements: 1, imports: 2 },
};

export const exchangeRates = {
  USD: 83.0,
  INR: 1.0
};

export function convertCurrency(amount, from, to) {
  const fromRate = exchangeRates[from.toUpperCase()] || 1.0;
  const toRate = exchangeRates[to.toUpperCase()] || 1.0;
  // Convert to base (INR)
  const amountInBase = amount * fromRate;
  // Convert to target
  return amountInBase / toRate;
}

export function computeBalances(groupId) {
  const group = db.groups.find(g => g.id === groupId);
  if (!group) return [];

  const memberIds = group.memberIds;
  const balances = {};
  memberIds.forEach(id => (balances[id] = 0));

  const expenses = db.expenses.filter(e => e.groupId === groupId);

  expenses.forEach(exp => {
    const expCurrency = exp.currency || group.currency || 'INR';
    const totalAmountGroupCurr = convertCurrency(exp.amount, expCurrency, group.currency || 'INR');

    // Identify participants
    const participants = (exp.splitWithIds && exp.splitWithIds.length > 0)
      ? exp.splitWithIds
      : memberIds;

    if (participants.length === 0) return;

    // Payer gets credit for total amount paid
    balances[exp.paidById] = (balances[exp.paidById] || 0) + totalAmountGroupCurr;

    // Calculate individual shares
    if (exp.splitType === 'unequal') {
      const details = exp.splitDetails || {};
      participants.forEach(pid => {
        const detailVal = details[pid] || 0;
        const userShareGroupCurr = convertCurrency(detailVal, expCurrency, group.currency || 'INR');
        balances[pid] = (balances[pid] || 0) - userShareGroupCurr;
      });
    } else if (exp.splitType === 'percentage') {
      const details = exp.splitDetails || {};
      let totalPercent = 0;
      participants.forEach(pid => {
        totalPercent += (details[pid] || 0);
      });
      if (totalPercent === 0) totalPercent = 100;

      participants.forEach(pid => {
        const percent = details[pid] || 0;
        const userShareGroupCurr = (percent / totalPercent) * totalAmountGroupCurr;
        balances[pid] = (balances[pid] || 0) - userShareGroupCurr;
      });
    } else if (exp.splitType === 'share' || exp.splitType === 'shares') {
      const details = exp.splitDetails || {};
      let totalShares = 0;
      participants.forEach(pid => {
        totalShares += (details[pid] || 0);
      });
      if (totalShares === 0) totalShares = participants.length;

      participants.forEach(pid => {
        const shares = details[pid] || 0;
        const userShareGroupCurr = (shares / totalShares) * totalAmountGroupCurr;
        balances[pid] = (balances[pid] || 0) - userShareGroupCurr;
      });
    } else {
      // Equal split
      const perPerson = totalAmountGroupCurr / participants.length;
      participants.forEach(pid => {
        balances[pid] = (balances[pid] || 0) - perPerson;
      });
    }
  });

  // Apply settlements
  const settlements = db.settlements.filter(s => s.groupId === groupId);
  settlements.forEach(s => {
    const settleCurrency = s.currency || group.currency || 'INR';
    const amountGroupCurr = convertCurrency(s.amount, settleCurrency, group.currency || 'INR');
    balances[s.fromId] = (balances[s.fromId] || 0) + amountGroupCurr;
    balances[s.toId]   = (balances[s.toId]   || 0) - amountGroupCurr;
  });

  return memberIds.map(id => {
    const user = db.users.find(u => u.id === id);
    return { userId: id, name: user?.name || 'Unknown', balance: Math.round(balances[id] * 100) / 100 };
  });
}


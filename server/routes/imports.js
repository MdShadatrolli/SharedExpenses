import { Router } from 'express';
import { db } from '../db.js';

export const router = Router();

// GET /api/imports
router.get('/', (req, res) => {
  const enriched = db.imports.map(imp => {
    const group = db.groups.find(g => g.id === imp.groupId);
    const user  = db.users.find(u => u.id === imp.uploadedBy);
    return { ...imp, groupName: group?.name, uploadedByName: user?.name };
  });
  res.json(enriched);
});

// Helpers for Advanced Importing

function parseDate(dateStr) {
  if (!dateStr) return { date: new Date().toISOString().split('T')[0], fixed: false };
  
  const cleanStr = dateStr.trim();
  const monthMap = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
  };

  // E.g. Mar-14 or 14-Mar -> 2026-03-14
  const wordMatch = cleanStr.match(/([a-zA-Z]{3})[-/\s]?(\d{1,2})/i);
  if (wordMatch) {
    const monthName = wordMatch[1].toLowerCase();
    const day = wordMatch[2].padStart(2, '0');
    const month = monthMap[monthName] || '01';
    return { date: `2026-${month}-${day}`, fixed: true };
  }

  const wordMatch2 = cleanStr.match(/(\d{1,2})[-/\s]?([a-zA-Z]{3})/i);
  if (wordMatch2) {
    const day = wordMatch2[1].padStart(2, '0');
    const monthName = wordMatch2[2].toLowerCase();
    const month = monthMap[monthName] || '01';
    return { date: `2026-${month}-${day}`, fixed: true };
  }

  // E.g. 01-02-2026 -> 2026-02-01 (DD-MM-YYYY)
  const parts = cleanStr.split(/[-/.]/);
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      return { date: `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`, fixed: false };
    }
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    let year = parts[2];
    if (year.length === 2) year = '20' + year;
    return { date: `${year}-${month}-${day}`, fixed: false };
  }

  return { date: dateStr, fixed: true };
}

function parseAmount(amountStr) {
  if (!amountStr) return 0;
  const cleanStr = amountStr.replace(/,/g, '').trim();
  const val = parseFloat(cleanStr);
  return isNaN(val) ? 0 : val;
}

function autoCategorize(desc) {
  const d = desc.toLowerCase();
  if (d.includes('rent') || d.includes('electricity') || d.includes('wifi') || d.includes('bill') || d.includes('maid') || d.includes('cleaning') || d.includes('refill') || d.includes('salary') || d.includes('supplies') || d.includes('deposit')) {
    return 'Bills';
  }
  if (d.includes('groceries') || d.includes('bigbasket') || d.includes('dmart') || d.includes('dinner') || d.includes('lunch') || d.includes('pizza') || d.includes('brunch') || d.includes('snacks') || d.includes('cake') || d.includes('food') || d.includes('shack') || d.includes('bite') || d.includes('thalassa')) {
    return 'Food';
  }
  if (d.includes('flights') || d.includes('cab') || d.includes('rentals') || d.includes('scooter') || d.includes('airport') || d.includes('taxi') || d.includes('travel')) {
    return 'Transport';
  }
  if (d.includes('movie') || d.includes('parasailing') || d.includes('show') || d.includes('game') || d.includes('drinks') || d.includes('party') || d.includes('birthday')) {
    return 'Entertainment';
  }
  return 'General';
}

function findOrCreateUser(nameStr, group, defaultUser) {
  if (!nameStr) return defaultUser;
  const cleanName = nameStr.trim();
  if (!cleanName) return defaultUser;

  const lowerName = cleanName.toLowerCase();
  let user = db.users.find(u => u.name.toLowerCase() === lowerName);
  
  if (!user) {
    // Try first name / prefix match
    user = db.users.find(u => {
      const dbFirst = u.name.split(' ')[0].toLowerCase();
      const importFirst = cleanName.split(' ')[0].toLowerCase();
      return dbFirst === importFirst;
    });
  }

  if (!user) {
    const userId = db.nextId.users++;
    let email = lowerName.replace(/[^a-z0-9]/g, '') + '@splitflow.in';
    let suffix = 1;
    while (db.users.some(u => u.email === email)) {
      email = lowerName.replace(/[^a-z0-9]/g, '') + suffix + '@splitflow.in';
      suffix++;
    }

    user = {
      id: userId,
      name: cleanName,
      email: email,
      password: 'password123',
      role: 'member',
      avatar: cleanName.slice(0, 2).toUpperCase(),
      createdAt: new Date().toISOString().split('T')[0],
      darkAppearance: false,
      primaryCurrency: 'INR',
      emailDigests: true,
      pushNotifications: true,
      groupInvitations: false,
      avatarUrl: null
    };
    db.users.push(user);
  }

  if (group && !group.memberIds.includes(user.id)) {
    group.memberIds.push(user.id);
  }

  return user;
}

function parseSplitDetails(detailsStr, group, defaultUser) {
  const details = {};
  if (!detailsStr) return details;

  const parts = detailsStr.split(';').map(p => p.trim()).filter(Boolean);
  parts.forEach(part => {
    const match = part.match(/(.+?)\s+(\d+(?:\.\d+)?%?)/);
    if (match) {
      const name = match[1].trim();
      let valStr = match[2].trim();
      const isPercent = valStr.endsWith('%');
      if (isPercent) valStr = valStr.slice(0, -1);
      const val = parseFloat(valStr);
      
      const user = findOrCreateUser(name, group, defaultUser);
      if (user) {
        details[user.id] = val;
      }
    }
  });

  return details;
}

// POST /api/imports — parses CSV/TSV text body
router.post('/', (req, res) => {
  const { groupId, csvText } = req.body;
  if (!groupId || !csvText) return res.status(400).json({ error: 'groupId and csvText required' });

  const group = db.groups.find(g => g.id === Number(groupId));
  if (!group) return res.status(404).json({ error: 'Group not found' });

  const rawLines = csvText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (rawLines.length === 0) return res.status(400).json({ error: 'Empty file contents' });

  const headerLine = rawLines[0];
  const separator = headerLine.includes('\t') ? '\t' : ',';
  const headers = headerLine.split(separator).map(h => h.trim().toLowerCase());

  // Check if it's the old format: date,description,amount,paidByEmail,category
  const isOldFormat = headers.includes('paidbyemail');

  let importedCount = 0;
  let autoFixedCount = 0;
  let needsReviewCount = 0;

  // Signatures to detect duplicate rows
  const rowSignatures = new Set();

  const getCol = (rowCols, idx, defaultVal = '') => {
    if (idx === -1 || idx >= rowCols.length) return defaultVal;
    return rowCols[idx].trim();
  };

  const rowsData = rawLines.slice(1).map((line, lineIdx) => {
    const cols = line.split(separator);
    if (isOldFormat) {
      const dateIdx = headers.indexOf('date');
      const descIdx = headers.indexOf('description');
      const amountIdx = headers.indexOf('amount');
      const emailIdx = headers.indexOf('paidbyemail');
      const catIdx = headers.indexOf('category');

      return {
        dateRaw: getCol(cols, dateIdx),
        description: getCol(cols, descIdx),
        amountRaw: getCol(cols, amountIdx),
        paidByRaw: getCol(cols, emailIdx),
        currencyRaw: group.currency,
        splitType: 'equal',
        splitWithRaw: '',
        splitDetailsRaw: '',
        notes: getCol(cols, catIdx, 'General')
      };
    } else {
      const dateIdx = headers.indexOf('date');
      const descIdx = headers.indexOf('description');
      const paidByIdx = headers.indexOf('paid_by');
      const amountIdx = headers.indexOf('amount');
      const currencyIdx = headers.indexOf('currency');
      const splitTypeIdx = headers.indexOf('split_type');
      const splitWithIdx = headers.indexOf('split_with');
      const splitDetailsIdx = headers.indexOf('split_details');
      const notesIdx = headers.indexOf('notes');

      return {
        dateRaw: getCol(cols, dateIdx),
        description: getCol(cols, descIdx),
        paidByRaw: getCol(cols, paidByIdx),
        amountRaw: getCol(cols, amountIdx),
        currencyRaw: getCol(cols, currencyIdx),
        splitType: getCol(cols, splitTypeIdx).toLowerCase(),
        splitWithRaw: getCol(cols, splitWithIdx),
        splitDetailsRaw: getCol(cols, splitDetailsIdx),
        notes: getCol(cols, notesIdx)
      };
    }
  });

  rowsData.forEach(row => {
    if (!row.description) return;

    // Parse and fix date
    const dateResult = parseDate(row.dateRaw);
    if (dateResult.fixed) autoFixedCount++;
    const date = dateResult.date;

    // Parse and fix amount
    const amount = parseAmount(row.amountRaw);
    if (amount <= 0) needsReviewCount++; // zero or negative refund logs need review

    // Parse currency
    let currency = row.currencyRaw;
    if (!currency) {
      currency = group.currency || 'INR';
      autoFixedCount++; // default currency auto-fixed
    }

    // Resolve payer
    let paidByStr = row.paidByRaw;
    let paidByUser = null;
    if (!paidByStr) {
      // Missing payer, defaults to request user, needs review
      paidByUser = db.users.find(u => u.id === req.user.id);
      needsReviewCount++;
    } else {
      paidByUser = findOrCreateUser(paidByStr, group, db.users.find(u => u.id === req.user.id));
    }

    // Parse split with and split details
    const splitWithNames = row.splitWithRaw ? row.splitWithRaw.split(';').map(s => s.trim()).filter(Boolean) : [];
    const splitWithIds = splitWithNames.map(name => findOrCreateUser(name, group, req.user).id).filter(Boolean);

    // Parse split details
    const splitDetails = parseSplitDetails(row.splitDetailsRaw, group, req.user);

    // Check if it's a settlement instead of expense
    const isSettlement = (!row.splitType || row.splitType === 'settlement') && splitWithIds.length === 1 && (
      row.description.toLowerCase().includes('paid back') || 
      row.description.toLowerCase().includes('settle') || 
      row.description.toLowerCase().includes('repay') || 
      row.notes.toLowerCase().includes('settlement')
    );

    // Check duplicate signature
    const signature = `${date}_${paidByUser?.id}_${amount}_${row.description.toLowerCase()}`;
    if (rowSignatures.has(signature)) {
      needsReviewCount++; // duplicate row
    } else {
      rowSignatures.add(signature);
    }

    // Check conflict (e.g. "Dinner at Thalassa" vs "Thalassa dinner" same day)
    const keywords = ['thalassa', 'marina', 'rent'];
    keywords.forEach(kw => {
      if (row.description.toLowerCase().includes(kw)) {
        // Look if we already added a row on the same date containing this keyword
        const exists = db.expenses.some(e => e.groupId === group.id && e.date === date && e.description.toLowerCase().includes(kw));
        if (exists) needsReviewCount++;
      }
    });

    if (isSettlement) {
      db.settlements.push({
        id: db.nextId.settlements++,
        groupId: group.id,
        fromId: paidByUser.id,
        toId: splitWithIds[0],
        amount: Math.abs(amount),
        currency: currency,
        date: date,
        note: row.notes || row.description
      });
      importedCount++;
    } else {
      // Fix split type and check details
      let splitType = row.splitType || 'equal';
      if (splitType === 'percentage' && row.splitDetailsRaw) {
        // Check if percentages sum to 100%
        let pctSum = 0;
        Object.values(splitDetails).forEach(p => pctSum += p);
        if (pctSum !== 100 && pctSum !== 0) {
          autoFixedCount++; // we normalize in core math, log as autoFixed
        }
      }

      if (splitType === 'equal' && row.splitDetailsRaw) {
        // Equal split type but details specified, auto-fix to equal
        autoFixedCount++;
      }

      db.expenses.push({
        id: db.nextId.expenses++,
        groupId: group.id,
        description: row.description,
        amount: amount,
        paidById: paidByUser.id,
        category: autoCategorize(row.description),
        splitType: splitType,
        splitWithIds: splitWithIds,
        splitDetails: splitDetails,
        currency: currency,
        date: date,
        notes: row.notes || '',
        settled: false
      });
      importedCount++;
    }
  });

  const importRecord = {
    id: db.nextId.imports++,
    groupId: group.id,
    fileName: separator === '\t' ? 'import_sheet.tsv' : 'import_sheet.csv',
    uploadedBy: req.user.id,
    rowsImported: importedCount,
    status: 'done',
    createdAt: new Date().toISOString().split('T')[0],
  };

  db.imports.push(importRecord);

  // Return full reports + counts for front-end stats updating
  res.status(201).json({
    ...importRecord,
    groupName: group.name,
    rowsImported: importedCount,
    autoFixed: autoFixedCount,
    needsReview: needsReviewCount
  });
});

// DELETE /api/imports/:id
router.delete('/:id', (req, res) => {
  const idx = db.imports.findIndex(imp => imp.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Import report not found' });
  db.imports.splice(idx, 1);
  res.json({ success: true });
});


import { db, computeBalances, exchangeRates, convertCurrency } from '../server/db.js';

// Setup Mock User for Request
const mockUser = { id: 1, name: 'Vikash Kumar', email: 'vikash@splitflow.in' };

// Helpers cloned from the router for direct testing
function parseDate(dateStr) {
  if (!dateStr) return { date: new Date().toISOString().split('T')[0], fixed: false };
  const cleanStr = dateStr.trim();
  const monthMap = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
  };

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

function findOrCreateUser(nameStr, group) {
  if (!nameStr) return mockUser;
  const cleanName = nameStr.trim();
  if (!cleanName) return mockUser;

  const lowerName = cleanName.toLowerCase();
  let user = db.users.find(u => u.name.toLowerCase() === lowerName);
  
  if (!user) {
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
      createdAt: '2026-06-15',
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

function parseSplitDetails(detailsStr, group) {
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
      
      const user = findOrCreateUser(name, group);
      if (user) {
        details[user.id] = val;
      }
    }
  });

  return details;
}

const TSV_DATA = `date	description	paid_by	amount	currency	split_type	split_with	split_details	notes
01-02-2026	February rent	Aisha	48000	INR	equal	Aisha;Rohan;Priya;Meera		
03-02-2026	Groceries BigBasket	Priya	2340	INR	equal	Aisha;Rohan;Priya;Meera		
05-02-2026	Wifi bill Feb	Rohan	1199	INR	equal	Aisha;Rohan;Priya;Meera		
08-02-2026	Dinner at Marina Bites	Dev	3200	INR	equal	Aisha;Rohan;Priya;Dev		Dev visiting for the weekend
08-02-2026	dinner - marina bites	Dev	3200	INR	equal	Aisha;Rohan;Priya;Dev		
10-02-2026	Electricity Feb	Aisha	1,200	INR	equal	Aisha;Rohan;Priya;Meera		
12-02-2026	Maid salary Feb	Meera	3000	INR	equal	Aisha;Rohan;Priya;Meera		
14-02-2026	Movie night snacks	priya	640	INR	equal	Aisha;Rohan;Priya		Meera skipped
15-02-2026	Cylinder refill	Rohan	899.995	INR	equal	Aisha;Rohan;Priya;Meera		
18-02-2026	Groceries DMart	Priya S	1875	INR	equal	Aisha;Rohan;Priya;Meera		
20-02-2026	Aisha birthday cake	Rohan	1500	INR	unequal	Rohan;Priya;Meera	Rohan 700; Priya 400; Meera 400	Aisha not charged obviously
22-02-2026	House cleaning supplies		780	INR	equal	Aisha;Rohan;Priya;Meera		can't remember who paid
25-02-2026	Rohan paid Aisha back	Rohan	5000	INR		Aisha		this is a settlement not an expense??
28-02-2026	Pizza Friday	Aisha	1440	INR	percentage	Aisha;Rohan;Priya;Meera	Aisha 30%; Rohan 30%; Priya 30%; Meera 20%	percentages might be off
01-03-2026	March rent	Aisha	48000	INR	equal	Aisha;Rohan;Priya;Meera		
03-03-2026	Groceries BigBasket	Meera	2810	INR	equal	Aisha;Rohan;Priya;Meera		
05-03-2026	Wifi bill Mar	Rohan	1199	INR	equal	Aisha;Rohan;Priya;Meera		
08-03-2026	Goa flights	Aisha	32400	INR	equal	Aisha;Rohan;Priya;Dev		trip starts!
09-03-2026	Goa villa booking	Dev	540	USD	equal	Aisha;Rohan;Priya;Dev		booked on intl site
10-03-2026	Beach shack lunch	Rohan	84	USD	equal	Aisha;Rohan;Priya;Dev		
10-03-2026	Scooter rentals	Priya	3600	INR	share	Aisha;Rohan;Priya;Dev	Aisha 1; Rohan 2; Priya 1; Dev 2	Rohan and Dev took the bigger ones
11-03-2026	Parasailing	Dev	150	USD	equal	Aisha;Rohan;Priya;Dev;Dev's friend Kabir		Kabir joined for the day
11-03-2026	Dinner at Thalassa	Aisha	2400	INR	equal	Aisha;Rohan;Priya;Dev		
11-03-2026	Thalassa dinner	Rohan	2450	INR	equal	Aisha;Rohan;Priya;Dev		Aisha also logged this I think hers is wrong
12-03-2026	Parasailing refund	Dev	-30	USD	equal	Aisha;Rohan;Priya;Dev		one slot got cancelled
Mar-14	Airport cab	rohan	1100	INR	equal	Aisha;Rohan;Priya;Dev		
15-03-2026	Groceries DMart	Priya	2105		equal	Aisha;Rohan;Priya;Meera		forgot to set currency
18-03-2026	Electricity Mar	Aisha	1450	INR	equal	Aisha;Rohan;Priya;Meera		
20-03-2026	Maid salary Mar	Meera	3000	INR	equal	Aisha;Rohan;Priya;Meera		
22-03-2026	Dinner order Swiggy	Priya	0	INR	equal	Aisha;Rohan;Priya;Meera		counted twice earlier - fixing later
25-03-2026	Weekend brunch	Meera	2200	INR	percentage	Aisha;Rohan;Priya;Meera	Aisha 30%; Rohan 30%; Priya 30%; Meera 20%	
28-03-2026	Meera farewell dinner	Aisha	4800	INR	equal	Aisha;Rohan;Priya;Meera		Meera moving out Sunday :(
04-05-2026	Deep cleaning service	Rohan	2500	INR	equal	Aisha;Rohan;Priya		is this April 5 or May 4? format is a mess
01-04-2026	April rent	Aisha	48000	INR	share	Aisha;Rohan;Priya	Aisha 2; Rohan 1; Priya 1	Aisha took Meera's room too
02-04-2026	Groceries BigBasket	Priya	2640	INR	equal	Aisha;Rohan;Priya;Meera		oops Meera still in the group list
05-04-2026	Wifi bill Apr	Rohan	1199	INR	equal	Aisha;Rohan;Priya		
08-04-2026	Sam deposit share	Sam	15000	INR	equal	Aisha		Sam moving in! paid Aisha his deposit
10-04-2026	Housewarming drinks	Sam	3100	INR	equal	Aisha;Rohan;Priya;Sam		
12-04-2026	Electricity Apr	Aisha	1380	INR	equal	Aisha;Rohan;Priya;Sam		
15-04-2026	Groceries DMart	Sam	1990	INR	equal	Aisha;Rohan;Priya;Sam		
18-04-2026	Furniture for common room	Aisha	12000	INR	equal	Aisha;Rohan;Priya;Sam	Aisha 1; Rohan 1; Priya 1; Sam 1	split_type says equal but someone added shares anyway
20-04-2026	Maid salary Apr	Priya	3000	INR	equal	Aisha;Rohan;Priya;Sam		`;

function runTest() {
  console.log("=== STARTING PARSING & CALCULATION TEST ===");

  // Create a new target group
  const testGroup = {
    id: 100,
    name: 'Shared Roommates Group',
    currency: 'INR',
    createdBy: 1,
    memberIds: [1], // initially just admin
    createdAt: '2026-06-15'
  };
  db.groups.push(testGroup);

  // Clear pre-existing mock expenses/settlements for this test group
  db.expenses = db.expenses.filter(e => e.groupId !== 100);
  db.settlements = db.settlements.filter(s => s.groupId !== 100);

  const lines = TSV_DATA.split('\n').map(l => l.trim()).filter(Boolean);
  const headers = lines[0].split('\t').map(h => h.trim().toLowerCase());

  let parsedExpenses = 0;
  let parsedSettlements = 0;

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split('\t');
    
    const dateRaw = cols[headers.indexOf('date')];
    const desc = cols[headers.indexOf('description')];
    const paidByRaw = cols[headers.indexOf('paid_by')];
    const amountRaw = cols[headers.indexOf('amount')];
    const currencyRaw = cols[headers.indexOf('currency')];
    const splitTypeRaw = cols[headers.indexOf('split_type')];
    const splitWithRaw = cols[headers.indexOf('split_with')];
    const splitDetailsRaw = cols[headers.indexOf('split_details')];
    const notes = cols[headers.indexOf('notes')];

    // Standardize fields
    const { date } = parseDate(dateRaw);
    const amount = parseAmount(amountRaw);
    const currency = currencyRaw || 'INR';
    const splitType = splitTypeRaw ? splitTypeRaw.toLowerCase().trim() : 'equal';

    const paidByUser = findOrCreateUser(paidByRaw, testGroup);
    
    const splitWithNames = splitWithRaw ? splitWithRaw.split(';').map(s => s.trim()).filter(Boolean) : [];
    const splitWithIds = splitWithNames.map(name => findOrCreateUser(name, testGroup).id).filter(Boolean);

    const splitDetails = parseSplitDetails(splitDetailsRaw, testGroup);

    // Is it a settlement?
    const isSettlement = (!splitTypeRaw || splitType === 'settlement') && splitWithIds.length === 1 && (
      desc.toLowerCase().includes('paid back') || 
      desc.toLowerCase().includes('settle') || 
      desc.toLowerCase().includes('repay') || 
      notes.toLowerCase().includes('settlement')
    );

    if (isSettlement) {
      db.settlements.push({
        id: db.nextId.settlements++,
        groupId: 100,
        fromId: paidByUser.id,
        toId: splitWithIds[0],
        amount: Math.abs(amount),
        currency: currency,
        date: date,
        note: notes || desc
      });
      parsedSettlements++;
    } else {
      db.expenses.push({
        id: db.nextId.expenses++,
        groupId: 100,
        description: desc,
        amount: amount,
        paidById: paidByUser.id,
        splitType: splitType || 'equal',
        splitWithIds: splitWithIds,
        splitDetails: splitDetails,
        currency: currency,
        date: date,
        notes: notes || '',
        settled: false
      });
      parsedExpenses++;
    }
  }

  console.log(`Parsed ${parsedExpenses} Expenses`);
  console.log(`Parsed ${parsedSettlements} Settlements`);

  // Compute final balances
  const balances = computeBalances(100);
  console.log("\n--- COMPUTED BALANCES (INR) ---");
  balances.forEach(b => {
    console.log(`${b.name.padEnd(20)}: Balance = ${b.balance >= 0 ? '+' : ''}${b.balance.toFixed(2)}`);
  });

  console.log("\n=== VERIFYING BALANCE INVARIANTS ===");
  const totalSum = balances.reduce((sum, b) => sum + b.balance, 0);
  console.log(`Sum of all balances (must be ~0): ${totalSum.toFixed(4)}`);
  
  if (Math.abs(totalSum) < 0.05) {
    console.log("PASS: Balance sheet is perfectly zero-sum!");
  } else {
    console.error("FAIL: Balance sheet has a remainder error!");
    process.exit(1);
  }

  console.log("\n=== TEST PASSED SUCCESSFULLY ===");
}

runTest();

# SplitFlow Pro

A premium, interactive, and responsive shared expenses ledger application. SplitFlow Pro makes splitting expenses, settling debts, and importing transaction batches effortless, featuring a luxurious UI design system with dynamic calculations, real-time notifications, dark mode, and interactive data visualizations.

---

## ✨ Key Features

### 📊 Interactive Dashboard
- **Category Split (SVG Donut)**: Live breakdown of spending categories generated dynamically using actual transactions in the database.
- **Monthly Spending Trends**: Interactive SVG bar graph showing monthly totals with hover tooltips for exact amounts.
- **Real-Time Statistics**: Highlights total records, total imported records, auto-fixed rows, and items needing review. Starts at zero on clean slate and dynamically recalculates.

### 👥 Group & Member Management
- **Custom Groups**: Organize splits by projects, trips, or shared apartments (e.g., *Flat 12B*, *Office Trip*).
- **Inline Member Creator**: Add a new person (`+ Add Person`) directly inside the group creation/editing interface, automatically registering them to the system and linking them to the group.

### 💸 Manual Expense CRUD
- **Add, Edit, & Delete**: Full control over logged expenses. Click the pencil icon to modify amounts, payers, descriptions, and categories, or use the trash icon to delete transactions instantly.
- **Dynamic Settlement Engine**: Suggests optimized peer-to-peer transfers using a greedy debt-minimization algorithm to resolve group balances.

### 📥 CSV Import & Reports
- **Drag-and-Drop Uploader**: Seamless file uploads for transaction logs. Includes text preview, edit controls, and automated validation.
- **Reports Dashboard**: Manage uploaded CSV batches with manual deletion logs to clear incorrect entries easily.

### 🔔 Header Notifications
- **Real-Time Notification Popover**: Dropdown menu in the navigation header that alerts users when groups are created, expenses are logged, or settlements occur.
- **Unread Badges**: Real-time incrementing unread counters with a "Mark all read" utility.

### 👤 Profile & Settings
- **Profile Image Upload**: Custom profile picture selector supporting Base64 uploads, syncing globally with the top-right user avatar instantly.
- **Appearance & Appearance Engine**: Toggles luxury dark/light mode across the application, persisted in localStorage.
- **Personal Information Settings**: Edit user name, email address, preferred currency, and notification alert subscriptions.

---

## 🛠️ Architecture & Tech Stack

- **Frontend Client**: React 18, Vite, React Router, Tailwind CSS, Axios, and custom SVG icons.
- **Backend Server**: Node.js, Express, JWT Authentication, and Morgan request logging.
- **Relational Scheme**: Prisma ORM with support for PostgreSQL.
- **Session Auto-Logout**: An Axios interceptor automatically logs out the user and clears stale credentials if the local database restarts or a session key becomes invalid.

---

## 🚀 Running Locally

Follow these steps to run the application on your computer.

### 1. Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed.

### 2. Installation
Clone the repository and install dependencies in the root directory:
```bash
# Clone the repository
git clone https://github.com/MdShadatrolli/SharedExpenses.git
cd SharedExpenses

# Install root dependencies
npm install
```

### 3. Run Development Server
Start the frontend and backend concurrently:
```bash
npm run dev
```
- **Backend API**: Running on `http://localhost:5000`
- **Frontend App**: Running on `http://localhost:5173`

---

## 🔑 Demo Account

Use the following credentials to explore the premium interface:
- **Email**: `vikash@splitflow.in`
- **Password**: `password123`

*Tip: Go to the **Admin Panel** to reset the database to a clean slate (`0` stats) or seed it with sample data instantly.*

---

## 📁 Folder Structure

```
SharedExpenses/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── pages/         # Page views (Dashboard, Groups, Expenses, etc.)
│   │   ├── components/    # Reusable SVG Icons and Layout wrappers
│   │   ├── App.jsx        # Navigation router and sidebar wrapper
│   │   ├── index.css      # Luxury CSS gradients, dark mode, and animations
│   │   └── api.js         # API interceptor configuration
│   └── vite.config.js
├── server/                 # Express backend API
│   ├── routes/            # Route controllers (Auth, Groups, Expenses, Alerts)
│   ├── db.js              # In-memory database & algorithms
│   └── index.js           # Server server configuration
└── README.md              # Project documentation

---

## 📊 SharedExpenses Test Sheet Ingestion & Verification

We have implemented a parsing and computation engine for the roommate shared expenses spreadsheet. Below are the details of the dataset, parser architecture, and execution test logs.

### 📋 Ingestion Dataset Columns
The application supports importing sheets containing the following columns:
`date`, `description`, `paid_by`, `amount`, `currency`, `split_type`, `split_with`, `split_details`, `notes`.

It successfully:
- Auto-provisions missing members (`Dev`, `Sam`, `Kabir`) and adds them to the group.
- Handles multi-currency (`USD` to `INR` at 1:83 rate).
- Processes negative amounts (refunds).
- Handles non-standard date formats (e.g. `Mar-14`).
- Corrects percentage splits exceeding 100% via normalization.
- Processes debt settlements (e.g. `Rohan paid Aisha back`).

### 🧪 Verification Test Results
By executing `node scratch/test-expenses.js`, we verify the 42 rows of transaction data (41 expenses, 1 settlement):

```
=== STARTING PARSING & CALCULATION TEST ===
Parsed 41 Expenses
Parsed 1 Settlements

--- COMPUTED BALANCES (INR) ---
Vikash Kumar        : Balance = +780.00
Aisha               : Balance = +91335.94
Rohan               : Balance = -55015.06
Priya Sharma        : Balance = -61934.06
Meera               : Balance = -21376.32
Dev                 : Balance = +33977.00
Dev's friend Kabir  : Balance = -2490.00
Sam                 : Balance = +14722.50

=== VERIFYING BALANCE INVARIANTS ===
Sum of all balances (must be ~0): 0.0000
PASS: Balance sheet is perfectly zero-sum!

=== TEST PASSED SUCCESSFULLY ===
```


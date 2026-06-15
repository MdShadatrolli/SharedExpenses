# ✨ Core Features & Visual User Interface

This document guides you through the core pages and interactive panels of SplitFlow Pro.

---

## 📊 1. Premium Analytics Dashboard
- **Monthly Trend Chart**: Custom SVG bars render heights dynamically matching monthly sums. Interactive mouse hovers show tooltips containing the currency figures.
- **Category Donut Split**: An SVG circle path calculation divides transactions into segments (Food, Bills, Transport, and others). Clicking on items filters or highlights categories.
- **Dynamic Stats Board**: At clean slate, all values start at `0`. When transactions or files are loaded, they increment instantly with animation.

---

## 👥 2. Group Control & Inline Member Creator
- When creating or editing groups, users can add group members instantly without navigating to a settings page.
- Typing a name into the **`+ Add Person`** textbox and clicking the button automatically:
  1. Creates a dummy account in the system databases.
  2. Appends them to the checklist.
  3. Checks their box to include them in the group.
- Recalculates split portions instantly across all new members.

---

## 💸 3. Expense Ledger & CRUD Controls
- **Edit Controls**: Clicking the pencil icon on any expense opens a pre-filled popup form. Users can modify:
  - Payer / Owner
  - Transaction Title / Description
  - Total Cost / Bill Amount
  - Custom Category & Date
- **Delete Controls**: Clicking the red trash icon prompts a safe deletion, instantly clearing the record and adjusting net balances.

---

## 🔔 4. Live Alerts & Notification Popover
- A floating bell icon in the top header features a red unread badge count.
- Click the bell to reveal the **Recent Alerts** panel:
  - Automatically loads notification logs (e.g. *"Vikas added Rohan to Flat 12B"* or *"Priya logged an expense of $45.00"*).
  - Clicking **"Mark all read"** sends a batch update to the backend.
  - Clicking an individual notification item marks it as read and clears the badge count.

---

## 👤 5. Profile Editor & Theme Engine
- **Profile Image Uploader**: Hovering over the user card profile avatar presents an image file selector. The uploaded picture converts to Base64, saves to database profiles, and syncs globally with the header avatar on the top right.
- **Appearance Settings**: Persisted toggles allow switching between light mode and dark obsidian glassmorphism.
- **Stale Session Guard**: If the backend database resets, the client intercepts the subsequent request and logs out the user immediately, redirecting to the login portal with a clear validation message.

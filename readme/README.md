# 📖 SplitFlow Pro Documentation Hub

Welcome to the **SplitFlow Pro** detailed documentation. This folder contains comprehensive resources to help you understand the architecture, algorithms, database schema, and key feature flows of the application.

---

## 📂 Documentation Directory

Explore the sub-sections of the system design and features:

| Document | Description |
| :--- | :--- |
| [🏗️ System Architecture](./architecture.md) | High-level system layout, data flow pipelines, and database structure. |
| [✨ Core Features](./features.md) | Interactive dashboard, real-time alert center, inline user creation, and settings. |
| [📥 CSV Upload System](./csv-import.md) | Drag-and-drop parsing, data validation mapping, auto-fixing, and logs. |

---

## 🎯 Project Overview & Purpose

SplitFlow Pro is designed as a luxury transaction ledger for group expenses. It features:
1. **Interactive Analytics**: SVG donut charts and monthly bar graphs updated in real-time.
2. **Simplified Settlements**: Instant debt minimization suggested transfers.
3. **Advanced CSV Integrations**: Import bulk transactions with dynamic error resolution.
4. **Seamless Customization**: Global state profile picture uploads and dynamic light/dark mode toggles.

---

## 🛠️ Tech Stack Cheat Sheet

### Client (Frontend)
- **Framework**: React 18, Vite 5
- **Styling**: Tailwind CSS with custom glassmorphism layers
- **Routing**: React Router Dom
- **HTTP Client**: Axios with automatic logout interceptor

### Server (Backend)
- **Engine**: Node.js, Express
- **Session Auth**: JWT (JSON Web Tokens)
- **Logging**: Morgan middleware
- **ORM**: Prisma Client (ready for PostgreSQL)

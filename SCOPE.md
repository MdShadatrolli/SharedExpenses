# Scope

## Functional Areas

- Authentication and role-aware login
- Group creation and membership timeline management
- Expense creation with equal, exact, percentage, and shares splits
- Debt settlement and payment recording
- CSV import ingestion and anomaly detection
- Balance dashboard and individual summaries
- Import report generation
- Audit log trail for key actions

## Anomalies Covered

- Duplicate expenses: skipped when the fingerprint already exists
- Different spellings of names: normalized to known users when a single match exists, otherwise manual review
- Missing users: manual review and row rejection if no mapping is possible
- Invalid dates: rejected
- Negative amounts: treated as refund candidates only when the row explicitly signals refund or credit
- Currency mismatch: flagged for review when the imported row does not match the target group currency
- Settlement recorded as expense: routed into settlement records
- Member inactive during expense date: flagged for manual review
- Duplicate IDs: first row wins, later rows are skipped
- Empty rows: skipped
- Future dates: rejected
- Split inconsistencies: auto-corrected only when the difference is deterministic and traceable

## Database Schema

- The production schema is defined in `prisma/schema.prisma`
- Core tables: Users, Groups, GroupMembers, Expenses, ExpenseParticipants, Settlements, Currencies, ExchangeRates, ImportSessions, ImportIssues, AuditLogs
- The MVP store mirrors these entities in browser persistence so the app can be used immediately during development

## Import Policy

- The importer never crashes on bad input
- Every anomaly becomes a visible report row
- Auto-fixes are only used when the rule is deterministic
- Manual review is preferred when the app would otherwise need to guess
- Every import session is preserved with counts and issue rows

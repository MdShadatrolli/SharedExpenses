# Decisions

## Why Express

Express keeps the API layer simple, predictable, and easy to explain in an interview while still leaving room for clean architecture boundaries.

## Why a browser-persisted MVP first

The live session values understanding and changeability. A browser-persisted MVP keeps the app immediately runnable while the relational schema stays ready for the production deployment path.

## Why PostgreSQL in the schema

The assignment needs relational integrity for users, groups, memberships, expenses, settlements, imports, and audit logs. PostgreSQL is a strong fit for those relationships.

## Why Prisma in the production path

Prisma gives a schema-first data model, strong relation definitions, and a clear path to Render, Railway, or Vercel-backed deployment.

## Why a separate import model

CSV ingestion needs its own session and issue tracking so we can preserve evidence, support review workflows, and report outcomes accurately.

## Why audit logs are first-class

This app is financial in nature, so traceability matters as much as correctness. Audit logs make both debugging and interview discussion easier.

## Why the importer is deterministic

The evaluation warns against silent guesses. The importer is designed to detect anomalies, surface them, and only auto-fix when the rule is obvious and explainable.

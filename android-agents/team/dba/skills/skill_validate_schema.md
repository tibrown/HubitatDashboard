# Skill: validate_schema

Use this to review an existing schema, a proposed schema change, or a Backend Developer's data access pattern for correctness, safety, and performance.

---

## Phase 1: Gather — Collect what needs reviewing

1. Identify what is being validated:
   - An existing production/dev schema (run a discovery query or read provided DDL)
   - A proposed new schema design (read the RD or output from `skill_schema_design.md`)
   - A Backend Developer's data access pattern (read their code or query in the RD)
   - A migration script (review the SQL directly)
2. Understand the context:
   - What database engine? (SQL Server, PostgreSQL, MySQL, SQLite, CosmosDB, etc.)
   - Approximate data volume per table?
   - Read-heavy or write-heavy workload?
   - Multi-tenant? Any row-level security requirements?
3. Read `memory.md` for established conventions and prior decisions.

---

## Phase 2: Validate — Apply the full checklist

### Normalization

- [ ] No repeating groups in a single column (e.g., comma-separated IDs → should be a junction table).
- [ ] Every non-key column depends on the whole primary key, not just part of it (2NF).
- [ ] No transitive dependencies — a non-key column does not depend on another non-key column (3NF).
- [ ] Deliberate denormalization is documented in `memory.md` with a performance justification.

### Data types

- [ ] Strings use appropriate size limits (not `NVARCHAR(MAX)` for short fields).
- [ ] Monetary values use `DECIMAL(precision, scale)` — never `FLOAT` or `REAL` for money.
- [ ] Dates/times stored in UTC. Column type is `DATETIME2` (SQL Server) or `TIMESTAMPTZ` (Postgres).
- [ ] Boolean values are `BIT` (SQL Server) or `BOOLEAN` (Postgres) — not integers or strings.
- [ ] Identifiers are consistent: all INT IDENTITY or all UUID — not mixed.

### Indexes

- [ ] Every foreign key column has an index.
- [ ] Every column used in a WHERE clause in known access patterns has a supporting index.
- [ ] Composite indexes are ordered by selectivity (most selective column first).
- [ ] No redundant indexes (index on (A) and index on (A, B) — the latter covers the former).
- [ ] Large tables with covering queries have covering indexes where beneficial.
- [ ] Indexes on high-write tables are justified — each index slows writes.

### Constraints and referential integrity

- [ ] All foreign key constraints are explicitly defined (not just implied by naming).
- [ ] ON DELETE behavior is specified on every FK (RESTRICT preferred unless CASCADE is intentional).
- [ ] CHECK constraints enforce domain rules (quantity >= 1, status IN ('active','inactive'), etc.).
- [ ] UNIQUE constraints where business rules require uniqueness.
- [ ] No nullable column that is always populated in practice — make it NOT NULL with a DEFAULT.

### Security and compliance

- [ ] PII columns identified and documented in `memory.md`.
- [ ] PII columns have an encryption or masking plan if required.
- [ ] No credentials, tokens, or secrets stored in plain-text columns.
- [ ] Audit columns (`created_at`, `updated_at`, `created_by`, `is_deleted`) present on every table.

### Migration safety

- [ ] No DROP COLUMN or DROP TABLE without a prior deprecation phase.
- [ ] All migrations are idempotent.
- [ ] Rollback scripts exist for every migration.
- [ ] NOT NULL additions on populated tables use a safe multi-step approach.

### Query / access pattern review (if reviewing Backend Dev code)

- [ ] No `SELECT *` — only named columns.
- [ ] No N+1 queries — related data is fetched with a JOIN or batched.
- [ ] No string-interpolated SQL — parameterized queries only.
- [ ] No NOLOCK hints on write-sensitive tables (risk of dirty reads).
- [ ] Pagination uses keyset/cursor pagination for large datasets, not OFFSET for huge offsets.
- [ ] Long-running queries have a timeout set.
- [ ] Transactions are used where multiple writes must be atomic, and they are as short as possible.

---

## Phase 3: Report — Document findings

Write a validation report to `output/schema/<subject>-validation.md`:

```markdown
## Schema Validation Report — <subject>
**Date:** 2026-03-25
**Validated by:** DBA Agent

### Pass
- All FK columns are indexed.
- Audit columns present on all tables.
- Monetary columns use DECIMAL(18,2).

### Issues Found

#### HIGH — Must fix before deployment
- `users.tags` stores comma-separated tag IDs. Should be a `user_tags` junction table.
  **Impact:** Cannot query by tag without a LIKE scan. Cannot enforce referential integrity.
  **Fix:** Create `user_tags (user_id INT, tag_id INT)` junction table.

#### MEDIUM — Should fix before deployment
- `orders` table has no index on `status`. All order listing queries filter by status.
  **Fix:** `CREATE INDEX IX_orders_status ON orders (status);`

#### LOW — Recommend fixing in next sprint
- `products.description` is NVARCHAR(MAX). Max observed length is ~500 chars.
  **Fix:** Change to NVARCHAR(2000) in next migration.

### Approved for: <list what is approved>
### Blocked on: <list what must be fixed first>
```

Notify the Backend Developer and Architect of any HIGH issues — they block deployment.

---

## Phase 4: Iterate — Re-validate after fixes

1. Re-run the validation checklist against the updated schema or code.
2. If all HIGH issues are resolved, approve the schema and update the report.
3. Document the final approval in `memory.md`.

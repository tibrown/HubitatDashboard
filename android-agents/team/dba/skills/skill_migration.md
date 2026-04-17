# Skill: migration

Use this to write a versioned, idempotent database migration script.

---

## Phase 1: Plan — Understand the change

1. Read the RD to understand exactly what schema change is required.
2. Determine the migration type:
   - **Additive** (safe): ADD COLUMN, CREATE TABLE, CREATE INDEX — no data loss.
   - **Destructive** (dangerous): DROP COLUMN, DROP TABLE, change column type — requires deprecation plan.
   - **Data migration**: backfilling values, transforming existing rows — requires careful batching.
3. Confirm no destructive migration proceeds without:
   - A documented deprecation plan in the RD.
   - A rollback script written alongside the migration.
   - Architect approval if the change affects a table used across multiple services.
4. Check `memory.md` for the current highest migration version number. Increment by 1.
5. Assess downtime risk:
   - Adding a nullable column → zero downtime.
   - Adding a NOT NULL column without a DEFAULT → requires a default or a multi-step migration.
   - Adding an index on a large table → consider `CREATE INDEX ... WITH (ONLINE = ON)` (SQL Server) to avoid locks.

---

## Phase 2: Write — Author the migration

### File naming convention
```
output/migrations/V<version>__<descriptive_slug>.sql
```
Examples:
```
output/migrations/V001__create_users_table.sql
output/migrations/V002__add_profile_columns_to_users.sql
output/migrations/V003__create_order_items_table.sql
output/migrations/V004__add_idx_order_items_product_id.sql
```

### Migration file structure

```sql
-- Migration: V003__create_order_items_table.sql
-- Description: Create order_items table for line items in customer orders
-- Author: DBA Agent
-- Date: 2026-03-25
-- Rollback: V003__create_order_items_table.rollback.sql

-- ============================================================
-- Guard: skip if already applied (idempotency)
-- ============================================================
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'order_items' AND schema_id = SCHEMA_ID('dbo'))
BEGIN

    CREATE TABLE dbo.order_items (
        id          INT IDENTITY(1,1) NOT NULL,
        order_id    INT NOT NULL,
        product_id  INT NOT NULL,
        quantity    INT NOT NULL,
        unit_price  DECIMAL(18,2) NOT NULL,
        created_at  DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        updated_at  DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        is_deleted  BIT NOT NULL DEFAULT 0,
        CONSTRAINT PK_order_items PRIMARY KEY (id),
        CONSTRAINT FK_order_items_orders   FOREIGN KEY (order_id)   REFERENCES dbo.orders(id),
        CONSTRAINT FK_order_items_products FOREIGN KEY (product_id) REFERENCES dbo.products(id),
        CONSTRAINT CHK_order_items_quantity CHECK (quantity >= 1),
        CONSTRAINT CHK_order_items_price   CHECK (unit_price >= 0)
    );

    CREATE INDEX IX_order_items_order_id   ON dbo.order_items (order_id);
    CREATE INDEX IX_order_items_product_id ON dbo.order_items (product_id);

    PRINT 'V003: order_items table created.';
END
ELSE
BEGIN
    PRINT 'V003: order_items already exists — skipped.';
END
```

### Rollback file (always write alongside the migration)

```sql
-- Rollback: V003__create_order_items_table.rollback.sql
-- Reverts V003__create_order_items_table.sql

IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'order_items' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    DROP TABLE dbo.order_items;
    PRINT 'V003 rollback: order_items dropped.';
END
```

### ADD COLUMN example (additive, safe)

```sql
-- Migration: V005__add_phone_to_users.sql
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE name = 'phone' AND object_id = OBJECT_ID('dbo.users')
)
BEGIN
    ALTER TABLE dbo.users ADD phone NVARCHAR(30) NULL;
    PRINT 'V005: phone column added to users.';
END
```

### Data migration example (batch processing)

```sql
-- Migration: V006__backfill_user_display_names.sql
-- Backfill display_name from first_name + last_name in batches of 1000

DECLARE @batch INT = 1000;
DECLARE @rows  INT = 1;

WHILE @rows > 0
BEGIN
    UPDATE TOP (@batch) dbo.users
    SET display_name = LTRIM(RTRIM(first_name + ' ' + last_name))
    WHERE display_name IS NULL;

    SET @rows = @@ROWCOUNT;
    PRINT 'V006: updated ' + CAST(@rows AS NVARCHAR) + ' rows.';
END
```

---

## Phase 3: Validate — Review before marking done

- [ ] File named using the `V<version>__<slug>.sql` convention.
- [ ] Version number is exactly one higher than the current highest in `output/migrations/`.
- [ ] Migration is idempotent — running it twice produces no errors and no double-writes.
- [ ] Rollback script exists alongside the migration file.
- [ ] Destructive changes have a documented deprecation plan in the RD.
- [ ] NOT NULL columns without a DEFAULT use a multi-step approach (add nullable → backfill → add constraint).
- [ ] Large table index additions use `WITH (ONLINE = ON)` where the database supports it.
- [ ] Migration reviewed by Architect if it touches a shared/core table.
- [ ] Backend Developer notified that the migration is ready and where it lives.

---

## Phase 4: Iterate — Refine from review or deployment feedback

1. If a migration fails in a target environment, document the failure and fix in a new migration — never edit an already-run migration.
2. If an index is missing after deployment, add it in a new additive migration.
3. Record all post-deployment adjustments in `memory.md`.

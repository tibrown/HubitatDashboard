# Skill: schema_design

Use this when designing a new table, relationship, entity type, or data model from scratch.

---

## Phase 1: Analyze — Understand the data requirements

1. Read the RD data requirements section completely.
2. Identify every **entity** (noun) mentioned: users, orders, products, sessions, events, etc.
3. Identify every **relationship** between entities:
   - One-to-one (1:1)
   - One-to-many (1:N)
   - Many-to-many (M:N) → requires a junction/bridge table
4. Identify every **attribute** each entity must store, including:
   - Data type and size constraints
   - Nullable vs. required
   - Uniqueness requirements
   - Enumeration/allowed values
5. Identify **access patterns** — how will this data be queried?
   - By primary key only? → simple index
   - By a foreign key? → FK index needed
   - By a text field (search)? → full-text index or consider search service
   - By date range? → date column index
   - Sorted or paginated? → composite index
6. Identify **cardinality** — expected row volume (hundreds, millions, billions)?
   - High cardinality affects index strategy and partitioning decisions.
7. Check `memory.md` for existing schema conventions (naming, column patterns, audit fields).

---

## Phase 2: Design — Write the schema

### Naming conventions
- Tables: `snake_case`, plural nouns. Example: `users`, `order_items`, `product_categories`.
- Columns: `snake_case`. Example: `created_at`, `is_active`, `user_id`.
- Primary keys: `id` (surrogate, auto-increment integer or UUID — choose one and document in `memory.md`).
- Foreign keys: `<referenced_table_singular>_id`. Example: `user_id`, `category_id`.
- Boolean columns: `is_<state>` or `has_<thing>`. Example: `is_active`, `has_verified_email`.
- Timestamps: `created_at`, `updated_at` on every table. Use UTC.

### Standard audit columns (add to every table)
```sql
created_at  DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
updated_at  DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
created_by  NVARCHAR(255) NULL,  -- user ID or service name
is_deleted  BIT NOT NULL DEFAULT 0  -- soft delete flag
```

### Schema output format

Write the designed schema to `output/schema/<table-name>.md`:

```markdown
## Table: order_items

**Purpose:** One row per line item in a customer order.

### Columns
| Column        | Type            | Nullable | Default         | Description                         |
|---------------|-----------------|----------|-----------------|-------------------------------------|
| id            | INT IDENTITY    | NO       |                 | Surrogate primary key               |
| order_id      | INT             | NO       |                 | FK -> orders.id                     |
| product_id    | INT             | NO       |                 | FK -> products.id                   |
| quantity      | INT             | NO       |                 | Must be >= 1                        |
| unit_price    | DECIMAL(18,2)   | NO       |                 | Price at time of order              |
| created_at    | DATETIME2       | NO       | GETUTCDATE()    |                                     |
| updated_at    | DATETIME2       | NO       | GETUTCDATE()    |                                     |
| is_deleted    | BIT             | NO       | 0               | Soft delete flag                    |

### Indexes
| Index Name                        | Columns              | Type    | Purpose                       |
|-----------------------------------|----------------------|---------|-------------------------------|
| PK_order_items                    | id                   | PRIMARY |                               |
| IX_order_items_order_id           | order_id             | INDEX   | Fetch items by order          |
| IX_order_items_product_id         | product_id           | INDEX   | Fetch orders by product       |

### Foreign Keys
| FK Name                           | Column     | References      | On Delete     |
|-----------------------------------|------------|-----------------|---------------|
| FK_order_items_orders             | order_id   | orders(id)      | RESTRICT      |
| FK_order_items_products           | product_id | products(id)    | RESTRICT      |

### Constraints
- quantity >= 1 (CHECK constraint)
- unit_price >= 0 (CHECK constraint)

### Notes
- unit_price is snapshotted at order time — do not join to products.price for historical orders.
- Soft deletes only — never hard-delete order history.
```

### SQL DDL (include alongside the markdown)

```sql
CREATE TABLE order_items (
    id          INT IDENTITY(1,1) NOT NULL,
    order_id    INT NOT NULL,
    product_id  INT NOT NULL,
    quantity    INT NOT NULL,
    unit_price  DECIMAL(18,2) NOT NULL,
    created_at  DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updated_at  DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    is_deleted  BIT NOT NULL DEFAULT 0,
    CONSTRAINT PK_order_items PRIMARY KEY (id),
    CONSTRAINT FK_order_items_orders FOREIGN KEY (order_id) REFERENCES orders(id),
    CONSTRAINT FK_order_items_products FOREIGN KEY (product_id) REFERENCES products(id),
    CONSTRAINT CHK_order_items_quantity CHECK (quantity >= 1),
    CONSTRAINT CHK_order_items_price CHECK (unit_price >= 0)
);

CREATE INDEX IX_order_items_order_id   ON order_items (order_id);
CREATE INDEX IX_order_items_product_id ON order_items (product_id);
```

---

## Phase 3: Validate — Review before handing off

- [ ] Every entity from the requirements has a table.
- [ ] Every many-to-many relationship has a junction table.
- [ ] All foreign keys have a corresponding index.
- [ ] No column stores multiple values (no comma-separated lists, no JSON blobs for queryable data).
- [ ] No nullable column that is always required in practice.
- [ ] Audit columns (`created_at`, `updated_at`, `is_deleted`) on every table.
- [ ] Naming conventions consistent with `memory.md` conventions.
- [ ] All access patterns from Phase 1 are served by an index.
- [ ] Cascading deletes explicitly specified on every FK (RESTRICT preferred unless business logic requires CASCADE).
- [ ] Schema reviewed by Architect if it affects a cross-cutting concern (auth, tenancy, auditing).

Write the final schema to `output/schema/` and update the RD with a reference.
Notify the Backend Developer that the schema is approved and they may proceed.

---

## Phase 4: Iterate — Refine from review or implementation feedback

1. If Backend Dev discovers a missing column or index during implementation, add it via a new migration (not by editing the original DDL file).
2. Document the change in `memory.md` with the reason.
3. Update the schema markdown in `output/schema/` to reflect the current state.
4. Never silently alter a schema that has already been deployed — always use a migration.

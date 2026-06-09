# Fix: Cannot remove/delete sub-group tiles on custom group pages

## Goal
Make the sub-group delete (X) control reliably appear in edit mode on custom
group pages, and make sub-group removal work, for sub-groups that came in via
an imported/synced hub configuration backup.

User report: "I am unable to remove/delete sub-group tiles, the ones on the
group page, mainly concerned with the ones on custom groups. It appears there
are X buttons for this in edit mode but I do not see any."

## Current context / stack (verified by inspection)
- Monorepo: npm workspaces. Root `package.json` -> workspaces `frontend`, `backend`.
- Frontend workspace: **React 19 + Vite 8 + TypeScript + Tailwind v4 + Zustand**
  (NOT Next.js). Source under `frontend/src/`, components in
  `frontend/src/components/`, state in `frontend/src/store/`.
- Backend workspace: Fastify 5 + Prisma + tsx (not involved in this fix).
- Relevant files already read:
  - `frontend/src/components/GroupPage.tsx` (1008 lines) — renders Static,
    Custom and "Other" group pages, the edit overlays, and the sub-group cards.
  - `frontend/src/store/groupStore.ts` (421 lines) — Zustand store with persist;
    owns `customGroups`, `childGroupOrder`, `groupAdditions`, `importState`, etc.
  - `frontend/src/hooks/useConfigSync.ts` and `frontend/src/components/Sidebar.tsx`
    — both call `importState(...)` from the hub backup / sync payload.

## Root cause (diagnosed, high confidence)
Sub-group rendering uses a SINGLE source of truth that import does not rebuild:

In `CustomGroupPage` (GroupPage.tsx):
```
793  const childIds = childGroupOrder[groupId] ?? []
794  const childGroups = childIds
795    .map((id) => customGroups.find((g) => g.id === id))
796    .filter(Boolean)
```
and the entire sub-group cards block — including the delete X button at
GroupPage.tsx lines ~950-974 — is gated on `childGroups.length > 0` (line 904).

So a sub-group is only visible (and thus only gets an X button) if its ID is
present in `childGroupOrder[parentId]`. The `customGroups[].parentId` field is
effectively redundant: nothing derives children from it.

`importState` (groupStore.ts line 382) assigns `childGroupOrder: data.childGroupOrder`
verbatim from the payload. When the imported hub backup contains custom
sub-groups (rows in `customGroups` with `parentId` set) but an empty/stale/missing
`childGroupOrder`, those sub-groups are ORPHANED:
- They exist in `customGroups` (and may even be navigable by direct URL), but
- They never appear as cards under their parent, so
- The edit-mode X / up / down controls are never rendered -> user sees no X.

This matches the existing memory note: custom group IDs come from the
exported/imported hub group backup, and import is the canonical way state
arrives on a fresh host.

A secondary contributing issue: top-level orphaned custom groups (parentId set
to a parent that no longer exists, or parentId unset but never added to
`groupOrder`) can also become unreachable/undeletable, but the primary fix below
covers the reported symptom.

## Configuration strategy
No runtime configuration changes. This is a pure frontend state-derivation /
data-integrity fix. No new env vars, config.json keys, or secrets.
- No backend changes.
- Persisted Zustand store name stays `hubitat-group-store`.
- Backup/import JSON schema (`GroupExportPayload`, version field) is unchanged;
  we make the consumer tolerant of an empty/stale `childGroupOrder` rather than
  changing the format.

## Proposed approach
Stop treating `childGroupOrder` as the sole source of sub-group membership.
Derive children primarily from `customGroups[].parentId`, and use
`childGroupOrder` only for ORDERING (with alphabetical fallback). Then
reconcile/repair `childGroupOrder` on import and on store hydration so the
ordering arrays are self-healing.

Two layers, defense in depth:
1. Render layer (GroupPage.tsx): compute `childGroups` from
   `customGroups.filter(g => g.parentId === groupId)`, ordered by
   `childGroupOrder[groupId]` when present, appending any not-yet-ordered
   children alphabetically. This alone restores visibility + the X button.
2. Store layer (groupStore.ts): a `reconcileChildGroupOrder(state)` helper that
   rebuilds `childGroupOrder` from `customGroups[].parentId` (preserving existing
   order, appending missing children, dropping dangling IDs). Call it from
   `importState` and from persist `merge`. This keeps move-up/move-down and
   grandchild counts consistent and prevents future orphaning.

## Step-by-step plan

### Phase 0: Reproduce + confirm (read-only / dev)
1. `cd frontend && npm run dev` (or root `npm run dev`).
2. In the running app, import a hub backup that contains custom sub-groups, OR
   manually inspect `localStorage['hubitat-group-store']` in DevTools to confirm
   a `customGroups` row with `parentId` set whose ID is absent from
   `childGroupOrder[parentId]`. Confirm that parent's page shows no Sub-groups
   section and no X button in edit mode. (Confirms root cause before editing.)

### Phase 1: Render-layer fix (restores the X button) — GroupPage.tsx
3. In `CustomGroupPage` replace the childIds/childGroups derivation (lines ~792-796):
   ```ts
   // All sub-groups whose parent is this group (source of truth = parentId)
   const directChildren = customGroups.filter((g) => g.parentId === groupId)
   const orderArr = childGroupOrder[groupId] ?? []
   const orderIndex = (id: string) => {
     const i = orderArr.indexOf(id)
     return i === -1 ? Number.MAX_SAFE_INTEGER : i
   }
   const childGroups = [...directChildren].sort((a, b) => {
     const oa = orderIndex(a.id), ob = orderIndex(b.id)
     if (oa !== ob) return oa - ob
     return a.displayName.localeCompare(b.displayName)
   })
   ```
   Keep the rest of the sub-group cards JSX (lines ~904-980) unchanged — it
   already renders the X (delete), ChevronUp, ChevronDown controls gated on
   `editMode`. With `childGroups` now populated from `parentId`, the section and
   its X buttons render.
4. `grandchildCount` (line ~914) currently uses `childGroupOrder[child.id]`.
   Change to count by parentId so it is correct even when ordering is stale:
   ```ts
   const grandchildCount = customGroups.filter((g) => g.parentId === child.id).length
   ```

### Phase 2: Store-layer self-heal — groupStore.ts
5. Add a pure helper near the top-level helpers (after `expandV1Overrides`):
   ```ts
   /** Rebuild childGroupOrder from customGroups[].parentId.
    *  Preserves existing order, appends missing children (alpha), drops dangling IDs. */
   function reconcileChildGroupOrder(
     customGroups: CustomGroup[],
     existing: Record<string, string[]>,
   ): Record<string, string[]> {
     const byParent: Record<string, CustomGroup[]> = {}
     for (const g of customGroups) {
       if (!g.parentId) continue
       (byParent[g.parentId] ??= []).push(g)
     }
     const result: Record<string, string[]> = {}
     for (const [parentId, children] of Object.entries(byParent)) {
       const prev = existing[parentId] ?? []
       const childIds = new Set(children.map((c) => c.id))
       const ordered = prev.filter((id) => childIds.has(id))            // keep known order
       const missing = children
         .filter((c) => !ordered.includes(c.id))
         .sort((a, b) => a.displayName.localeCompare(b.displayName))
         .map((c) => c.id)
       result[parentId] = [...ordered, ...missing]
     }
     return result
   }
   ```
6. In `importState` (line ~377-388) replace
   `childGroupOrder: data.childGroupOrder,` with
   `childGroupOrder: reconcileChildGroupOrder(data.customGroups, data.childGroupOrder ?? {}),`
7. In persist `merge` (line ~392-418) compute and include a reconciled
   childGroupOrder:
   ```ts
   const reconciledChildOrder = reconcileChildGroupOrder(
     stored.customGroups ?? [],
     stored.childGroupOrder ?? {},
   )
   ...
   return { ...current, ...stored, groupOrder: merged, tileTypeOverrides,
            childGroupOrder: reconciledChildOrder,
            multiTileConfigs: stored.multiTileConfigs ?? {},
            tileTitleOverrides: stored.tileTitleOverrides ?? {} }
   ```
   This makes existing users with an already-corrupt persisted store self-heal
   on next page load — no manual re-import required.

### Phase 3 (optional, only if Phase 0 shows top-level orphans too)
8. If some custom groups have a `parentId` pointing at a non-existent parent (so
   they are neither top-level nor a visible child of any real group), add a
   small repair in `merge`/`importState`: any custom group whose `parentId` does
   not match an existing group id gets `parentId` cleared and its id appended to
   `groupOrder` (so it becomes a deletable top-level group). Gate this behind
   confirming the symptom actually exists; do not add speculative logic.

## Files likely to change
- `frontend/src/components/GroupPage.tsx`  (Phase 1: childGroups derivation,
  grandchildCount)
- `frontend/src/store/groupStore.ts`       (Phase 2: reconcileChildGroupOrder
  helper, importState, persist merge; Phase 3 optional orphan reparenting)

No backend, schema, or config files change.

## Tests / validation
Manual (primary — there is a Playwright dep `@playwright/test` in frontend; no
existing component unit-test harness was found, so verification is manual + lint
+ typecheck):
1. `cd frontend && npm run lint` — no new lint errors.
2. `cd frontend && npx tsc -b --noEmit` (or `npm run build`) — typechecks clean.
3. Dev run, then with a backup that has orphaned sub-groups imported:
   - Parent custom group page now shows the "Sub-groups" section.
   - Enter Edit mode -> each sub-group card shows up / down / X controls.
   - Click X on a sub-group -> it is removed (verify `removeCustomGroup` runs;
     toast "Removed ...") and disappears; reload page -> still gone.
   - Up/Down reorder persists across reload.
   - Create a NEW sub-group via "Sub-group" button -> appears, deletable
     (regression check that the add path still works).
4. Reload WITHOUT re-importing on an already-corrupt store -> sub-groups appear
   (confirms persist `merge` self-heal).
5. Static group pages and the "Other" page unaffected (device tile X overlay
   path in `EditOverlay` untouched).

If a Playwright e2e for groups is desired, add a spec under
`frontend/tests/` (or wherever existing specs live — confirm during execution)
that seeds localStorage with an orphaned sub-group and asserts the X button is
visible and deletion works. Treat as nice-to-have, not required for the fix.

## Risks, tradeoffs, open questions
- RISK: Deriving children from `parentId` could surface duplicates if the same
  group somehow appears with parentId AND is also a top-level entry in
  `groupOrder`. Mitigation: the Sidebar/top-level list filters by parentId
  (confirm during execution that Sidebar excludes `parentId`-set groups from the
  top-level list; if it does not, that is a related pre-existing bug to note).
- TRADEOFF: `childGroupOrder` becomes ordering-only, not membership. This is the
  correct normalized model and matches how `addCustomGroup`/`removeCustomGroup`
  already maintain it, so drift risk is low after reconcile.
- OPEN QUESTION: Does the Android app (which shares `GroupExportPayload`) rely on
  `childGroupOrder` for membership too? If yes, the same orphaning bug may exist
  there. Out of scope for this web fix but worth flagging to the user — Android
  sources live under `/home/tim/gitrepos/HubitatDashboard/android` (per memory)
  / the shared payload shape is defined in groupStore.ts.
- LIKELY BLOCKER during execution: confirming the exact shape of the user's
  imported backup. Phase 0 (inspect localStorage `hubitat-group-store`) resolves
  this quickly without needing the hub online.
- The persist `merge` change runs for ALL users on next load; it is idempotent
  and order-preserving, so safe, but should be sanity-checked against a store
  that already has correct childGroupOrder (no reordering should occur).

## Execution note
This was written in plan mode — no code has been changed yet. To proceed, say
"execute" and I will apply Phases 1 and 2 (and run Phase 0 inspection first to
confirm the orphan shape), then lint + typecheck.

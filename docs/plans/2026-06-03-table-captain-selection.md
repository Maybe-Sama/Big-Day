# Table Captain Selection Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Let admins choose or remove a table captain directly from the people list in the seating table popover.

**Architecture:** Add a tiny pure helper for captain toggle behavior and use it from `TableInfoPopover`. The existing `MesaConfig.capitanId` and `updateTable` autosave flow remain the source of truth.

**Tech Stack:** React, TypeScript, Vitest, lucide-react, existing shadcn UI primitives.

---

### Task 1: Captain Toggle Helper

**Files:**
- Create: `src/lib/mesas-utils.ts`
- Test: `src/lib/mesas-utils.test.ts`

**Step 1:** Write failing tests for selecting and deselecting a captain.

**Step 2:** Run `npx vitest run src/lib/mesas-utils.test.ts` and confirm the helper is missing.

**Step 3:** Implement `toggleMesaCaptainId(currentCapitanId, personaId)`.

**Step 4:** Re-run the test and confirm it passes.

### Task 2: Popover UI

**Files:**
- Modify: `src/components/seating/TableInfoPopover.tsx`

**Step 1:** Import `Crown` and `toggleMesaCaptainId`.

**Step 2:** Add a crown icon button to each seated person row.

**Step 3:** Call `updateTable(mesaId, { capitanId: toggleMesaCaptainId(mesa.capitanId, p.personaId) })` when clicked.

**Step 4:** Show the active captain with a yellow highlight, crown label, and accessible title.

### Task 3: Verification

**Step 1:** Run `npx vitest run src/lib/mesas-utils.test.ts`.

**Step 2:** Run `npm run build`.

**Step 3:** Report any warnings or failures.

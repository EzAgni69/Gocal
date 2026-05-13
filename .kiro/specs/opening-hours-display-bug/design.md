# Opening Hours Display Bug — Bugfix Design

## Overview

Two independent bugs prevent vendor opening hours from displaying correctly across the application.

**Bug 1 — Day-name key mismatch**: The contact card request form (`request-card/page.tsx`) stores opening hours under full day-name keys (`Monday`–`Sunday`). The display utilities (`formatOpeningHours`, `getAllOpeningHours`) and the vendor DB schema both expect abbreviated keys (`Mon`–`Sun`). Because the keys never match, every lookup returns the fallback value instead of the vendor's actual hours.

**Bug 2 — Wrong key path in MiniWebsite.tsx**: The "Boutique Hours" section reads `vendor.openingHours?.general?.open`, a key path that does not exist in the `OpeningHours` type. This always evaluates to `undefined`, so the component falls back to the hardcoded string `'Mon - Sat: 10:00 AM - 9:00 PM\nSun: By Appointment'` regardless of what the vendor submitted.

The fix is purely in the frontend: (1) map full day names to abbreviated keys in the form submission handler before sending the payload, and (2) replace the invalid key path in `MiniWebsite.tsx` with the existing `formatOpeningHours` / `getAllOpeningHours` utilities.

---

## Glossary

- **Bug_Condition (C)**: The set of conditions that trigger either bug — either opening hours are stored under full day-name keys, or the mini website reads a non-existent key path.
- **Property (P)**: The desired behavior when the bug condition holds — the correct vendor hours are displayed instead of a fallback.
- **Preservation**: Existing behaviors that must remain unchanged by the fix — correct display for vendors whose hours are already stored under abbreviated keys, graceful fallback for vendors with no hours, and correct "Closed" display for days marked closed.
- **`formatOpeningHours`**: The function in `apps/frontend/src/utils/openingHours.ts` that returns today's hours as a formatted string (e.g. `9:00 AM - 9:00 PM`) or a fallback string. Keyed by abbreviated day names (`Mon`–`Sun`).
- **`getAllOpeningHours`**: The function in `apps/frontend/src/utils/openingHours.ts` that returns a formatted array of all seven days. Keyed by abbreviated day names (`Mon`–`Sun`).
- **`DAYS` (form)**: The constant in `request-card/page.tsx` — `['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']` — used as keys in the form state.
- **`DAYS` (utils)**: The constant in `openingHours.ts` — `['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']` — used as keys by all display utilities and the DB schema.
- **`openingHours` (DB schema)**: The `jsonb` column in `packages/database/src/schema/vendors.ts`, documented as `{ Mon: { open: "09:00", close: "21:00" }, ... }`.

---

## Bug Details

### Bug Condition

The bug manifests in two distinct scenarios:

**Scenario A** — A vendor submits the request-card form. The `handleSubmit` function passes `formData.openingHours` directly into the API payload without remapping keys. The form state uses full day names (`Monday`–`Sunday`), so the stored object has keys like `{ Monday: { open: "09:00", close: "21:00" } }`. When `formatOpeningHours` or `getAllOpeningHours` later look up `openingHours['Mon']`, they find `undefined` and return fallback text.

**Scenario B** — The mini website home tab renders the "Boutique Hours" section. It reads `(vendor.openingHours as any)?.general?.open`, which is always `undefined` because the `OpeningHours` type has no `general` property. The component falls back to the hardcoded string unconditionally.

**Formal Specification:**

```
FUNCTION isBugCondition(input)
  INPUT: input — one of:
           A: { context: 'form-submission', openingHours: OpeningHoursMap }
           B: { context: 'mini-website-render', vendor: Vendor }
  OUTPUT: boolean

  IF input.context = 'form-submission' THEN
    RETURN EXISTS key IN KEYS(input.openingHours)
           WHERE key IN ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
    -- Full day-name keys are present; abbreviated-key lookups will miss them

  IF input.context = 'mini-website-render' THEN
    RETURN TRUE
    -- The key path vendor.openingHours?.general?.open never exists;
    -- the bug fires unconditionally for every vendor in MiniWebsite.tsx

END FUNCTION
```

### Examples

- **Bug A — form submission**: Vendor sets Monday 09:00–21:00. Stored as `{ Monday: { open: "09:00", close: "21:00" } }`. `formatOpeningHours` looks up `openingHours['Mon']` → `undefined` → returns `'Hours not available'`. Expected: `'9:00 AM - 9:00 PM'`.
- **Bug A — weekly schedule**: `getAllOpeningHours` iterates `['Sun','Mon','Tue',...]`, finds nothing, returns all days as `'Closed'`. Expected: each day shows the vendor's actual hours or `'Closed'` only for days explicitly marked closed.
- **Bug B — mini website**: Vendor has valid hours stored under abbreviated keys. MiniWebsite reads `vendor.openingHours?.general?.open` → `undefined` → displays `'Mon - Sat: 10:00 AM - 9:00 PM\nSun: By Appointment'`. Expected: the vendor's actual hours via `formatOpeningHours` / `getAllOpeningHours`.
- **Edge case — no hours set**: `vendor.openingHours` is `null`. Both `formatOpeningHours(null)` and `getAllOpeningHours(null)` already handle this gracefully; the fix must not break this path.

---

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Vendors whose opening hours are already stored under abbreviated keys (`Mon`–`Sun`) must continue to display correctly in both `ContactCardModal` and `MiniWebsite`.
- When `vendor.openingHours` is `null` or `undefined`, `ContactCardModal` must continue to show `'Hours not available'` and `MiniWebsite` must show a graceful fallback.
- Days explicitly marked `closed: true` must continue to display `'Closed'` in both the weekly schedule and the mini website.
- The backend validation schema for the contact card request must remain unchanged — the fix is a pure frontend key-mapping transformation applied before the API call.
- The admin approval flow that copies `openingHours` from the request record to the vendor record must remain unchanged.

**Scope:**
All inputs that do NOT involve the two bug conditions should be completely unaffected by this fix. This includes:
- Vendors with hours already stored under abbreviated keys
- Vendors with `null` / `undefined` opening hours
- All non-opening-hours fields in the request-card form
- All other tabs and sections of `MiniWebsite.tsx`

---

## Hypothesized Root Cause

Based on code inspection, the root causes are confirmed (not merely hypothesized):

1. **Full vs. abbreviated day-name mismatch (Bug A)**: `request-card/page.tsx` defines `DAYS = ['Monday', 'Tuesday', ...]` and uses these as keys in `defaultOpeningHours` and `formData.openingHours`. The `handleSubmit` function passes `formData.openingHours` directly into the payload without any key transformation. The display utilities and DB schema both use `['Sun', 'Mon', 'Tue', ...]`. There is no shared constant or mapping between the two representations.

2. **Non-existent key path (Bug B)**: `MiniWebsite.tsx` reads `(vendor.openingHours as any)?.general?.open`. The `OpeningHours` type is `{ [day: string]: { open: string; close: string; closed?: boolean } | { closed: true } }` — it has no `general` property. The `as any` cast suppresses the TypeScript error, masking the bug at compile time. The correct approach is to call `formatOpeningHours(vendor.openingHours)` and `getAllOpeningHours(vendor.openingHours)`, which are already imported in `ContactCardModal.tsx` but not used in `MiniWebsite.tsx`.

3. **No shared day-name constant**: The form and the utilities each define their own `DAYS` array independently, making the mismatch easy to introduce and hard to notice in review.

4. **`as any` cast hiding type error**: The cast in `MiniWebsite.tsx` prevents TypeScript from flagging the invalid key path, so the bug survives static analysis.

---

## Correctness Properties

Property 1: Bug Condition — Opening Hours Display Reflects Vendor Data

_For any_ vendor whose opening hours are stored (whether submitted via the form after the fix, or already stored under abbreviated keys), the fixed `formatOpeningHours` call in `ContactCardModal` and the fixed "Boutique Hours" section in `MiniWebsite` SHALL display the vendor's actual open/close times (or `'Closed today'` / `'Closed'` for days marked closed), and SHALL NOT display the hardcoded fallback string or `'Hours not available'` when valid hours exist.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

Property 2: Preservation — Non-Buggy Inputs Produce Identical Output

_For any_ input where the bug condition does NOT hold — specifically, vendors with hours already stored under abbreviated keys, vendors with `null`/`undefined` opening hours, and all non-opening-hours interactions — the fixed code SHALL produce exactly the same output as the original code, preserving all existing display behavior, form behavior, and backend flows.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

---

## Fix Implementation

### Changes Required

**Fix A — Key remapping in form submission handler**

**File**: `apps/frontend/src/app/request-card/page.tsx`

**Function**: `handleSubmit`

**Specific Changes**:

1. **Add a day-name mapping constant** (near the top of the file, alongside the existing `DAYS` constant):
   ```typescript
   const FULL_TO_ABBR: Record<string, string> = {
     Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed',
     Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat', Sunday: 'Sun',
   };
   ```

2. **Remap keys before building the payload** (inside `handleSubmit`, before constructing `payload`):
   ```typescript
   const normalizedOpeningHours = Object.fromEntries(
     Object.entries(formData.openingHours).map(([day, hours]) => [
       FULL_TO_ABBR[day] ?? day,
       hours,
     ])
   );
   ```

3. **Use `normalizedOpeningHours` in the payload** instead of `formData.openingHours`:
   ```typescript
   openingHours: normalizedOpeningHours,
   ```

---

**Fix B — Replace invalid key path in MiniWebsite**

**File**: `apps/frontend/src/components/MiniWebsite.tsx`

**Specific Changes**:

1. **Import the display utilities** at the top of the file:
   ```typescript
   import { formatOpeningHours, getAllOpeningHours } from '../utils/openingHours';
   ```

2. **Replace the hardcoded/invalid expression** in the "Boutique Hours" section:

   Before:
   ```tsx
   <p className="text-gray-600 font-light whitespace-pre-line">
     {(vendor.openingHours as any)?.general?.open || 'Mon - Sat: 10:00 AM - 9:00 PM\nSun: By Appointment'}
   </p>
   ```

   After:
   ```tsx
   <div className="text-gray-600 font-light space-y-1">
     {getAllOpeningHours(vendor.openingHours).length > 0
       ? getAllOpeningHours(vendor.openingHours).map(({ day, hours, isToday }) => (
           <p key={day} className={isToday ? 'font-semibold text-black' : ''}>
             {day}: {hours}
           </p>
         ))
       : <p>{formatOpeningHours(vendor.openingHours)}</p>
     }
   </div>
   ```

   Alternatively, for a simpler single-line display consistent with the existing style:
   ```tsx
   <p className="text-gray-600 font-light">
     {formatOpeningHours(vendor.openingHours)}
   </p>
   ```

---

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate each bug on the unfixed code to confirm the root cause analysis; then verify the fix works correctly and preserves existing behavior.

---

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate both bugs BEFORE implementing the fix. Confirm the root cause analysis. If the tests do not fail as expected, re-examine the root cause.

**Test Plan**: Write unit tests that (A) call `formatOpeningHours` and `getAllOpeningHours` with a full-day-name-keyed object (simulating what the form currently submits), and (B) render the `MiniWebsite` home tab and assert the displayed text. Run these tests on the UNFIXED code to observe failures.

**Test Cases**:

1. **Full-key hours → formatOpeningHours (Bug A)**: Pass `{ Monday: { open: '09:00', close: '21:00' } }` to `formatOpeningHours` on a Monday. Assert result equals `'9:00 AM - 9:00 PM'`. Will fail on unfixed code (returns `'Hours not available'`).

2. **Full-key hours → getAllOpeningHours (Bug A)**: Pass a full-day-name-keyed object to `getAllOpeningHours`. Assert that at least one entry has hours other than `'Closed'`. Will fail on unfixed code (all entries return `'Closed'`).

3. **MiniWebsite Boutique Hours (Bug B)**: Render `MiniWebsite` with a vendor that has valid abbreviated-key hours. Assert the displayed text matches the vendor's actual hours. Will fail on unfixed code (displays hardcoded fallback).

4. **Edge case — mixed keys**: Pass an object with both full and abbreviated keys. Observe which keys are found. May partially fail on unfixed code.

**Expected Counterexamples**:
- `formatOpeningHours({ Monday: { open: '09:00', close: '21:00' } })` returns `'Hours not available'` instead of `'9:00 AM - 9:00 PM'`
- `getAllOpeningHours({ Monday: { open: '09:00', close: '21:00' } })` returns all days as `'Closed'`
- MiniWebsite displays `'Mon - Sat: 10:00 AM - 9:00 PM\nSun: By Appointment'` regardless of vendor data

---

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed code produces the expected behavior.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := fixedCode(input)
  ASSERT expectedBehavior(result)
    -- For Bug A: formatOpeningHours(normalizedHours) returns actual hours string
    -- For Bug B: MiniWebsite displays vendor.openingHours via formatOpeningHours/getAllOpeningHours
END FOR
```

---

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed code produces the same result as the original code.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT originalCode(input) = fixedCode(input)
    -- Abbreviated-key vendors: same display output
    -- null/undefined hours: same fallback output
    -- Closed days: same 'Closed' output
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many random `OpeningHours` objects (with abbreviated keys, null values, closed days) automatically
- It catches edge cases that manual unit tests might miss (e.g. partial objects, all-closed weeks)
- It provides strong guarantees that the key-remapping transformation does not affect already-correct abbreviated-key data

**Test Plan**: Observe behavior on UNFIXED code for abbreviated-key vendors and null-hours vendors, then write property-based tests capturing that behavior.

**Test Cases**:

1. **Abbreviated-key preservation**: Verify that `formatOpeningHours({ Mon: { open: '09:00', close: '21:00' } })` returns the same result before and after the fix.
2. **Null hours preservation**: Verify that `formatOpeningHours(null)` and `getAllOpeningHours(null)` return the same fallback values before and after the fix.
3. **Closed-day preservation**: Verify that days with `{ closed: true }` continue to display `'Closed'` after the fix.
4. **Non-opening-hours form fields**: Verify that the key-remapping change in `handleSubmit` does not affect any other field in the submitted payload.

---

### Unit Tests

- Test `formatOpeningHours` with a full-day-name-keyed object (expects fix to normalize keys before calling utility, or utility to handle both)
- Test `getAllOpeningHours` with a full-day-name-keyed object
- Test the `FULL_TO_ABBR` mapping covers all seven days correctly
- Test `normalizedOpeningHours` output for a complete week of full-name keys
- Test `MiniWebsite` "Boutique Hours" section renders `formatOpeningHours` output
- Test edge cases: empty object, null, all days closed, single day open

### Property-Based Tests

- Generate random `OpeningHours` objects with abbreviated keys and verify `formatOpeningHours` output is unchanged by the fix (preservation)
- Generate random full-day-name-keyed objects and verify the normalized output has only abbreviated keys and identical hour values (fix correctness)
- Generate random vendor objects and verify `MiniWebsite` never displays the hardcoded fallback string when `openingHours` is non-null (fix correctness)
- Generate random `OpeningHours` objects with a mix of open and closed days and verify `getAllOpeningHours` returns `'Closed'` only for days with `closed: true` (preservation)

### Integration Tests

- Submit the request-card form with opening hours set for all seven days; verify the stored payload uses abbreviated keys
- Render `ContactCardModal` for a vendor with abbreviated-key hours; verify today's hours are displayed correctly
- Render `MiniWebsite` home tab for a vendor with abbreviated-key hours; verify the "Boutique Hours" section shows actual hours
- Render `ContactCardModal` for a vendor with `null` opening hours; verify `'Hours not available'` is shown
- Render `MiniWebsite` for a vendor with `null` opening hours; verify a graceful fallback is shown (not the hardcoded string)

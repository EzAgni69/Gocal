# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Opening Hours Key Mismatch & Invalid Key Path
  - **CRITICAL**: This test MUST FAIL on unfixed code — failure confirms both bugs exist
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior — it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate both bugs exist
  - **Scoped PBT Approach**: Scope to the concrete failing cases for reproducibility
  - Create `apps/frontend/src/__tests__/openingHours.bugCondition.test.ts`
  - **Bug A — full-key mismatch (isBugCondition: any key in openingHours ∈ {Monday…Sunday})**:
    - Call `formatOpeningHours({ Monday: { open: '09:00', close: '21:00' } })` on a Monday — assert result equals `'9:00 AM - 9:00 PM'`
    - Call `getAllOpeningHours({ Monday: { open: '09:00', close: '21:00' }, Tuesday: { open: '10:00', close: '18:00' }, Wednesday: { open: '10:00', close: '18:00' }, Thursday: { open: '10:00', close: '18:00' }, Friday: { open: '10:00', close: '18:00' }, Saturday: { closed: true }, Sunday: { closed: true } })` — assert at least one entry has hours other than `'Closed'`
    - Use `fast-check` to generate arbitrary full-day-name-keyed objects and assert `formatOpeningHours` never returns `'Hours not available'` when at least one day has valid open/close times
  - **Bug B — invalid key path (isBugCondition: always true for MiniWebsite render)**:
    - Render `MiniWebsite` with a vendor whose `openingHours` is `{ Mon: { open: '09:00', close: '21:00' }, Tue: { open: '09:00', close: '21:00' }, Wed: { open: '09:00', close: '21:00' }, Thu: { open: '09:00', close: '21:00' }, Fri: { open: '09:00', close: '21:00' }, Sat: { closed: true }, Sun: { closed: true } }`
    - Assert the rendered "Boutique Hours" section does NOT contain the hardcoded string `'Mon - Sat: 10:00 AM - 9:00 PM'`
    - Assert the rendered output contains actual hours from the vendor data
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests FAIL (this is correct — it proves both bugs exist)
  - Document counterexamples found:
    - `formatOpeningHours({ Monday: { open: '09:00', close: '21:00' } })` returns `'Hours not available'` instead of `'9:00 AM - 9:00 PM'`
    - `getAllOpeningHours({ Monday: ... })` returns all days as `'Closed'`
    - MiniWebsite displays `'Mon - Sat: 10:00 AM - 9:00 PM\nSun: By Appointment'` regardless of vendor data
  - Mark task complete when tests are written, run, and failures are documented
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Abbreviated-Key Vendors, Null Hours, and Closed Days
  - **IMPORTANT**: Follow observation-first methodology
  - **Observe on UNFIXED code** (isBugCondition is false for these inputs):
    - `formatOpeningHours({ Mon: { open: '09:00', close: '21:00' } })` on a Monday → observe actual return value (e.g. `'9:00 AM - 9:00 PM'`)
    - `formatOpeningHours(null)` → observe returns `'Hours not available'`
    - `formatOpeningHours(undefined)` → observe returns `'Hours not available'`
    - `getAllOpeningHours(null)` → observe returns `[]`
    - `getAllOpeningHours({ Mon: { closed: true }, Tue: { open: '10:00', close: '18:00' }, Wed: { open: '10:00', close: '18:00' }, Thu: { open: '10:00', close: '18:00' }, Fri: { open: '10:00', close: '18:00' }, Sat: { closed: true }, Sun: { closed: true } })` → observe `Mon` entry has `hours: 'Closed'`
  - Create `apps/frontend/src/__tests__/openingHours.preservation.test.ts`
  - **Write property-based tests capturing observed behavior** (from Preservation Requirements in design):
    - Use `fast-check` to generate arbitrary `OpeningHours` objects with abbreviated keys (`Mon`–`Sun`) and verify `formatOpeningHours` output is identical before and after the fix
    - Use `fast-check` to generate arbitrary abbreviated-key objects and verify `getAllOpeningHours` returns exactly 7 entries, one per abbreviated day
    - Property: for all abbreviated-key objects, `getAllOpeningHours` returns `'Closed'` only for days where `closed: true` or the day is absent
    - Property: `formatOpeningHours(null)` always returns `'Hours not available'`
    - Property: `getAllOpeningHours(null)` always returns `[]`
    - Property: for all abbreviated-key objects with at least one day having `closed: true`, that day's entry in `getAllOpeningHours` has `hours: 'Closed'`
    - Unit test: `FULL_TO_ABBR` mapping (once added) covers all 7 days and maps to the correct abbreviated keys
    - Unit test: `normalizedOpeningHours` output for a complete 7-day full-name-keyed object has only abbreviated keys and identical hour values
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 3. Fix opening hours display bugs

  - [x] 3.1 Implement Fix A — key remapping in form submission handler
    - File: `apps/frontend/src/app/request-card/page.tsx`
    - Add `FULL_TO_ABBR` constant near the existing `DAYS` constant:
      ```typescript
      const FULL_TO_ABBR: Record<string, string> = {
        Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed',
        Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat', Sunday: 'Sun',
      };
      ```
    - Add `normalizedOpeningHours` computation inside `handleSubmit`, before building `payload`:
      ```typescript
      const normalizedOpeningHours = Object.fromEntries(
        Object.entries(formData.openingHours).map(([day, hours]) => [
          FULL_TO_ABBR[day] ?? day,
          hours,
        ])
      );
      ```
    - Replace `openingHours: formData.openingHours` with `openingHours: normalizedOpeningHours` in the `payload` object
    - _Bug_Condition: isBugCondition(input) where input.context = 'form-submission' AND EXISTS key IN KEYS(input.openingHours) WHERE key ∈ ['Monday'…'Sunday']_
    - _Expected_Behavior: stored openingHours object has only abbreviated keys (Mon–Sun) matching the keys expected by formatOpeningHours and getAllOpeningHours_
    - _Preservation: all non-opening-hours fields in the payload remain unchanged; backend validation schema is not modified_
    - _Requirements: 2.1, 3.4, 3.5_

  - [x] 3.2 Implement Fix B — replace invalid key path in MiniWebsite
    - File: `apps/frontend/src/components/MiniWebsite.tsx`
    - Add import at the top of the file:
      ```typescript
      import { formatOpeningHours, getAllOpeningHours } from '../utils/openingHours';
      ```
    - Replace the "Boutique Hours" `<p>` element in the home tab info section:
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
    - Remove the `as any` cast — the fix uses the typed utility functions directly
    - _Bug_Condition: isBugCondition(input) where input.context = 'mini-website-render' — always true for the old code path_
    - _Expected_Behavior: "Boutique Hours" section displays vendor's actual hours via formatOpeningHours / getAllOpeningHours; never shows hardcoded fallback when openingHours is non-null_
    - _Preservation: null/undefined openingHours still shows graceful fallback via formatOpeningHours; all other MiniWebsite tabs and sections are unchanged_
    - _Requirements: 2.4, 3.1, 3.2, 3.3_

  - [x] 3.3 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Opening Hours Display Reflects Vendor Data
    - **IMPORTANT**: Re-run the SAME tests from task 1 — do NOT write new tests
    - The tests from task 1 encode the expected behavior (Requirements 2.1–2.4)
    - When these tests pass, they confirm the expected behavior is satisfied for both bugs
    - Run `apps/frontend/src/__tests__/openingHours.bugCondition.test.ts`
    - **EXPECTED OUTCOME**: Tests PASS (confirms both bugs are fixed)
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 3.4 Verify preservation tests still pass
    - **Property 2: Preservation** - Non-Buggy Inputs Produce Identical Output
    - **IMPORTANT**: Re-run the SAME tests from task 2 — do NOT write new tests
    - Run `apps/frontend/src/__tests__/openingHours.preservation.test.ts`
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm abbreviated-key vendors, null-hours vendors, and closed-day vendors all behave identically to the unfixed code
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 4. Checkpoint — Ensure all tests pass
  - Run the full frontend test suite: `cd apps/frontend && npx jest --run` (or `npm test -- --watchAll=false`)
  - Ensure all tests pass; ask the user if any questions arise
  - Verify no TypeScript errors in the two modified files (`request-card/page.tsx`, `MiniWebsite.tsx`) by running `tsc --noEmit` in `apps/frontend`
  - Confirm the `as any` cast has been removed from `MiniWebsite.tsx` and TypeScript is satisfied

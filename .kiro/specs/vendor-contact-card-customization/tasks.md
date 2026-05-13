# Implementation Plan: Vendor Contact Card Customization

## Overview

Replace three hardcoded placeholder strings in `MiniWebsite.tsx` ("The Maison", "Heritage & Elegance", and the static about paragraph) with vendor-supplied values. The implementation flows through five layers in order: database schema → backend validation & persistence → approval propagation → frontend rendering → vendor dashboard editing.

## Tasks

- [x] 1. Add new columns to the `contact_card_requests` database schema
  - Add `businessLabel varchar(100)`, `tagline varchar(150)`, and `aboutDescription text` as nullable columns to `packages/database/src/schema/contactCardRequests.ts`
  - Generate and apply a Drizzle migration with the corresponding `ALTER TABLE` statement
  - Export updated `ContactCardRequest` and `NewContactCardRequest` types
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 2. Extend backend validation and persistence for the card request route
  - [x] 2.1 Add Zod validation fields to `cardRequestSchema` in `apps/backend/src/routes/contactCardRequestRoutes.ts`
    - Add `businessLabel: z.string().max(100).optional()`, `tagline: z.string().max(150).optional()`, `aboutDescription: z.string().max(1000).optional()` to the `body` object
    - _Requirements: 2.1, 2.2, 2.3, 2.6, 2.7, 2.8_

  - [x] 2.2 Extend the `POST /api/card-requests` handler to persist the three new fields
    - Destructure `businessLabel`, `tagline`, `aboutDescription` from `req.body`
    - Include them in the `db.insert(contactCardRequests).values(...)` call as `businessLabel: businessLabel || null`, etc.
    - _Requirements: 2.4, 2.5_

  - [x] 2.3 Write property test for schema length enforcement (Property 3)
    - **Property 3: Schema length enforcement**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.6, 2.7, 2.8**
    - Use `fast-check` in `apps/backend/src/__tests__/contactCardRequestRoutes.test.ts`
    - Assert strings within limits pass; strings exceeding limits return HTTP 400

  - [x] 2.4 Write unit tests for the POST handler persistence
    - Test that valid payloads with all three fields return 201 and include the values
    - Test that omitted fields are stored as `null` without error
    - _Requirements: 2.4, 2.5_

- [x] 3. Propagate customizable text to the vendor record on approval
  - [x] 3.1 Extend the `miniConfig` construction in the `PUT /api/card-requests/:id/review` approval handler
    - After the existing `if (existingRequest.googleDirectionLink)` guard, add conditional guards for `businessLabel`, `tagline`, and `aboutDescription`
    - Only write a key when the value is non-null (omit the key entirely for null values)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 3.2 Write property test for approval propagation (Property 5)
    - **Property 5: Approval propagation**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
    - Extract and unit-test the `buildMiniConfig` logic with `fast-check` in `apps/backend/src/__tests__/contactCardRequestRoutes.test.ts`
    - Assert non-null values appear as keys; null values produce no key in the resulting object

  - [x] 3.3 Write unit test for miniWebsiteConfig field preservation (Property 6)
    - **Property 6: miniWebsiteConfig field preservation**
    - **Validates: Requirements 3.5**
    - Assert that pre-existing keys like `googleMapsUrl` remain present after the three new keys are written

- [x] 4. Checkpoint — Ensure all backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Update frontend TypeScript types
  - [x] 5.1 Add three optional fields to `MiniWebsiteConfig` interface in `apps/frontend/src/types`
    - `businessLabel?: string`, `tagline?: string`, `aboutDescription?: string`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [x] 5.2 Add three optional nullable fields to the `ContactCardRequest` type
    - `businessLabel?: string | null`, `tagline?: string | null`, `aboutDescription?: string | null`
    - _Requirements: 1.6_

  - [x] 5.3 Add three string fields to the `FormData` interface in `apps/frontend/src/app/request-card/page.tsx`
    - `businessLabel: string`, `tagline: string`, `aboutDescription: string` (defaulting to `''` in `initialFormData`)
    - _Requirements: 1.1, 1.2, 1.3_

- [x] 6. Add input fields to the request form (Step 3) and review step
  - [x] 6.1 Add three new input fields to `Step3Business` in `apps/frontend/src/app/request-card/page.tsx`
    - `businessLabel` — `<input type="text" maxLength={100} />` with character counter
    - `tagline` — `<input type="text" maxLength={150} />` with character counter
    - `aboutDescription` — `<textarea maxLength={1000} />` with character counter
    - All three are optional (no `required` attribute, no validation in `validateStep(3)`)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 6.2 Include the three fields in the `handleSubmit` payload
    - Add `businessLabel: formData.businessLabel || undefined`, `tagline: formData.tagline || undefined`, `aboutDescription: formData.aboutDescription || undefined` to the payload object
    - _Requirements: 1.6_

  - [x] 6.3 Add a "Brand Copy" section to `StepReview`
    - Display `businessLabel`, `tagline`, and `aboutDescription` values (or `—` placeholder when empty)
    - Include an Edit button that calls `handleEdit(3)` for each field
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [x] 6.4 Write unit tests for the Review step Brand Copy section
    - Test that values are displayed when present
    - Test that `—` placeholder is shown when fields are empty
    - Test that the edit button calls `handleEdit(3)`
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 7. Replace hardcoded strings in `MiniWebsite.tsx` with dynamic values and fallbacks
  - [x] 7.1 Compute derived display values at the top of the `MiniWebsite` component
    - `businessLabel`: `vendor.miniWebsiteConfig?.businessLabel?.trim() || vendor.name`
    - `tagline`: `vendor.miniWebsiteConfig?.tagline?.trim() || vendor.shortDescription?.trim() || null`
    - `aboutDescription`: `vendor.miniWebsiteConfig?.aboutDescription?.trim() || vendor.description?.trim() || vendor.shortDescription?.trim() || null`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [x] 7.2 Replace the three hardcoded strings in the Info Section JSX
    - Replace `"The Maison"` with `{businessLabel}`
    - Replace `"Heritage & Elegance"` with a conditional render: `{tagline && <h3>...</h3>}`
    - Replace the static about paragraph with a conditional render: `{aboutDescription && <p>...</p>}`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

  - [x] 7.3 Write property test for Mini Website rendering (Property 8)
    - **Property 8: Mini Website rendering — correct value or fallback**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6**
    - Use `fast-check` in `apps/frontend/src/__tests__/MiniWebsite.test.tsx`
    - Assert `businessLabel` fallback to `vendor.name`; assert no hardcoded strings rendered (Property 7)

  - [x] 7.4 Write unit tests for each fallback path
    - Test `businessLabel` absent → renders `vendor.name`
    - Test `tagline` absent + `shortDescription` present → renders `shortDescription`
    - Test both absent → tagline element omitted
    - Test `aboutDescription` absent → renders `vendor.description`, then `vendor.shortDescription`
    - _Requirements: 4.2, 4.4, 4.6_

- [x] 8. Checkpoint — Ensure all frontend rendering tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Add "Brand Copy" section to `MiniWebsiteEditor` and validate on the vendor update endpoint
  - [x] 9.1 Add three editable fields to `MiniWebsiteEditor.tsx`
    - Add a "Brand Copy" section above the Social Presence section
    - `businessLabel` — `<input type="text" maxLength={100} />` with character counter, pre-populated from `config.businessLabel`
    - `tagline` — `<input type="text" maxLength={150} />` with character counter, pre-populated from `config.tagline`
    - `aboutDescription` — `<textarea maxLength={1000} />` with character counter, pre-populated from `config.aboutDescription`
    - Update `config` state via `setConfig` on change; the existing `handleSave` already includes `config` in the PUT payload
    - _Requirements: 5.1, 5.2, 5.7_

  - [x] 9.2 Add inline length validation to `PUT /api/vendors/:id` in `apps/backend/src/routes/vendorRoutes.ts`
    - After parsing `miniWebsiteConfig`, check `businessLabel` ≤ 100, `tagline` ≤ 150, `aboutDescription` ≤ 1000
    - Return HTTP 400 with a descriptive error message if any limit is exceeded
    - _Requirements: 5.3, 5.4, 5.5, 5.6_

  - [x] 9.3 Write property test for dashboard validation enforcement (Property 11)
    - **Property 11: Dashboard validation enforcement**
    - **Validates: Requirements 5.4, 5.5, 5.6**
    - Use `fast-check` in `apps/backend/src/__tests__/vendorRoutes.test.ts`
    - Assert strings exceeding limits return HTTP 400; strings within limits return 200

  - [x] 9.4 Write unit tests for `MiniWebsiteEditor` pre-population and save payload
    - Test that fields are pre-populated from `config` on mount (Property 9)
    - Test that the save payload includes the three new keys (Property 10)
    - _Requirements: 5.1, 5.2_

- [x] 10. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- The design uses TypeScript throughout; all code examples should follow the existing project conventions
- The `miniWebsiteConfig` JSONB column on `vendors` requires no migration — it already accepts arbitrary keys
- Only `contact_card_requests` requires a migration (Task 1)
- Property tests use `fast-check` integrated with Jest (`fc.assert(fc.property(...))`)
- Each property test should include the tag comment: `// Feature: vendor-contact-card-customization, Property N: <property text>`

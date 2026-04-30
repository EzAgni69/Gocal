# Implementation Plan: vendor-role-auto-downgrade

## Overview

Implement automatic role downgrade when an admin deletes a vendor card. The work spans a new backend service, a new admin-only route, a small modification to the card-request route, and a frontend update to the vendor delete action.

## Tasks

- [x] 1. Create `RoleDowngradeService`
  - Create `apps/backend/src/services/roleDowngradeService.ts`
  - Implement `deleteVendorWithDowngrade(vendorId, adminUserId): Promise<DowngradeResult>` using `db.transaction()`
  - Inside the transaction: fetch vendor, 404 if missing, 409 if already soft-deleted
  - Count remaining active cards for the owner (excluding the card being deleted)
  - Soft-delete the vendor (`deletedAt = new Date()`)
  - If `owner.role === 'VENDOR'` AND `remainingCount === 0`: update user role to `CONSUMER`
  - Emit structured `logger.info` entries for downgrade and skip events (include `vendorId`, `userId`, `previousRole`, `newRole` or skip reason)
  - Return `{ vendor, roleDowngraded, newRole, previousRole }`
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 5.1, 5.2, 5.3_

  - [ ]* 1.1 Write unit tests for `RoleDowngradeService`
    - Mock `db` and `db.transaction` using Jest mocks
    - Test: owner is `VENDOR` with 0 remaining cards → `roleDowngraded: true`, role updated to `CONSUMER`
    - Test: owner is `VENDOR` with 1 remaining card → `roleDowngraded: false`, role unchanged
    - Test: owner is `ADMIN` with 0 remaining cards → `roleDowngraded: false`, role unchanged
    - Test: owner is `SUPER_ADMIN` with 0 remaining cards → `roleDowngraded: false`, role unchanged
    - Test: owner is `CONSUMER` with 0 remaining cards → `roleDowngraded: false`, role unchanged
    - Test: vendor not found → throws error with 404 context
    - Test: vendor already soft-deleted → throws error with 409 context
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3_

  - [ ]* 1.2 Write property test — Property 1: role downgrade correctness
    - **Property 1: For any owner role and 0 remaining cards, `newRole === 'CONSUMER'` iff `previousRole === 'VENDOR'`; otherwise `newRole === previousRole`**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4**
    - Use `fast-check` with `fc.constantFrom('VENDOR', 'ADMIN', 'SUPER_ADMIN', 'CONSUMER')` for role
    - Tag: `// Feature: vendor-role-auto-downgrade, Property 1: role downgrade correctness`

  - [ ]* 1.3 Write property test — Property 2: multi-card guard
    - **Property 2: For any owner with role `VENDOR` and `remainingCards >= 1`, `roleDowngraded === false` and `newRole === 'VENDOR'`**
    - **Validates: Requirements 2.1, 2.2, 2.3**
    - Use `fc.integer({ min: 1, max: 20 })` for remaining card count
    - Tag: `// Feature: vendor-role-auto-downgrade, Property 2: multi-card guard`

  - [ ]* 1.4 Write property test — Property 3: transaction atomicity
    - **Property 3: If a failure is injected after soft-delete but before role update, vendor `deletedAt` remains `null` and user role is unchanged**
    - **Validates: Requirements 3.1, 3.2, 3.3**
    - Inject a mock DB error mid-transaction and assert rollback
    - Tag: `// Feature: vendor-role-auto-downgrade, Property 3: transaction atomicity`

  - [ ]* 1.5 Write property test — Property 5: audit log completeness
    - **Property 5: For any deletion scenario, logger is called with at least `vendorId` and `userId`; if downgraded, also `previousRole` and `newRole`; if skipped, also the skip reason**
    - **Validates: Requirements 5.1, 5.2, 5.3**
    - Use `fc.record` to generate random vendor/owner combinations
    - Tag: `// Feature: vendor-role-auto-downgrade, Property 5: audit log completeness`

- [x] 2. Create admin vendor route
  - Create `apps/backend/src/routes/adminVendorRoutes.ts`
  - Register `DELETE /:id` with `authenticate` + `requireRole('ADMIN', 'SUPER_ADMIN')` middleware
  - Call `deleteVendorWithDowngrade(req.params.id, req.user.id)`
  - Map service errors to HTTP responses: 404, 409, 500
  - Return `200 { vendor, roleDowngraded, newRole, previousRole }` on success
  - _Requirements: 4.1, 4.2, 4.3, 6.1, 6.2_

  - [ ]* 2.1 Write unit tests for admin vendor route handler
    - Test: unauthenticated request → 401
    - Test: `CONSUMER` role → 403
    - Test: `VENDOR` role → 403
    - Test: `ADMIN` role, successful deletion with downgrade → 200 with `roleDowngraded: true` and `newRole`
    - Test: `ADMIN` role, successful deletion without downgrade → 200 with `roleDowngraded: false`
    - Test: vendor not found → 404
    - Test: vendor already deleted → 409
    - _Requirements: 4.1, 4.2, 4.3, 6.1, 6.2_

  - [ ]* 2.2 Write property test — Property 4: admin-only authorization
    - **Property 4: `DELETE /api/admin/vendors/:id` returns 403 for any role that is not `ADMIN` or `SUPER_ADMIN`**
    - **Validates: Requirements 4.1, 4.2, 4.3**
    - Use `fc.constantFrom('CONSUMER', 'VENDOR')` for non-admin roles
    - Tag: `// Feature: vendor-role-auto-downgrade, Property 4: admin-only authorization`

  - [ ]* 2.3 Write property test — Property 6: API response shape
    - **Property 6: Every successful response contains a boolean `roleDowngraded`; when `true`, also contains `newRole` as a string**
    - **Validates: Requirements 6.1, 6.2**
    - Generate both downgrade and no-downgrade scenarios
    - Tag: `// Feature: vendor-role-auto-downgrade, Property 6: API response shape`

- [x] 3. Register admin vendor route in `index.ts`
  - Modify `apps/backend/src/index.ts`
  - Add `import adminVendorRoutes from './routes/adminVendorRoutes'`
  - Add `app.use('/api/admin/vendors', adminVendorRoutes)` after the existing vendor routes registration
  - _Requirements: 4.1, 4.3_

- [x] 4. Remove VENDOR-role block from card request route
  - Modify `apps/backend/src/routes/contactCardRequestRoutes.ts`
  - Remove the `if (req.user?.role === 'VENDOR')` block that returns 403 in `POST /api/card-requests`
  - The only remaining guard should be the existing PENDING-request check
  - _Requirements: (unblocks re-application after downgrade)_

  - [ ]* 4.1 Write unit tests for updated card request route
    - Test: `VENDOR`-role user with no pending request → 201 (no longer blocked)
    - Test: any user with an existing PENDING request → 409
    - _Requirements: (regression guard)_

- [x] 5. Checkpoint — Ensure all backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Update frontend vendor delete action
  - Modify `apps/frontend/src/services/vendorService.ts`
  - Add `deleteAdminVendor(vendorId: string): Promise<{ vendor: any; roleDowngraded: boolean; newRole?: string }>` that calls `DELETE /api/admin/vendors/:id`
  - Update the admin dashboard component that calls `removeVendor` to call `deleteAdminVendor` instead
  - When `roleDowngraded === true` in the response, show a toast/notification indicating the user's role was downgraded to Consumer
  - _Requirements: 6.1, 6.2_

- [x] 7. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- `fast-check` must be added as a dev dependency to `apps/backend` before running property tests: `npm install --save-dev fast-check`
- Property tests should run a minimum of 100 iterations each
- The existing `DELETE /api/vendors/:id` route is intentionally left unchanged — it handles owner self-deletion with no role logic
- All property tests belong in `apps/backend/src/__tests__/roleDowngrade.property.test.ts`
- All unit tests belong in `apps/backend/src/__tests__/roleDowngradeService.test.ts` and `apps/backend/src/__tests__/adminVendorRoutes.test.ts`

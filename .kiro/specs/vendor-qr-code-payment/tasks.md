# Implementation Plan: Vendor QR Code Payment

## Overview

Add optional UPI/payment QR code support to the Gocal platform. The implementation is additive and non-breaking: a new `qr_code_url` column is added to `contact_card_requests`, a dedicated upload endpoint is added, the QR URL flows through the card request → approval → vendor record pipeline, and both `ContactCardModal` and `MiniWebsite` conditionally render the QR section. Vendors can also manage their QR code from the dashboard via `MiniWebsiteEditor`.

## Tasks

- [x] 1. Database migration — add `qr_code_url` column to `contact_card_requests`
  - Add `qrCodeUrl: text('qr_code_url')` to `packages/database/src/schema/contactCardRequests.ts`
  - Update the `ContactCardRequest` TypeScript type in `apps/frontend/src/types.ts` to include `qrCodeUrl?: string | null`
  - Create a Drizzle migration file that runs `ALTER TABLE contact_card_requests ADD COLUMN qr_code_url text;`
  - Update the JSDoc comment on `miniWebsiteConfig` in `packages/database/src/schema/vendors.ts` to document the new `qrCodeUrl` key
  - _Requirements: 2.2, 3.1_

- [x] 2. Backend — QR code upload endpoint
  - [x] 2.1 Add `POST /api/upload/qr-code` to `apps/backend/src/routes/uploadRoutes.ts`
    - Define `UPLOADS_QR_CODES` directory constant and ensure it is created on startup (follow the existing pattern for `UPLOADS_LOGOS`, etc.)
    - Create a `uploadQrCode` multer instance using `createUpload(UPLOADS_QR_CODES)`
    - Implement the route handler: authenticate, handle multer errors (413 for size, 400 for type), return `{ imageUrl }` on success
    - The `imageUrl` must include the path segment `/uploads/qr-codes/`
    - Static serving of `uploads/qr-codes/` is already covered by the wildcard `app.use('/uploads', express.static(...))` in `index.ts` — no change needed there
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [ ]* 2.2 Write unit tests for the QR code upload endpoint
    - Test: unauthenticated request → 401
    - Test: oversized file (>5 MB) → 413 with descriptive message
    - Test: non-image file → 400 with descriptive message
    - Test: valid image → 201 with `imageUrl` containing `/uploads/qr-codes/`
    - _Requirements: 7.2, 7.4, 7.5_

  - [ ]* 2.3 Write property test for upload endpoint URL path (Property 10)
    - **Property 10: Upload endpoint returns URL in qr-codes path**
    - **Validates: Requirements 7.3**

- [x] 3. Backend — card request route: schema and persistence
  - [x] 3.1 Add `qrCodeUrl` to `cardRequestSchema` in `apps/backend/src/routes/contactCardRequestRoutes.ts`
    - Add optional field: `qrCodeUrl: z.string().url('Invalid QR code URL').optional().or(z.literal('').transform(() => undefined))`
    - Destructure `qrCodeUrl` from `req.body` in the `POST /api/card-requests` handler
    - Persist `qrCodeUrl: qrCodeUrl || null` in the `db.insert(contactCardRequests)` call
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [ ]* 3.2 Write unit tests for `qrCodeUrl` in the card request schema
    - Test: `qrCodeUrl` absent → valid (no error)
    - Test: `qrCodeUrl` = valid URL → valid, persisted correctly
    - Test: `qrCodeUrl` = empty string → coerced to `undefined`, stored as `null`
    - Test: `qrCodeUrl` = non-URL string → HTTP 400 with field-level error
    - _Requirements: 2.1, 2.3, 2.4_

  - [ ]* 3.3 Write property test for schema URL validation (Property 4)
    - **Property 4: Schema accepts valid URLs and rejects invalid ones**
    - **Validates: Requirements 2.1, 2.4**

  - [ ]* 3.4 Write property test for QR URL round-trip persistence (Property 5)
    - **Property 5: QR URL round-trip through card request persistence**
    - **Validates: Requirements 2.2**

- [x] 4. Backend — approval handler: propagate `qrCodeUrl` to vendor record
  - In the `PUT /api/card-requests/:id/review` handler in `contactCardRequestRoutes.ts`, update the `miniConfig` construction block to include:
    ```typescript
    if (existingRequest.qrCodeUrl) miniConfig.qrCodeUrl = existingRequest.qrCodeUrl;
    ```
  - This must be placed alongside the existing `googleMapsUrl`, `businessLabel`, `tagline`, `aboutDescription` assignments so all fields are preserved
  - _Requirements: 3.1, 3.2, 3.3_

  - [ ]* 4.1 Write unit tests for the approval handler QR propagation
    - Test: request with non-null `qrCodeUrl` → vendor `miniWebsiteConfig.qrCodeUrl` equals the request value
    - Test: request with `null` `qrCodeUrl` → vendor `miniWebsiteConfig` has no `qrCodeUrl` key
    - Test: existing config fields (`googleMapsUrl`, `businessLabel`, `tagline`, `aboutDescription`) are preserved alongside `qrCodeUrl`
    - _Requirements: 3.1, 3.2, 3.3_

  - [ ]* 4.2 Write property test for approval preserving miniWebsiteConfig fields (Property 6 & 7)
    - **Property 6: QR URL propagates to vendor record on approval**
    - **Property 7: Approval preserves existing miniWebsiteConfig fields**
    - **Validates: Requirements 3.1, 3.3**

- [x] 5. Backend — vendor PUT route: validate `qrCodeUrl`
  - In the `PUT /api/vendors/:id` handler in `apps/backend/src/routes/vendorRoutes.ts`, add a validation block after the existing `aboutDescription` check:
    ```typescript
    if (miniWebsiteConfig?.qrCodeUrl !== undefined && miniWebsiteConfig.qrCodeUrl !== null) {
        if (typeof miniWebsiteConfig.qrCodeUrl !== 'string' || !isValidUrl(miniWebsiteConfig.qrCodeUrl)) {
            return res.status(400).json({ error: 'qrCodeUrl must be a valid URL' });
        }
    }
    ```
  - Add a local `isValidUrl` helper (or reuse URL constructor) for the check
  - _Requirements: 6.8, 6.9_

  - [ ]* 5.1 Write unit tests for vendor PUT `qrCodeUrl` validation
    - Test: valid `qrCodeUrl` → 200, persisted
    - Test: invalid `qrCodeUrl` (non-URL string) → 400 with descriptive error
    - Test: `qrCodeUrl: null` → 200 (removal allowed)
    - _Requirements: 6.8, 6.9_

- [x] 6. Checkpoint — ensure all backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Frontend types — add `qrCodeUrl` to `MiniWebsiteConfig` and `FormData`
  - In `apps/frontend/src/types.ts`, add `qrCodeUrl?: string` to the `MiniWebsiteConfig` interface
  - In `apps/frontend/src/app/request-card/page.tsx`, add `qrCodeUrl: string` to the `FormData` interface and `qrCodeUrl: ''` to `initialFormData`
  - _Requirements: 1.5, 4.1, 5.1, 6.3_

- [x] 8. Frontend — Step 6 Media: QR code upload section
  - In `apps/frontend/src/app/request-card/page.tsx`, add a QR code upload section to the `Step6Media` component
  - Follow the same upload pattern as the logo and main photo fields:
    - File input (`accept="image/*"`) triggers `POST /api/upload/qr-code` via `apiClient`
    - On success: store returned URL in `formData.qrCodeUrl` via `updateFormData`; show a preview `<Image>` of the uploaded QR code
    - On failure: show an inline error message; preserve all other form data
    - Client-side file type validation: reject non-image files before upload with a validation error
  - Display helper text: "Recommended — helps customers pay you directly. You can change this later."
  - The field is optional; no validation error if absent
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.7, 1.8, 1.9_

  - [ ]* 8.1 Write unit tests for Step 6 QR upload section
    - Test: QR upload section is present in Step 6
    - Test: helper text is present
    - Test: field is optional (no error when absent)
    - Test: upload success shows preview image
    - Test: upload failure shows error without losing other fields
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.7_

  - [ ]* 8.2 Write property test for file type acceptance (Property 3)
    - **Property 3: File type acceptance is consistent**
    - **Validates: Requirements 1.8, 1.9**

  - [ ]* 8.3 Write property test for form state capturing uploaded QR URL (Property 1)
    - **Property 1: Form state captures uploaded QR URL**
    - **Validates: Requirements 1.5**

- [x] 9. Frontend — form submission: include `qrCodeUrl` in POST body
  - In the `handleSubmit` function in `apps/frontend/src/app/request-card/page.tsx`, add `qrCodeUrl: formData.qrCodeUrl || undefined` to the `payload` object sent to `POST /api/card-requests`
  - _Requirements: 1.6_

  - [ ]* 9.1 Write property test for submitted form payload including QR URL (Property 2)
    - **Property 2: Submitted form payload includes QR URL**
    - **Validates: Requirements 1.6**

- [x] 10. Frontend — StepReview: QR code thumbnail preview
  - In the `StepReview` component in `apps/frontend/src/app/request-card/page.tsx`, add a QR code row to the review summary:
    - If `formData.qrCodeUrl` is non-empty: render a thumbnail `<Image>` preview and an edit button that calls `handleEdit(6)` to navigate back to Step 6
    - If `formData.qrCodeUrl` is empty: display a placeholder text ("No QR code uploaded") or omit the row
  - _Requirements: 8.1, 8.2, 8.3_

  - [ ]* 10.1 Write unit tests for StepReview QR preview
    - Test: QR thumbnail shown when `qrCodeUrl` is non-empty
    - Test: QR row omitted or shows placeholder when `qrCodeUrl` is empty
    - Test: edit button navigates to step 6
    - _Requirements: 8.1, 8.2, 8.3_

  - [ ]* 10.2 Write property test for review step QR thumbnail (Property 11)
    - **Property 11: Review step shows QR thumbnail iff qrCodeUrl is non-empty**
    - **Validates: Requirements 8.1, 8.2**

- [x] 11. Frontend — ContactCardModal: conditional QR display
  - In `apps/frontend/src/components/ContactCardModal.tsx`, add a "Scan to Pay" section in the content area after the Contact Details block and before the Featured Products section:
    ```tsx
    {vendor.miniWebsiteConfig?.qrCodeUrl && (
      <div className="mb-6">
        <h3 className="font-serif text-lg font-bold text-luxury-black mb-3">Scan to Pay</h3>
        <div className="flex justify-center p-4 bg-luxury-cream rounded-xl border" style={{ borderColor: accentColor + '40' }}>
          <Image
            src={vendor.miniWebsiteConfig.qrCodeUrl}
            alt="Payment QR Code"
            width={200}
            height={200}
            className="rounded-lg"
          />
        </div>
      </div>
    )}
    ```
  - The section must only render when `vendor.miniWebsiteConfig?.qrCodeUrl` is a non-empty string
  - Rendered image must be at least 160×160 CSS pixels (200×200 used)
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ]* 11.1 Write unit tests for ContactCardModal QR display
    - Test: renders QR section with non-empty `qrCodeUrl`
    - Test: does not render QR section when `qrCodeUrl` is absent or empty
    - Test: label "Scan to Pay" is present when QR is shown
    - Test: image rendered at ≥ 160px
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ]* 11.2 Write property test for ContactCardModal conditional rendering (Property 8)
    - **Property 8: ContactCardModal renders QR section iff qrCodeUrl is non-empty**
    - **Validates: Requirements 4.1, 4.2**

- [x] 12. Frontend — MiniWebsite: conditional QR display
  - In `apps/frontend/src/components/MiniWebsite.tsx`, add the `QrCode` icon import from `lucide-react`
  - In the Home tab's info section (inside the `space-y-8` block alongside Location, Hours, and Contact), add a conditional QR entry:
    ```tsx
    {vendor.miniWebsiteConfig?.qrCodeUrl && (
      <div className="flex items-start gap-5">
        <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0">
          <QrCode className="w-5 h-5 text-black" />
        </div>
        <div>
          <p className="font-bold text-black tracking-widest uppercase text-xs mb-3">Scan to Pay</p>
          <Image
            src={vendor.miniWebsiteConfig.qrCodeUrl}
            alt="Payment QR Code"
            width={200}
            height={200}
            className="rounded-lg border border-gray-100"
          />
        </div>
      </div>
    )}
    ```
  - The section must only render when `vendor.miniWebsiteConfig?.qrCodeUrl` is a non-empty string
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [ ]* 12.1 Write unit tests for MiniWebsite QR display
    - Test: renders QR section with non-empty `qrCodeUrl`
    - Test: does not render QR section when `qrCodeUrl` is absent or empty
    - Test: label "Scan to Pay" is present when QR is shown
    - Test: image rendered at ≥ 160px
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [ ]* 12.2 Write property test for MiniWebsite conditional rendering (Property 9)
    - **Property 9: MiniWebsite renders QR section iff qrCodeUrl is non-empty**
    - **Validates: Requirements 5.1, 5.2**

- [x] 13. Frontend — MiniWebsiteEditor: QR upload/replace/remove UI
  - In `apps/frontend/src/components/vendor/MiniWebsiteEditor.tsx`, add a new "Payment QR Code" section after the Brand Copy section:
    - Import `Upload`, `Trash2`, and `QrCode` icons from `lucide-react` (add any not already imported)
    - Add upload state: `const [qrUploading, setQrUploading] = useState(false)` and `const [qrError, setQrError] = useState<string | null>(null)`
    - If `config.qrCodeUrl` is set: display a preview `<Image>` of the current QR code alongside "Replace" and "Remove" buttons
    - If `config.qrCodeUrl` is not set: display an upload prompt with a file input
    - File input (`accept="image/*"`) triggers `POST /api/upload/qr-code` via `apiClient`; on success, call `setConfig({ ...config, qrCodeUrl: imageUrl })`; on failure, show `qrError`
    - "Remove" button sets `setConfig({ ...config, qrCodeUrl: undefined })`
    - Display helper text: "Recommended — helps customers pay you directly. You can change this anytime."
    - The existing `handleSave` → `updateVendor` call already sends `miniWebsiteConfig: config`, so no changes needed to the save path
    - After a successful save, the existing `alert('Mini-website settings saved successfully!')` covers requirement 6.10
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.10, 6.11, 6.12_

  - [ ]* 13.1 Write unit tests for MiniWebsiteEditor QR section
    - Test: QR upload section is present
    - Test: helper text is present
    - Test: when `qrCodeUrl` is set, preview and replace/remove options are shown
    - Test: when `qrCodeUrl` is not set, upload prompt is shown
    - Test: upload success updates `config.qrCodeUrl`
    - Test: remove button clears `config.qrCodeUrl`
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.7_

- [x] 14. Final checkpoint — ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- The design uses TypeScript throughout; all code examples should be TypeScript/TSX
- Property tests should use `fast-check` (already used in the project for `roleDowngrade.property.test.ts`)
- Static file serving for `uploads/qr-codes/` requires no change to `index.ts` — the existing `app.use('/uploads', express.static(...))` wildcard already covers it
- The `qrCodeUrl` field in `MiniWebsiteConfig` is optional (`?`) so existing vendor records without a QR code continue to work unchanged

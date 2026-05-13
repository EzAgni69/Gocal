# Requirements Document

## Introduction

The Gocal platform allows vendors to maintain a contact card and, for `card_website` plan holders, a full mini website. Currently, vendors have no way to share a payment QR code with customers — a common need in the Indian market where UPI QR codes (PhonePe, Google Pay, Paytm, etc.) are the dominant payment method.

This feature adds an optional QR code image upload to two surfaces:

1. **Contact card request flow** (`/request-card`) — vendors can upload a QR code image as part of the multi-step request form, so it is available from day one after approval.
2. **Vendor dashboard** — approved vendors can upload, replace, or remove their QR code image at any time without submitting a new request.

The QR code field is optional at both surfaces. Wherever it appears, the UI must indicate that adding a QR code is recommended and that it can be changed later. When a QR code is present on a vendor record, it is displayed on the vendor's contact card modal and mini website so customers can scan and pay directly.

## Glossary

- **Vendor**: A user with the `VENDOR`, `ADMIN`, or `SUPER_ADMIN` role who owns one or more contact cards on the platform.
- **Contact_Card**: A vendor record in the `vendors` table associated with a specific `ownerId`.
- **Mini_Website**: The full-page storefront experience rendered by `MiniWebsite.tsx` for vendors with plan type `card_website`.
- **Contact_Card_Modal**: The slide-up modal rendered by `ContactCardModal.tsx` that shows vendor details in the directory.
- **QR_Code_Image**: A raster image file (JPEG, PNG, WebP, or GIF) containing a payment QR code (e.g. UPI, PhonePe, Google Pay, Paytm) uploaded by the vendor.
- **QR_Code_URL**: The publicly accessible URL of the stored QR_Code_Image, persisted in `vendors.mini_website_config` under the key `qrCodeUrl` and in `contact_card_requests` under the column `qr_code_url`.
- **Request_Form**: The multi-step form at `/request-card` (`apps/frontend/src/app/request-card/page.tsx`) through which vendors submit a contact card request.
- **Card_Request_Schema**: The Zod validation schema in `apps/backend/src/routes/contactCardRequestRoutes.ts` that validates the POST body for `/api/card-requests`.
- **ContactCardRequest**: The database table `contact_card_requests` defined in `packages/database/src/schema/contactCardRequests.ts`.
- **Vendor_Record**: A row in the `vendors` table defined in `packages/database/src/schema/vendors.ts`.
- **miniWebsiteConfig**: The `jsonb` column on the `vendors` table that stores theme, social links, and other mini-website-specific configuration.
- **Upload_Route**: The backend Express router at `apps/backend/src/routes/uploadRoutes.ts` that handles image uploads via multer.
- **Approval_Handler**: The `PUT /api/card-requests/:id/review` endpoint that creates a vendor record from an approved request.
- **Vendor_Dashboard**: The authenticated vendor-facing UI where vendors manage their contact card and mini website settings.
- **Vendor_API**: The `PUT /api/vendors/:id` endpoint in `apps/backend/src/routes/vendorRoutes.ts`.

## Requirements

### Requirement 1: QR Code Upload in the Contact Card Request Flow

**User Story:** As a vendor submitting a contact card request, I want to upload my payment QR code image as part of the request form, so that my QR code is available on my contact card from the moment it is approved.

#### Acceptance Criteria

1. WHEN a vendor navigates to the Media step (Step 6) of the Request_Form, THE Request_Form SHALL display a QR code image upload section.
2. THE Request_Form SHALL display helper text in the QR code upload section indicating that adding a QR code is recommended and that it can be changed later.
3. THE Request_Form SHALL treat the QR code upload field as optional; the vendor SHALL be able to proceed past the Media step and submit the form without uploading a QR code.
4. WHEN a vendor selects an image file for the QR code upload, THE Request_Form SHALL upload the file to the Upload_Route endpoint and display a preview of the uploaded image upon success.
5. WHEN the QR code image upload succeeds, THE Request_Form SHALL store the returned QR_Code_URL in the form state.
6. WHEN a vendor submits the Request_Form, THE Request_Form SHALL include the QR_Code_URL in the POST request body sent to `/api/card-requests` if one was uploaded.
7. IF the QR code image upload fails, THEN THE Request_Form SHALL display an error message and allow the vendor to retry without losing other form data.
8. THE Request_Form SHALL accept only image files (JPEG, JPG, PNG, WebP, GIF) for the QR code upload field.
9. IF a vendor attempts to upload a non-image file for the QR code, THEN THE Request_Form SHALL display a validation error and reject the file.

---

### Requirement 2: Validate and Persist QR Code URL in the Card Request

**User Story:** As a platform operator, I want the submitted QR code URL to be validated and stored with the card request, so that admins can review it before approval and it is available for propagation to the vendor record.

#### Acceptance Criteria

1. THE Card_Request_Schema SHALL accept an optional `qrCodeUrl` string field that, when present, must be a valid URL.
2. WHEN a POST request to `/api/card-requests` includes a `qrCodeUrl` value, THE Request_Card_Route SHALL persist that value in the `qr_code_url` column of the ContactCardRequest table.
3. WHEN a POST request to `/api/card-requests` omits `qrCodeUrl`, THE Request_Card_Route SHALL store `null` for the `qr_code_url` column without returning an error.
4. IF a submitted `qrCodeUrl` value is not a valid URL, THEN THE Request_Card_Route SHALL return HTTP status 400 with a descriptive validation error.

---

### Requirement 3: Propagate QR Code URL to the Vendor Record on Approval

**User Story:** As a platform operator, I want the approved QR code URL to be automatically transferred to the vendor record, so that the vendor's contact card and mini website display the QR code immediately after approval.

#### Acceptance Criteria

1. WHEN the Approval_Handler creates a Vendor_Record from an approved ContactCardRequest that has a non-null `qrCodeUrl`, THE Approval_Handler SHALL write that value into the `miniWebsiteConfig` JSON object under the key `qrCodeUrl`.
2. WHEN the ContactCardRequest has a `null` value for `qrCodeUrl`, THE Approval_Handler SHALL omit the `qrCodeUrl` key from `miniWebsiteConfig` rather than writing `null`.
3. THE Approval_Handler SHALL preserve all other existing `miniWebsiteConfig` fields (e.g. `googleMapsUrl`, `theme`, `socialLinks`, `businessLabel`) when writing the `qrCodeUrl` key.

---

### Requirement 4: Display QR Code on the Contact Card Modal

**User Story:** As a customer viewing a vendor's contact card, I want to see the vendor's payment QR code, so that I can scan it to make a payment directly.

#### Acceptance Criteria

1. WHEN the Contact_Card_Modal renders for a vendor whose `miniWebsiteConfig.qrCodeUrl` is a non-empty string, THE Contact_Card_Modal SHALL display the QR code image.
2. WHEN the Contact_Card_Modal renders for a vendor whose `miniWebsiteConfig.qrCodeUrl` is absent or empty, THE Contact_Card_Modal SHALL NOT display a QR code section.
3. THE Contact_Card_Modal SHALL display the QR code image with a label indicating it is a payment QR code (e.g. "Scan to Pay").
4. THE Contact_Card_Modal SHALL render the QR code image at a size sufficient for scanning (minimum 160×160 CSS pixels).

---

### Requirement 5: Display QR Code on the Mini Website

**User Story:** As a customer browsing a vendor's mini website, I want to see the vendor's payment QR code, so that I can scan it to make a payment without leaving the page.

#### Acceptance Criteria

1. WHEN the Mini_Website renders for a vendor whose `miniWebsiteConfig.qrCodeUrl` is a non-empty string, THE Mini_Website SHALL display the QR code image.
2. WHEN the Mini_Website renders for a vendor whose `miniWebsiteConfig.qrCodeUrl` is absent or empty, THE Mini_Website SHALL NOT display a QR code section.
3. THE Mini_Website SHALL display the QR code image with a label indicating it is a payment QR code (e.g. "Scan to Pay").
4. THE Mini_Website SHALL render the QR code image at a size sufficient for scanning (minimum 160×160 CSS pixels).

---

### Requirement 6: QR Code Management in the Vendor Dashboard

**User Story:** As a vendor, I want to upload, replace, or remove my payment QR code from my vendor dashboard after my card has been approved, so that I can keep my payment information up to date at any time.

#### Acceptance Criteria

1. WHEN a vendor accesses the Mini Website settings section of the Vendor_Dashboard, THE Vendor_Dashboard SHALL display a QR code upload section.
2. THE Vendor_Dashboard SHALL display helper text in the QR code upload section indicating that adding a QR code is recommended and that it can be changed later.
3. WHEN a vendor's `miniWebsiteConfig.qrCodeUrl` is already set, THE Vendor_Dashboard SHALL display a preview of the current QR code image alongside options to replace or remove it.
4. WHEN a vendor's `miniWebsiteConfig.qrCodeUrl` is not set, THE Vendor_Dashboard SHALL display an upload prompt in the QR code section.
5. WHEN a vendor uploads a new QR code image in the Vendor_Dashboard, THE Vendor_Dashboard SHALL upload the file to the Upload_Route endpoint and display a preview of the uploaded image upon success.
6. WHEN a vendor saves the updated QR code, THE Vendor_Dashboard SHALL send a PUT request to the Vendor_API with the updated `miniWebsiteConfig` containing the new `qrCodeUrl`.
7. WHEN a vendor removes their QR code, THE Vendor_Dashboard SHALL send a PUT request to the Vendor_API with `miniWebsiteConfig.qrCodeUrl` set to `null` or omitted.
8. WHEN the Vendor_API receives a valid `miniWebsiteConfig.qrCodeUrl` value, THE Vendor_API SHALL persist the updated value to the Vendor_Record.
9. IF the Vendor_API receives a `miniWebsiteConfig.qrCodeUrl` value that is not a valid URL, THEN THE Vendor_API SHALL return HTTP status 400 with a descriptive error.
10. AFTER a successful save, THE Vendor_Dashboard SHALL display a confirmation message to the vendor.
11. THE Vendor_Dashboard SHALL accept only image files (JPEG, JPG, PNG, WebP, GIF) for the QR code upload field.
12. IF a vendor attempts to upload a non-image file for the QR code in the Vendor_Dashboard, THEN THE Vendor_Dashboard SHALL display a validation error and reject the file.

---

### Requirement 7: QR Code Upload Backend Endpoint

**User Story:** As a developer, I want a dedicated upload endpoint for QR code images, so that QR code files are stored separately from other image types and the upload pipeline is consistent with existing patterns.

#### Acceptance Criteria

1. THE Upload_Route SHALL expose a `POST /api/upload/qr-code` endpoint that accepts a single image file under the field name `image`.
2. THE Upload_Route SHALL require authentication for `POST /api/upload/qr-code`.
3. WHEN a valid image file is uploaded to `POST /api/upload/qr-code`, THE Upload_Route SHALL store the file in a dedicated `uploads/qr-codes/` directory and return a JSON response containing the `imageUrl`.
4. IF the uploaded file exceeds 5 MB, THEN THE Upload_Route SHALL return HTTP status 413 with a descriptive error message.
5. IF the uploaded file is not an accepted image type (JPEG, JPG, PNG, WebP, GIF), THEN THE Upload_Route SHALL return HTTP status 400 with a descriptive error message.
6. THE Upload_Route SHALL serve uploaded QR code files as static assets under the `/uploads/qr-codes/` path.

---

### Requirement 8: Review Step Preview of QR Code

**User Story:** As a vendor filling out the request form, I want to see a preview of my uploaded QR code in the review step before submitting, so that I can confirm the correct image was uploaded.

#### Acceptance Criteria

1. WHEN the vendor reaches the Review step of the Request_Form and a QR_Code_URL is present in the form state, THE Request_Form SHALL display a thumbnail preview of the QR code image in the review summary.
2. WHEN the vendor reaches the Review step of the Request_Form and no QR_Code_URL is present, THE Request_Form SHALL display a placeholder or omit the QR code row in the review summary.
3. WHEN the vendor clicks the edit action on the QR code row in the review summary, THE Request_Form SHALL navigate back to the Media step (Step 6).

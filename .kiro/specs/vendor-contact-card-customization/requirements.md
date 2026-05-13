# Requirements Document

## Introduction

The Gocal platform currently renders a "Mini Website" for vendors with the `card_website` plan. The Info Section of that mini website contains three hardcoded placeholder text values:

- **Business label** ("The Maison") — a short brand/house name displayed above the headline
- **Tagline** ("Heritage & Elegance") — a decorative headline
- **About description** ("Visit our exclusive boutique to experience true craftsmanship…") — a paragraph describing the business

These values are static strings embedded directly in `MiniWebsite.tsx` and are not sourced from any vendor record. As a result, every vendor's mini website shows identical placeholder copy regardless of their actual business identity.

This feature allows vendors to supply their own values for these three text properties when submitting a contact card request. The values are stored alongside the rest of the request data, carried through to the vendor record on approval, and rendered dynamically in the Mini Website component instead of the hardcoded strings.

## Glossary

- **Vendor**: A user with the `VENDOR`, `ADMIN`, or `SUPER_ADMIN` role who owns one or more contact cards on the platform.
- **Contact Card**: A vendor record in the `vendors` table associated with a specific `ownerId`. May be of plan type `card_only` or `card_website`.
- **Mini Website**: The full-page storefront experience rendered by `MiniWebsite.tsx` for vendors with plan type `card_website`.
- **Info Section**: The two-column section within the Mini Website home tab that currently displays the hardcoded business label, tagline, and about description.
- **Business_Label**: A short brand or house name (e.g. "The Maison") displayed above the tagline in the Info Section. Maps to the new `businessLabel` field.
- **Tagline**: A decorative one-line headline (e.g. "Heritage & Elegance") displayed as the section heading in the Info Section. Maps to the new `tagline` field on the vendor record (distinct from `shortDescription`).
- **About_Description**: A paragraph of free-form text describing the business, displayed in the Info Section body. Falls back to `fullDescription` or `shortDescription` if not provided.
- **Request_Form**: The multi-step form at `/request-card` (`apps/frontend/src/app/request-card/page.tsx`) through which vendors submit a contact card request.
- **Card_Request_Schema**: The Zod validation schema in `apps/backend/src/routes/contactCardRequestRoutes.ts` that validates the POST body for `/api/card-requests`.
- **ContactCardRequest**: The database table `contact_card_requests` defined in `packages/database/src/schema/contactCardRequests.ts`.
- **Vendor_Record**: A row in the `vendors` table defined in `packages/database/src/schema/vendors.ts`.
- **miniWebsiteConfig**: The `jsonb` column on the `vendors` table that stores theme, social links, and other mini-website-specific configuration.
- **Request_Card_Route**: The backend Express router at `apps/backend/src/routes/contactCardRequestRoutes.ts`.
- **Approval_Handler**: The `PUT /api/card-requests/:id/review` endpoint that creates a vendor record from an approved request.

## Requirements

### Requirement 1: Capture Customizable Text in the Request Form

**User Story:** As a vendor, I want to enter my own business label, tagline, and about description when submitting a contact card request, so that my mini website reflects my actual brand identity instead of placeholder text.

#### Acceptance Criteria

1. WHEN a vendor navigates to the Business Information step (Step 3) of the Request_Form, THE Request_Form SHALL display an input field for Business_Label with a maximum length of 100 characters.
2. WHEN a vendor navigates to the Business Information step (Step 3) of the Request_Form, THE Request_Form SHALL display an input field for Tagline with a maximum length of 150 characters.
3. WHEN a vendor navigates to the Business Information step (Step 3) of the Request_Form, THE Request_Form SHALL display a textarea for About_Description with a maximum length of 1000 characters.
4. THE Request_Form SHALL display a character counter for each of the three new fields showing the current character count against the maximum.
5. THE Request_Form SHALL treat all three new fields as optional; the vendor SHALL be able to submit the form without filling them in.
6. WHEN a vendor submits the Request_Form, THE Request_Form SHALL include the values of Business_Label, Tagline, and About_Description in the POST request body sent to `/api/card-requests`.

---

### Requirement 2: Validate and Persist Customizable Text in the Request

**User Story:** As a platform operator, I want the submitted customizable text values to be validated and stored with the card request, so that admins can review them before approval.

#### Acceptance Criteria

1. THE Card_Request_Schema SHALL accept an optional `businessLabel` string field with a maximum length of 100 characters.
2. THE Card_Request_Schema SHALL accept an optional `tagline` string field with a maximum length of 150 characters.
3. THE Card_Request_Schema SHALL accept an optional `aboutDescription` string field with a maximum length of 1000 characters.
4. WHEN a POST request to `/api/card-requests` includes `businessLabel`, `tagline`, or `aboutDescription` values, THE Request_Card_Route SHALL persist those values in the corresponding columns of the ContactCardRequest table.
5. WHEN a POST request to `/api/card-requests` omits `businessLabel`, `tagline`, or `aboutDescription`, THE Request_Card_Route SHALL store `null` for those columns without returning an error.
6. IF a submitted `businessLabel` value exceeds 100 characters, THEN THE Request_Card_Route SHALL return HTTP status 400 with a descriptive validation error.
7. IF a submitted `tagline` value exceeds 150 characters, THEN THE Request_Card_Route SHALL return HTTP status 400 with a descriptive validation error.
8. IF a submitted `aboutDescription` value exceeds 1000 characters, THEN THE Request_Card_Route SHALL return HTTP status 400 with a descriptive validation error.

---

### Requirement 3: Propagate Customizable Text to the Vendor Record on Approval

**User Story:** As a platform operator, I want the approved customizable text values to be automatically transferred to the vendor record, so that the mini website immediately reflects the vendor's brand copy after approval.

#### Acceptance Criteria

1. WHEN the Approval_Handler creates a Vendor_Record from an approved ContactCardRequest, THE Approval_Handler SHALL write the request's `businessLabel` value into the `miniWebsiteConfig` JSON object under the key `businessLabel`.
2. WHEN the Approval_Handler creates a Vendor_Record from an approved ContactCardRequest, THE Approval_Handler SHALL write the request's `tagline` value into the `miniWebsiteConfig` JSON object under the key `tagline`.
3. WHEN the Approval_Handler creates a Vendor_Record from an approved ContactCardRequest, THE Approval_Handler SHALL write the request's `aboutDescription` value into the `miniWebsiteConfig` JSON object under the key `aboutDescription`.
4. WHEN the ContactCardRequest has a `null` value for `businessLabel`, `tagline`, or `aboutDescription`, THE Approval_Handler SHALL omit the corresponding key from `miniWebsiteConfig` rather than writing `null`.
5. THE Approval_Handler SHALL preserve all other existing `miniWebsiteConfig` fields (e.g. `googleMapsUrl`, `theme`, `socialLinks`) when writing the new keys.

---

### Requirement 4: Render Customizable Text in the Mini Website

**User Story:** As a customer browsing the directory, I want to see the vendor's actual business label, tagline, and about description on their mini website, so that each vendor's page feels unique and authentic.

#### Acceptance Criteria

1. WHEN the Mini Website renders the Info Section and `vendor.miniWebsiteConfig.businessLabel` is a non-empty string, THE Mini_Website SHALL display that value in place of the hardcoded string "The Maison".
2. WHEN the Mini Website renders the Info Section and `vendor.miniWebsiteConfig.businessLabel` is absent or empty, THE Mini_Website SHALL display the vendor's `name` as the fallback value.
3. WHEN the Mini Website renders the Info Section and `vendor.miniWebsiteConfig.tagline` is a non-empty string, THE Mini_Website SHALL display that value in place of the hardcoded string "Heritage & Elegance".
4. WHEN the Mini Website renders the Info Section and `vendor.miniWebsiteConfig.tagline` is absent or empty, THE Mini_Website SHALL display the vendor's `shortDescription` as the fallback value, and if `shortDescription` is also absent, THE Mini_Website SHALL omit the tagline element entirely.
5. WHEN the Mini Website renders the Info Section and `vendor.miniWebsiteConfig.aboutDescription` is a non-empty string, THE Mini_Website SHALL display that value as the about paragraph.
6. WHEN the Mini Website renders the Info Section and `vendor.miniWebsiteConfig.aboutDescription` is absent or empty, THE Mini_Website SHALL display `vendor.description` (i.e. `fullDescription`) as the fallback, and if that is also absent, THE Mini_Website SHALL display `vendor.shortDescription`.
7. THE Mini_Website SHALL NOT display a hardcoded string for any of the three Info Section text properties.

---

### Requirement 5: Allow Vendors to Update Customizable Text via the Vendor Dashboard

**User Story:** As a vendor, I want to edit my business label, tagline, and about description from my vendor dashboard after my card has been approved, so that I can keep my mini website copy up to date without submitting a new request.

#### Acceptance Criteria

1. WHEN a vendor accesses the Mini Website settings section of the Vendor Dashboard, THE Vendor_Dashboard SHALL display editable fields for Business_Label, Tagline, and About_Description pre-populated with the current values from `miniWebsiteConfig`.
2. WHEN a vendor saves updated values for Business_Label, Tagline, or About_Description, THE Vendor_Dashboard SHALL send a PATCH or PUT request to the vendor update endpoint with the new `miniWebsiteConfig` values.
3. WHEN the vendor update endpoint receives valid `miniWebsiteConfig.businessLabel`, `miniWebsiteConfig.tagline`, or `miniWebsiteConfig.aboutDescription` values, THE Vendor_API SHALL persist the updated values to the Vendor_Record.
4. WHEN the vendor update endpoint receives a `businessLabel` value exceeding 100 characters, THE Vendor_API SHALL return HTTP status 400.
5. WHEN the vendor update endpoint receives a `tagline` value exceeding 150 characters, THE Vendor_API SHALL return HTTP status 400.
6. WHEN the vendor update endpoint receives an `aboutDescription` value exceeding 1000 characters, THE Vendor_API SHALL return HTTP status 400.
7. AFTER a successful save, THE Vendor_Dashboard SHALL display a confirmation message to the vendor.

---

### Requirement 6: Review Step Preview

**User Story:** As a vendor filling out the request form, I want to see my entered business label, tagline, and about description in the review step before submitting, so that I can confirm the copy is correct.

#### Acceptance Criteria

1. WHEN the vendor reaches the Review step of the Request_Form, THE Request_Form SHALL display the entered Business_Label value (or a placeholder if empty) in the review summary.
2. WHEN the vendor reaches the Review step of the Request_Form, THE Request_Form SHALL display the entered Tagline value (or a placeholder if empty) in the review summary.
3. WHEN the vendor reaches the Review step of the Request_Form, THE Request_Form SHALL display the entered About_Description value (or a placeholder if empty) in the review summary.
4. WHEN the vendor clicks the edit action on the review summary for any of the three fields, THE Request_Form SHALL navigate back to the Business Information step (Step 3).

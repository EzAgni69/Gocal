# Requirements Document

## Introduction

Some vendors on the Gocal platform may own more than one contact card or mini website — for example, when an admin publishes additional cards on behalf of a vendor. Currently, the vendor dashboard (`/vendor`) fetches only the first card associated with the authenticated user's account, making any additional cards inaccessible to the vendor.

This feature introduces a card-selection step into the vendor dashboard flow. When a vendor navigates to `/vendor` and owns multiple cards, the Dashboard shall present a selection screen listing all their cards so they can choose which one to edit. When a vendor owns exactly one card, the selection step shall be skipped and the dashboard shall load that card directly — preserving the existing single-card experience.

## Glossary

- **Vendor**: A user with the `VENDOR`, `ADMIN`, or `SUPER_ADMIN` role who owns one or more contact cards on the platform.
- **Contact Card**: A vendor record in the `vendors` table associated with a specific `ownerId`. May be of plan type `card_only` or `card_website`.
- **Mini Website**: A contact card of plan type `card_website` that includes a full storefront experience.
- **Card Selection Screen**: A UI screen displayed at `/vendor` when the authenticated vendor owns more than one contact card, listing all available cards for selection.
- **Vendor Dashboard**: The editing and management interface rendered by `VendorDashboard` after a specific contact card has been selected.
- **Dashboard_Page**: The Next.js page component at `apps/frontend/src/app/vendor/page.tsx`.
- **Vendor_API**: The backend Express router at `apps/backend/src/routes/vendorRoutes.ts`.
- **VendorDashboard**: The React component at `apps/frontend/src/components/VendorDashboard.tsx` that renders the editing interface for a single vendor card.
- **Card_Selection_Component**: The new React component responsible for rendering the card selection screen.

## Requirements

### Requirement 1: Fetch All Vendor Cards for the Authenticated User

**User Story:** As a vendor, I want the system to retrieve all my contact cards when I navigate to the vendor dashboard, so that I can see and manage every card associated with my account.

#### Acceptance Criteria

1. THE Vendor_API SHALL expose a `GET /api/vendors/mine` endpoint that returns all non-deleted vendor records where `ownerId` matches the authenticated user's ID.
2. WHEN the authenticated user has no vendor records, THE Vendor_API SHALL return an empty array with HTTP status 200.
3. WHEN the authenticated user has one or more vendor records, THE Vendor_API SHALL return each record including its `id`, `name`, `slug`, `planType`, `city`, `address`, `coverImageUrl`, `isVerified`, `isPremium`, `rating`, `reviewCount`, `createdAt`, and `deletedAt` fields.
4. IF the request is made without a valid authentication token, THEN THE Vendor_API SHALL return HTTP status 401.
5. THE Vendor_API SHALL exclude vendor records where `deletedAt` is not null from the response.

---

### Requirement 2: Single-Card Bypass

**User Story:** As a vendor with only one contact card, I want to go directly to my dashboard without any extra steps, so that my existing workflow is not disrupted.

#### Acceptance Criteria

1. WHEN the authenticated vendor owns exactly one non-deleted contact card, THE Dashboard_Page SHALL load the Vendor Dashboard directly without displaying the Card Selection Screen.
2. WHILE the vendor card data is loading, THE Dashboard_Page SHALL display a loading indicator.
3. IF the vendor card data fails to load, THEN THE Dashboard_Page SHALL display an error message and a retry action.

---

### Requirement 3: Multi-Card Selection Screen

**User Story:** As a vendor with multiple contact cards, I want to see all my cards listed when I visit the vendor dashboard, so that I can choose which specific card to edit.

#### Acceptance Criteria

1. WHEN the authenticated vendor owns more than one non-deleted contact card, THE Dashboard_Page SHALL display the Card Selection Screen instead of loading the Vendor Dashboard directly.
2. THE Card_Selection_Component SHALL display each card as a selectable item showing the card's business name, plan type (`card_only` or `card_website`), city, address, and verification status.
3. THE Card_Selection_Component SHALL display a visual indicator distinguishing `card_website` cards from `card_only` cards.
4. WHEN the vendor selects a card from the Card Selection Screen, THE Dashboard_Page SHALL load the Vendor Dashboard for the selected card.
5. THE Card_Selection_Component SHALL display the total count of available cards to the vendor.
6. WHERE a card has `isPremium` set to true, THE Card_Selection_Component SHALL display a premium or verified badge on that card's list item.

---

### Requirement 4: Card Selection State Management

**User Story:** As a vendor, I want my card selection to be maintained during my session so that navigating within the dashboard does not reset my selection unexpectedly.

#### Acceptance Criteria

1. WHEN a vendor selects a card, THE Dashboard_Page SHALL store the selected card's `id` in component state for the duration of the session.
2. WHEN the vendor navigates back from the Vendor Dashboard to the Card Selection Screen (if a back action is provided), THE Dashboard_Page SHALL re-display the Card Selection Screen with all cards listed.
3. THE Dashboard_Page SHALL NOT persist the selected card ID to `localStorage` or any external storage between sessions.

---

### Requirement 5: Access Control

**User Story:** As a platform operator, I want only authenticated vendors to access the card selection and dashboard, so that unauthorized users cannot view or modify vendor data.

#### Acceptance Criteria

1. THE Dashboard_Page SHALL restrict access to users with the `VENDOR`, `ADMIN`, or `SUPER_ADMIN` role.
2. WHEN an unauthenticated user navigates to `/vendor`, THE Dashboard_Page SHALL redirect the user to the sign-in flow.
3. WHEN an authenticated user with the `CONSUMER` role navigates to `/vendor`, THE Dashboard_Page SHALL deny access and display an appropriate message.
4. THE Vendor_API SHALL validate the authentication token on every request to `GET /api/vendors/mine`.

---

### Requirement 6: Empty State Handling

**User Story:** As a vendor whose cards have all been deleted by an admin, I want to see a clear message when I have no active cards, so that I understand my account status.

#### Acceptance Criteria

1. WHEN the authenticated vendor has zero non-deleted contact cards, THE Dashboard_Page SHALL display an empty state message informing the vendor that no active cards are available.
2. THE Dashboard_Page SHALL provide a link or call-to-action directing the vendor to the card request page (`/request-card`) from the empty state.
3. IF the `GET /api/vendors/mine` request returns an empty array, THEN THE Dashboard_Page SHALL render the empty state rather than the Card Selection Screen or the Vendor Dashboard.

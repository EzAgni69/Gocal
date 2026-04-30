# Requirements Document

## Introduction

When an admin deletes a contact card (vendor record) from the admin dashboard, the system must automatically downgrade the associated user's role from `VENDOR` to `CONSUMER`, provided the user does not hold a protected role (`ADMIN` or `SUPER_ADMIN`). This ensures that users who no longer have an active vendor card are not incorrectly treated as vendors in the platform.

## Glossary

- **Vendor_Card**: A record in the `vendors` table representing a business contact card owned by a user.
- **Role_Downgrade_Service**: The backend service responsible for evaluating and updating a user's role after a vendor card deletion.
- **Admin**: A user with the role `ADMIN` or `SUPER_ADMIN` in the system.
- **Protected_Role**: A role that must never be downgraded — specifically `ADMIN` and `SUPER_ADMIN`.
- **Soft_Delete**: Setting the `deleted_at` timestamp on a vendor record rather than removing the row from the database.
- **Active_Vendor_Card**: A vendor record where `deleted_at` IS NULL.
- **System**: The backend Node.js/Express application.

---

## Requirements

### Requirement 1: Automatic Role Downgrade on Card Deletion

**User Story:** As an admin, I want the system to automatically downgrade a vendor's role to consumer when I delete their contact card, so that users without an active card are not incorrectly treated as vendors.

#### Acceptance Criteria

1. WHEN an admin deletes a Vendor_Card, THE Role_Downgrade_Service SHALL check whether the card's owner holds a Protected_Role (`ADMIN` or `SUPER_ADMIN`).
2. WHEN an admin deletes a Vendor_Card and the owner's role is `VENDOR`, THE Role_Downgrade_Service SHALL update the owner's role to `CONSUMER` in the `users` table.
3. WHEN an admin deletes a Vendor_Card and the owner's role is `ADMIN` or `SUPER_ADMIN`, THE Role_Downgrade_Service SHALL leave the owner's role unchanged.
4. WHEN an admin deletes a Vendor_Card and the owner's role is `CONSUMER`, THE Role_Downgrade_Service SHALL leave the owner's role unchanged.

---

### Requirement 2: Multi-Card Ownership Guard

**User Story:** As a platform operator, I want the system to only downgrade a user's role when they have no remaining active vendor cards, so that users with multiple cards are not incorrectly demoted.

#### Acceptance Criteria

1. WHEN an admin deletes a Vendor_Card, THE Role_Downgrade_Service SHALL count the number of Active_Vendor_Cards remaining for the card's owner (excluding the card being deleted).
2. WHEN an admin deletes a Vendor_Card and the owner still has at least one Active_Vendor_Card remaining, THE Role_Downgrade_Service SHALL NOT downgrade the owner's role.
3. WHEN an admin deletes a Vendor_Card and the owner has zero Active_Vendor_Cards remaining, THE Role_Downgrade_Service SHALL proceed with the role evaluation defined in Requirement 1.

---

### Requirement 3: Deletion Atomicity and Consistency

**User Story:** As a platform operator, I want the card deletion and role downgrade to succeed or fail together, so that the system never ends up in an inconsistent state where a card is deleted but the role is not updated (or vice versa).Also system should allow single consumer to request more than one contact card and mini website currently after one request and on acceptance the request contact card funcationality is being removed 

#### Acceptance Criteria

1. THE System SHALL perform the Vendor_Card soft-delete and the role update within a single database transaction.
2. IF the role update fails, THEN THE System SHALL roll back the Vendor_Card soft-delete and return an error response.
3. IF the Vendor_Card soft-delete fails, THEN THE System SHALL NOT update the user's role.

---

### Requirement 4: Admin-Only Delete Endpoint Authorization

**User Story:** As a security-conscious operator, I want only admins to be able to trigger the card deletion that causes a role downgrade, so that regular users cannot manipulate roles.

#### Acceptance Criteria

1. THE System SHALL require the requesting user to hold the role `ADMIN` or `SUPER_ADMIN` to call the admin card-deletion endpoint.
2. WHEN a non-admin user attempts to call the admin card-deletion endpoint, THE System SHALL return HTTP 403 with an error message.
3. THE System SHALL authenticate the request using a valid Firebase ID token before processing the deletion.

---

### Requirement 5: Audit Logging

**User Story:** As a platform operator, I want every role downgrade triggered by a card deletion to be logged, so that I can audit role changes and investigate issues.

#### Acceptance Criteria

1. WHEN THE Role_Downgrade_Service downgrades a user's role, THE System SHALL log the event including: the deleted Vendor_Card ID, the affected user ID, the previous role, the new role, and the timestamp.
2. WHEN THE Role_Downgrade_Service skips a role downgrade due to a Protected_Role, THE System SHALL log the skip event including: the Vendor_Card ID, the user ID, and the reason for skipping.
3. WHEN THE Role_Downgrade_Service skips a role downgrade because the user has remaining Active_Vendor_Cards, THE System SHALL log the skip event including: the Vendor_Card ID, the user ID, and the count of remaining Active_Vendor_Cards.

---

### Requirement 6: API Response

**User Story:** As a frontend developer, I want the card deletion API response to indicate whether a role downgrade occurred, so that the admin dashboard can reflect the change without requiring a separate user-fetch.

#### Acceptance Criteria

1. WHEN a Vendor_Card is deleted and a role downgrade occurs, THE System SHALL include a `roleDowngraded: true` field and the new role value in the deletion response body.
2. WHEN a Vendor_Card is deleted and no role downgrade occurs, THE System SHALL include a `roleDowngraded: false` field in the deletion response body.

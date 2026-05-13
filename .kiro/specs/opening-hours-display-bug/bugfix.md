# Bugfix Requirements Document

## Introduction

Vendors enter opening hours during the contact card request flow using full day names (e.g. `Monday`, `Tuesday`). However, the display utilities (`formatOpeningHours`, `getAllOpeningHours`) and the vendor DB schema both key hours by abbreviated day names (`Mon`, `Tue`, etc.). This mismatch means the stored opening hours are never found by the display logic, so the contact card modal and mini website always show fallback text instead of the actual hours the vendor entered.

A second, independent bug exists in `MiniWebsite.tsx`: the "Boutique Hours" section reads `vendor.openingHours?.general?.open`, which is a non-existent key path, so it always falls back to the hardcoded string `'Mon - Sat: 10:00 AM - 9:00 PM\nSun: By Appointment'` regardless of what the vendor submitted.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a vendor submits opening hours using the request-card form (which uses full day names: `Monday`–`Sunday`) THEN the system stores those hours under full-day-name keys in the database

1.2 WHEN the contact card modal renders `formatOpeningHours(vendor.openingHours)` for a vendor whose hours are stored under full day names THEN the system returns `'Hours not available'` or `'Closed today'` because the utility looks up abbreviated keys (`Mon`–`Sun`) that do not exist in the stored object

1.3 WHEN the contact card modal renders `getAllOpeningHours(vendor.openingHours)` to show the weekly schedule THEN the system returns all days as `'Closed'` because none of the abbreviated-key lookups match the stored full-name keys

1.4 WHEN the mini website home tab renders the "Boutique Hours" section THEN the system displays the hardcoded fallback string `'Mon - Sat: 10:00 AM - 9:00 PM\nSun: By Appointment'` because it reads `vendor.openingHours?.general?.open`, a key path that never exists in the actual opening hours structure

### Expected Behavior (Correct)

2.1 WHEN a vendor submits opening hours via the request-card form THEN the system SHALL store those hours under abbreviated day-name keys (`Mon`–`Sun`) that match the keys expected by the display utilities and DB schema

2.2 WHEN the contact card modal renders `formatOpeningHours(vendor.openingHours)` for a vendor with valid stored hours THEN the system SHALL display the actual open/close times for today (e.g. `9:00 AM - 9:00 PM`)

2.3 WHEN the contact card modal renders `getAllOpeningHours(vendor.openingHours)` THEN the system SHALL display the correct open/close times (or `'Closed'`) for each day of the week as entered by the vendor

2.4 WHEN the mini website home tab renders the "Boutique Hours" section THEN the system SHALL display the vendor's actual opening hours using the same `formatOpeningHours` / `getAllOpeningHours` utilities instead of a hardcoded fallback string

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a vendor's opening hours are already stored under abbreviated keys (`Mon`–`Sun`) THEN the system SHALL CONTINUE TO display those hours correctly in both the contact card modal and the mini website

3.2 WHEN a vendor has no opening hours set (`openingHours` is `null` or `undefined`) THEN the system SHALL CONTINUE TO display `'Hours not available'` in the contact card modal and a graceful fallback in the mini website

3.3 WHEN a vendor marks a specific day as closed (`closed: true`) THEN the system SHALL CONTINUE TO display `'Closed'` for that day in both the contact card modal weekly schedule and the mini website

3.4 WHEN the contact card request form is submitted THEN the system SHALL CONTINUE TO validate and accept the opening hours payload without any change to the backend validation schema (the fix is purely in the frontend key mapping)

3.5 WHEN the admin approves a contact card request THEN the system SHALL CONTINUE TO copy `openingHours` from the request record to the new vendor record unchanged

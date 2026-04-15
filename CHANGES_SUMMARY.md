# Lost & Found 2.0 — Change Summary

## Overview
This update introduces an admin workflow for claim tracking, enforces 60-day public item visibility, and fixes item filtering behavior so filters apply correctly in the public listing.

## Features Added

### 1) Admin-only dashboard (`/admin`)
- Added a protected admin route in the app router.
- Created a new **Admin Dashboard** page with:
  - **Claims table** (claimant, claimant type, item, claimed timestamp)
  - **Admin item search** table (includes items hidden from public after retention window)
- Added Admin navigation button in desktop and mobile nav for admin users only.

### 2) Claim flow improvements
- Claim submission records claimant data including claimant type and related fields.
- Claim submission still marks item as claimed.
- Success state continues to display pickup instructions.
- Improved error handling typing and messaging in the claim form.

### 3) Public retention policy (60 days)
- Added a shared helper for retention checks (`isExpiredItem`).
- Public-facing item visibility is constrained to the latest 60 days.
- Admin users can still search and view older/expired items in admin tools.

### 4) Filtering fix on homepage
- Reworked fetch/filter logic so item queries rerun when filters change.
- Updated tag matching logic to **overlap** selected tags (any match), improving expected behavior.
- Preserved support for search text, category, claim status, and date-range filtering.

## Database / Supabase Changes
Added migration:
- `supabase/migrations/20260415093000_admin_claims_and_retention.sql`

Migration responsibilities:
- Adds missing claim columns (`claimant_type`, `division`)
- Adds `is_admin` to `staff_emails`
- Adds `public.is_admin_user()` helper function
- Restricts claim read access to admins
- Limits public item reads to last 60 days
- Allows admins to read all items
- Adds supporting indexes

## Type Updates
Updated shared database types to include:
- `claimantType` and `division` on claim form data
- `claimant_type` and `division` on claim records

## Notes for Deployment
- Apply the new Supabase migration before release.
- Ensure real admin accounts have `staff_emails.is_admin = true`.
- Replace any placeholder seeded admin email (e.g. `admin@example.com`) with real admin email(s).

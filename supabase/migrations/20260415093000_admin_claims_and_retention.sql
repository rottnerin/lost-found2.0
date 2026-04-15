/*
  # Admin claims access and 60-day public retention

  1. Claims
    - Add `claimant_type` and `division` columns when missing
    - Restrict claim reads to admin users

  2. Staff emails
    - Add `is_admin` flag
    - Allow authenticated users to read staff records
    - Allow only admins to manage staff records

  3. Items
    - Limit public reads to items from the last 60 days
    - Allow admins to read all items, including expired ones
*/

ALTER TABLE claims
ADD COLUMN IF NOT EXISTS claimant_type text NOT NULL DEFAULT 'Student',
ADD COLUMN IF NOT EXISTS division text NOT NULL DEFAULT '';

ALTER TABLE staff_emails
ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

UPDATE staff_emails
SET is_admin = true
WHERE lower(email) = 'admin@example.com';

CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.staff_emails
    WHERE lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      AND is_admin = true
  );
$$;

DROP POLICY IF EXISTS "Allow authenticated users to read claims" ON claims;
CREATE POLICY "Allow admins to read claims"
  ON claims
  FOR SELECT
  TO authenticated
  USING (public.is_admin_user());

DROP POLICY IF EXISTS "Allow authenticated users to manage staff emails" ON staff_emails;
DROP POLICY IF EXISTS "Allow authenticated users to read staff emails" ON staff_emails;
DROP POLICY IF EXISTS "Allow admins to manage staff emails" ON staff_emails;

CREATE POLICY "Allow authenticated users to read staff emails"
  ON staff_emails
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow admins to manage staff emails"
  ON staff_emails
  FOR ALL
  TO authenticated
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS "Allow public read access" ON items;
DROP POLICY IF EXISTS "Allow public read access to recent items" ON items;
DROP POLICY IF EXISTS "Allow admins to read all items" ON items;

CREATE POLICY "Allow public read access to recent items"
  ON items
  FOR SELECT
  TO public
  USING (created_at >= now() - interval '60 days');

CREATE POLICY "Allow admins to read all items"
  ON items
  FOR SELECT
  TO authenticated
  USING (public.is_admin_user());

CREATE INDEX IF NOT EXISTS idx_claims_created_at ON claims (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_claims_item_id ON claims (item_id);
CREATE INDEX IF NOT EXISTS idx_items_created_at ON items (created_at DESC);

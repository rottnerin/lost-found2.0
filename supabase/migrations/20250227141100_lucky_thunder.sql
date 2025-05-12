/*
  # Create staff_emails table

  1. New Tables
    - `staff_emails`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `name` (text)
      - `created_at` (timestamp)
  2. Security
    - Enable RLS on `staff_emails` table
    - Add policy for authenticated users to read and manage staff emails
*/

CREATE TABLE IF NOT EXISTS staff_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE staff_emails ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow authenticated users to manage staff emails"
  ON staff_emails
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Insert a default admin email (replace with your actual admin email)
INSERT INTO staff_emails (email, name)
VALUES ('admin@example.com', 'System Administrator')
ON CONFLICT (email) DO NOTHING;
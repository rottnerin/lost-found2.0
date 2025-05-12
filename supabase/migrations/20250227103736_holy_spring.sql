/*
  # Create claims table

  1. New Tables
    - `claims`
      - `id` (uuid, primary key)
      - `item_id` (uuid, references items.id)
      - `first_name` (text)
      - `last_name` (text)
      - `child_name` (text)
      - `child_grade` (text)
      - `created_at` (timestamptz)
  2. Security
    - Enable RLS on `claims` table
    - Add policy for public to insert claims
    - Add policy for authenticated users to read claims
*/

CREATE TABLE IF NOT EXISTS claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid REFERENCES items(id),
  first_name text NOT NULL,
  last_name text NOT NULL,
  child_name text NOT NULL,
  child_grade text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public to insert claims"
  ON claims
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to read claims"
  ON claims
  FOR SELECT
  TO authenticated
  USING (true);
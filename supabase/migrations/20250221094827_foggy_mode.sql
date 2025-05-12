/*
  # Create Items Table for Lost and Found System

  1. New Tables
    - `items`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text, nullable)
      - `image_url` (text)
      - `tag` (text)
      - `created_at` (timestamp with time zone)
      - `updated_at` (timestamp with time zone)

  2. Security
    - Enable RLS on `items` table
    - Add policies for:
      - Public read access
      - Authenticated users can create/update/delete
*/

CREATE TABLE IF NOT EXISTS items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  image_url text NOT NULL,
  tag text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read access"
  ON items
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated users to create items"
  ON items
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update their items"
  ON items
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete items"
  ON items
  FOR DELETE
  TO authenticated
  USING (true);

-- Create an update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_items_updated_at
  BEFORE UPDATE
  ON items
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();
/*
  # Enable proper item deletion

  1. Create a function to delete items and associated data
    - `delete_item(item_id UUID)`
      - Deletes associated claims
      - Removes item record
  
  2. Set up proper RLS policies
    - Ensure authenticated users can delete items
*/

-- Create a function to properly delete an item and its associated data
CREATE OR REPLACE FUNCTION delete_item(p_item_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER -- Run with privileges of the function creator
AS $$
BEGIN
  -- Delete any claims associated with this item
  DELETE FROM claims WHERE item_id = p_item_id;
  
  -- Delete the item itself
  DELETE FROM items WHERE id = p_item_id;
END;
$$;

-- Grant execute permission on the function to authenticated users
GRANT EXECUTE ON FUNCTION delete_item TO authenticated;

-- Create a secure RPC wrapper for the delete function
CREATE OR REPLACE FUNCTION delete_item_rpc(item_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Call the delete_item function
  PERFORM delete_item(item_id);
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;

-- Grant execute permission on the RPC function to authenticated users
GRANT EXECUTE ON FUNCTION delete_item_rpc TO authenticated;

-- Ensure RLS policies are properly set for items table
DO $$
BEGIN
  -- Check if the delete policy exists, if not create it
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_policy 
    WHERE schemaname = 'public' 
    AND tablename = 'items' 
    AND policyname = 'Allow authenticated users to delete items'
  ) THEN
    CREATE POLICY "Allow authenticated users to delete items"
      ON items
      FOR DELETE
      TO authenticated
      USING (true);
  END IF;
  
  -- Check if the delete policy exists for claims, if not create it
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_policy 
    WHERE schemaname = 'public' 
    AND tablename = 'claims' 
    AND policyname = 'Allow authenticated users to delete claims'
  ) THEN
    CREATE POLICY "Allow authenticated users to delete claims"
      ON claims
      FOR DELETE
      TO authenticated
      USING (true);
  END IF;
END $$;

-- Add comment to explain the function usage
COMMENT ON FUNCTION delete_item_rpc(UUID) IS 'Securely deletes an item and all its associated data. Restricted to authenticated users only.';
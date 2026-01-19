/*
  # Fix get_user_emails function return type

  ## Changes
  - Drop and recreate the function with correct return type
  - auth.users.email is varchar(255), not text
*/

DROP FUNCTION IF EXISTS get_user_emails(uuid[]);

CREATE OR REPLACE FUNCTION get_user_emails(user_ids uuid[])
RETURNS TABLE (id uuid, email varchar(255))
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT au.id, au.email
  FROM auth.users au
  WHERE au.id = ANY(user_ids);
END;
$$;
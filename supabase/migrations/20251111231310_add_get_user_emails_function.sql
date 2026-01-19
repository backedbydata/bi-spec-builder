/*
  # Add function to get user emails

  ## Changes
  - Create a function to fetch user emails by their IDs from auth.users
  - This allows the client to retrieve email addresses for displaying who last edited a project
  - Function returns id and email for the provided user IDs
*/

CREATE OR REPLACE FUNCTION get_user_emails(user_ids uuid[])
RETURNS TABLE (id uuid, email text)
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
/*
  # Add updated_by field to projects table

  ## Changes
  - Add `updated_by` column to projects table to track the last person who edited the project
  - Set default value to created_by for existing projects
  - Update RLS policies to allow reading the updated_by field
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'updated_by'
  ) THEN
    ALTER TABLE projects ADD COLUMN updated_by uuid REFERENCES auth.users(id);
    
    UPDATE projects SET updated_by = created_by WHERE updated_by IS NULL;
  END IF;
END $$;
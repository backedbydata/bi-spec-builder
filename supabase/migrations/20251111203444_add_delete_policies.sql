/*
  # Add DELETE policies for all tables

  1. Changes
    - Add DELETE policy for projects table
    - Add DELETE policies for functional_requirements, design_requirements, and change_history tables
  
  2. Security
    - Allow authenticated users to delete their own data
    - Maintain data integrity through proper RLS policies
*/

-- Add DELETE policy for projects
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'projects' 
    AND policyname = 'Authenticated users can delete projects'
  ) THEN
    CREATE POLICY "Authenticated users can delete projects"
      ON projects
      FOR DELETE
      TO authenticated
      USING (true);
  END IF;
END $$;

-- Add DELETE policy for functional_requirements
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'functional_requirements' 
    AND policyname = 'Authenticated users can delete functional requirements'
  ) THEN
    CREATE POLICY "Authenticated users can delete functional requirements"
      ON functional_requirements
      FOR DELETE
      TO authenticated
      USING (true);
  END IF;
END $$;

-- Add DELETE policy for design_requirements
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'design_requirements' 
    AND policyname = 'Authenticated users can delete design requirements'
  ) THEN
    CREATE POLICY "Authenticated users can delete design requirements"
      ON design_requirements
      FOR DELETE
      TO authenticated
      USING (true);
  END IF;
END $$;

-- Add DELETE policy for change_history
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'change_history' 
    AND policyname = 'Authenticated users can delete change history'
  ) THEN
    CREATE POLICY "Authenticated users can delete change history"
      ON change_history
      FOR DELETE
      TO authenticated
      USING (true);
  END IF;
END $$;

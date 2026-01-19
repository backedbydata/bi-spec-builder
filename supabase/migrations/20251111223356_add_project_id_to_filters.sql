/*
  # Add project_id to filters table

  1. Changes
    - Add project_id column to filters table to enable project-level filtering
    - Add foreign key constraint to projects table
    - Add index for performance
    - Update existing filters to associate with projects based on their tabs
  
  2. Notes
    - Filters with null tab_id (global filters) will need project_id to be set manually or through application logic
*/

-- Add project_id column to filters table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'filters' AND column_name = 'project_id'
  ) THEN
    ALTER TABLE filters ADD COLUMN project_id uuid REFERENCES projects(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Update existing filters to have project_id based on their tab's project
UPDATE filters
SET project_id = (
  SELECT project_id FROM dashboard_tabs WHERE dashboard_tabs.id = filters.tab_id
)
WHERE tab_id IS NOT NULL AND project_id IS NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_filters_project_id ON filters(project_id);

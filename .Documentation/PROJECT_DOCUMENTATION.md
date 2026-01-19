# BI Spec Builder - Comprehensive Project Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Technical Stack](#technical-stack)
4. [Database Schema](#database-schema)
5. [Core Features](#core-features)
6. [Component Structure](#component-structure)
7. [User Workflows](#user-workflows)
8. [Setup and Installation](#setup-and-installation)
9. [Data Models](#data-models)
10. [Security Implementation](#security-implementation)
11. [Export Functionality](#export-functionality)
12. [Future Enhancements](#future-enhancements)

---

## Project Overview

**BI Spec Builder** is a collaborative web application designed to streamline the process of creating, managing, and documenting Business Intelligence dashboard specifications. The application provides an intuitive chat-based interface for gathering requirements and automatically generates comprehensive specification documents.

### Purpose
- Standardize dashboard specification creation across teams
- Capture functional and design requirements systematically
- Enable version control for dashboard specifications
- Facilitate collaboration among stakeholders
- Generate exportable documentation

### Key Benefits
- **Consistency**: Ensures all required information is captured
- **Efficiency**: Conversational interface speeds up requirements gathering
- **Collaboration**: Multi-user support with change tracking
- **Documentation**: Auto-generates specification documents
- **Versioning**: Track changes and create enhancement versions

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Client Layer                         │
│         (React + TypeScript + Tailwind CSS)              │
│                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Project    │  │   Project    │  │    Auth      │  │
│  │     List     │  │    Editor    │  │  Component   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Requirements │  │   Design     │  │    Tasks     │  │
│  │     Chat     │  │     Chat     │  │   Manager    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                            │
                            │ Supabase JS Client
                            ▼
┌─────────────────────────────────────────────────────────┐
│                  Supabase Backend                        │
│                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  PostgreSQL  │  │   Auth API   │  │  Storage API │  │
│  │   Database   │  │              │  │              │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │         Row Level Security (RLS) Policies        │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Application Flow

```
User Authentication
       ↓
Project List View
       ↓
   ┌───┴───┐
   ↓       ↓
Create   Select
New      Existing
   ↓       ↓
   └───┬───┘
       ↓
Project Editor
   │
   ├─→ Functional Requirements (Chat Interface)
   │   ├─ Data Sources
   │   ├─ Metrics
   │   ├─ Dashboard Tabs
   │   ├─ Filters
   │   └─ Additional Requirements
   │
   ├─→ Design Requirements (Chat Interface)
   │   ├─ Dashboard Size
   │   ├─ Color Palette
   │   ├─ Fonts
   │   └─ Logo/Branding
   │
   ├─→ Tasks Manager
   │   └─ Project tasks and completion tracking
   │
   └─→ Version History
       └─ Change tracking and audit trail
```

---

## Technical Stack

### Frontend
- **Framework**: React 18.3.1
- **Language**: TypeScript 5.5.3
- **Build Tool**: Vite 5.4.2
- **Styling**: Tailwind CSS 3.4.1
- **Icons**: Lucide React 0.344.0
- **Linting**: ESLint 9.9.1 with TypeScript support

### Backend
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth (email/password)
- **Real-time**: Supabase Real-time subscriptions
- **API**: Supabase JS Client 2.57.4

### Development Tools
- **Type Checking**: TypeScript strict mode
- **Code Quality**: ESLint with React hooks plugin
- **CSS Processing**: PostCSS with Autoprefixer
- **Package Manager**: npm

---

## Database Schema

### Entity Relationship Diagram

```
┌─────────────────┐
│   auth.users    │
│  (Supabase)     │
└────────┬────────┘
         │
         │ created_by / updated_by / changed_by
         │
    ┌────┴─────────────────────────────────┐
    │                                       │
    ▼                                       ▼
┌─────────────────┐              ┌─────────────────┐
│    projects     │              │ change_history  │
│─────────────────│              │─────────────────│
│ id (PK)         │              │ id (PK)         │
│ name            │              │ project_id (FK) │
│ description     │              │ changed_by (FK) │
│ audience        │              │ change_type     │
│ status          │              │ snapshot        │
│ created_by (FK) │              │ created_at      │
│ updated_by (FK) │              └─────────────────┘
│ parent_proj (FK)│
│ version_number  │
│ has_appendix    │
│ has_metric_logic│
└────────┬────────┘
         │
    ┌────┴────────────────────────────────────────┐
    │                                              │
    ▼                                              ▼
┌────────────────────┐                 ┌─────────────────────┐
│ functional_        │                 │ design_             │
│ requirements       │                 │ requirements        │
│────────────────────│                 │─────────────────────│
│ id (PK)            │                 │ id (PK)             │
│ project_id (FK)    │                 │ project_id (FK)     │
│ data_sources       │                 │ dashboard_size      │
│ metrics            │                 │ color_palette       │
│ created_at         │                 │ fonts               │
│ updated_at         │                 │ logo_url            │
└────────────────────┘                 │ logo_location       │
                                       │ additional_reqs     │
    ┌──────────────────────────────────│ created_at          │
    │                                  │ updated_at          │
    ▼                                  └─────────────────────┘
┌────────────────────┐
│ dashboard_tabs     │                 ┌─────────────────────┐
│────────────────────│                 │ tasks               │
│ id (PK)            │                 │─────────────────────│
│ project_id (FK)    │                 │ id (PK)             │
│ name               │                 │ project_id (FK)     │
│ order_index        │                 │ description         │
│ carry_over_filters │                 │ order_index         │
│ has_detail_section │                 │ completed           │
│ detail_fields      │                 │ created_at          │
│ interaction_behav. │                 └─────────────────────┘
│ created_at         │
└────────┬───────────┘
         │
    ┌────┴────────┐                    ┌─────────────────────┐
    ▼             ▼                    │ additional_         │
┌──────────┐ ┌──────────┐             │ requirements        │
│ visuals  │ │ filters  │             │─────────────────────│
│──────────│ │──────────│             │ id (PK)             │
│ id (PK)  │ │ id (PK)  │             │ project_id (FK)     │
│ tab_id(FK)│ │ tab_id(FK)│           │ category            │
│ name     │ │ project_id│            │ content             │
│ type     │ │ name     │             │ created_at          │
│ desc.    │ │ data_src │             └─────────────────────┘
│ order_idx│ │ multi_sel│
└──────────┘ │ default  │             ┌─────────────────────┐
             │ sorting  │             │ metric_logic        │
             └──────────┘             │─────────────────────│
                                      │ id (PK)             │
                                      │ project_id (FK)     │
                                      │ metric_name         │
                                      │ calculation_logic   │
                                      │ created_at          │
                                      │ updated_at          │
                                      └─────────────────────┘
```

### Tables Description

#### 1. **projects**
Core table storing dashboard project information.
- Primary key: `id` (UUID)
- Tracks versioning via `version_number` and `parent_project_id`
- Status: `draft` or `done`
- Audit fields: `created_by`, `updated_by`, `created_at`, `updated_at`

#### 2. **functional_requirements**
Stores functional specifications for each project.
- JSONB arrays for `data_sources` and `metrics`
- One-to-one relationship with projects

#### 3. **dashboard_tabs**
Defines the tab structure of the dashboard.
- Ordered by `order_index`
- Configurable filter carryover and detail sections
- JSONB for `detail_fields`

#### 4. **visuals**
Visual components within each tab.
- Types: table, chart, graph, etc.
- Ordered by `order_index`

#### 5. **filters**
Filter components (global or tab-specific).
- Can be attached to tabs or project-level
- Support for multi-select and default values
- JSONB for `other_options`

#### 6. **design_requirements**
Design and branding specifications.
- JSONB arrays for `color_palette` and `fonts`
- Logo configuration

#### 7. **tasks**
Project tasks and to-dos.
- Ordered by `order_index`
- Boolean completion status

#### 8. **additional_requirements**
Catch-all for extra requirements.
- Categorized by `category` field

#### 9. **change_history**
Audit trail of all project changes.
- JSONB `snapshot` for storing state
- References `auth.users` for attribution

#### 10. **metric_logic**
Documentation of metric calculation logic.
- Optional tab enabled via `has_metric_logic_tab`

### Database Functions

#### get_user_emails(user_ids uuid[])
Returns user email addresses for given user IDs.
- **Security**: SECURITY DEFINER
- **Purpose**: Display user information in UI without exposing auth schema
- **Returns**: Table with id and email columns

---

## Core Features

### 1. Project Management
- **Create Projects**: New dashboard specifications with versioning
- **List Projects**: View all projects with search and filtering
  - Filter by: All, Last Modified by Me, Last 7 Days
  - Search by name or description
- **Edit Projects**: Update specifications via chat interface
- **Delete Projects**: Remove projects and all related data
- **Version Control**: Create enhancement versions from completed projects

### 2. Requirements Gathering

#### Functional Requirements
Conversational chat interface that guides users through:
1. **Dashboard Name**: Project identification
2. **Description**: Purpose and goals
3. **Audience**: Target users
4. **Data Sources**: Required data connections
5. **Metrics**: Key performance indicators
6. **Dashboard Tabs**: Page structure
7. **Filters**: Global and tab-specific filters
8. **Appendix Tab**: Optional additional information
9. **Metric Logic Tab**: Optional calculation documentation
10. **Additional Requirements**: Freeform requirements

**Chat Features**:
- Guided step-by-step conversation
- Edit existing requirements with natural language
- Real-time preview of captured requirements
- Auto-save functionality

#### Design Requirements
Separate chat for design specifications:
1. **Dashboard Size**: Dimensions or responsive
2. **Color Palette**: Brand colors and themes
3. **Fonts**: Typography specifications
4. **Logo**: Branding and placement
5. **Additional Design**: Extra styling requirements

### 3. Task Management
- Create project-related tasks
- Track completion status
- Reorder tasks via drag-and-drop
- Auto-generated task suggestions

### 4. Document Export
- **Format**: Markdown (.md)
- **Content**:
  - Project overview
  - Functional requirements
  - Design requirements
  - Task list
  - Version information
- **Automatic naming**: `{ProjectName}_v{Version}.md`

### 5. Change Tracking
- Every project change recorded in `change_history`
- Tracks who made changes and when
- Version history view (UI in progress)
- Change types: create, update, delete, version

### 6. Collaborative Features
- Multi-user access with authentication
- Track last editor on each project
- Relative timestamps (e.g., "2h ago")
- User attribution on all changes

### 7. Status Management
- **Draft**: Active development
- **Done**: Completed specifications
- Enhancement versions only from "Done" projects

---

## Component Structure

### Component Hierarchy

```
App (Root)
├─ AuthContext (Context Provider)
├─ Auth (Login/Register)
└─ Authenticated View
   ├─ ProjectList
   │  ├─ Search & Filter Bar
   │  ├─ Project Cards
   │  └─ Create Project Dialog
   │
   └─ ProjectEditor
      ├─ Project Header
      │  ├─ Name/Description/Audience (editable)
      │  ├─ Status Badge
      │  └─ Action Buttons
      │
      ├─ Tab Navigation
      │
      └─ Tab Content
         ├─ Functional Requirements
         │  ├─ RequirementsChat
         │  └─ DocumentPreview
         │
         ├─ Design Requirements
         │  ├─ DesignRequirementsChat
         │  └─ DesignPreview
         │
         ├─ Tasks
         │  └─ TasksManager
         │
         └─ Version History
            └─ Change History View
```

### Key Components

#### 1. **App.tsx**
- Root component
- Handles authentication state
- Routes between ProjectList and ProjectEditor
- Manages project creation flow

#### 2. **Auth.tsx**
- Email/password authentication
- Sign up and sign in forms
- Error handling
- Supabase Auth integration

#### 3. **ProjectList.tsx**
- Displays all projects in card format
- Search functionality
- Filter tabs (All, Modified by Me, Last 7 Days)
- Project creation dialog
- Quick actions: Edit, Download, Delete
- User context display
- Relative timestamp formatting

#### 4. **ProjectEditor.tsx**
- Main editing interface
- Auto-save debouncing (1 second)
- Tab navigation for different requirement types
- Project header with editable fields
- Export functionality
- Version/enhancement creation
- Status management

#### 5. **RequirementsChat.tsx**
- Conversational requirements gathering
- State machine for chat flow
- Support for editing captured requirements
- Natural language processing for changes
- Auto-save to database
- Message history display

#### 6. **DesignRequirementsChat.tsx**
- Design-specific chat interface
- Similar flow to functional requirements
- Handles arrays (colors, fonts)
- Logo configuration

#### 7. **DocumentPreview.tsx**
- Real-time preview of functional requirements
- Markdown-style formatting
- Displays all captured information
- Updates automatically when requirements change

#### 8. **DesignPreview.tsx**
- Visual preview of design requirements
- Color palette display
- Font specifications
- Logo information

#### 9. **TasksManager.tsx**
- Task list with checkboxes
- Add/edit/delete tasks
- Reorder functionality
- Completion tracking

#### 10. **AuthContext.tsx**
- Authentication state management
- User session handling
- Sign in/out methods
- Loading states

---

## User Workflows

### Workflow 1: Creating a New Project

```
1. User clicks "New Dashboard Project"
   ↓
2. Dialog prompts for project name
   ↓
3. User enters name and clicks "Create"
   ↓
4. ProjectEditor opens with new project
   ↓
5. Functional Requirements chat begins
   ↓
6. Chat guides through each requirement step
   │
   ├─ Name (auto-filled)
   ├─ Description
   ├─ Audience
   ├─ Data Sources
   ├─ Metrics
   ├─ Dashboard Tabs
   ├─ Filters
   ├─ Appendix Tab (yes/no)
   ├─ Metric Logic Tab (yes/no)
   └─ Additional Requirements
   ↓
7. Preview updates in real-time
   ↓
8. User switches to Design Requirements tab
   ↓
9. Design chat gathers visual specifications
   ↓
10. User adds tasks in Tasks tab
   ↓
11. User marks project as "Done"
   ↓
12. User exports document
```

### Workflow 2: Editing an Existing Project

```
1. User searches/filters for project
   ↓
2. Clicks on project card or Edit button
   ↓
3. ProjectEditor opens with loaded data
   ↓
4. Chat resumes from last completed step
   ↓
5. User can update any requirement via chat
   │  (e.g., "change metrics to Revenue, Profit")
   ↓
6. Changes save automatically
   ↓
7. All changes tracked in change_history
```

### Workflow 3: Creating Enhancement Version

```
1. User completes project (marks as Done)
   ↓
2. Clicks "Create Enhancement"
   ↓
3. System creates new project:
   - Copies all requirements
   - Increments version number
   - Links to parent project
   - Sets status to Draft
   ↓
4. User modifies requirements for enhancement
   ↓
5. New version tracked separately
```

---

## Setup and Installation

### Prerequisites
- Node.js 18+ and npm
- Supabase account and project

### Environment Variables
Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd project
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new Supabase project
   - Run the database schema from `database_schema.sql`
   - Enable email authentication in Supabase dashboard
   - Copy your project URL and anon key to `.env`

4. **Run the database migrations**
   ```bash
   # Execute the SQL files in supabase/migrations/ in order
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Build for production**
   ```bash
   npm run build
   npm run preview  # Preview production build
   ```

### Database Setup

Execute the `database_schema.sql` file in your Supabase SQL editor. This creates:
- All tables with proper relationships
- Row Level Security policies
- Database functions
- Indexes

---

## Data Models

### TypeScript Interfaces

```typescript
interface Project {
  id: string;
  name: string;
  description: string;
  audience: string;
  status: 'draft' | 'done';
  created_by: string;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  parent_project_id: string | null;
  version_number: number;
  has_appendix_tab: boolean;
  has_metric_logic_tab: boolean;
}

interface FunctionalRequirements {
  id: string;
  project_id: string;
  data_sources: string[];
  metrics: string[];
  created_at: string;
  updated_at: string;
}

interface DashboardTab {
  id: string;
  project_id: string;
  name: string;
  order_index: number;
  carry_over_filters: boolean;
  has_detail_section: boolean;
  detail_fields: string[];
  interaction_behavior: string;
  created_at: string;
}

interface Filter {
  id: string;
  tab_id: string | null;
  project_id: string | null;
  visual_id: string | null;
  name: string;
  data_source: string;
  custom_sorting: string;
  multi_select: boolean;
  default_value: string;
  other_options: Record<string, any>;
  created_at: string;
}

interface Visual {
  id: string;
  tab_id: string;
  name: string;
  type: string;
  description: string;
  order_index: number;
  created_at: string;
}

interface DesignRequirements {
  id: string;
  project_id: string;
  dashboard_size: string;
  color_palette: string[];
  fonts: string[];
  logo_url: string;
  logo_location: string;
  additional_requirements: string;
  created_at: string;
  updated_at: string;
}

interface Task {
  id: string;
  project_id: string;
  description: string;
  order_index: number;
  completed: boolean;
  created_at: string;
}

interface ChangeHistory {
  id: string;
  project_id: string;
  changed_by: string;
  change_type: 'create' | 'update' | 'delete' | 'version';
  change_description: string;
  snapshot: Record<string, any>;
  created_at: string;
}

interface AdditionalRequirement {
  id: string;
  project_id: string;
  category: string;
  content: string;
  created_at: string;
}

interface MetricLogic {
  id: string;
  project_id: string;
  metric_name: string;
  calculation_logic: string;
  created_at: string;
  updated_at: string;
}
```

---

## Security Implementation

### Row Level Security (RLS)

All tables have RLS enabled with the following policy structure:

#### Projects Table
```sql
-- All authenticated users can view projects
SELECT: authenticated = true

-- Users can only create projects as themselves
INSERT: auth.uid() = created_by

-- All authenticated users can update projects
UPDATE: authenticated = true

-- All authenticated users can delete projects
DELETE: authenticated = true
```

#### Related Tables (Requirements, Tabs, Filters, etc.)
```sql
-- All authenticated users have full access
SELECT, INSERT, UPDATE, DELETE: authenticated = true
```

#### Change History Table
```sql
-- All can view
SELECT: authenticated = true

-- Can only create entries attributed to self
INSERT: auth.uid() = changed_by

-- All can delete (for admin cleanup)
DELETE: authenticated = true
```

### Authentication
- Email/password authentication via Supabase Auth
- Session management with automatic refresh
- Secure password requirements enforced by Supabase
- User context stored in AuthContext

### Data Access Patterns
- All database queries use Supabase client with user context
- User ID from auth.uid() for attributions
- Automatic timestamps on all creates/updates
- Cascade deletes for data integrity

---

## Export Functionality

### Document Export Format

Generated markdown includes:

1. **Header**
   - Project name
   - Version number
   - Status
   - Last updated date

2. **Overview Section**
   - Description
   - Target audience

3. **Functional Requirements**
   - Data sources list
   - Metrics list
   - Dashboard tabs
   - Filter behavior
   - Global filters with configurations
   - Additional requirements
   - Appendix tab notice (if enabled)
   - Metric logic tab notice (if enabled)

4. **Design Requirements**
   - Dashboard size
   - Color palette
   - Fonts
   - Logo information
   - Additional design requirements

5. **Tasks**
   - Checkbox-style task list with status

6. **Footer**
   - Generation timestamp

### Export Trigger Points
- **Project List**: Download button on each project card
- **Project Editor**: Export button in header
- **Format**: Markdown (.md) file
- **Naming**: `{ProjectName}_v{VersionNumber}.md`

---

## Future Enhancements

### Planned Features

1. **Version History UI**
   - Visual timeline of changes
   - Diff viewer for version comparison
   - Restore previous versions
   - Branch visualization for enhancements

2. **Advanced Filtering**
   - Filter by creator
   - Date range filters
   - Status filters
   - Tag/label system

3. **Collaboration Features**
   - Comments on requirements
   - @mentions for team members
   - Real-time collaboration indicators
   - Activity feed

4. **Template System**
   - Save projects as templates
   - Template library
   - Quick-start templates for common dashboard types

5. **Enhanced Export**
   - PDF export
   - HTML export
   - Excel/CSV data export
   - Custom export templates

6. **Dashboard Mockups**
   - Visual wireframe builder
   - Drag-and-drop layout designer
   - Preview mode

7. **Integration Capabilities**
   - JIRA/Project management tools
   - Slack notifications
   - Email notifications
   - Webhook support

8. **Advanced Design Features**
   - Color picker integration
   - Font preview
   - Logo upload and storage
   - Style guide generation

9. **Analytics**
   - Project metrics
   - User activity tracking
   - Completion rates
   - Time tracking

10. **Permissions System**
    - Project-level permissions
    - Role-based access (Owner, Editor, Viewer)
    - Organization management
    - Public/private projects

### Technical Improvements

1. **Performance**
   - Implement pagination for project lists
   - Virtual scrolling for long chats
   - Lazy loading for tabs
   - Image optimization

2. **Testing**
   - Unit tests for components
   - Integration tests for workflows
   - E2E tests with Playwright
   - Database migration tests

3. **Developer Experience**
   - Storybook for component documentation
   - API documentation
   - Development environment setup scripts
   - Docker containerization

4. **Accessibility**
   - WCAG 2.1 Level AA compliance
   - Screen reader optimization
   - Keyboard navigation
   - High contrast mode

5. **Internationalization**
   - Multi-language support
   - Locale-specific formatting
   - RTL language support

---

## Appendix

### Tech Debt Items
- Implement proper error boundaries
- Add loading states for all async operations
- Improve TypeScript type safety (reduce `any` usage)
- Add input validation and sanitization
- Implement rate limiting for chat operations

### Known Limitations
- Chat conversation state not persisted (resets on page refresh)
- No offline mode support
- Maximum project size not enforced
- No bulk operations support
- Export format limited to Markdown

### Performance Considerations
- Debounced auto-save (1 second delay)
- No pagination on project list (consider when >100 projects)
- Real-time updates not implemented (manual refresh needed)
- Large JSONB fields may impact query performance

### Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES6+ required
- No IE11 support
- Mobile responsive but not optimized for mobile workflow

---

## Contributing

### Code Style
- Follow existing TypeScript conventions
- Use functional components with hooks
- Maintain consistent naming (camelCase for variables, PascalCase for components)
- Add comments for complex logic
- Keep components under 300 lines

### Database Changes
- Always create a new migration file
- Include rollback SQL in comments
- Test migrations on development database first
- Update database_schema.sql with final state
- Document new tables/columns in this file

### Pull Request Process
1. Create feature branch from main
2. Make changes with clear commit messages
3. Test thoroughly in development environment
4. Update documentation if needed
5. Submit PR with description of changes
6. Address review feedback

---

## Support and Contact

For questions or issues:
- Review this documentation first
- Check the database schema file
- Examine component code and comments
- Test in development environment

---

**Last Updated**: 2026-01-02
**Version**: 1.0
**Author**: BI Spec Builder Development Team
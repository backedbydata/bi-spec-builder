# BI Spec Builder

A collaborative web application for creating, managing, and documenting Business Intelligence dashboard specifications through an intuitive chat-based interface.

## Overview

BI Spec Builder streamlines the dashboard specification process by:
- Providing guided conversational interfaces for gathering requirements
- Automatically generating comprehensive specification documents
- Enabling version control with enhancement versioning
- Facilitating multi-user collaboration with audit trails
- Standardizing documentation across teams

---

## Features

### Project Management
- **Create Projects**: Start new dashboard specifications with automatic versioning
- **List & Search**: View all projects with filtering (All, Last Modified by Me, Last 7 Days) and full-text search
- **Edit Projects**: Update specifications through conversational chat interfaces
- **Delete Projects**: Remove projects and all associated data
- **Version Control**: Create enhancement versions from completed projects

### Functional Requirements Gathering
Conversational chat interface that guides you through:
1. Dashboard Name
2. Description
3. Audience (target users)
4. Data Sources (required data connections)
5. Metrics (key performance indicators)
6. Dashboard Tabs (page structure)
7. Filters (global and tab-specific)
8. Appendix Tab (optional)
9. Metric Logic Tab (optional)
10. Additional Requirements (freeform)

**Key Features:**
- Natural language editing (e.g., "change metrics to Revenue, Profit")
- Real-time preview of captured requirements
- Auto-save functionality (1-second debounce)
- Resume from last step automatically

### Design Requirements
Separate chat interface for design specifications:
1. Dashboard Size (dimensions or responsive)
2. Color Palette (brand colors and themes)
3. Fonts (typography specifications)
4. Logo (branding and placement)
5. Additional Design Requirements

### Task Management
- Create project-related tasks
- Track completion status with checkboxes
- Reorder tasks via drag-and-drop
- Auto-generated task suggestions

### Document Export
- **Format**: Markdown (.md)
- **Contents**: Project overview, functional requirements, design requirements, task list, version information
- **Naming**: Automatic naming as `{ProjectName}_v{Version}.md`

### Change Tracking & Audit Trail
- Every project change recorded in database
- Track who made changes and when
- Version history view
- Change types: create, update, delete, version

### Collaboration Features
- Multi-user access with authentication
- Track last editor on each project
- Relative timestamps (e.g., "2 hours ago")
- User attribution on all changes

---

## Quick Start

```bash
# Clone the repository
git clone https://github.com/backedbydata/bi-spec-builder
cd bi-spec-builder

# Install dependencies
npm install

# Set up environment variables
# Copy .env.example to .env and add your Supabase credentials

# Start development server
npm run dev
```

The application will be available at `http://localhost:5173`

---

## Prerequisites

### Required Software
- **Node.js**: Version 16.x or higher
- **npm**: Version 7.x or higher (comes with Node.js)
- **Modern Web Browser**: Chrome, Firefox, Safari, or Edge (latest versions)

### Supabase Account
- Create a free account at [supabase.com](https://supabase.com)
- You'll need:
  - Supabase Project URL
  - Supabase Anon Key

---

## Installation

### 1. Clone the Repository
```bash
git clone https://github.com/backedbydata/bi-spec-builder
cd bi-spec-builder
```

### 2. Install Dependencies
```bash
npm install
```

This will install all required packages:
- React 18.3.1
- TypeScript 5.5.3
- Vite 5.4.2
- Supabase JS Client 2.57.4
- Tailwind CSS 3.4.1
- Lucide React 0.344.0

### 3. Set Up Supabase

#### Create a Supabase Project
1. Go to [supabase.com](https://supabase.com) and sign up
2. Create a new project
3. Wait for the database to be provisioned

#### Run Database Migrations
1. Install Supabase CLI:
```bash
npm install -g supabase
```

2. Link to your project:
```bash
supabase link --project-ref <your-project-ref>
```

3. Run migrations:
```bash
supabase db push
```

Alternatively, you can run the migration SQL files manually in the Supabase SQL Editor:
- Navigate to `supabase/migrations/` directory
- Copy contents of migration files
- Paste into Supabase SQL Editor and execute

### 4. Configure Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project-url.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

To find these values:
1. Go to your Supabase project dashboard
2. Navigate to Settings > API
3. Copy the Project URL and anon/public key

### 5. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

---

## Setup Steps

### First-Time Setup Checklist

- [ ] Install Node.js and npm
- [ ] Clone the repository
- [ ] Run `npm install`
- [ ] Create Supabase account and project
- [ ] Run database migrations
- [ ] Create `.env` file with Supabase credentials
- [ ] Start development server with `npm run dev`
- [ ] Create your first user account via the Sign Up page
- [ ] Create your first project

### Database Schema Setup

The database schema includes these main tables:
- `projects` - Core project data
- `functional_requirements` - Functional specifications
- `design_requirements` - Design specifications
- `dashboard_tabs` - Tab structure
- `filters` - Global and tab-specific filters
- `visuals` - Charts, tables, graphs
- `tasks` - Project tasks/to-dos
- `change_history` - Audit trail

All tables have Row Level Security (RLS) enabled for data protection.

---

## Usage

### Creating a New Project

1. Click **"Create New Project"** button
2. Enter a project name in the dialog
3. Click **"Create"**
4. You'll be taken to the Project Editor

### Gathering Functional Requirements

1. Navigate to the **"Functional Requirements"** tab
2. The chat assistant will guide you through each step:
   - Answer questions in the text input
   - Press Enter or click Send to submit
3. To edit a previous answer: type "change [field] to [value]"
   - Example: "change metrics to Revenue, Profit, Margin"
4. View your progress in the preview panel on the right

### Adding Design Requirements

1. Navigate to the **"Design Requirements"** tab
2. Follow the chat prompts for:
   - Dashboard size
   - Color palette
   - Fonts
   - Logo specifications
3. Preview appears on the right side

### Managing Tasks

1. Navigate to the **"Tasks"** tab
2. Add tasks using the input field
3. Check boxes to mark tasks complete
4. Reorder tasks by clicking and dragging

### Exporting Specifications

1. Click the **"Download"** button in the header
2. A Markdown file will be generated and downloaded
3. Filename format: `{ProjectName}_v{Version}.md`

### Creating Enhancement Versions

1. Mark your project as "Done" (toggle status badge)
2. Click **"Create Enhancement"** button
3. A new version (v1.1, v2.0, etc.) will be created
4. The new version starts with all data from the parent

### Viewing Change History

1. Navigate to the **"History"** tab
2. See all changes made to the project
3. View who made changes and when

---

## Use Cases

### Business Analyst Creating Dashboard Specs
**Scenario**: A business analyst needs to document requirements for a new sales dashboard.

**Workflow**:
1. Create new project: "Q1 Sales Dashboard"
2. Use functional requirements chat to capture:
   - Audience: Sales managers and executives
   - Data sources: Salesforce, SQL Server
   - Metrics: Revenue, Deals Closed, Pipeline Value
   - Tabs: Overview, By Region, By Product
3. Use design requirements chat to specify:
   - Company colors and branding
   - Font preferences
   - Logo placement
4. Add tasks for data validation and UAT
5. Export specification document
6. Share with development team

### Product Manager Versioning Dashboards
**Scenario**: A product manager needs to create enhancement specifications for an existing dashboard.

**Workflow**:
1. Find original dashboard project (v1.0)
2. Click "Create Enhancement"
3. System creates v1.1 with all original data
4. Update specific requirements in chat (e.g., "add metric: Customer Lifetime Value")
5. Export new specification showing v1.1
6. Share with stakeholders for review

### Team Collaboration
**Scenario**: Multiple team members collaborate on dashboard requirements.

**Workflow**:
1. Team member A creates initial project and captures basic requirements
2. Team member B opens same project, sees A's work
3. Team member B adds design requirements
4. Team member C adds tasks
5. Change history shows all contributions with timestamps
6. Export generates complete specification with all inputs

### Standardizing Documentation
**Scenario**: Organization needs consistent dashboard documentation across departments.

**Workflow**:
1. Create template project with standard structure
2. Train teams on using conversational interface
3. Each department creates projects using same guided flow
4. Export all specifications in identical Markdown format
5. Store in central documentation repository

---

## Project Structure

```
BI Spec Builder/
├── src/
│   ├── components/              # React components
│   │   ├── Auth.tsx            # Authentication UI
│   │   ├── ProjectList.tsx     # Project management view
│   │   ├── ProjectEditor.tsx   # Main editor with tabs
│   │   ├── RequirementsChat.tsx        # Functional requirements chat
│   │   ├── DesignRequirementsChat.tsx  # Design chat interface
│   │   ├── DocumentPreview.tsx         # Functional preview
│   │   ├── DesignPreview.tsx           # Design preview
│   │   └── TasksManager.tsx            # Tasks interface
│   ├── contexts/
│   │   └── AuthContext.tsx     # Authentication state
│   ├── lib/
│   │   └── supabase.ts         # Supabase client
│   ├── App.tsx                 # Root component & routing
│   ├── main.tsx                # React entry point
│   └── index.css               # Global styles
├── supabase/
│   └── migrations/             # Database migration files
├── .Documentation/             # Project documentation
│   ├── PROJECT_DOCUMENTATION.md
│   └── TECHNICAL_SPECIFICATION.md
├── package.json                # Dependencies & scripts
├── vite.config.ts              # Vite configuration
├── tsconfig.json               # TypeScript configuration
├── tailwind.config.js          # Tailwind CSS configuration
├── eslint.config.js            # ESLint configuration
├── index.html                  # HTML entry point
├── .env                        # Environment variables
└── README.md                   # This file
```

---

## Technical Details

### Tech Stack

**Frontend**
- **React** 18.3.1 - UI library
- **TypeScript** 5.5.3 - Type-safe JavaScript
- **Vite** 5.4.2 - Build tool & dev server
- **Tailwind CSS** 3.4.1 - Utility-first CSS
- **Lucide React** 0.344.0 - Icon library

**Backend**
- **Supabase PostgreSQL** - Database
- **Supabase Auth** - Email/password authentication
- **Supabase JS Client** 2.57.4 - API client

**Development Tools**
- ESLint 9.9.1 - Code linting
- PostCSS - CSS processing
- Autoprefixer - CSS vendor prefixes

### Architecture

**Component Hierarchy**
```
main.tsx
  └── App.tsx
      └── AuthProvider
          ├── Auth.tsx (unauthenticated)
          └── ProjectList.tsx (authenticated)
              └── ProjectEditor.tsx
                  ├── RequirementsChat.tsx
                  ├── DesignRequirementsChat.tsx
                  ├── DocumentPreview.tsx
                  ├── DesignPreview.tsx
                  └── TasksManager.tsx
```

**State Management**
- React hooks (useState, useEffect, useContext)
- Context API for authentication
- Local component state for forms
- Debounced auto-save (1-second delay)

**Data Flow**
```
User Input → Component State → Debounced Save → Supabase API
                                                       ↓
Component Update ← Database Response ← PostgreSQL Update
```

**Chat State Machine**
- Linear progression through requirement steps
- State stored in component state
- Supports editing previous answers with natural language
- Auto-saves on each step completion

### Security

- **Row Level Security (RLS)** enabled on all tables
- Authenticated users can only access their projects
- User attribution tracked via `auth.uid()`
- Environment variables for sensitive credentials
- HTTPS-only in production

### Performance Optimizations

- Debounced auto-save reduces database writes
- useCallback for function memoization
- Key-based component refresh
- Efficient re-rendering with React hooks

### Database Schema Highlights

**Projects Table**
- Version control (version_number, parent_project_id)
- Status tracking (draft/done)
- User attribution (created_by, updated_by)

**Change History Table**
- Complete audit trail
- Snapshot storage (JSONB)
- Change type categorization

**Relational Structure**
- Projects → Functional Requirements (1:1)
- Projects → Design Requirements (1:1)
- Projects → Dashboard Tabs (1:many)
- Dashboard Tabs → Filters (1:many)
- Dashboard Tabs → Visuals (1:many)
- Projects → Tasks (1:many)

---

## Available Scripts

### Development
```bash
npm run dev
```
Starts development server at `http://localhost:5173` with hot module replacement.

### Build
```bash
npm run build
```
Creates production build in `dist/` directory. Runs TypeScript compiler and Vite build.

### Preview
```bash
npm run preview
```
Preview production build locally before deployment.

### Linting
```bash
npm run lint
```
Runs ESLint on the codebase to check for code quality issues.

### Type Checking
```bash
npm run typecheck
```
Runs TypeScript compiler in check mode without emitting files.

---

## Troubleshooting

### Common Issues

#### "Cannot connect to Supabase"
**Problem**: Application can't reach Supabase backend.

**Solutions**:
- Verify `.env` file exists and contains correct credentials
- Check `VITE_SUPABASE_URL` format: `https://your-project.supabase.co`
- Ensure `VITE_SUPABASE_ANON_KEY` is the anon/public key, not the service role key
- Restart development server after changing `.env` file

#### "Authentication failed"
**Problem**: Cannot sign up or sign in.

**Solutions**:
- Verify email/password meet requirements (min 6 characters for password)
- Check Supabase project is active (not paused)
- Confirm email confirmations are disabled in Supabase Auth settings (or check email)
- Check browser console for specific error messages

#### "Data not saving"
**Problem**: Changes not persisting to database.

**Solutions**:
- Check browser console for errors
- Verify Row Level Security (RLS) policies are set up correctly
- Ensure user is authenticated
- Check network tab for failed API requests
- Verify database migrations were run successfully

#### "Project list is empty"
**Problem**: No projects appear even after creating them.

**Solutions**:
- Check filters (switch from "Last Modified by Me" to "All")
- Verify projects table has RLS policies allowing SELECT
- Check created_by field matches current user ID
- Refresh the page

#### "Build fails"
**Problem**: `npm run build` errors.

**Solutions**:
- Run `npm run typecheck` to find TypeScript errors
- Check for ESLint errors with `npm run lint`
- Delete `node_modules` and `package-lock.json`, then run `npm install`
- Clear Vite cache: delete `.vite` directory

#### "Module not found" errors
**Problem**: Import errors during development.

**Solutions**:
- Run `npm install` to ensure all dependencies are installed
- Check import paths are correct (case-sensitive)
- Restart development server
- Clear browser cache

### Database Issues

#### Migration Failures
**Problem**: Database migrations won't apply.

**Solutions**:
- Check Supabase project is active
- Verify you have proper permissions
- Run migrations in order (they're timestamped)
- Check SQL syntax in migration files
- Review Supabase logs for specific errors

#### RLS Policy Issues
**Problem**: Users can't access their own data.

**Solutions**:
- Verify RLS is enabled on tables
- Check policy definitions in migration files
- Ensure policies use `auth.uid()` correctly
- Test policies in Supabase SQL editor

### Performance Issues

#### Slow Auto-Save
**Problem**: Application feels sluggish when typing.

**Solutions**:
- Auto-save is debounced to 1 second - this is expected
- Check network speed to Supabase
- Verify not running other intensive processes

#### Slow Project List Load
**Problem**: Project list takes long to load.

**Solutions**:
- Check number of projects (large datasets may be slow)
- Verify network connection
- Check Supabase project region (choose closer region)

---

## Limitations

### Current Limitations

1. **Single-User Editing**: No real-time collaborative editing (one user editing at a time recommended)
2. **No Offline Support**: Requires internet connection for all operations
3. **File Attachments**: No support for uploading images or attachments
4. **Export Format**: Only Markdown export (no PDF, DOCX, etc.)
5. **Search**: Basic text search only (no advanced filters or full-text search)
6. **Mobile UI**: Optimized for desktop; mobile experience is functional but not ideal
7. **Undo/Redo**: No undo/redo functionality for chat inputs
8. **Bulk Operations**: No bulk project operations (delete, export, etc.)
9. **Templates**: No pre-built project templates
10. **Notifications**: No email or in-app notifications for changes

### Data Limits

- **Supabase Free Tier**: 500MB database storage, 2GB bandwidth/month
- **Text Fields**: No hard limits on text length, but very large inputs may impact performance
- **JSONB Fields**: Practical limit around 1MB per field

### Browser Support

- **Supported**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Not Supported**: Internet Explorer, older mobile browsers

---

## Future Enhancements

### Planned Features

- **Real-time Collaboration**: Multiple users editing simultaneously with presence indicators
- **Rich Text Editor**: Formatting options for requirements and descriptions
- **File Attachments**: Upload mockups, wireframes, and reference documents
- **Export Formats**: PDF, DOCX, HTML export options
- **Templates**: Pre-built project templates for common dashboard types
- **Advanced Search**: Full-text search across all project fields
- **Notifications**: Email notifications for project updates and mentions
- **Comments**: In-line commenting on specific requirements
- **Approval Workflow**: Request and track approvals from stakeholders
- **Integration**: Export to project management tools (Jira, Asana, etc.)
- **Mobile App**: Native mobile applications for iOS and Android

### Potential Improvements

- Dark mode support
- Keyboard shortcuts
- Drag-and-drop dashboard tab ordering
- Copy/paste requirements between projects
- Project duplication
- Bulk import/export
- Custom fields and requirement types
- Role-based access control (viewer, editor, admin)
- Project archiving
- Analytics dashboard (project statistics, usage metrics)

---

## Contributing

### Development Workflow

1. Create a feature branch: `git checkout -b feature/your-feature-name`
2. Make your changes
3. Test thoroughly
4. Run linting: `npm run lint`
5. Run type checking: `npm run typecheck`
6. Build to verify: `npm run build`
7. Commit with descriptive messages
8. Push and create a pull request

### Code Style

- Follow existing TypeScript and React patterns
- Use functional components with hooks
- Maintain type safety (avoid `any` types)
- Use Tailwind CSS classes for styling
- Follow ESLint rules

### Testing Checklist

Before submitting changes, verify:
- [ ] Application builds without errors
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] Authentication works
- [ ] Can create, edit, delete projects
- [ ] Chat interfaces work correctly
- [ ] Auto-save functions properly
- [ ] Export generates correct Markdown
- [ ] No console errors

---

## Support & Resources

### Documentation
- **Project Documentation**: See `.Documentation/PROJECT_DOCUMENTATION.md`
- **Technical Specification**: See `.Documentation/TECHNICAL_SPECIFICATION.md`
- **This README**: Comprehensive usage guide

### External Resources
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Vite Documentation](https://vitejs.dev/)

### Getting Help

1. Check this README and project documentation
2. Review Supabase logs for backend issues
3. Check browser console for frontend errors
4. Search existing issues (if repository has issue tracker)
5. Create detailed bug reports with reproduction steps

---

## License

MIT License

Copyright (c) 2026

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

## Acknowledgments

Built with:
- [React](https://react.dev/) - UI framework
- [Supabase](https://supabase.com/) - Backend platform
- [Tailwind CSS](https://tailwindcss.com/) - Styling framework
- [Vite](https://vitejs.dev/) - Build tool
- [Lucide](https://lucide.dev/) - Icons

---

## Version History

### v1.0.0 (Current)
- Initial release
- Functional and design requirements chat interfaces
- Project management with versioning
- Task management
- Markdown export
- Change history tracking
- Multi-user authentication

---

**Last Updated**: January 2026

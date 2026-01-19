# BI Spec Builder - Technical Specification

## Overview
This document provides detailed technical specifications for the BI Spec Builder application, including implementation details, API patterns, state management, and architectural decisions.

---

## Table of Contents
1. [Technology Decisions](#technology-decisions)
2. [State Management](#state-management)
3. [API Patterns](#api-patterns)
4. [Database Design Decisions](#database-design-decisions)
5. [Component Architecture](#component-architecture)
6. [Chat State Machine](#chat-state-machine)
7. [Auto-Save Implementation](#auto-save-implementation)
8. [Authentication Flow](#authentication-flow)
9. [Export Generation](#export-generation)
10. [Performance Optimization](#performance-optimization)

---

## Technology Decisions

### Why React + TypeScript?
- **Type Safety**: Catch errors at compile time
- **Developer Experience**: Better IDE support and autocomplete
- **Maintainability**: Self-documenting code through types
- **Component Reusability**: Strong typing enables confident refactoring

### Why Vite?
- **Fast HMR**: Instant hot module replacement during development
- **Build Speed**: Significantly faster than webpack
- **Modern Defaults**: ES modules, optimized builds
- **Simple Configuration**: Minimal setup required

### Why Supabase?
- **Rapid Development**: Authentication and database in one platform
- **PostgreSQL**: Powerful relational database with JSONB support
- **Row Level Security**: Built-in authorization at database level
- **Real-time**: WebSocket support for future features
- **Scalability**: Managed infrastructure

### Why Tailwind CSS?
- **Utility-First**: Rapid UI development
- **Consistency**: Design system through configuration
- **Performance**: Purged CSS for small bundle sizes
- **Responsive**: Mobile-first responsive utilities
- **No CSS Files**: Co-located styling with components

---

## State Management

### Local State Strategy

The application uses React's built-in state management without external libraries:

#### Component-Level State
```typescript
// ProjectEditor.tsx
const [project, setProject] = useState<Project | null>(null);
const [localName, setLocalName] = useState('');
const [activeTab, setActiveTab] = useState<'functional' | 'design'>('functional');
```

**Rationale**:
- Simple prop drilling for related components
- No global state complexity for current scope
- Easier to reason about data flow

#### Context for Cross-Cutting Concerns
```typescript
// AuthContext.tsx
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Authentication methods
  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
```

**Rationale**:
- Authentication state needed across entire app
- Prevents prop drilling for user context
- Single source of truth for auth state

### State Synchronization

#### Server as Source of Truth
- All data persisted to Supabase immediately
- Components fetch fresh data on mount
- Optimistic UI updates for better UX

#### Debounced Updates
```typescript
const debouncedSave = useCallback(
  (updates: Partial<Project>) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      await supabase.from('projects').update(updates).eq('id', project.id);
    }, 1000);
  },
  [project]
);
```

**Rationale**:
- Reduces database write operations
- Improves perceived performance
- Batches rapid changes

---

## API Patterns

### Supabase Client Setup

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
```

### Query Patterns

#### Single Record Queries
```typescript
// Use maybeSingle() for queries that might return no results
const { data, error } = await supabase
  .from('projects')
  .select('*')
  .eq('id', projectId)
  .maybeSingle();

// Benefits:
// - Returns null instead of throwing error when no record
// - Cleaner error handling
// - Matches TypeScript's null handling patterns
```

#### Multiple Record Queries
```typescript
const { data, error } = await supabase
  .from('projects')
  .select('*')
  .order('created_at', { ascending: false });
```

#### Insert with Return
```typescript
const { data, error } = await supabase
  .from('projects')
  .insert([newProject])
  .select()
  .single();

// Returns the created record with generated fields
```

#### Update Patterns
```typescript
// Optimistic update pattern
setLocalState(newValue);

const { error } = await supabase
  .from('projects')
  .update({ field: newValue })
  .eq('id', projectId);

if (error) {
  // Revert on error
  setLocalState(oldValue);
}
```

#### Delete Cascade Pattern
```typescript
// Manual cascade for child projects
const { data: children } = await supabase
  .from('projects')
  .select('id')
  .eq('parent_project_id', projectId);

for (const child of children) {
  await supabase.from('projects').delete().eq('id', child.id);
}

await supabase.from('projects').delete().eq('id', projectId);
```

### Error Handling

```typescript
const { data, error } = await supabase
  .from('projects')
  .select('*')
  .eq('id', projectId)
  .maybeSingle();

if (error) {
  console.error('Error fetching project:', error);
  // Show user-friendly error message
  return;
}

if (!data) {
  // Handle missing data case
  return;
}

// Proceed with data
```

---

## Database Design Decisions

### UUID Primary Keys
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid()
```

**Benefits**:
- Globally unique identifiers
- No sequence coordination needed
- Better for distributed systems
- Merge-friendly for future sharding

**Trade-offs**:
- Larger index size than integers
- Not human-readable
- Random ordering (but we sort by created_at)

### JSONB for Arrays and Objects
```sql
data_sources jsonb DEFAULT '[]'::jsonb
color_palette jsonb DEFAULT '[]'::jsonb
other_options jsonb DEFAULT '{}'::jsonb
```

**Benefits**:
- Flexible schema for evolving requirements
- Native PostgreSQL querying with operators
- Reduces need for junction tables
- Efficient storage

**Trade-offs**:
- Less type safety at database level
- Harder to query across projects
- Index complexity for nested queries

### Timestamp Tracking
```sql
created_at timestamptz DEFAULT now()
updated_at timestamptz DEFAULT now()
```

**Benefits**:
- Audit trail built-in
- Time zone awareness (timestamptz)
- Automatic defaults

**Pattern**:
Application handles updated_at updates:
```typescript
await supabase
  .from('projects')
  .update({
    name: newName,
    updated_at: new Date().toISOString()
  })
  .eq('id', projectId);
```

### Soft vs Hard Deletes

Current implementation: **Hard deletes**

**Rationale**:
- Simpler data model
- Reduced storage costs
- RLS policies simpler
- Change history provides audit trail

**Future consideration**: Soft deletes with `deleted_at` column if compliance requires data retention.

### Parent-Child Relationships for Versioning
```sql
parent_project_id uuid REFERENCES projects(id)
version_number integer DEFAULT 1
```

**Design**:
- First version: parent_project_id = NULL
- Enhancements: parent_project_id points to first version
- All versions in same table

**Benefits**:
- Simple queries for version tree
- No separate versions table
- Versions can be independently modified

**Queries**:
```sql
-- Get all versions of a project
SELECT * FROM projects
WHERE id = :rootId OR parent_project_id = :rootId
ORDER BY version_number;

-- Get latest version
SELECT * FROM projects
WHERE id = :rootId OR parent_project_id = :rootId
ORDER BY version_number DESC LIMIT 1;
```

---

## Component Architecture

### Component Organization Principles

1. **Single Responsibility**: Each component has one primary purpose
2. **Composition**: Build complex UIs from simple components
3. **Props Interface**: Explicit TypeScript interfaces for all props
4. **Controlled Components**: Form inputs controlled by React state
5. **Effect Cleanup**: Always clean up timers, subscriptions

### Component Communication Patterns

#### Parent-Child: Props Down, Events Up
```typescript
// Parent
<RequirementsChat
  projectId={project.id}
  onRequirementsGenerated={(reqs) => setFunctionalReqs(reqs)}
  onProjectUpdate={handleProjectUpdate}
/>

// Child
const RequirementsChat = ({
  projectId,
  onRequirementsGenerated,
  onProjectUpdate
}) => {
  // Call parent callbacks
  onProjectUpdate({ name: newName });
};
```

#### Sibling Communication: Lift State Up
```typescript
// Parent manages shared state
const [refreshKey, setRefreshKey] = useState(0);

// Trigger refresh from one child
<RequirementsChat
  onRequirementsUpdated={() => setRefreshKey(prev => prev + 1)}
/>

// Other child responds to refresh
<DocumentPreview key={refreshKey} projectId={projectId} />
```

### Ref Usage Patterns

#### DOM References
```typescript
const messagesEndRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
}, [messages]);

return (
  <div>
    {messages.map(msg => <Message key={msg.id} {...msg} />)}
    <div ref={messagesEndRef} />
  </div>
);
```

#### Mutable Values (Timers)
```typescript
const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

const debouncedSave = useCallback(() => {
  if (saveTimeoutRef.current) {
    clearTimeout(saveTimeoutRef.current);
  }
  saveTimeoutRef.current = setTimeout(save, 1000);
}, [save]);

// Cleanup
useEffect(() => {
  return () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
  };
}, []);
```

#### Prevent Duplicate Effects
```typescript
const projectCreatedRef = useRef(false);

useEffect(() => {
  if (!projectId && !projectCreatedRef.current) {
    projectCreatedRef.current = true;
    createNewProject();
  }
}, [projectId]);
```

---

## Chat State Machine

### Requirements Chat State Machine

```
          ┌──────────┐
    ┌────▶│   name   │────┐
    │     └──────────┘    │
    │                     ▼
    │     ┌──────────────────┐
    │     │   description    │
    │     └──────────────────┘
    │              │
    │              ▼
    │     ┌──────────────────┐
    │     │    audience      │
    │     └──────────────────┘
    │              │
    │              ▼
    │     ┌──────────────────┐
    │     │  data_sources    │
    │     └──────────────────┘
    │              │
    │              ▼
    │     ┌──────────────────┐
    │     │    metrics       │
    │     └──────────────────┘
    │              │
    │              ▼
    │     ┌──────────────────┐
    │     │      tabs        │
    │     └──────────────────┘
    │              │
    │              ▼
    │     ┌──────────────────┐
    │     │    filters       │
    │     └──────────────────┘
    │              │
    │              ▼
    │     ┌──────────────────┐
    │     │    appendix      │
    │     └──────────────────┘
    │              │
    │              ▼
    │     ┌──────────────────┐
    │     │  metric_logic    │
    │     └──────────────────┘
    │              │
    │              ▼
    │     ┌──────────────────┐
    └─────│   additional     │◄───┐
          └──────────────────┘    │
                   │               │
                   │  "change X"   │
                   └───────────────┘
                   │
                   │  "done"
                   ▼
          ┌──────────────────┐
          │    complete      │
          └──────────────────┘
```

### State Structure
```typescript
interface ConversationState {
  step: string;
  data: Record<string, any>;
}

const [conversationState, setConversationState] = useState({
  step: 'name',
  data: {}
});
```

### State Transitions

#### Linear Progression
```typescript
switch (state.step) {
  case 'name':
    newData.name = userInput;
    return {
      message: "Great! Now describe...",
      newState: { step: 'description', data: newData }
    };

  case 'description':
    newData.description = userInput;
    return {
      message: "Who is the audience?",
      newState: { step: 'audience', data: newData }
    };
  // ... etc
}
```

#### Special Commands
```typescript
case 'additional':
  if (userInput.toLowerCase() === 'done') {
    return {
      message: "All requirements captured!",
      newState: { step: 'complete', data: newData },
      requirements: newData
    };
  }

  if (userInput.startsWith('change ')) {
    return handleChangeRequest(userInput, newData);
  }

  // Default: add as additional requirement
  newData.additional_requirements.push(userInput);
  return {
    message: "Added! Type 'done' when finished.",
    newState: { step: 'additional', data: newData }
  };
```

### Natural Language Parsing

#### Change Request Parser
```typescript
const handleChangeRequest = (userInput: string, data: Record<string, any>) => {
  const input = userInput.toLowerCase();

  // Pattern: "change X to Y"
  if (input.includes('metrics')) {
    const value = extractValue('metric[s]?');
    const newMetrics = value.split(',').map(s => s.trim());
    data.metrics = newMetrics;
    saveFunctionalRequirements({ metrics: newMetrics });
    return {
      message: `Updated metrics to: ${newMetrics.join(', ')}`,
      newState: { step: 'additional', data }
    };
  }

  // ... handle other fields
};

const extractValue = (field: string): string => {
  // Regex to extract value after "to"
  const match = userInput.match(new RegExp(`${field}\\s+to\\s+(.+)`, 'i'));
  return match ? match[1] : '';
};
```

### Conversation Resumption

```typescript
const initializeChat = async () => {
  const existingData = await loadExistingRequirements();
  const nextStep = determineNextStep(existingData);

  setConversationState({
    step: nextStep,
    data: existingData
  });

  const welcomeMessage = getWelcomeMessage(nextStep, existingData);
  setMessages([welcomeMessage]);
};

const determineNextStep = (data: Record<string, any>): string => {
  if (!data.name) return 'name';
  if (!data.description) return 'description';
  // ... check all required fields in order
  return 'additional'; // Resume at additional requirements
};
```

---

## Auto-Save Implementation

### Debounced Save Pattern

```typescript
const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

const debouncedSave = useCallback(
  (updates: Partial<Project>) => {
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout
    saveTimeoutRef.current = setTimeout(async () => {
      if (!project || !user) return;

      setSaving(true);

      const { error } = await supabase
        .from('projects')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
          updated_by: user.id
        })
        .eq('id', project.id);

      if (!error) {
        setProject(prev => prev ? { ...prev, ...updates } : null);
      }

      setSaving(false);
    }, 1000); // 1 second debounce
  },
  [project, user]
);
```

### Input Handlers

```typescript
const handleNameChange = (value: string) => {
  // Update local state immediately (optimistic)
  setLocalName(value);

  // Trigger debounced save
  debouncedSave({ name: value });
};

// Usage
<input
  type="text"
  value={localName}
  onChange={(e) => handleNameChange(e.target.value)}
  placeholder="Dashboard Name"
/>
```

### Cleanup

```typescript
useEffect(() => {
  return () => {
    // Clear pending saves on unmount
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
  };
}, []);
```

### Save Indicator

```typescript
const [saving, setSaving] = useState(false);

// Show indicator
{saving && <p className="text-xs text-slate-500">Saving...</p>}
```

---

## Authentication Flow

### Session Management

```typescript
// AuthContext.tsx
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### Protected Routes

```typescript
// App.tsx
function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Auth />;
  }

  return <AuthenticatedApp />;
}
```

### User Attribution

```typescript
// Creating records with user attribution
const createProject = async () => {
  const { data, error } = await supabase
    .from('projects')
    .insert([{
      name: projectName,
      created_by: user.id, // Current user
      updated_by: user.id
    }])
    .select()
    .single();
};

// Updating records
const updateProject = async (updates: Partial<Project>) => {
  await supabase
    .from('projects')
    .update({
      ...updates,
      updated_by: user.id, // Track who made the change
      updated_at: new Date().toISOString()
    })
    .eq('id', projectId);
};
```

---

## Export Generation

### Markdown Generation

```typescript
const generateExportContent = async (): Promise<string> => {
  let content = '';

  // Header
  content += `# ${project.name}\n\n`;
  content += `**Version:** ${project.version_number}\n`;
  content += `**Status:** ${project.status.toUpperCase()}\n\n`;

  // Fetch all related data
  const { data: funcReqs } = await supabase
    .from('functional_requirements')
    .select('*')
    .eq('project_id', project.id)
    .maybeSingle();

  // Format data sources
  if (funcReqs?.data_sources?.length > 0) {
    content += `### Data Sources\n\n`;
    funcReqs.data_sources.forEach((source: string) => {
      content += `- ${source}\n`;
    });
    content += `\n`;
  }

  // ... continue for all sections

  return content;
};
```

### Download Trigger

```typescript
const exportDocuments = async () => {
  const content = await generateExportContent();

  // Create blob
  const blob = new Blob([content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);

  // Create download link
  const a = document.createElement('a');
  a.href = url;
  a.download = `${project.name.replace(/\s+/g, '_')}_v${project.version_number}.md`;

  // Trigger download
  document.body.appendChild(a);
  a.click();

  // Cleanup
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
```

---

## Performance Optimization

### Current Optimizations

1. **Debounced Auto-Save**: Reduces database writes
2. **useCallback for Functions**: Prevents unnecessary re-renders
3. **Key-Based Refresh**: Triggers selective re-renders
4. **Lazy State Updates**: Only update what changes
5. **Indexed Queries**: Database indexes on foreign keys

### Query Optimization

```typescript
// Single query with select specific fields
const { data } = await supabase
  .from('projects')
  .select('id, name, description, created_at')
  .order('created_at', { ascending: false });

// Join pattern (avoid N+1)
const { data } = await supabase
  .from('projects')
  .select(`
    *,
    functional_requirements(*),
    design_requirements(*)
  `)
  .eq('id', projectId)
  .maybeSingle();
```

### React Optimizations

```typescript
// Memoize expensive computations
const filteredProjects = useMemo(() => {
  return projects.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
}, [projects, searchQuery]);

// Prevent unnecessary re-renders
const ProjectCard = React.memo(({ project, onClick }) => {
  return <div onClick={() => onClick(project.id)}>...</div>;
});
```

### Future Optimizations

1. **Pagination**: Implement cursor-based pagination for project list
2. **Virtual Scrolling**: For long chat histories
3. **Image Optimization**: Compress and resize uploaded images
4. **Code Splitting**: Lazy load route components
5. **Service Worker**: Cache static assets
6. **Database Indexing**: Add composite indexes for complex queries

---

## Deployment

### Build Configuration

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2015',
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'supabase-vendor': ['@supabase/supabase-js']
        }
      }
    }
  }
});
```

### Environment Variables

Production environment requires:
```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
```

### Build Steps

```bash
# Install dependencies
npm ci

# Type check
npm run typecheck

# Build
npm run build

# Preview production build
npm run preview
```

---

## Monitoring and Debugging

### Error Tracking

Current: Console logging
Recommended: Sentry or similar service

```typescript
try {
  await supabase.from('projects').insert([data]);
} catch (error) {
  console.error('Error creating project:', error);
  // Future: Sentry.captureException(error);
}
```

### Performance Monitoring

Recommended additions:
- React DevTools Profiler
- Lighthouse CI in build pipeline
- Database query performance monitoring in Supabase dashboard

---

**Last Updated**: 2026-01-02
**Version**: 1.0
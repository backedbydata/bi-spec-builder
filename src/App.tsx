import { useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import Auth from './components/Auth';
import ProjectList from './components/ProjectList';
import ProjectEditor from './components/ProjectEditor';

function App() {
  const { user, loading } = useAuth();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [creatingNew, setCreatingNew] = useState(false);
  const [newProjectName, setNewProjectName] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  if (selectedProjectId || (creatingNew && newProjectName)) {
    return (
      <ProjectEditor
        projectId={creatingNew ? null : selectedProjectId}
        projectName={newProjectName}
        onBack={() => {
          setSelectedProjectId(null);
          setCreatingNew(false);
          setNewProjectName(null);
        }}
      />
    );
  }

  return (
    <ProjectList
      onSelectProject={setSelectedProjectId}
      onCreateProject={(name: string) => {
        setNewProjectName(name);
        setCreatingNew(true);
      }}
      showCreateDialog={creatingNew && !newProjectName}
      onCancelCreate={() => setCreatingNew(false)}
    />
  );
}

export default App;

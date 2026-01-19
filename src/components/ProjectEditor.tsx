import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Download, GitBranch, FileCheck, Trash2, Edit2, Check, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import RequirementsChat from './RequirementsChat';
import DocumentPreview from './DocumentPreview';
import DesignRequirementsChat from './DesignRequirementsChat';
import DesignPreview from './DesignPreview';
import TasksManager from './TasksManager';

interface Project {
  id: string;
  name: string;
  description: string;
  audience: string;
  status: string;
  version_number: number;
  parent_project_id: string | null;
  has_appendix_tab: boolean;
  has_metric_logic_tab: boolean;
  created_at: string;
  updated_at: string;
}

interface ProjectEditorProps {
  projectId: string | null;
  projectName?: string | null;
  onBack: () => void;
}

export default function ProjectEditor({ projectId, projectName, onBack }: ProjectEditorProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [localName, setLocalName] = useState('');
  const [localDescription, setLocalDescription] = useState('');
  const [localAudience, setLocalAudience] = useState('');
  const [activeTab, setActiveTab] = useState<'functional' | 'design' | 'tasks' | 'history'>('functional');
  const [saving, setSaving] = useState(false);
  const [showEnhancementDialog, setShowEnhancementDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [isEditingAudience, setIsEditingAudience] = useState(false);
  const [functionalReqs, setFunctionalReqs] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const { user } = useAuth();
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const projectCreatedRef = useRef(false);

  useEffect(() => {
    if (projectId) {
      loadProject();
    } else if (!projectCreatedRef.current) {
      projectCreatedRef.current = true;
      createNewProject();
    }
  }, [projectId]);

  const loadProject = async () => {
    if (!projectId) return;

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .maybeSingle();

    if (!error && data) {
      setProject(data);
      setLocalName(data.name);
      setLocalDescription(data.description);
      setLocalAudience(data.audience);
    }
  };

  const createNewProject = async () => {
    if (!user) return;

    const newProject = {
      name: projectName || 'New Dashboard Project',
      description: '',
      audience: '',
      status: 'draft',
      created_by: user.id,
      version_number: 1,
      has_appendix_tab: false,
      has_metric_logic_tab: false,
    };

    const { data, error } = await supabase
      .from('projects')
      .insert([newProject])
      .select()
      .single();

    if (!error && data) {
      setProject(data);
      setLocalName(data.name);
      setLocalDescription(data.description);
      setLocalAudience(data.audience);
      await createChangeHistory(data.id, 'create', 'Project created');
    }
  };

  const createChangeHistory = async (projectId: string, changeType: string, description: string) => {
    if (!user) return;

    await supabase.from('change_history').insert([{
      project_id: projectId,
      changed_by: user.id,
      change_type: changeType,
      change_description: description,
      snapshot: {},
    }]);
  };

  const debouncedSave = useCallback(
    (updates: Partial<Project>) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(async () => {
        if (!project || !user) return;

        setSaving(true);
        const { error } = await supabase
          .from('projects')
          .update({ ...updates, updated_at: new Date().toISOString(), updated_by: user.id })
          .eq('id', project.id);

        if (!error) {
          setProject((prev) => (prev ? { ...prev, ...updates } : null));
        }
        setSaving(false);
      }, 1000);
    },
    [project, user]
  );

  const handleNameChange = (value: string) => {
    setLocalName(value);
    debouncedSave({ name: value });
  };

  const handleDescriptionChange = (value: string) => {
    setLocalDescription(value);
    debouncedSave({ description: value });
  };

  const handleAudienceChange = (value: string) => {
    setLocalAudience(value);
    debouncedSave({ audience: value });
  };

  const handleProjectUpdateFromChat = (updates: { name?: string; description?: string; audience?: string; has_appendix_tab?: boolean; has_metric_logic_tab?: boolean }) => {
    if (updates.name !== undefined) {
      setLocalName(updates.name);
      debouncedSave({ name: updates.name });
    }
    if (updates.description !== undefined) {
      setLocalDescription(updates.description);
      debouncedSave({ description: updates.description });
    }
    if (updates.audience !== undefined) {
      setLocalAudience(updates.audience);
      debouncedSave({ audience: updates.audience });
    }
    if (updates.has_appendix_tab !== undefined) {
      updateProject({ has_appendix_tab: updates.has_appendix_tab });
    }
    if (updates.has_metric_logic_tab !== undefined) {
      updateProject({ has_metric_logic_tab: updates.has_metric_logic_tab });
    }
  };

  const handleRequirementsUpdated = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const deleteProject = async () => {
    if (!project) return;

    try {
      const { data: childProjects } = await supabase
        .from('projects')
        .select('id')
        .eq('parent_project_id', project.id);

      if (childProjects && childProjects.length > 0) {
        for (const child of childProjects) {
          await supabase.from('projects').delete().eq('id', child.id);
        }
      }

      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', project.id);

      if (error) {
        console.error('Error deleting project:', error);
      } else {
        setShowDeleteDialog(false);
        onBack();
      }
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  const updateProject = async (updates: Partial<Project>) => {
    if (!project || !user) return;

    setSaving(true);
    const { error } = await supabase
      .from('projects')
      .update({ ...updates, updated_at: new Date().toISOString(), updated_by: user.id })
      .eq('id', project.id);

    if (!error) {
      setProject({ ...project, ...updates });
      if (updates.name !== undefined) setLocalName(updates.name);
      if (updates.description !== undefined) setLocalDescription(updates.description);
      if (updates.audience !== undefined) setLocalAudience(updates.audience);
      await createChangeHistory(project.id, 'update', 'Project updated');
    }
    setSaving(false);
  };

  const markAsDone = async () => {
    await updateProject({ status: 'done' });
  };

  const createEnhancement = async () => {
    if (!project || !user) return;

    const latestVersion = await getLatestVersion();
    const newVersion = latestVersion + 1;

    const enhancementProject = {
      name: `${project.name} - Enhancement v${newVersion}`,
      description: project.description,
      audience: project.audience,
      status: 'draft',
      created_by: user.id,
      parent_project_id: project.parent_project_id || project.id,
      version_number: newVersion,
      has_appendix_tab: project.has_appendix_tab,
      has_metric_logic_tab: project.has_metric_logic_tab,
    };

    const { data, error } = await supabase
      .from('projects')
      .insert([enhancementProject])
      .select()
      .single();

    if (!error && data) {
      await createChangeHistory(data.id, 'version', `Created enhancement version ${newVersion}`);
      setProject(data);
      setShowEnhancementDialog(false);
    }
  };

  const getLatestVersion = async (): Promise<number> => {
    if (!project) return 1;

    const rootId = project.parent_project_id || project.id;
    const { data } = await supabase
      .from('projects')
      .select('version_number')
      .or(`id.eq.${rootId},parent_project_id.eq.${rootId}`)
      .order('version_number', { ascending: false })
      .limit(1)
      .maybeSingle();

    return data?.version_number || project.version_number;
  };

  const exportDocuments = async () => {
    if (!project) return;

    const content = await generateExportContent();
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name.replace(/\s+/g, '_')}_v${project.version_number}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateExportContent = async (): Promise<string> => {
    if (!project) return '';

    let content = `# ${project.name}\n\n`;
    content += `**Version:** ${project.version_number}\n`;
    content += `**Status:** ${project.status.toUpperCase()}\n`;
    content += `**Last Updated:** ${new Date(project.updated_at).toLocaleDateString()}\n\n`;
    content += `## Overview\n\n`;
    content += `**Description:** ${project.description || 'Not specified'}\n\n`;
    content += `**Audience:** ${project.audience || 'Not specified'}\n\n`;
    content += `---\n\n`;
    content += `## Functional Requirements\n\n`;

    const { data: funcReqs } = await supabase
      .from('functional_requirements')
      .select('*')
      .eq('project_id', project.id)
      .maybeSingle();

    if (funcReqs) {
      if (funcReqs.data_sources && funcReqs.data_sources.length > 0) {
        content += `### Data Sources\n\n`;
        funcReqs.data_sources.forEach((source: string) => {
          content += `- ${source}\n`;
        });
        content += `\n`;
      }

      if (funcReqs.metrics && funcReqs.metrics.length > 0) {
        content += `### Metrics\n\n`;
        funcReqs.metrics.forEach((metric: string) => {
          content += `- ${metric}\n`;
        });
        content += `\n`;
      }
    }

    const { data: tabs } = await supabase
      .from('dashboard_tabs')
      .select('*')
      .eq('project_id', project.id)
      .order('order_index');

    if (tabs && tabs.length > 0) {
      content += `### Dashboard Tabs\n\n`;
      tabs.forEach((tab: any) => {
        content += `- ${tab.name}\n`;
      });
      content += `\n`;
    }

    if (funcReqs) {
      content += `### Filter Behavior\n\n`;
      content += `Filter selections ${funcReqs.filter_carryover ? 'carry over' : 'do not carry over'} from tab to tab.\n\n`;
    }

    const { data: filters } = await supabase
      .from('filters')
      .select('*')
      .eq('project_id', project.id)
      .is('tab_id', null);

    if (filters && filters.length > 0) {
      content += `### Global Filters\n\n`;
      filters.forEach((filter: any) => {
        content += `**${filter.name}**\n`;
        if (filter.data_source) content += `- Source: ${filter.data_source}\n`;
        content += `- Multi-select: ${filter.multi_select ? 'Yes' : 'No'}\n`;
        if (filter.default_value) content += `- Default: ${filter.default_value}\n`;
        content += `\n`;
      });
    }

    const { data: additionalReqs } = await supabase
      .from('additional_requirements')
      .select('*')
      .eq('project_id', project.id)
      .eq('category', 'functional');

    if (additionalReqs && additionalReqs.length > 0) {
      content += `### Additional Requirements\n\n`;
      additionalReqs.forEach((req: any) => {
        content += `- ${req.content}\n`;
      });
      content += `\n`;
    }

    if (project.has_appendix_tab) {
      content += `### Appendix Tab\n\nAn appendix tab will be included with additional information about the dashboard.\n\n`;
    }

    if (project.has_metric_logic_tab) {
      content += `### Metric Logic Tab\n\nA metric logic tab will be included explaining calculation logic for each metric.\n\n`;
    }

    content += `---\n\n`;
    content += `## Design Requirements\n\n`;

    const { data: designReqs } = await supabase
      .from('design_requirements')
      .select('*')
      .eq('project_id', project.id)
      .maybeSingle();

    if (designReqs) {
      if (designReqs.dashboard_size) {
        content += `### Dashboard Size\n\n${designReqs.dashboard_size}\n\n`;
      }

      if (designReqs.color_palette && designReqs.color_palette.length > 0) {
        content += `### Color Palette\n\n`;
        designReqs.color_palette.forEach((color: string) => {
          content += `- ${color}\n`;
        });
        content += `\n`;
      }

      if (designReqs.fonts && designReqs.fonts.length > 0) {
        content += `### Fonts\n\n`;
        designReqs.fonts.forEach((font: string) => {
          content += `- ${font}\n`;
        });
        content += `\n`;
      }

      if (designReqs.logo_url) {
        content += `### Logo\n\n`;
        content += `- URL: ${designReqs.logo_url}\n`;
        if (designReqs.logo_location) {
          content += `- Location: ${designReqs.logo_location}\n`;
        }
        content += `\n`;
      }

      if (designReqs.additional_requirements) {
        content += `### Additional Design Requirements\n\n${designReqs.additional_requirements}\n\n`;
      }
    }

    content += `---\n\n`;
    content += `## Tasks\n\n`;

    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', project.id)
      .order('order_index');

    if (tasks && tasks.length > 0) {
      tasks.forEach((task: any, index: number) => {
        const status = task.completed ? 'x' : ' ';
        content += `${index + 1}. [${status}] ${task.description}\n`;
      });
      content += `\n`;
    } else {
      content += `No tasks have been added yet.\n\n`;
    }

    content += `---\n\n`;
    content += `*Generated by BI Spec Builder on ${new Date().toLocaleDateString()}*\n`;

    return content;
  };

  if (!project) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Projects
              </button>
              <button
                onClick={() => setShowDeleteDialog(true)}
                className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm font-medium">
                v{project.version_number}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                project.status === 'done' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {project.status.toUpperCase()}
              </span>
              <button
                onClick={markAsDone}
                disabled={project.status === 'done' || saving}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileCheck className="w-4 h-4" />
                Mark as Done
              </button>
              <button
                onClick={() => setShowEnhancementDialog(true)}
                disabled={project.status !== 'done'}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                title={project.status !== 'done' ? 'Project must be marked as Done before creating enhancements' : ''}
              >
                <GitBranch className="w-4 h-4" />
                Create Enhancement
              </button>
              <button
                onClick={exportDocuments}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>

          <div className="mb-4">
            <input
              type="text"
              value={localName}
              onChange={(e) => handleNameChange(e.target.value)}
              className="text-2xl font-bold text-slate-900 bg-transparent border-none outline-none w-full focus:ring-0 px-0"
              placeholder="Dashboard Name"
            />
            <input
              type="text"
              value={localDescription}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              className="text-slate-600 bg-transparent border-none outline-none w-full focus:ring-0 px-0 mt-2"
              placeholder="Brief description of the dashboard"
            />
            <input
              type="text"
              value={localAudience}
              onChange={(e) => handleAudienceChange(e.target.value)}
              className="text-slate-500 text-sm bg-transparent border-none outline-none w-full focus:ring-0 px-0 mt-2"
              placeholder="Target audience"
            />
            {saving && (
              <p className="text-xs text-slate-500 mt-2">Saving...</p>
            )}
          </div>

          <div className="flex gap-2 border-b border-slate-200">
            <button
              onClick={() => setActiveTab('functional')}
              className={`px-4 py-2 font-medium transition ${
                activeTab === 'functional'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Functional Requirements
            </button>
            <button
              onClick={() => setActiveTab('design')}
              className={`px-4 py-2 font-medium transition ${
                activeTab === 'design'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Design Requirements
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`px-4 py-2 font-medium transition ${
                activeTab === 'tasks'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tasks
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 font-medium transition ${
                activeTab === 'history'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Version History
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-full mx-auto px-6 py-8">
        {activeTab === 'functional' && (
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-[calc(100vh-300px)]">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Requirements Chat</h3>
              <RequirementsChat
                projectId={project.id}
                onRequirementsGenerated={(reqs) => setFunctionalReqs(reqs)}
                onProjectUpdate={handleProjectUpdateFromChat}
                onRequirementsUpdated={handleRequirementsUpdated}
              />
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-[calc(100vh-300px)] flex flex-col">
              <DocumentPreview
                key={refreshKey}
                projectId={project.id}
                projectName={localName}
                projectDescription={localDescription}
                projectAudience={localAudience}
                hasAppendix={project.has_appendix_tab}
                hasMetricLogic={project.has_metric_logic_tab}
                onProjectUpdate={updateProject}
              />
            </div>
          </div>
        )}
        {activeTab === 'design' && (
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-[calc(100vh-300px)]">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Design Requirements Chat</h3>
              <DesignRequirementsChat
                projectId={project.id}
                onRequirementsUpdated={handleRequirementsUpdated}
              />
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-[calc(100vh-300px)] flex flex-col">
              <DesignPreview
                key={refreshKey}
                projectId={project.id}
              />
            </div>
          </div>
        )}
        {activeTab === 'tasks' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-[calc(100vh-300px)]">
            <TasksManager projectId={project.id} />
          </div>
        )}
        {activeTab === 'history' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <p className="text-slate-600">Version history - View all changes and previous versions here.</p>
          </div>
        )}
      </div>

      {showEnhancementDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Create Enhancement</h2>
            <p className="text-slate-600 mb-6">
              This will create a new version of the project based on the current specifications.
              You can then modify the requirements to reflect the enhancements.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowEnhancementDialog(false)}
                className="flex-1 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={createEnhancement}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Delete Project</h2>
            <p className="text-slate-600 mb-6">
              Are you sure you want to delete "{localName}"? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteDialog(false)}
                className="flex-1 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={deleteProject}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

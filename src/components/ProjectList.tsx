import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, FileText, Calendar, LogOut, Edit2, Download, Trash2, Clock, Search, Layers, History } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
  version_number: number;
  parent_project_id: string | null;
  created_by: string;
  updated_by: string | null;
}

interface UserProfile {
  id: string;
  email: string;
}

interface ProjectListProps {
  onSelectProject: (projectId: string) => void;
  onCreateProject: (name: string) => void;
  showCreateDialog: boolean;
  onCancelCreate: () => void;
}

export default function ProjectList({ onSelectProject, onCreateProject, showCreateDialog, onCancelCreate }: ProjectListProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [userMap, setUserMap] = useState<Record<string, string>>({});
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'recent' | 'modified'>('all');
  const [newProjectName, setNewProjectName] = useState('');
  const { signOut, user } = useAuth();

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    filterProjects();
  }, [projects, searchQuery, filterTab, user]);

  const loadProjects = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setProjects(data);

      const uniqueUserIds = new Set<string>();
      data.forEach((p) => {
        uniqueUserIds.add(p.created_by);
        if (p.updated_by) uniqueUserIds.add(p.updated_by);
      });

      const { data: usersData } = await supabase
        .rpc('get_user_emails', { user_ids: Array.from(uniqueUserIds) });

      const map: Record<string, string> = {};
      if (usersData) {
        usersData.forEach((u: { id: string; email: string }) => {
          map[u.id] = u.email;
        });
      }

      setUserMap(map);
    }
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    return status === 'done' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
  };

  const handleDownload = async (e: React.MouseEvent, projectId: string, projectName: string) => {
    e.stopPropagation();

    const { data: project } = await supabase.from('projects').select('*').eq('id', projectId).single();
    const { data: funcReqs } = await supabase.from('functional_requirements').select('*').eq('project_id', projectId).maybeSingle();
    const { data: tabs } = await supabase.from('dashboard_tabs').select('*').eq('project_id', projectId).order('order_index');
    const { data: filters } = await supabase.from('filters').select('*').is('tab_id', null);
    const { data: additionalReqs } = await supabase.from('additional_requirements').select('*').eq('project_id', projectId).eq('category', 'functional');

    let content = `# ${projectName}\n\n`;
    if (project) {
      content += `**Description:** ${project.description || 'Not specified'}\n`;
      content += `**Audience:** ${project.audience || 'Not specified'}\n\n`;
    }
    content += `## Functional Requirements\n\n`;
    if (funcReqs) {
      content += `### Data Sources\n`;
      funcReqs.data_sources?.forEach((s: string) => content += `- ${s}\n`);
      content += `\n### Metrics\n`;
      funcReqs.metrics?.forEach((m: string) => content += `- ${m}\n`);
    }
    if (tabs && tabs.length > 0) {
      content += `\n### Dashboard Tabs\n`;
      tabs.forEach((t: any) => content += `- ${t.name}\n`);
    }
    if (additionalReqs && additionalReqs.length > 0) {
      content += `\n### Additional Requirements\n`;
      additionalReqs.forEach((r: any) => content += `- ${r.content}\n`);
    }

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName.replace(/\s+/g, '_')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDelete = async (projectId: string) => {
    await supabase.from('projects').delete().eq('id', projectId);
    setShowDeleteDialog(null);
    loadProjects();
  };

  const filterProjects = () => {
    let filtered = [...projects];

    if (searchQuery) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterTab === 'modified') {
      filtered = filtered.filter(p => p.updated_by === user?.id);
    } else if (filterTab === 'recent') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      filtered = filtered.filter(p => new Date(p.updated_at) >= sevenDaysAgo);
    }

    filtered.sort((a, b) => a.name.localeCompare(b.name));

    setFilteredProjects(filtered);
  };

  const formatLastEdited = (updatedAt: string) => {
    const date = new Date(updatedAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">BI Spec Builder</h1>
            <p className="text-slate-600 mt-2">Manage your dashboard specifications</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">{user?.email}</span>
            <button
              onClick={signOut}
              className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-200 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>

        <button
          onClick={() => onCreateProject('')}
          className="mb-6 flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-sm"
        >
          <Plus className="w-5 h-5" />
          New Dashboard Project
        </button>

        {showCreateDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Create New Project</h2>
              <p className="text-slate-600 mb-4">What would you like to name your dashboard project?</p>
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="Enter project name..."
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newProjectName.trim()) {
                    onCreateProject(newProjectName.trim());
                    setNewProjectName('');
                  } else if (e.key === 'Escape') {
                    onCancelCreate();
                    setNewProjectName('');
                  }
                }}
              />
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    onCancelCreate();
                    setNewProjectName('');
                  }}
                  className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (newProjectName.trim()) {
                      onCreateProject(newProjectName.trim());
                      setNewProjectName('');
                    }
                  }}
                  disabled={!newProjectName.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Project
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects..."
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 placeholder-slate-400"
            />
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-1.5 shadow-sm">
            <div className="grid grid-cols-3 gap-1.5">
              <button
                onClick={() => setFilterTab('all')}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
                  filterTab === 'all'
                    ? 'bg-blue-600 text-white shadow-md scale-105'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Layers className={`w-4 h-4 ${
                  filterTab === 'all' ? 'animate-pulse' : ''
                }`} />
                <span className="hidden sm:inline">All Projects</span>
                <span className="sm:hidden">All</span>
              </button>
              <button
                onClick={() => setFilterTab('modified')}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
                  filterTab === 'modified'
                    ? 'bg-blue-600 text-white shadow-md scale-105'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Edit2 className={`w-4 h-4 ${
                  filterTab === 'modified' ? 'animate-pulse' : ''
                }`} />
                <span className="hidden sm:inline">Last Modified by Me</span>
                <span className="sm:hidden">Modified</span>
              </button>
              <button
                onClick={() => setFilterTab('recent')}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
                  filterTab === 'recent'
                    ? 'bg-blue-600 text-white shadow-md scale-105'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <History className={`w-4 h-4 ${
                  filterTab === 'recent' ? 'animate-pulse' : ''
                }`} />
                <span className="hidden sm:inline">Last 7 Days</span>
                <span className="sm:hidden">7 Days</span>
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredProjects.length === 0 && projects.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">No projects yet</h2>
            <p className="text-slate-600 mb-6">Create your first dashboard project to get started</p>
            <button
              onClick={onCreateProject}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              <Plus className="w-5 h-5" />
              Create Project
            </button>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">No projects found</h2>
            <p className="text-slate-600">Try adjusting your search or filter</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition p-6 border border-slate-200 hover:border-blue-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 cursor-pointer" onClick={() => onSelectProject(project.id)}>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-slate-900">{project.name}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                        {project.status.toUpperCase()}
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                        v{project.version_number}
                      </span>
                    </div>
                    <p className="text-slate-600 mb-3">{project.description || 'No description'}</p>
                    <div className="flex items-center gap-6 text-sm text-slate-500">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>Created {new Date(project.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>Edited {formatLastEdited(project.updated_at)}</span>
                      </div>
                      {project.updated_by && userMap[project.updated_by] && (
                        <div className="flex items-center gap-2">
                          <Edit2 className="w-4 h-4" />
                          <span>{userMap[project.updated_by]}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectProject(project.id);
                      }}
                      className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
                      title="Edit Requirements"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={(e) => handleDownload(e, project.id, project.name)}
                      className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
                      title="Download Documents"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDeleteDialog(project.id);
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Delete Project"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Delete Project</h3>
            <p className="text-slate-600 mb-6">
              Are you sure you want to delete this project? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteDialog(null)}
                className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showDeleteDialog)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
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

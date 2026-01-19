import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Edit2, Check, X, Trash2 } from 'lucide-react';

interface FunctionalReqs {
  data_sources: string[];
  metrics: string[];
}

interface DashboardTab {
  id: string;
  name: string;
  order_index: number;
}

interface Filter {
  id: string;
  name: string;
  data_source: string;
  multi_select: boolean;
  default_value: string;
}

interface Visual {
  id: string;
  name: string;
  type: string;
  description: string;
}

interface AdditionalReq {
  id: string;
  content: string;
}

interface DocumentPreviewProps {
  projectId: string;
  projectName: string;
  projectDescription: string;
  projectAudience: string;
  hasAppendix: boolean;
  hasMetricLogic: boolean;
  onProjectUpdate: (updates: { name?: string; description?: string; audience?: string }) => void;
}

export default function DocumentPreview({
  projectId,
  projectName,
  projectDescription,
  projectAudience,
  hasAppendix,
  hasMetricLogic,
  onProjectUpdate,
}: DocumentPreviewProps) {
  const [functionalReqs, setFunctionalReqs] = useState<FunctionalReqs | null>(null);
  const [tabs, setTabs] = useState<DashboardTab[]>([]);
  const [filters, setFilters] = useState<Filter[]>([]);
  const [visuals, setVisuals] = useState<Visual[]>([]);
  const [additionalReqs, setAdditionalReqs] = useState<AdditionalReq[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editItemValue, setEditItemValue] = useState<string>('');
  const [editingFilter, setEditingFilter] = useState<Filter | null>(null);

  const [localName, setLocalName] = useState(projectName);
  const [localDescription, setLocalDescription] = useState(projectDescription);
  const [localAudience, setLocalAudience] = useState(projectAudience);
  const [localDataSources, setLocalDataSources] = useState('');
  const [localMetrics, setLocalMetrics] = useState('');

  useEffect(() => {
    loadAllRequirements();
  }, [projectId]);

  useEffect(() => {
    setLocalName(projectName);
    setLocalDescription(projectDescription);
    setLocalAudience(projectAudience);
  }, [projectName, projectDescription, projectAudience]);

  useEffect(() => {
    if (functionalReqs) {
      setLocalDataSources(functionalReqs.data_sources?.join(', ') || '');
      setLocalMetrics(functionalReqs.metrics?.join(', ') || '');
    }
  }, [functionalReqs]);

  const loadAllRequirements = async () => {
    setLoading(true);

    const [funcReqs, tabsData, filtersData, visualsData, additionalData] = await Promise.all([
      supabase.from('functional_requirements').select('*').eq('project_id', projectId).maybeSingle(),
      supabase.from('dashboard_tabs').select('*').eq('project_id', projectId).order('order_index'),
      supabase.from('filters').select('*').eq('project_id', projectId).is('tab_id', null),
      supabase.from('visuals').select('*'),
      supabase.from('additional_requirements').select('*').eq('project_id', projectId).eq('category', 'functional'),
    ]);

    if (funcReqs.data) {
      setFunctionalReqs(funcReqs.data);
    }
    if (tabsData.data) {
      setTabs(tabsData.data);
    }
    if (filtersData.data) {
      setFilters(filtersData.data);
    }
    if (visualsData.data) {
      setVisuals(visualsData.data);
    }
    if (additionalData.data) {
      setAdditionalReqs(additionalData.data);
    }

    setLoading(false);
  };

  const handleEdit = () => {
    setIsEditMode(true);
  };

  const handleCancel = () => {
    setIsEditMode(false);
    setLocalName(projectName);
    setLocalDescription(projectDescription);
    setLocalAudience(projectAudience);
    if (functionalReqs) {
      setLocalDataSources(functionalReqs.data_sources?.join(', ') || '');
      setLocalMetrics(functionalReqs.metrics?.join(', ') || '');
    }
  };

  const handleUpdate = async () => {
    await supabase
      .from('projects')
      .update({
        name: localName,
        description: localDescription,
        audience: localAudience,
      })
      .eq('id', projectId);

    onProjectUpdate({
      name: localName,
      description: localDescription,
      audience: localAudience,
    });

    const dataSources = localDataSources.split(',').map(v => v.trim()).filter(v => v);
    const metrics = localMetrics.split(',').map(v => v.trim()).filter(v => v);

    if (functionalReqs) {
      await supabase
        .from('functional_requirements')
        .update({
          data_sources: dataSources,
          metrics: metrics,
        })
        .eq('project_id', projectId);
    } else {
      await supabase
        .from('functional_requirements')
        .insert({
          project_id: projectId,
          data_sources: dataSources,
          metrics: metrics,
        });
    }

    await loadAllRequirements();
    setIsEditMode(false);
  };

  const startEditItem = (itemId: string, currentValue: string) => {
    if (!isEditMode) {
      setEditingItem(itemId);
      setEditItemValue(currentValue);
    }
  };

  const startEditFilter = (filter: Filter) => {
    if (!isEditMode) {
      setEditingItem(filter.id);
      setEditingFilter(filter);
    }
  };

  const cancelEditItem = () => {
    setEditingItem(null);
    setEditItemValue('');
    setEditingFilter(null);
  };

  const saveEditItem = async (itemId: string, type: 'tab' | 'additional' | 'filter') => {
    if (type === 'tab') {
      await supabase
        .from('dashboard_tabs')
        .update({ name: editItemValue })
        .eq('id', itemId);
    } else if (type === 'additional') {
      await supabase
        .from('additional_requirements')
        .update({ content: editItemValue })
        .eq('id', itemId);
    } else if (type === 'filter') {
      if (editingFilter) {
        await supabase
          .from('filters')
          .update({
            name: editingFilter.name,
            data_source: editingFilter.data_source,
            multi_select: editingFilter.multi_select,
            default_value: editingFilter.default_value
          })
          .eq('id', itemId);
      }
    }
    await loadAllRequirements();
    setEditingItem(null);
    setEditItemValue('');
    setEditingFilter(null);
  };

  const deleteItem = async (itemId: string, type: 'tab' | 'additional' | 'filter') => {
    if (type === 'tab') {
      await supabase.from('dashboard_tabs').delete().eq('id', itemId);
    } else if (type === 'additional') {
      await supabase.from('additional_requirements').delete().eq('id', itemId);
    } else if (type === 'filter') {
      await supabase.from('filters').delete().eq('id', itemId);
    }
    await loadAllRequirements();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="inline-block w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
        <h2 className="text-xl font-semibold text-slate-900">Document Preview</h2>
        <div className="flex items-center gap-2">
          {!isEditMode ? (
            <button
              onClick={handleEdit}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Edit2 className="w-4 h-4" />
              Edit
            </button>
          ) : (
            <>
              <button
                onClick={handleCancel}
                className="flex items-center gap-2 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                <Check className="w-4 h-4" />
                Update
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-white p-8 prose prose-slate max-w-none">
        {isEditMode ? (
          <input
            type="text"
            value={localName}
            onChange={(e) => setLocalName(e.target.value)}
            className="w-full px-3 py-2 text-3xl font-bold bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
            placeholder="Dashboard Name"
          />
        ) : (
          <h1 className="text-3xl font-bold text-slate-900 mb-2">{projectName}</h1>
        )}

        <div className="mb-8 p-4 bg-slate-50 rounded-lg border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Overview</h2>
          <div className="mb-2">
            <div className="flex items-start gap-2">
              <strong className="text-slate-700 min-w-fit">Description:</strong>
              {isEditMode ? (
                <textarea
                  value={localDescription}
                  onChange={(e) => setLocalDescription(e.target.value)}
                  className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Brief description of the dashboard"
                  rows={3}
                />
              ) : (
                <span className="text-slate-700 flex-1">{projectDescription || 'Not specified'}</span>
              )}
            </div>
          </div>
          <div className="flex items-start gap-2">
            <strong className="text-slate-700 min-w-fit">Audience:</strong>
            {isEditMode ? (
              <input
                type="text"
                value={localAudience}
                onChange={(e) => setLocalAudience(e.target.value)}
                className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Target audience"
              />
            ) : (
              <span className="text-slate-700 flex-1">{projectAudience || 'Not specified'}</span>
            )}
          </div>
        </div>

        <h2 className="text-2xl font-bold text-slate-900 mb-4 border-b-2 border-slate-200 pb-2">
          Functional Requirements
        </h2>

        {functionalReqs && (
          <>
            <h3 className="text-xl font-semibold text-slate-900 mt-6 mb-3">Data Sources</h3>
            <div className="mb-4">
              {isEditMode ? (
                <input
                  type="text"
                  value={localDataSources}
                  onChange={(e) => setLocalDataSources(e.target.value)}
                  placeholder="Enter comma-separated data sources"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : functionalReqs.data_sources && functionalReqs.data_sources.length > 0 ? (
                <ul className="list-disc pl-6">
                  {functionalReqs.data_sources.map((source: string, idx: number) => (
                    <li key={idx} className="text-slate-700">{source}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-500 italic">No data sources specified</p>
              )}
            </div>

            <h3 className="text-xl font-semibold text-slate-900 mt-6 mb-3">Metrics</h3>
            <div className="mb-4">
              {isEditMode ? (
                <input
                  type="text"
                  value={localMetrics}
                  onChange={(e) => setLocalMetrics(e.target.value)}
                  placeholder="Enter comma-separated metrics"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : functionalReqs.metrics && functionalReqs.metrics.length > 0 ? (
                <ul className="list-disc pl-6">
                  {functionalReqs.metrics.map((metric: string, idx: number) => (
                    <li key={idx} className="text-slate-700">{metric}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-500 italic">No metrics specified</p>
              )}
            </div>
          </>
        )}

        {tabs.length > 0 && (
          <>
            <h3 className="text-xl font-semibold text-slate-900 mt-6 mb-3">Dashboard Tabs</h3>
            <ul className="list-disc pl-6 mb-4">
              {tabs.map((tab) => (
                <li key={tab.id} className="flex items-center gap-2 group">
                  {(isEditMode || editingItem === tab.id) ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="text"
                        value={editingItem === tab.id ? editItemValue : tab.name}
                        onChange={(e) => {
                          if (editingItem === tab.id) {
                            setEditItemValue(e.target.value);
                          }
                        }}
                        className="flex-1 px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus={editingItem === tab.id}
                        disabled={isEditMode && editingItem !== tab.id}
                      />
                      {!isEditMode && editingItem === tab.id && (
                        <>
                          <button onClick={() => saveEditItem(tab.id, 'tab')} className="p-1 text-green-600 hover:bg-green-50 rounded">
                            <Check className="w-4 h-4" />
                          </button>
                          <button onClick={cancelEditItem} className="p-1 text-red-600 hover:bg-red-50 rounded">
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {!isEditMode && (
                        <button
                          onClick={() => deleteItem(tab.id, 'tab')}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-600 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <>
                      <span className="text-slate-700 flex-1">{tab.name}</span>
                      {!isEditMode && (
                        <>
                          <button
                            onClick={() => startEditItem(tab.id, tab.name)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-blue-600 transition-opacity"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => deleteItem(tab.id, 'tab')}
                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-600 transition-opacity"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </>
                      )}
                    </>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}


        <>
          <div className="flex items-center justify-between mt-6 mb-3">
            <h3 className="text-xl font-semibold text-slate-900">Global Filters</h3>
            {isEditMode && (
              <button
                onClick={async () => {
                  const { data } = await supabase
                    .from('filters')
                    .insert({ name: 'New Filter', data_source: '', multi_select: false, default_value: '', tab_id: null, project_id: projectId })
                    .select()
                    .single();
                  if (data) {
                    await loadAllRequirements();
                  }
                }}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition"
              >
                Add Filter
              </button>
            )}
          </div>
          {filters.length > 0 ? (
            <div className="space-y-3 mb-4">
              {filters.map((filter) => (
                <div key={filter.id} className="p-3 bg-slate-50 rounded border border-slate-200 group relative">
                  {editingItem === filter.id && editingFilter ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-slate-700 w-24">Name:</label>
                        <input
                          type="text"
                          value={editingFilter.name}
                          onChange={(e) => setEditingFilter({ ...editingFilter, name: e.target.value })}
                          className="flex-1 px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          autoFocus
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-slate-700 w-24">Source:</label>
                        <input
                          type="text"
                          value={editingFilter.data_source || ''}
                          onChange={(e) => setEditingFilter({ ...editingFilter, data_source: e.target.value })}
                          className="flex-1 px-2 py-1 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-slate-700 w-24">Default:</label>
                        <input
                          type="text"
                          value={editingFilter.default_value || ''}
                          onChange={(e) => setEditingFilter({ ...editingFilter, default_value: e.target.value })}
                          className="flex-1 px-2 py-1 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-slate-700 w-24">Multi-select:</label>
                        <input
                          type="checkbox"
                          checked={editingFilter.multi_select}
                          onChange={(e) => setEditingFilter({ ...editingFilter, multi_select: e.target.checked })}
                          className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => saveEditItem(filter.id, 'filter')} className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700">
                          Save
                        </button>
                        <button onClick={cancelEditItem} className="px-3 py-1 text-sm bg-slate-300 text-slate-700 rounded hover:bg-slate-400">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-slate-900">{filter.name}</p>
                        {!isEditMode && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => startEditFilter(filter)}
                              className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-blue-600 transition-opacity"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteItem(filter.id, 'filter')}
                              className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-600 transition-opacity"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-slate-600">Source: {filter.data_source || 'Not specified'}</p>
                      <p className="text-sm text-slate-600">
                        Multi-select: {filter.multi_select ? 'Yes' : 'No'}
                      </p>
                      {filter.default_value && (
                        <p className="text-sm text-slate-600">Default: {filter.default_value}</p>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-sm mb-4">No filters defined. Click "Add Filter" to create one.</p>
          )}
        </>

        {additionalReqs.length > 0 && (
          <>
            <h3 className="text-xl font-semibold text-slate-900 mt-6 mb-3">Additional Requirements</h3>
            <ul className="list-disc pl-6 mb-4">
              {additionalReqs.map((req) => (
                <li key={req.id} className="flex items-start gap-2 group">
                  {(isEditMode || editingItem === req.id) ? (
                    <div className="flex items-start gap-2 flex-1">
                      <textarea
                        value={editingItem === req.id ? editItemValue : req.content}
                        onChange={(e) => {
                          if (editingItem === req.id) {
                            setEditItemValue(e.target.value);
                          }
                        }}
                        className="flex-1 px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={2}
                        autoFocus={editingItem === req.id}
                        disabled={isEditMode && editingItem !== req.id}
                      />
                      {!isEditMode && editingItem === req.id && (
                        <>
                          <button onClick={() => saveEditItem(req.id, 'additional')} className="p-1 text-green-600 hover:bg-green-50 rounded">
                            <Check className="w-4 h-4" />
                          </button>
                          <button onClick={cancelEditItem} className="p-1 text-red-600 hover:bg-red-50 rounded">
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {!isEditMode && (
                        <button
                          onClick={() => deleteItem(req.id, 'additional')}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-600 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <>
                      <span className="text-slate-700 flex-1">{req.content}</span>
                      {!isEditMode && (
                        <>
                          <button
                            onClick={() => startEditItem(req.id, req.content)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-blue-600 transition-opacity"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => deleteItem(req.id, 'additional')}
                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-600 transition-opacity"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </>
                      )}
                    </>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}

        {hasAppendix && (
          <>
            <h3 className="text-xl font-semibold text-slate-900 mt-6 mb-3">Appendix Tab</h3>
            <p className="text-slate-700">An appendix tab will be included with additional information about the dashboard.</p>
          </>
        )}

        {hasMetricLogic && (
          <>
            <h3 className="text-xl font-semibold text-slate-900 mt-6 mb-3">Metric Logic Tab</h3>
            <p className="text-slate-700">A metric logic tab will be included explaining calculation logic for each metric.</p>
          </>
        )}

        {!functionalReqs && tabs.length === 0 && additionalReqs.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-500 italic">
              No functional requirements captured yet. Use the chat on the left to start gathering requirements.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

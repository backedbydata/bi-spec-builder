import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Edit2, Check, X } from 'lucide-react';

interface DesignRequirements {
  id: string;
  dashboard_size: string;
  color_palette: string[];
  fonts: string[];
  logo_url: string;
  logo_location: string;
  additional_requirements: string;
}

interface DesignPreviewProps {
  projectId: string;
}

export default function DesignPreview({ projectId }: DesignPreviewProps) {
  const [designReqs, setDesignReqs] = useState<DesignRequirements | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  useEffect(() => {
    loadDesignRequirements();
  }, [projectId]);

  const loadDesignRequirements = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('design_requirements')
      .select('*')
      .eq('project_id', projectId)
      .maybeSingle();

    if (!error && data) {
      setDesignReqs(data);
    }
    setLoading(false);
  };

  const handleEdit = () => {
    setIsEditMode(true);
  };

  const handleCancel = () => {
    setIsEditMode(false);
    setEditingField(null);
    setEditValue('');
  };

  const handleUpdate = async () => {
    setIsEditMode(false);
    await loadDesignRequirements();
  };

  const startEditField = (field: string, currentValue: string | string[]) => {
    setEditingField(field);
    if (Array.isArray(currentValue)) {
      setEditValue(currentValue.join(', '));
    } else {
      setEditValue(currentValue || '');
    }
  };

  const saveEditField = async () => {
    if (!designReqs || !editingField) return;

    let updateValue: any = editValue;
    if (editingField === 'color_palette' || editingField === 'fonts') {
      updateValue = editValue.split(',').map(v => v.trim()).filter(v => v);
    }

    await supabase
      .from('design_requirements')
      .update({ [editingField]: updateValue })
      .eq('id', designReqs.id);

    await loadDesignRequirements();
    setEditingField(null);
    setEditValue('');
  };

  const cancelEditField = () => {
    setEditingField(null);
    setEditValue('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="inline-block w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!designReqs) {
    return (
      <div className="p-6 text-center">
        <p className="text-slate-500">No design requirements defined yet. Use the chat to add them.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
        <h2 className="text-xl font-semibold text-slate-900">Design Preview</h2>
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
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Check className="w-4 h-4" />
                Done
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-slate-900">Dashboard Size</h3>
              {isEditMode && editingField !== 'dashboard_size' && (
                <button
                  onClick={() => startEditField('dashboard_size', designReqs.dashboard_size)}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Edit
                </button>
              )}
            </div>
            {editingField === 'dashboard_size' ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="flex-1 px-3 py-2 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                <button onClick={saveEditField} className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                  Save
                </button>
                <button onClick={cancelEditField} className="px-3 py-2 bg-slate-300 text-slate-700 rounded hover:bg-slate-400">
                  Cancel
                </button>
              </div>
            ) : (
              <p className="text-slate-700">{designReqs.dashboard_size || 'Not specified'}</p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-slate-900">Color Palette</h3>
              {isEditMode && editingField !== 'color_palette' && (
                <button
                  onClick={() => startEditField('color_palette', designReqs.color_palette || [])}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Edit
                </button>
              )}
            </div>
            {editingField === 'color_palette' ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  placeholder="Comma-separated colors"
                  className="flex-1 px-3 py-2 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                <button onClick={saveEditField} className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                  Save
                </button>
                <button onClick={cancelEditField} className="px-3 py-2 bg-slate-300 text-slate-700 rounded hover:bg-slate-400">
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {designReqs.color_palette && designReqs.color_palette.length > 0 ? (
                  designReqs.color_palette.map((color, index) => (
                    <span key={index} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm">
                      {color}
                    </span>
                  ))
                ) : (
                  <p className="text-slate-500">Not specified</p>
                )}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-slate-900">Fonts</h3>
              {isEditMode && editingField !== 'fonts' && (
                <button
                  onClick={() => startEditField('fonts', designReqs.fonts || [])}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Edit
                </button>
              )}
            </div>
            {editingField === 'fonts' ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  placeholder="Comma-separated fonts"
                  className="flex-1 px-3 py-2 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                <button onClick={saveEditField} className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                  Save
                </button>
                <button onClick={cancelEditField} className="px-3 py-2 bg-slate-300 text-slate-700 rounded hover:bg-slate-400">
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {designReqs.fonts && designReqs.fonts.length > 0 ? (
                  designReqs.fonts.map((font, index) => (
                    <span key={index} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm">
                      {font}
                    </span>
                  ))
                ) : (
                  <p className="text-slate-500">Not specified</p>
                )}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-slate-900">Logo</h3>
              {isEditMode && editingField !== 'logo_location' && (
                <button
                  onClick={() => startEditField('logo_location', designReqs.logo_location)}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Edit
                </button>
              )}
            </div>
            {editingField === 'logo_location' ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="flex-1 px-3 py-2 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                <button onClick={saveEditField} className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                  Save
                </button>
                <button onClick={cancelEditField} className="px-3 py-2 bg-slate-300 text-slate-700 rounded hover:bg-slate-400">
                  Cancel
                </button>
              </div>
            ) : (
              <p className="text-slate-700">
                {designReqs.logo_location || 'Not specified'}
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-slate-900">Additional Requirements</h3>
              {isEditMode && editingField !== 'additional_requirements' && (
                <button
                  onClick={() => startEditField('additional_requirements', designReqs.additional_requirements)}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Edit
                </button>
              )}
            </div>
            {editingField === 'additional_requirements' ? (
              <div className="flex gap-2">
                <textarea
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  rows={4}
                  className="flex-1 px-3 py-2 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                <div className="flex flex-col gap-2">
                  <button onClick={saveEditField} className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                    Save
                  </button>
                  <button onClick={cancelEditField} className="px-3 py-2 bg-slate-300 text-slate-700 rounded hover:bg-slate-400">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-slate-700 whitespace-pre-wrap">
                {designReqs.additional_requirements || 'Not specified'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

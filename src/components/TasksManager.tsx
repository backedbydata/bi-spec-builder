import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Check, Trash2, GripVertical, Edit2, X } from 'lucide-react';

interface Task {
  id: string;
  description: string;
  order_index: number;
  completed: boolean;
}

interface TasksManagerProps {
  projectId: string;
}

export default function TasksManager({ projectId }: TasksManagerProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskValue, setEditingTaskValue] = useState('');
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  useEffect(() => {
    loadTasks();
  }, [projectId]);

  const loadTasks = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', projectId)
      .order('order_index');

    if (!error && data) {
      setTasks(data);
    }
    setLoading(false);
  };

  const addTask = async () => {
    if (!newTaskDescription.trim()) return;

    const maxOrder = tasks.length > 0 ? Math.max(...tasks.map(t => t.order_index)) : -1;

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        project_id: projectId,
        description: newTaskDescription.trim(),
        order_index: maxOrder + 1,
        completed: false,
      })
      .select()
      .single();

    if (!error && data) {
      setTasks([...tasks, data]);
      setNewTaskDescription('');
    }
  };

  const toggleTaskCompletion = async (taskId: string, completed: boolean) => {
    const { error } = await supabase
      .from('tasks')
      .update({ completed: !completed })
      .eq('id', taskId);

    if (!error) {
      setTasks(tasks.map(t => t.id === taskId ? { ...t, completed: !completed } : t));
    }
  };

  const deleteTask = async (taskId: string) => {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (!error) {
      setTasks(tasks.filter(t => t.id !== taskId));
    }
  };

  const startEditTask = (taskId: string, currentDescription: string) => {
    setEditingTaskId(taskId);
    setEditingTaskValue(currentDescription);
  };

  const saveEditTask = async () => {
    if (!editingTaskId || !editingTaskValue.trim()) return;

    const { error } = await supabase
      .from('tasks')
      .update({ description: editingTaskValue.trim() })
      .eq('id', editingTaskId);

    if (!error) {
      setTasks(tasks.map(t =>
        t.id === editingTaskId ? { ...t, description: editingTaskValue.trim() } : t
      ));
      setEditingTaskId(null);
      setEditingTaskValue('');
    }
  };

  const cancelEditTask = () => {
    setEditingTaskId(null);
    setEditingTaskValue('');
  };

  const handleDragStart = (taskId: string) => {
    setDraggedTaskId(taskId);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (!draggedTaskId) return;

    const draggedIndex = tasks.findIndex(t => t.id === draggedTaskId);
    if (draggedIndex === dropIndex) {
      setDraggedTaskId(null);
      return;
    }

    const newTasks = [...tasks];
    const [draggedTask] = newTasks.splice(draggedIndex, 1);
    newTasks.splice(dropIndex, 0, draggedTask);

    setTasks(newTasks);

    const updates = newTasks.map((task, idx) => ({
      id: task.id,
      order_index: idx
    }));

    for (const update of updates) {
      await supabase
        .from('tasks')
        .update({ order_index: update.order_index })
        .eq('id', update.id);
    }

    setDraggedTaskId(null);
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="inline-block w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const completedCount = tasks.filter(t => t.completed).length;
  const totalCount = tasks.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Project Tasks</h2>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <span className="text-sm text-slate-600 font-medium">
            {completedCount} of {totalCount} completed
          </span>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={newTaskDescription}
            onChange={(e) => setNewTaskDescription(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addTask()}
            placeholder="Add a new task..."
            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={addTask}
            disabled={!newTaskDescription.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Task
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        {tasks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500">No tasks yet. Add your first task above.</p>
          </div>
        ) : (
          tasks.map((task, index) => (
            <div
              key={task.id}
              draggable
              onDragStart={() => handleDragStart(task.id)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              className={`group flex items-center gap-3 p-4 bg-white border rounded-lg hover:shadow-sm transition cursor-move ${
                task.completed ? 'border-slate-200 bg-slate-50' : 'border-slate-300'
              } ${
                draggedTaskId === task.id ? 'opacity-50' : ''
              }`}
            >
              <div className="text-slate-400 group-hover:text-slate-600 transition-colors cursor-grab active:cursor-grabbing">
                <GripVertical className="w-5 h-5" />
              </div>
              <button
                onClick={() => toggleTaskCompletion(task.id, task.completed)}
                className={`w-6 h-6 rounded border-2 flex items-center justify-center transition flex-shrink-0 ${
                  task.completed
                    ? 'bg-blue-600 border-blue-600'
                    : 'border-slate-300 hover:border-blue-600'
                }`}
              >
                {task.completed && <Check className="w-4 h-4 text-white" />}
              </button>
              <div className="flex-1">
                {editingTaskId === task.id ? (
                  <input
                    type="text"
                    value={editingTaskValue}
                    onChange={(e) => setEditingTaskValue(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') saveEditTask();
                      if (e.key === 'Escape') cancelEditTask();
                    }}
                    className="w-full px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                ) : (
                  <p className={`${task.completed ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                    {task.description}
                  </p>
                )}
              </div>
              {editingTaskId === task.id ? (
                <div className="flex gap-1">
                  <button
                    onClick={saveEditTask}
                    className="p-2 text-green-600 hover:bg-green-50 rounded transition"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={cancelEditTask}
                    className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-1">
                  <button
                    onClick={() => startEditTask(task.id, task.description)}
                    className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-blue-600 transition"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-red-600 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

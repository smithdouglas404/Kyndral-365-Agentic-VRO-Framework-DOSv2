/**
 * CUSTOM FIELD MANAGEMENT PAGE
 * Admin interface for defining custom fields for projects, tasks, issues, etc.
 */

import { AdminLayout } from '@/components/AdminLayout';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, ToggleLeft, ToggleRight, Loader2, Settings } from 'lucide-react';

interface CustomField {
  id: string;
  name: string;
  label: string;
  description?: string;
  entity_type: string;
  field_type: string;
  required: boolean;
  options?: string[];
  formula?: string;
  validation?: any;
  default_value?: any;
  is_active: boolean;
  created_at: string;
  /** OpenProject mapping (stamped by the connector; optional until synced). */
  externalCustomFieldId?: string | number | null;
  external_custom_field_id?: string | number | null;
  syncDirection?: string | null;
  sync_direction?: string | null;
}

/** ⚡ chip shown when a field definition is mapped to an OpenProject custom field. */
function OpenProjectFieldSyncChip({ field }: { field: CustomField }) {
  const externalId = field.externalCustomFieldId ?? field.external_custom_field_id;
  if (externalId === undefined || externalId === null || externalId === '') return null;
  const direction = field.syncDirection ?? field.sync_direction;
  return (
    <span
      title={`Mapped to OpenProject custom field ${externalId}${direction ? ` (${direction})` : ''}. Values flow via the connector sync.`}
      className="ml-2 inline-flex items-center gap-1 rounded-full border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-[11px] font-medium text-blue-600 dark:text-blue-300"
    >
      <span aria-hidden="true">⚡</span>
      Synced with OpenProject
      {direction ? <span className="text-blue-500/70">· {direction}</span> : null}
    </span>
  );
}

const ENTITY_TYPES = [
  { value: 'project', label: 'Project' },
  { value: 'task', label: 'Task' },
  { value: 'issue', label: 'Issue' },
  { value: 'risk', label: 'Risk' },
  { value: 'okr', label: 'OKR' },
  { value: 'resource', label: 'Resource' },
];

const FIELD_TYPES = [
  { value: 'text', label: 'Text', icon: '📝' },
  { value: 'number', label: 'Number', icon: '🔢' },
  { value: 'date', label: 'Date', icon: '📅' },
  { value: 'boolean', label: 'Yes/No', icon: '✓' },
  { value: 'select', label: 'Dropdown', icon: '▼' },
  { value: 'multiselect', label: 'Multi-Select', icon: '☑' },
  { value: 'url', label: 'URL', icon: '🔗' },
  { value: 'email', label: 'Email', icon: '📧' },
  { value: 'calculated', label: 'Calculated', icon: '∑' },
];

export default function CustomFieldManagement() {
  const [showModal, setShowModal] = useState(false);
  const [editingField, setEditingField] = useState<CustomField | null>(null);
  const [filterEntity, setFilterEntity] = useState<string>('all');
  const queryClient = useQueryClient();

  const { data: fields = [], isLoading } = useQuery<CustomField[]>({
    queryKey: ['custom-fields', filterEntity],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterEntity !== 'all') {
        params.append('entityType', filterEntity);
      }

      const res = await fetch(`/api/admin/custom-fields?${params}`);
      if (!res.ok) throw new Error('Failed to fetch custom fields');
      const data = await res.json();
      return data.fields || [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (fieldId: string) => {
      const res = await fetch(`/api/admin/custom-fields/${fieldId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete field');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-fields'] });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (fieldId: string) => {
      const res = await fetch(`/api/admin/custom-fields/${fieldId}/toggle`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to toggle field');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-fields'] });
    },
  });

  return (
    <AdminLayout>
      <div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Custom Field Management</h1>
            <p className="text-muted-foreground">Define custom fields for projects, tasks, and more</p>
          </div>

          <button
            onClick={() => {
              setEditingField(null);
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
          >
            <Plus className="w-5 h-5" />
            Add Custom Field
          </button>
        </div>

        {/* Entity Filter */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilterEntity('all')}
            className={`px-4 py-2 rounded-lg ${
              filterEntity === 'all'
                ? 'bg-blue-500 text-white'
                : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200'
            }`}
          >
            All ({fields.length})
          </button>
          {ENTITY_TYPES.map((entity) => (
            <button
              key={entity.value}
              onClick={() => setFilterEntity(entity.value)}
              className={`px-4 py-2 rounded-lg ${
                filterEntity === entity.value
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200'
              }`}
            >
              {entity.label}
            </button>
          ))}
        </div>

        {/* Fields List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : fields.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <Settings className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Custom Fields</h3>
            <p className="text-muted-foreground mb-4">
              Create custom fields to extend your data model
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
            >
              <Plus className="w-4 h-4" />
              Add First Field
            </button>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-lg border overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-700">
                <tr>
                  <th className="text-left p-4 font-semibold">Field Name</th>
                  <th className="text-left p-4 font-semibold">Type</th>
                  <th className="text-left p-4 font-semibold">Entity</th>
                  <th className="text-left p-4 font-semibold">Required</th>
                  <th className="text-left p-4 font-semibold">Status</th>
                  <th className="text-right p-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {fields.map((field) => (
                  <tr key={field.id} className="border-t dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="p-4">
                      <div>
                        <p className="font-medium">
                          {field.label}
                          <OpenProjectFieldSyncChip field={field} />
                        </p>
                        <p className="text-xs text-muted-foreground">{field.name}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 text-sm">
                        {FIELD_TYPES.find(t => t.value === field.field_type)?.icon}{' '}
                        {FIELD_TYPES.find(t => t.value === field.field_type)?.label}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-sm capitalize">{field.entity_type}</span>
                    </td>
                    <td className="p-4">
                      {field.required ? (
                        <span className="inline-block px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded text-xs">
                          Required
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">Optional</span>
                      )}
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => toggleMutation.mutate(field.id)}
                        className="flex items-center gap-2"
                      >
                        {field.is_active ? (
                          <>
                            <ToggleRight className="w-5 h-5 text-green-500" />
                            <span className="text-sm text-green-600">Active</span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="w-5 h-5 text-gray-400" />
                            <span className="text-sm text-gray-500">Inactive</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingField(field);
                            setShowModal(true);
                          }}
                          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-600 rounded"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this custom field?')) {
                              deleteMutation.mutate(field.id);
                            }
                          }}
                          className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {showModal && (
          <CustomFieldModal
            field={editingField}
            onClose={() => {
              setShowModal(false);
              setEditingField(null);
            }}
            onSuccess={() => {
              setShowModal(false);
              setEditingField(null);
              queryClient.invalidateQueries({ queryKey: ['custom-fields'] });
            }}
          />
        )}
      </div>
    </AdminLayout>
  );
}

function CustomFieldModal({ field, onClose, onSuccess }: any) {
  const [formData, setFormData] = useState({
    name: field?.name || '',
    label: field?.label || '',
    description: field?.description || '',
    entityType: field?.entity_type || 'project',
    fieldType: field?.field_type || 'text',
    required: field?.required || false,
    options: field?.options?.join('\n') || '',
    formula: field?.formula || '',
    isActive: field?.is_active ?? true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const url = field ? `/api/admin/custom-fields/${field.id}` : '/api/admin/custom-fields';
      const method = field ? 'PUT' : 'POST';

      const payload = {
        name: formData.name,
        label: formData.label,
        description: formData.description,
        entityType: formData.entityType,
        fieldType: formData.fieldType,
        required: formData.required,
        options: formData.options ? formData.options.split('\n').filter(Boolean) : undefined,
        formula: formData.formula || undefined,
        isActive: formData.isActive,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Operation failed');
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">
          {field ? 'Edit Custom Field' : 'Add New Custom Field'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-red-800 dark:text-red-200 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Field Name (Internal)</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="e.g., customer_priority"
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Label (Display)</label>
              <input
                type="text"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                required
                placeholder="e.g., Customer Priority"
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional description"
              className="w-full px-3 py-2 border rounded-lg"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Entity Type</label>
              <select
                value={formData.entityType}
                onChange={(e) => setFormData({ ...formData, entityType: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                {ENTITY_TYPES.map((entity) => (
                  <option key={entity.value} value={entity.value}>
                    {entity.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Field Type</label>
              <select
                value={formData.fieldType}
                onChange={(e) => setFormData({ ...formData, fieldType: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                {FIELD_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {(formData.fieldType === 'select' || formData.fieldType === 'multiselect') && (
            <div>
              <label className="block text-sm font-medium mb-2">Options (one per line)</label>
              <textarea
                value={formData.options}
                onChange={(e) => setFormData({ ...formData, options: e.target.value })}
                placeholder="Option 1&#10;Option 2&#10;Option 3"
                className="w-full px-3 py-2 border rounded-lg font-mono text-sm"
                rows={5}
              />
            </div>
          )}

          {formData.fieldType === 'calculated' && (
            <div>
              <label className="block text-sm font-medium mb-2">Formula</label>
              <input
                type="text"
                value={formData.formula}
                onChange={(e) => setFormData({ ...formData, formula: e.target.value })}
                placeholder="e.g., budget - actualCost"
                className="w-full px-3 py-2 border rounded-lg font-mono text-sm"
              />
            </div>
          )}

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.required}
                onChange={(e) => setFormData({ ...formData, required: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium">Required field</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium">Active</span>
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg"
            >
              {loading ? 'Saving...' : field ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

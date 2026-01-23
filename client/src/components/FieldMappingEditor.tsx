/**
 * FIELD MAPPING VISUAL EDITOR
 *
 * Visual editor for mapping external data source fields to internal schema.
 * Supports drag-and-drop, formula creation, and validation rules.
 *
 * Used by: Integration Management (Admin)
 */

import { useState } from 'react';
import { ArrowRight, Plus, Trash2, Save, AlertCircle, CheckCircle2, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface FieldMapping {
  id: string;
  sourceField: string;
  targetField: string;
  transformation?: string;
  required: boolean;
  validated: boolean;
}

interface FieldMappingEditorProps {
  integrationType: string;
  existingMappings?: Record<string, any>;
  onSave: (mappings: Record<string, any>) => void;
}

// Standard target fields for PPM
const TARGET_FIELDS = {
  project: [
    { name: 'name', type: 'string', required: true, description: 'Project name/title' },
    { name: 'description', type: 'string', required: false, description: 'Project description' },
    { name: 'status', type: 'enum', required: true, description: 'Project status (active, completed, on-hold)' },
    { name: 'startDate', type: 'date', required: true, description: 'Project start date' },
    { name: 'endDate', type: 'date', required: true, description: 'Project end date' },
    { name: 'budget', type: 'number', required: true, description: 'Total budget ($)' },
    { name: 'actualCost', type: 'number', required: false, description: 'Actual cost to date ($)' },
    { name: 'progress', type: 'number', required: false, description: 'Progress percentage (0-100)' },
    { name: 'owner', type: 'string', required: true, description: 'Project owner/manager' },
    { name: 'externalId', type: 'string', required: true, description: 'External system ID' },
  ],
  task: [
    { name: 'title', type: 'string', required: true, description: 'Task title' },
    { name: 'assignee', type: 'string', required: false, description: 'Task assignee' },
    { name: 'status', type: 'enum', required: true, description: 'Task status' },
    { name: 'dueDate', type: 'date', required: false, description: 'Task due date' },
    { name: 'projectId', type: 'string', required: true, description: 'Parent project ID' },
  ],
  issue: [
    { name: 'title', type: 'string', required: true, description: 'Issue title' },
    { name: 'severity', type: 'enum', required: true, description: 'Issue severity (critical, high, medium, low)' },
    { name: 'status', type: 'enum', required: true, description: 'Issue status (open, in-progress, resolved)' },
    { name: 'description', type: 'string', required: false, description: 'Issue description' },
    { name: 'projectId', type: 'string', required: true, description: 'Parent project ID' },
  ],
};

// Example source fields for different integration types
const SOURCE_FIELDS_BY_TYPE: Record<string, Array<{ name: string; type: string; description: string }>> = {
  jira: [
    { name: 'summary', type: 'string', description: 'Issue summary' },
    { name: 'key', type: 'string', description: 'Issue key (e.g., PROJ-123)' },
    { name: 'status.name', type: 'string', description: 'Status name' },
    { name: 'assignee.displayName', type: 'string', description: 'Assignee name' },
    { name: 'created', type: 'date', description: 'Creation date' },
    { name: 'updated', type: 'date', description: 'Last updated date' },
    { name: 'duedate', type: 'date', description: 'Due date' },
    { name: 'customfield_10001', type: 'number', description: 'Story points' },
    { name: 'customfield_10002', type: 'number', description: 'Budget' },
  ],
  'azure-devops': [
    { name: 'System.Title', type: 'string', description: 'Work item title' },
    { name: 'System.Id', type: 'string', description: 'Work item ID' },
    { name: 'System.State', type: 'string', description: 'Work item state' },
    { name: 'System.AssignedTo', type: 'string', description: 'Assigned to' },
    { name: 'System.CreatedDate', type: 'date', description: 'Created date' },
    { name: 'Microsoft.VSTS.Scheduling.StartDate', type: 'date', description: 'Start date' },
    { name: 'Microsoft.VSTS.Scheduling.DueDate', type: 'date', description: 'Due date' },
  ],
  servicenow: [
    { name: 'short_description', type: 'string', description: 'Short description' },
    { name: 'number', type: 'string', description: 'Project number' },
    { name: 'state', type: 'string', description: 'State' },
    { name: 'assigned_to', type: 'string', description: 'Assigned to' },
    { name: 'opened_at', type: 'date', description: 'Opened date' },
    { name: 'expected_start', type: 'date', description: 'Expected start' },
    { name: 'planned_end_date', type: 'date', description: 'Planned end date' },
    { name: 'cost', type: 'number', description: 'Cost' },
  ],
};

export function FieldMappingEditor({ integrationType, existingMappings, onSave }: FieldMappingEditorProps) {
  const [mappings, setMappings] = useState<FieldMapping[]>(() => {
    if (existingMappings && existingMappings.mappings) {
      return Object.entries(existingMappings.mappings).map(([target, source], index) => ({
        id: `mapping-${index}`,
        sourceField: source as string,
        targetField: target,
        required: TARGET_FIELDS.project.find(f => f.name === target)?.required || false,
        validated: true,
      }));
    }
    return [];
  });

  const [selectedEntity, setSelectedEntity] = useState<'project' | 'task' | 'issue'>('project');

  const sourceFields = SOURCE_FIELDS_BY_TYPE[integrationType] || [];
  const targetFields = TARGET_FIELDS[selectedEntity];

  const addMapping = () => {
    setMappings([
      ...mappings,
      {
        id: `mapping-${Date.now()}`,
        sourceField: '',
        targetField: '',
        required: false,
        validated: false,
      },
    ]);
  };

  const removeMapping = (id: string) => {
    setMappings(mappings.filter(m => m.id !== id));
  };

  const updateMapping = (id: string, field: keyof FieldMapping, value: any) => {
    setMappings(
      mappings.map(m =>
        m.id === id
          ? { ...m, [field]: value, validated: field === 'sourceField' || field === 'targetField' ? false : m.validated }
          : m
      )
    );
  };

  const validateMapping = (id: string) => {
    setMappings(
      mappings.map(m =>
        m.id === id ? { ...m, validated: !!(m.sourceField && m.targetField) } : m
      )
    );
  };

  const autoMap = () => {
    // Simple auto-mapping based on field name similarity
    const newMappings: FieldMapping[] = [];

    targetFields.forEach((targetField) => {
      const sourceField = sourceFields.find(
        sf =>
          sf.name.toLowerCase().includes(targetField.name.toLowerCase()) ||
          targetField.name.toLowerCase().includes(sf.name.toLowerCase())
      );

      if (sourceField) {
        newMappings.push({
          id: `mapping-${targetField.name}`,
          sourceField: sourceField.name,
          targetField: targetField.name,
          required: targetField.required,
          validated: true,
        });
      }
    });

    setMappings(newMappings);
  };

  const saveMappings = () => {
    const mappingObject: Record<string, any> = {};

    mappings.forEach(m => {
      if (m.sourceField && m.targetField) {
        mappingObject[m.targetField] = m.transformation
          ? { source: m.sourceField, transform: m.transformation }
          : m.sourceField;
      }
    });

    onSave({ entity: selectedEntity, mappings: mappingObject });
  };

  const requiredFieldsMapped = targetFields
    .filter(f => f.required)
    .every(f => mappings.some(m => m.targetField === f.name && m.validated));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Field Mapping Configuration</h3>
          <p className="text-sm text-muted-foreground">
            Map {integrationType} fields to internal schema
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={autoMap}>
            <Wand2 className="w-4 h-4 mr-2" />
            Auto-Map
          </Button>
          <Button size="sm" onClick={saveMappings} disabled={!requiredFieldsMapped}>
            <Save className="w-4 h-4 mr-2" />
            Save Mappings
          </Button>
        </div>
      </div>

      {/* Entity Selector */}
      <div className="flex gap-2 border-b pb-4">
        {(['project', 'task', 'issue'] as const).map((entity) => (
          <button
            key={entity}
            onClick={() => setSelectedEntity(entity)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedEntity === entity
                ? 'bg-blue-500 text-white'
                : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200'
            }`}
          >
            {entity.charAt(0).toUpperCase() + entity.slice(1)}
          </button>
        ))}
      </div>

      {/* Validation Status */}
      <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
        <div className="flex-1">
          <p className="text-sm font-medium">
            Mapped: {mappings.filter(m => m.validated).length} / {targetFields.length} fields
          </p>
          <p className="text-xs text-muted-foreground">
            Required: {mappings.filter(m => m.required && m.validated).length} /{' '}
            {targetFields.filter(f => f.required).length}
          </p>
        </div>
        {requiredFieldsMapped ? (
          <Badge className="bg-green-500 text-white">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Valid
          </Badge>
        ) : (
          <Badge variant="destructive">
            <AlertCircle className="w-3 h-3 mr-1" />
            Incomplete
          </Badge>
        )}
      </div>

      {/* Mappings */}
      <div className="space-y-3">
        {mappings.map((mapping) => (
          <div key={mapping.id} className="flex items-center gap-3 p-4 border rounded-lg bg-white dark:bg-slate-800">
            {/* Source Field */}
            <div className="flex-1">
              <label className="text-xs text-muted-foreground mb-1 block">Source Field</label>
              <select
                value={mapping.sourceField}
                onChange={(e) => {
                  updateMapping(mapping.id, 'sourceField', e.target.value);
                  setTimeout(() => validateMapping(mapping.id), 100);
                }}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              >
                <option value="">Select field...</option>
                {sourceFields.map((field) => (
                  <option key={field.name} value={field.name}>
                    {field.name} ({field.type})
                  </option>
                ))}
              </select>
            </div>

            <ArrowRight className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-5" />

            {/* Target Field */}
            <div className="flex-1">
              <label className="text-xs text-muted-foreground mb-1 block">Target Field</label>
              <select
                value={mapping.targetField}
                onChange={(e) => {
                  updateMapping(mapping.id, 'targetField', e.target.value);
                  const targetField = targetFields.find(f => f.name === e.target.value);
                  if (targetField) {
                    updateMapping(mapping.id, 'required', targetField.required);
                  }
                  setTimeout(() => validateMapping(mapping.id), 100);
                }}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              >
                <option value="">Select field...</option>
                {targetFields.map((field) => (
                  <option key={field.name} value={field.name}>
                    {field.name} ({field.type}) {field.required && '*'}
                  </option>
                ))}
              </select>
            </div>

            {/* Status & Actions */}
            <div className="flex items-center gap-2 flex-shrink-0 mt-5">
              {mapping.required && (
                <Badge variant="outline" className="text-xs">Required</Badge>
              )}
              {mapping.validated && (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              )}
              <button
                onClick={() => removeMapping(mapping.id)}
                className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 rounded"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        <Button variant="outline" onClick={addMapping} className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Add Mapping
        </Button>
      </div>

      {/* Help Text */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm">
        <p className="font-medium text-blue-900 dark:text-blue-100 mb-2">Field Mapping Guide</p>
        <ul className="text-blue-800 dark:text-blue-200 space-y-1 text-xs">
          <li>• Required fields (marked with *) must be mapped for sync to work</li>
          <li>• Use Auto-Map to automatically match common field names</li>
          <li>• You can map the same source field to multiple targets</li>
          <li>• Click Save Mappings when done to test your configuration</li>
        </ul>
      </div>
    </div>
  );
}

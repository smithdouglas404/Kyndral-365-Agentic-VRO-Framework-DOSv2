/**
 * RULE EDITOR BASE
 *
 * Base component and types for rule editors.
 * Provides shared functionality for FinOps, TMO, Risk, VRO, PMO, OCM, and Governance rule editors.
 */

import { useState, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Save, Trash2, Plus, Play } from 'lucide-react';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface AttributeDefinition {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'enum';
  description?: string;
  required?: boolean;
  enumValues?: string[];
  defaultValue?: unknown;
}

export interface ActionDefinition {
  id: string;
  name: string;
  description?: string;
  parameters?: AttributeDefinition[];
  isAutonomous?: boolean;
}

export interface RuleCondition {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'in' | 'not_in';
  value: unknown;
}

export interface Rule {
  id: string;
  name: string;
  description?: string;
  agentId: string;
  conditions: RuleCondition[];
  actions: Array<{
    actionId: string;
    parameters?: Record<string, unknown>;
  }>;
  priority: number;
  enabled: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// ============================================================================
// RULE EDITOR BASE COMPONENT
// ============================================================================

interface RuleEditorBaseProps {
  title: string;
  description?: string;
  attributes: AttributeDefinition[];
  actions: ActionDefinition[];
  rules: Rule[];
  onSaveRule: (rule: Rule) => Promise<void>;
  onDeleteRule: (ruleId: string) => Promise<void>;
  onTestRule?: (rule: Rule) => Promise<{ passed: boolean; message: string }>;
  children?: ReactNode;
}

export function RuleEditorBase({
  title,
  description,
  attributes,
  actions,
  rules,
  onSaveRule,
  onDeleteRule,
  onTestRule,
  children,
}: RuleEditorBaseProps) {
  const [selectedRule, setSelectedRule] = useState<Rule | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!selectedRule) return;
    setIsSaving(true);
    try {
      await onSaveRule(selectedRule);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    if (!selectedRule || !onTestRule) return;
    const result = await onTestRule(selectedRule);
    alert(result.message);
  };

  const handleDelete = async () => {
    if (!selectedRule) return;
    if (!confirm(`Delete rule "${selectedRule.name}"?`)) return;
    await onDeleteRule(selectedRule.id);
    setSelectedRule(null);
  };

  const createNewRule = (): Rule => ({
    id: `rule-${Date.now()}`,
    name: 'New Rule',
    description: '',
    agentId: '',
    conditions: [],
    actions: [],
    priority: 50,
    enabled: true,
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{title}</span>
            <Button
              onClick={() => {
                setSelectedRule(createNewRule());
                setIsEditing(true);
              }}
              size="sm"
            >
              <Plus className="w-4 h-4 mr-1" />
              New Rule
            </Button>
          </CardTitle>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Rules List */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Rules ({rules.length})</h4>
              <div className="space-y-1">
                {rules.map((rule) => (
                  <div
                    key={rule.id}
                    onClick={() => {
                      setSelectedRule(rule);
                      setIsEditing(false);
                    }}
                    className={`p-2 rounded cursor-pointer border ${
                      selectedRule?.id === rule.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate">{rule.name}</span>
                      <Badge variant={rule.enabled ? 'default' : 'secondary'}>
                        {rule.enabled ? 'Active' : 'Disabled'}
                      </Badge>
                    </div>
                  </div>
                ))}
                {rules.length === 0 && (
                  <p className="text-sm text-gray-500 p-2">No rules defined</p>
                )}
              </div>
            </div>

            {/* Rule Editor */}
            <div className="md:col-span-2">
              {selectedRule ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Input
                      value={selectedRule.name}
                      onChange={(e) =>
                        setSelectedRule({ ...selectedRule, name: e.target.value })
                      }
                      disabled={!isEditing}
                      className="text-lg font-medium"
                      placeholder="Rule name"
                    />
                    <div className="flex gap-2">
                      {!isEditing ? (
                        <Button onClick={() => setIsEditing(true)} size="sm">
                          Edit
                        </Button>
                      ) : (
                        <>
                          <Button onClick={handleSave} disabled={isSaving} size="sm">
                            <Save className="w-4 h-4 mr-1" />
                            Save
                          </Button>
                          <Button
                            onClick={() => setIsEditing(false)}
                            variant="outline"
                            size="sm"
                          >
                            Cancel
                          </Button>
                        </>
                      )}
                      {onTestRule && (
                        <Button onClick={handleTest} variant="outline" size="sm">
                          <Play className="w-4 h-4 mr-1" />
                          Test
                        </Button>
                      )}
                      <Button onClick={handleDelete} variant="destructive" size="sm">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Description</label>
                    <Input
                      value={selectedRule.description || ''}
                      onChange={(e) =>
                        setSelectedRule({ ...selectedRule, description: e.target.value })
                      }
                      disabled={!isEditing}
                      placeholder="Rule description"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Priority</label>
                      <Input
                        type="number"
                        value={selectedRule.priority}
                        onChange={(e) =>
                          setSelectedRule({
                            ...selectedRule,
                            priority: parseInt(e.target.value) || 50,
                          })
                        }
                        disabled={!isEditing}
                        min={1}
                        max={100}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Status</label>
                      <Select
                        value={selectedRule.enabled ? 'enabled' : 'disabled'}
                        onValueChange={(value) =>
                          setSelectedRule({
                            ...selectedRule,
                            enabled: value === 'enabled',
                          })
                        }
                        disabled={!isEditing}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="enabled">Enabled</SelectItem>
                          <SelectItem value="disabled">Disabled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Conditions Section */}
                  <div>
                    <h4 className="font-medium text-sm mb-2">
                      Conditions ({selectedRule.conditions.length})
                    </h4>
                    <div className="space-y-2">
                      {selectedRule.conditions.map((condition, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 p-2 bg-gray-50 rounded"
                        >
                          <span className="text-sm">
                            {condition.field} {condition.operator} {String(condition.value)}
                          </span>
                        </div>
                      ))}
                      {isEditing && (
                        <Button
                          onClick={() =>
                            setSelectedRule({
                              ...selectedRule,
                              conditions: [
                                ...selectedRule.conditions,
                                { field: '', operator: 'eq', value: '' },
                              ],
                            })
                          }
                          variant="outline"
                          size="sm"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add Condition
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Actions Section */}
                  <div>
                    <h4 className="font-medium text-sm mb-2">
                      Actions ({selectedRule.actions.length})
                    </h4>
                    <div className="space-y-2">
                      {selectedRule.actions.map((action, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 p-2 bg-gray-50 rounded"
                        >
                          <span className="text-sm">{action.actionId}</span>
                        </div>
                      ))}
                      {isEditing && (
                        <Button
                          onClick={() =>
                            setSelectedRule({
                              ...selectedRule,
                              actions: [
                                ...selectedRule.actions,
                                { actionId: '' },
                              ],
                            })
                          }
                          variant="outline"
                          size="sm"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add Action
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  Select a rule or create a new one
                </div>
              )}
            </div>
          </div>

          {/* Custom content from child editors */}
          {children}
        </CardContent>
      </Card>
    </div>
  );
}

export default RuleEditorBase;

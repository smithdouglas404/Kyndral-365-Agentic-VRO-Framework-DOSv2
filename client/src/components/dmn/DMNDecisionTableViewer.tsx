import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Table, Zap, GitBranch, CheckCircle2, AlertTriangle,
  Download, ExternalLink, FileCode, Info, ArrowRight, Search, Filter, Printer
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { DMNSimulator } from './DMNSimulator';
import { DMNVersionHistory } from './DMNVersionHistory';

interface DmnInput {
  id: string;
  label: string;
  expression: string;
  typeRef?: string;
}

interface DmnOutput {
  id: string;
  label: string;
  name: string;
  typeRef?: string;
}

interface DmnRule {
  id: string;
  inputEntries: Array<{
    id: string;
    text: string;
  }>;
  outputEntries: Array<{
    id: string;
    text: string;
  }>;
  description?: string;
}

interface DmnDecisionTable {
  id: string;
  name: string;
  hitPolicy: string;
  inputs: DmnInput[];
  outputs: DmnOutput[];
  rules: DmnRule[];
  description?: string;
}

interface ParsedDmn {
  name: string;
  id: string;
  namespace: string;
  decisionTables: DmnDecisionTable[];
}

interface DMNDecisionTableViewerProps {
  decisionKey: string;
  className?: string;
}

const HIT_POLICY_DESCRIPTIONS: Record<string, string> = {
  FIRST: 'Returns the output of the first rule that matches',
  UNIQUE: 'Only one rule can match (enforced)',
  PRIORITY: 'Multiple rules can match, highest priority wins',
  ANY: 'Multiple rules can match, all must agree',
  COLLECT: 'Returns outputs of all matching rules',
  'RULE ORDER': 'Returns rules in order they are defined',
  'OUTPUT ORDER': 'Returns rules in order of output values',
};

const TYPE_ICONS: Record<string, string> = {
  string: '📝',
  number: '🔢',
  boolean: '✓/✗',
  date: '📅',
  integer: '🔢',
};

export function DMNDecisionTableViewer({
  decisionKey,
  className,
}: DMNDecisionTableViewerProps) {
  const [selectedTable, setSelectedTable] = useState<number>(0);
  const [highlightedRule, setHighlightedRule] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showFilters, setShowFilters] = useState<boolean>(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['dmn-decision', decisionKey],
    queryFn: async () => {
      const response = await fetch(`/api/admin/camunda/dmn/${decisionKey}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch DMN decision table');
      }

      const result = await response.json();
      return result.dmn as ParsedDmn;
    },
  });

  const downloadXml = async () => {
    try {
      const response = await fetch(`/api/admin/camunda/dmn/${decisionKey}/xml`, {
        credentials: 'include',
      });

      const xml = await response.text();
      const blob = new Blob([xml], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${decisionKey}.dmn`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download DMN XML:', error);
    }
  };

  const downloadMarkdown = async () => {
    try {
      const response = await fetch(`/api/admin/camunda/dmn/${decisionKey}?format=markdown`, {
        credentials: 'include',
      });

      const markdown = await response.text();
      const blob = new Blob([markdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${decisionKey}.md`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download Markdown:', error);
    }
  };

  const exportToPDF = () => {
    // Create a print-friendly view and trigger browser print dialog
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to export PDF');
      return;
    }

    const decisionTable = data?.decisionTables[selectedTable];
    if (!decisionTable) return;

    // Generate HTML for PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${data.name} - Decision Table</title>
          <style>
            @page {
              size: A4 landscape;
              margin: 20mm;
            }
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
            }
            h1 {
              color: #4f46e5;
              border-bottom: 3px solid #4f46e5;
              padding-bottom: 10px;
              margin-bottom: 20px;
            }
            h2 {
              color: #6366f1;
              margin-top: 20px;
              margin-bottom: 10px;
            }
            .metadata {
              background: #f3f4f6;
              padding: 15px;
              border-radius: 8px;
              margin-bottom: 20px;
            }
            .metadata p {
              margin: 5px 0;
              font-size: 14px;
            }
            .badge {
              display: inline-block;
              background: #4f46e5;
              color: white;
              padding: 4px 12px;
              border-radius: 4px;
              font-size: 12px;
              font-weight: bold;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
              font-size: 12px;
            }
            th {
              background: #e0e7ff;
              color: #3730a3;
              padding: 12px;
              text-align: left;
              border: 1px solid #c7d2fe;
              font-weight: bold;
            }
            th.input {
              background: #dbeafe;
              color: #1e3a8a;
              border-color: #93c5fd;
            }
            th.output {
              background: #d1fae5;
              color: #065f46;
              border-color: #6ee7b7;
            }
            td {
              padding: 10px 12px;
              border: 1px solid #d1d5db;
            }
            tr:nth-child(even) {
              background: #f9fafb;
            }
            tr:hover {
              background: #fef3c7;
            }
            .rule-number {
              font-weight: bold;
              color: #6366f1;
              margin-right: 8px;
            }
            .type-icon {
              font-size: 10px;
              color: #6b7280;
              margin-left: 4px;
            }
            .description {
              margin-top: 20px;
              padding: 15px;
              background: #eff6ff;
              border-left: 4px solid #3b82f6;
              border-radius: 4px;
            }
            .description h3 {
              margin-top: 0;
              color: #1e40af;
            }
            .description-item {
              margin: 10px 0;
              padding: 8px;
              background: white;
              border-radius: 4px;
            }
            .footer {
              margin-top: 30px;
              padding-top: 15px;
              border-top: 2px solid #e5e7eb;
              text-align: center;
              font-size: 11px;
              color: #6b7280;
            }
            @media print {
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <h1>${data.name}</h1>

          <div class="metadata">
            <p><strong>Decision Table:</strong> ${decisionTable.name}</p>
            <p><strong>Hit Policy:</strong> <span class="badge">${decisionTable.hitPolicy}</span></p>
            <p><strong>Description:</strong> ${decisionTable.description || 'N/A'}</p>
            <p><strong>Inputs:</strong> ${decisionTable.inputs.length} | <strong>Outputs:</strong> ${decisionTable.outputs.length} | <strong>Rules:</strong> ${decisionTable.rules.length}</p>
            <p><strong>Exported:</strong> ${new Date().toLocaleString()}</p>
          </div>

          <h2>Decision Rules</h2>
          <table>
            <thead>
              <tr>
                ${decisionTable.inputs.map((input) => `
                  <th class="input">
                    ${input.label}
                    <span class="type-icon">(${input.typeRef || 'string'})</span>
                    <br>
                    <small style="font-weight: normal; opacity: 0.8;">${input.expression}</small>
                  </th>
                `).join('')}
                ${decisionTable.outputs.map((output) => `
                  <th class="output">
                    ${output.label}
                    <span class="type-icon">(${output.typeRef || 'string'})</span>
                    <br>
                    <small style="font-weight: normal; opacity: 0.8;">${output.name}</small>
                  </th>
                `).join('')}
              </tr>
            </thead>
            <tbody>
              ${decisionTable.rules.map((rule, index) => `
                <tr>
                  ${rule.inputEntries.map((entry, entryIndex) => `
                    <td>
                      ${entryIndex === 0 ? `<span class="rule-number">#${index + 1}</span>` : ''}
                      ${entry.text}
                    </td>
                  `).join('')}
                  ${rule.outputEntries.map((entry) => `
                    <td style="background: #f0fdf4; font-weight: 600;">
                      ${entry.text}
                    </td>
                  `).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>

          ${decisionTable.rules.some((r) => r.description) ? `
            <div class="description">
              <h3>Rule Descriptions</h3>
              ${decisionTable.rules.map((rule, index) =>
                rule.description ? `
                  <div class="description-item">
                    <span class="rule-number">#${index + 1}</span>
                    ${rule.description}
                  </div>
                ` : ''
              ).join('')}
            </div>
          ` : ''}

          <div class="footer">
            <p>Generated from ${data.name} | Camunda DMN Decision Table</p>
            <p>Exported on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
          </div>

          <div class="no-print" style="margin-top: 30px; text-align: center;">
            <button onclick="window.print()" style="padding: 12px 24px; background: #4f46e5; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;">
              Print / Save as PDF
            </button>
            <button onclick="window.close()" style="padding: 12px 24px; background: #6b7280; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; margin-left: 10px;">
              Close
            </button>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  if (isLoading) {
    return (
      <div className={className}>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={className}>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-red-700">
              <AlertTriangle size={24} />
              <div>
                <p className="font-medium">Failed to load DMN decision table</p>
                <p className="text-sm">{error instanceof Error ? error.message : 'Unknown error'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const decisionTable = data.decisionTables[selectedTable];

  if (!decisionTable) {
    return (
      <div className={className}>
        <Card>
          <CardContent className="pt-6">
            <p className="text-gray-500">No decision tables found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Filter rules based on search query
  const filteredRules = useMemo(() => {
    if (!searchQuery.trim()) {
      return decisionTable.rules;
    }

    const query = searchQuery.toLowerCase();
    return decisionTable.rules.filter((rule) => {
      // Search in rule description
      if (rule.description?.toLowerCase().includes(query)) {
        return true;
      }

      // Search in input entries
      const inputMatch = rule.inputEntries.some((entry) =>
        entry.text.toLowerCase().includes(query)
      );
      if (inputMatch) return true;

      // Search in output entries
      const outputMatch = rule.outputEntries.some((entry) =>
        entry.text.toLowerCase().includes(query)
      );
      if (outputMatch) return true;

      return false;
    });
  }, [decisionTable.rules, searchQuery]);

  return (
    <div className={className}>
      {/* Header */}
      <Card className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Table size={28} />
                <h2 className="text-2xl font-bold">{data.name}</h2>
              </div>
              <p className="text-white/80 text-sm">
                Camunda DMN Decision Table Viewer
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={downloadMarkdown}
                className="bg-white/20 text-white border-white/30 hover:bg-white/30"
              >
                <Download size={16} className="mr-1" />
                Markdown
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadXml}
                className="bg-white/20 text-white border-white/30 hover:bg-white/30"
              >
                <FileCode size={16} className="mr-1" />
                XML
              </Button>
              <Button
                variant="outline"
                size="sm"
                asChild
                className="bg-white/20 text-white border-white/30 hover:bg-white/30"
              >
                <a
                  href="https://modeler.cloud.camunda.io"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink size={16} className="mr-1" />
                  Edit in Modeler
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table Selector (if multiple tables) */}
      {data.decisionTables.length > 1 && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <Tabs value={selectedTable.toString()} onValueChange={(v) => setSelectedTable(parseInt(v))}>
              <TabsList>
                {data.decisionTables.map((table, index) => (
                  <TabsTrigger key={index} value={index.toString()}>
                    {table.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Decision Table Info */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <GitBranch size={20} />
              {decisionTable.name}
            </CardTitle>
            <Badge variant="outline" className="text-lg px-3 py-1">
              Hit Policy: {decisionTable.hitPolicy}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {decisionTable.description && (
            <div className="flex items-start gap-2 mb-4 p-4 bg-blue-50 rounded-lg">
              <Info size={20} className="text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm text-gray-700">{decisionTable.description}</p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-2 p-4 bg-gray-50 rounded-lg">
            <Zap size={20} className="text-amber-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-900 mb-1">
                {HIT_POLICY_DESCRIPTIONS[decisionTable.hitPolicy] || 'Custom hit policy'}
              </p>
              <p className="text-xs text-gray-600">
                {decisionTable.inputs.length} input(s) → {decisionTable.outputs.length} output(s) → {decisionTable.rules.length} rule(s)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Decision Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Table size={20} />
              Decision Rules
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? 'bg-blue-50 border-blue-300' : ''}
            >
              <Filter size={16} className="mr-1" />
              {showFilters ? 'Hide Search' : 'Search & Filter'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search Bar */}
          {showFilters && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-3">
                <Search size={20} className="text-blue-600" />
                <Input
                  type="text"
                  placeholder="Search in rules, inputs, outputs, or descriptions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 border-blue-300 focus:border-blue-500 focus:ring-blue-500"
                />
                {searchQuery && (
                  <Badge variant="default" className="bg-blue-600">
                    {filteredRules.length} / {decisionTable.rules.length} rules
                  </Badge>
                )}
              </div>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              {/* Header Row */}
              <thead>
                <tr>
                  {/* Input Columns */}
                  {decisionTable.inputs.map((input) => (
                    <th
                      key={input.id}
                      className="border border-gray-300 bg-blue-50 px-4 py-3 text-left"
                    >
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold text-sm text-blue-900">
                          {input.label}
                        </span>
                        <span className="text-xs text-blue-600 font-mono">
                          {TYPE_ICONS[input.typeRef || 'string']} {input.expression}
                        </span>
                      </div>
                    </th>
                  ))}

                  {/* Output Columns */}
                  {decisionTable.outputs.map((output) => (
                    <th
                      key={output.id}
                      className="border border-gray-300 bg-green-50 px-4 py-3 text-left"
                    >
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold text-sm text-green-900">
                          {output.label}
                        </span>
                        <span className="text-xs text-green-600 font-mono">
                          {TYPE_ICONS[output.typeRef || 'string']} {output.name}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Rule Rows */}
              <tbody>
                <AnimatePresence>
                  {filteredRules.length === 0 && searchQuery && (
                    <tr>
                      <td colSpan={decisionTable.inputs.length + decisionTable.outputs.length} className="text-center py-8 text-gray-500">
                        <div className="flex flex-col items-center gap-2">
                          <Search size={32} className="text-gray-400" />
                          <p>No rules match your search query</p>
                          <Button
                            variant="link"
                            size="sm"
                            onClick={() => setSearchQuery('')}
                            className="text-blue-600"
                          >
                            Clear search
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )}
                  {filteredRules.map((rule, ruleIndex) => (
                    <motion.tr
                      key={rule.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: ruleIndex * 0.05 }}
                      onMouseEnter={() => setHighlightedRule(rule.id)}
                      onMouseLeave={() => setHighlightedRule(null)}
                      className={`transition-colors ${
                        highlightedRule === rule.id
                          ? 'bg-yellow-50'
                          : ruleIndex % 2 === 0
                          ? 'bg-white'
                          : 'bg-gray-50'
                      }`}
                    >
                      {/* Input Entries */}
                      {rule.inputEntries.map((entry, entryIndex) => (
                        <td
                          key={entry.id}
                          className="border border-gray-300 px-4 py-3"
                        >
                          <div className="flex items-center gap-2">
                            {entryIndex === 0 && (
                              <Badge
                                variant="outline"
                                className="text-xs shrink-0"
                              >
                                #{ruleIndex + 1}
                              </Badge>
                            )}
                            <span className="font-mono text-sm">{entry.text}</span>
                          </div>
                        </td>
                      ))}

                      {/* Output Entries */}
                      {rule.outputEntries.map((entry, entryIndex) => (
                        <td
                          key={entry.id}
                          className="border border-gray-300 px-4 py-3 bg-green-50/30"
                        >
                          <div className="flex items-center gap-2">
                            {entryIndex === 0 && (
                              <ArrowRight size={14} className="text-green-600 shrink-0" />
                            )}
                            <span className="font-mono text-sm font-semibold text-green-800">
                              {entry.text}
                            </span>
                          </div>
                        </td>
                      ))}
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* Rule Descriptions */}
          {filteredRules.some((r) => r.description) && (
            <div className="mt-6">
              <h4 className="font-semibold text-sm text-gray-900 mb-3">Rule Descriptions</h4>
              <div className="space-y-2">
                {filteredRules.map((rule, index) =>
                  rule.description ? (
                    <div
                      key={rule.id}
                      className="flex gap-3 p-3 bg-gray-50 rounded-lg text-sm"
                    >
                      <Badge variant="outline">#{index + 1}</Badge>
                      <p className="text-gray-700">{rule.description}</p>
                    </div>
                  ) : null
                )}
              </div>
            </div>
          )}

          {/* Statistics */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
              <Table size={32} className="text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Input Columns</p>
                <p className="text-2xl font-bold text-blue-900">
                  {decisionTable.inputs.length}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
              <CheckCircle2 size={32} className="text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Output Columns</p>
                <p className="text-2xl font-bold text-green-900">
                  {decisionTable.outputs.length}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-lg">
              <Zap size={32} className="text-amber-600" />
              <div>
                <p className="text-sm text-gray-600">
                  {searchQuery ? 'Filtered Rules' : 'Total Rules'}
                </p>
                <p className="text-2xl font-bold text-amber-900">
                  {searchQuery ? `${filteredRules.length} / ${decisionTable.rules.length}` : decisionTable.rules.length}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* DMN Simulator */}
      <DMNSimulator decisionKey={decisionKey} className="mt-6" />

      {/* Version History */}
      <DMNVersionHistory decisionKey={decisionKey} className="mt-6" />
    </div>
  );
}

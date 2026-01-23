/**
 * CUSTOM REPORT BUILDER
 * Drag-and-drop report designer with export capabilities
 */

import { useState } from 'react';
import { FileText, Plus, Download, Save, Play, Table, PieChart, BarChart, LineChart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ReportWidget {
  id: string;
  type: 'table' | 'chart' | 'metric' | 'text';
  title: string;
  config: any;
}

export default function CustomReportBuilder() {
  const [widgets, setWidgets] = useState<ReportWidget[]>([]);
  const [reportName, setReportName] = useState('Untitled Report');

  const widgetTypes = [
    { type: 'table', label: 'Data Table', icon: Table, color: 'blue' },
    { type: 'chart', label: 'Bar Chart', icon: BarChart, color: 'green' },
    { type: 'chart', label: 'Line Chart', icon: LineChart, color: 'purple' },
    { type: 'chart', label: 'Pie Chart', icon: PieChart, color: 'orange' },
    { type: 'metric', label: 'KPI Card', icon: FileText, color: 'red' },
  ];

  const addWidget = (type: string) => {
    const newWidget: ReportWidget = {
      id: `widget-${Date.now()}`,
      type: type as any,
      title: `New ${type}`,
      config: {},
    };
    setWidgets([...widgets, newWidget]);
  };

  const removeWidget = (id: string) => {
    setWidgets(widgets.filter(w => w.id !== id));
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <input
            type="text"
            value={reportName}
            onChange={(e) => setReportName(e.target.value)}
            className="text-3xl font-bold mb-2 bg-transparent border-none outline-none focus:ring-2 focus:ring-blue-500 rounded px-2"
          />
          <p className="text-muted-foreground">Drag and drop widgets to build your report</p>
        </div>

        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-slate-50">
            <Play className="w-4 h-4" />
            Preview
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-slate-50">
            <Download className="w-4 h-4" />
            Export PDF
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg">
            <Save className="w-4 h-4" />
            Save Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6">
        {/* Widget Palette */}
        <div className="col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Widgets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {widgetTypes.map((widget) => {
                  const Icon = widget.icon;
                  return (
                    <button
                      key={widget.label}
                      onClick={() => addWidget(widget.type)}
                      className={`w-full flex items-center gap-3 p-3 border rounded-lg hover:bg-${widget.color}-50 dark:hover:bg-${widget.color}-900/20 text-${widget.color}-600 transition-colors`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-sm font-medium">{widget.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 pt-6 border-t">
                <p className="text-sm font-semibold mb-3">Data Sources</p>
                <div className="space-y-2">
                  <button className="w-full text-left p-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 rounded">
                    Projects
                  </button>
                  <button className="w-full text-left p-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 rounded">
                    Tasks
                  </button>
                  <button className="w-full text-left p-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 rounded">
                    Issues
                  </button>
                  <button className="w-full text-left p-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 rounded">
                    Risks
                  </button>
                  <button className="w-full text-left p-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 rounded">
                    Resources
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Report Canvas */}
        <div className="col-span-3">
          <Card className="min-h-[600px]">
            <CardHeader className="border-b">
              <CardTitle>Report Canvas</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {widgets.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[500px] text-center">
                  <FileText className="w-16 h-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Empty Report</h3>
                  <p className="text-muted-foreground mb-4">
                    Add widgets from the left panel to start building your report
                  </p>
                  <button
                    onClick={() => addWidget('table')}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
                  >
                    <Plus className="w-4 h-4" />
                    Add First Widget
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {widgets.map((widget) => {
                    const widgetType = widgetTypes.find(w => w.type === widget.type);
                    const Icon = widgetType?.icon || FileText;

                    return (
                      <Card key={widget.id} className="relative">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Icon className="w-4 h-4 text-muted-foreground" />
                              <CardTitle className="text-sm">{widget.title}</CardTitle>
                            </div>
                            <button
                              onClick={() => removeWidget(widget.id)}
                              className="text-xs text-red-600 hover:text-red-700"
                            >
                              Remove
                            </button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="h-32 bg-slate-100 dark:bg-slate-800 rounded flex items-center justify-center text-sm text-muted-foreground">
                            {widget.type === 'table' && 'Data Table Preview'}
                            {widget.type === 'chart' && 'Chart Preview'}
                            {widget.type === 'metric' && 'KPI Metric'}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

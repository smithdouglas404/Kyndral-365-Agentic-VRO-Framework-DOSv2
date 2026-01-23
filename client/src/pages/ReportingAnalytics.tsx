/**
 * REPORTING & ANALYTICS PAGE
 *
 * Comprehensive reporting and analytics:
 * - Custom report builder
 * - Chart library (bar, line, pie, Gantt)
 * - Pivot tables
 * - Excel/PDF export
 * - Scheduled reports
 */

import { useState } from 'react';
import { FileText, BarChart3, Table, Download, Clock, PieChart } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function ReportingAnalytics() {
  const [activeTab, setActiveTab] = useState('builder');

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <FileText className="h-8 w-8" />
          Reporting & Analytics
        </h1>
        <p className="text-muted-foreground mt-1">
          Create custom reports, visualizations, and schedule automated report delivery
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="builder">
            <FileText className="h-4 w-4 mr-2" />
            Report Builder
          </TabsTrigger>
          <TabsTrigger value="charts">
            <BarChart3 className="h-4 w-4 mr-2" />
            Charts
          </TabsTrigger>
          <TabsTrigger value="pivot">
            <Table className="h-4 w-4 mr-2" />
            Pivot Tables
          </TabsTrigger>
          <TabsTrigger value="export">
            <Download className="h-4 w-4 mr-2" />
            Export
          </TabsTrigger>
          <TabsTrigger value="scheduled">
            <Clock className="h-4 w-4 mr-2" />
            Scheduled
          </TabsTrigger>
          <TabsTrigger value="templates">
            <PieChart className="h-4 w-4 mr-2" />
            Templates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="builder">
          <Card>
            <CardHeader>
              <CardTitle>Custom Report Builder</CardTitle>
              <CardDescription>Drag-and-drop interface to create custom reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Build custom reports by selecting data sources, fields, filters, and groupings.
                  No SQL knowledge required - visual query builder with live preview.
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Data Sources:</div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>- Projects, Features, Stories, Tasks</div>
                    <div>- Resources, Allocations, Timesheets</div>
                    <div>- Budgets, Purchase Orders, Invoices</div>
                    <div>- Risks, Issues, Dependencies</div>
                    <div>- Documents, Approvals</div>
                    <div>- Programs, Portfolios</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Builder Features:</div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>- Drag-and-drop field selection</div>
                    <div>- Visual filter builder (AND/OR conditions)</div>
                    <div>- Grouping and aggregation (sum, avg, count, min, max)</div>
                    <div>- Calculated fields (formulas)</div>
                    <div>- Sorting and limiting results</div>
                    <div>- Save report definitions</div>
                    <div>- Share reports with teams</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Report Types:</div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>- Tabular reports (spreadsheet-style)</div>
                    <div>- Summary reports (aggregated data)</div>
                    <div>- Matrix reports (cross-tab)</div>
                    <div>- Comparison reports (side-by-side)</div>
                  </div>
                </div>
                <Button>Create New Report</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="charts">
          <Card>
            <CardHeader>
              <CardTitle>Chart Library</CardTitle>
              <CardDescription>Rich visualization library with interactive charts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Create stunning visualizations using a comprehensive chart library.
                  All charts are interactive with hover details, drill-down, and filtering.
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-medium mb-2">Chart Types:</div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>- Bar chart (vertical/horizontal)</div>
                      <div>- Line chart (single/multi-series)</div>
                      <div>- Pie/Donut chart</div>
                      <div>- Area chart (stacked/overlapping)</div>
                      <div>- Scatter plot</div>
                      <div>- Bubble chart</div>
                      <div>- Gantt chart (timeline)</div>
                      <div>- Heat map</div>
                      <div>- Tree map</div>
                      <div>- Radar chart</div>
                    </div>
                  </div>
                  <div>
                    <div className="font-medium mb-2">Features:</div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>- Interactive hover tooltips</div>
                      <div>- Drill-down into data</div>
                      <div>- Zoom and pan</div>
                      <div>- Legend filtering</div>
                      <div>- Annotations and markers</div>
                      <div>- Dual-axis support</div>
                      <div>- Real-time updates</div>
                      <div>- Export as PNG/SVG</div>
                      <div>- Embed in dashboards</div>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Common Use Cases:</div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>- Project timeline (Gantt chart)</div>
                    <div>- Budget vs. actual (bar chart)</div>
                    <div>- Risk distribution (pie chart)</div>
                    <div>- Resource utilization trends (line chart)</div>
                    <div>- Portfolio performance (heat map)</div>
                  </div>
                </div>
                <Button>Create Chart</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pivot">
          <Card>
            <CardHeader>
              <CardTitle>Pivot Tables</CardTitle>
              <CardDescription>Interactive pivot tables for data analysis and exploration</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Excel-like pivot table functionality for dynamic data analysis.
                  Drag fields to rows, columns, and values to slice and dice data.
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Pivot Table Features:</div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>- Drag-and-drop field arrangement</div>
                    <div>- Multiple aggregation functions (sum, count, avg, min, max, etc.)</div>
                    <div>- Grouping (by date, range, custom)</div>
                    <div>- Filtering and sorting</div>
                    <div>- Expand/collapse hierarchies</div>
                    <div>- Calculated fields</div>
                    <div>- Conditional formatting</div>
                    <div>- Grand totals and subtotals</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Common Pivot Analyses:</div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>- Budget by project and cost category</div>
                    <div>- Resource hours by project and month</div>
                    <div>- Issues by priority and status</div>
                    <div>- Risks by impact and probability</div>
                    <div>- Tasks by assignee and status</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Export Options:</div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>- Export to Excel with pivot table preserved</div>
                    <div>- Export as CSV (flattened data)</div>
                    <div>- Save pivot configuration for reuse</div>
                  </div>
                </div>
                <Button>Create Pivot Table</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export">
          <Card>
            <CardHeader>
              <CardTitle>Export Options</CardTitle>
              <CardDescription>Export reports and data in multiple formats</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Export reports, charts, and data in various formats for sharing and offline use.
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-medium mb-2">Export Formats:</div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>- PDF (formatted reports)</div>
                      <div>- Excel (.xlsx) with formatting</div>
                      <div>- CSV (comma-separated)</div>
                      <div>- JSON (structured data)</div>
                      <div>- PNG/SVG (charts only)</div>
                      <div>- HTML (web-ready)</div>
                    </div>
                  </div>
                  <div>
                    <div className="font-medium mb-2">Features:</div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>- Custom branding (logo, colors)</div>
                      <div>- Page layout configuration</div>
                      <div>- Include/exclude sections</div>
                      <div>- Watermarks and headers</div>
                      <div>- Password protection (PDF)</div>
                      <div>- Batch export multiple reports</div>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Excel Export Features:</div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>- Multiple sheets (one per section)</div>
                    <div>- Preserve formatting (colors, borders)</div>
                    <div>- Include charts as embedded objects</div>
                    <div>- Formulas for calculations</div>
                    <div>- Auto-fit columns</div>
                    <div>- Freeze panes for headers</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">PDF Export Features:</div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>- Professional formatting</div>
                    <div>- Table of contents with links</div>
                    <div>- Page numbers and headers</div>
                    <div>- Landscape/portrait orientation</div>
                    <div>- Vector graphics (crisp at any zoom)</div>
                  </div>
                </div>
                <Button>Export Report</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scheduled">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Reports</CardTitle>
              <CardDescription>Automate report generation and delivery</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Schedule reports to run automatically and deliver to stakeholders via email or file storage.
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Scheduling Options:</div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>- One-time (specific date/time)</div>
                    <div>- Recurring (daily, weekly, monthly, quarterly)</div>
                    <div>- Custom cron expressions</div>
                    <div>- Triggered by events (project completion, milestone, etc.)</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Delivery Methods:</div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>- Email (to/cc/bcc with attachments)</div>
                    <div>- Save to document repository</div>
                    <div>- Upload to cloud storage (S3, Google Drive, SharePoint)</div>
                    <div>- Post to collaboration tools (Slack, Teams)</div>
                    <div>- FTP/SFTP upload</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Advanced Features:</div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>- Dynamic recipient lists (based on project roles)</div>
                    <div>- Conditional delivery (only if data meets criteria)</div>
                    <div>- Multiple format delivery (PDF + Excel)</div>
                    <div>- Execution history and logs</div>
                    <div>- Retry on failure</div>
                    <div>- Notification on completion/failure</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Common Scheduled Reports:</div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>- Weekly status report (every Friday)</div>
                    <div>- Monthly financial summary (1st of month)</div>
                    <div>- Daily resource utilization (every morning)</div>
                    <div>- Quarterly executive dashboard (end of quarter)</div>
                  </div>
                </div>
                <Button>Schedule Report</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>Report Templates</CardTitle>
              <CardDescription>Pre-built report templates for common use cases</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Start with professionally designed report templates and customize to your needs.
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-medium mb-2">Project Reports:</div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>- Project status report</div>
                      <div>- Executive summary</div>
                      <div>- Milestone tracker</div>
                      <div>- Resource allocation report</div>
                      <div>- Budget vs. actuals</div>
                      <div>- Risk register</div>
                      <div>- Issue log</div>
                    </div>
                  </div>
                  <div>
                    <div className="font-medium mb-2">Portfolio Reports:</div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>- Portfolio dashboard</div>
                      <div>- Program health scorecard</div>
                      <div>- Cross-project dependencies</div>
                      <div>- Resource capacity planning</div>
                      <div>- Financial rollup</div>
                      <div>- Benefits realization</div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-medium mb-2">Financial Reports:</div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>- Cost breakdown structure</div>
                      <div>- Purchase order tracking</div>
                      <div>- Invoice aging report</div>
                      <div>- Budget variance analysis</div>
                      <div>- EVM performance report</div>
                    </div>
                  </div>
                  <div>
                    <div className="font-medium mb-2">Operational Reports:</div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>- Timesheet summary</div>
                      <div>- Resource utilization</div>
                      <div>- Task completion metrics</div>
                      <div>- Document audit log</div>
                      <div>- Change request log</div>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Template Features:</div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>- Professional layouts and styling</div>
                    <div>- Pre-configured charts and visualizations</div>
                    <div>- Calculated metrics and KPIs</div>
                    <div>- Customizable branding</div>
                    <div>- Save custom templates</div>
                    <div>- Share templates organization-wide</div>
                  </div>
                </div>
                <Button>Browse Templates</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Implementation Status */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Implementation Status</CardTitle>
          <CardDescription>Reporting infrastructure ready - uses existing database schemas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-50">✓</Badge>
              <span>All project tables</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-50">✓</Badge>
              <span>Financial tables</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-50">✓</Badge>
              <span>Resource tables</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-50">✓</Badge>
              <span>Document tables</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-50">✓</Badge>
              <span>Program tables</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-yellow-50">⊙</Badge>
              <span>Chart libraries (React-based)</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-yellow-50">⊙</Badge>
              <span>Export services (PDF/Excel)</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-yellow-50">⊙</Badge>
              <span>Scheduler service</span>
            </div>
          </div>
          <div className="mt-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="bg-green-50">✓</Badge>
              <span>Database schemas complete</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-yellow-50">⊙</Badge>
              <span>Requires additional implementation (charting libraries, export services, job scheduler)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

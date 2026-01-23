/**
 * FINANCIAL MANAGEMENT PAGE
 *
 * Comprehensive financial management:
 * - Budget by phase/workstream
 * - Purchase orders
 * - Invoices
 * - Cost categories
 * - EVM dashboard
 * - Financial forecasting
 */

import { useState } from 'react';
import { DollarSign, FileText, Receipt, FolderTree, TrendingUp, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function FinancialManagement() {
  const [activeTab, setActiveTab] = useState('budget');

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <DollarSign className="h-8 w-8" />
          Financial Management
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage budgets, purchase orders, invoices, and financial forecasting
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="budget">
            <DollarSign className="h-4 w-4 mr-2" />
            Budget
          </TabsTrigger>
          <TabsTrigger value="purchase-orders">
            <FileText className="h-4 w-4 mr-2" />
            Purchase Orders
          </TabsTrigger>
          <TabsTrigger value="invoices">
            <Receipt className="h-4 w-4 mr-2" />
            Invoices
          </TabsTrigger>
          <TabsTrigger value="cost-categories">
            <FolderTree className="h-4 w-4 mr-2" />
            Cost Categories
          </TabsTrigger>
          <TabsTrigger value="evm">
            <TrendingUp className="h-4 w-4 mr-2" />
            EVM Dashboard
          </TabsTrigger>
          <TabsTrigger value="forecasting">
            <BarChart3 className="h-4 w-4 mr-2" />
            Forecasting
          </TabsTrigger>
        </TabsList>

        <TabsContent value="budget">
          <Card>
            <CardHeader>
              <CardTitle>Budget Allocations</CardTitle>
              <CardDescription>Track budget by phase, workstream, and cost category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Allocate budgets across project phases (planning, execution, closeout) and workstreams.
                  Track allocated vs. spent amounts with variance analysis.
                </div>
                <div className="text-sm text-muted-foreground">
                  Database schema created: <code>budgetAllocations</code>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Schema Fields:</div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>- projectId, phase, workstream</div>
                    <div>- categoryId (FK to costCategories)</div>
                    <div>- allocatedAmount, spentAmount</div>
                    <div>- createdAt, updatedAt</div>
                  </div>
                </div>
                <Button>Create Budget Allocation</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="purchase-orders">
          <Card>
            <CardHeader>
              <CardTitle>Purchase Orders</CardTitle>
              <CardDescription>Create and track purchase orders with approval workflows</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Manage the complete purchase order lifecycle from creation through approval to closure.
                  Track PO status, amounts, and vendor information.
                </div>
                <div className="text-sm text-muted-foreground">
                  Database schema created: <code>purchaseOrders</code>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Schema Fields:</div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>- projectId, poNumber, vendor</div>
                    <div>- description, amount, status</div>
                    <div>- requestedBy, approvedBy</div>
                    <div>- approvedAt, issueDate, createdAt</div>
                  </div>
                </div>
                <Button>Create Purchase Order</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Management</CardTitle>
              <CardDescription>Track and process invoices linked to purchase orders</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Process invoices with PO matching, approval workflow, and payment tracking.
                  Monitor due dates and payment status.
                </div>
                <div className="text-sm text-muted-foreground">
                  Database schema created: <code>invoices</code>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Schema Fields:</div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>- projectId, poId (FK to purchaseOrders)</div>
                    <div>- invoiceNumber, vendor, amount</div>
                    <div>- status (pending, approved, paid, rejected)</div>
                    <div>- invoiceDate, dueDate, paidDate</div>
                  </div>
                </div>
                <Button>Create Invoice</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cost-categories">
          <Card>
            <CardHeader>
              <CardTitle>Cost Categories</CardTitle>
              <CardDescription>Hierarchical cost category structure for budget tracking</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Define and organize cost categories in a hierarchical structure (e.g., Labor, Materials, Services).
                  Support parent-child relationships for detailed cost breakdown.
                </div>
                <div className="text-sm text-muted-foreground">
                  Database schema created: <code>costCategories</code>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Schema Fields:</div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>- name, code, description</div>
                    <div>- parentId (self-referencing for hierarchy)</div>
                    <div>- isActive, createdAt</div>
                  </div>
                </div>
                <Button>Create Cost Category</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="evm">
          <Card>
            <CardHeader>
              <CardTitle>Earned Value Management (EVM)</CardTitle>
              <CardDescription>Real-time EVM metrics and performance indicators</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Track project performance using EVM metrics including:
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-medium mb-2">Key Metrics:</div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>- Planned Value (PV)</div>
                      <div>- Earned Value (EV)</div>
                      <div>- Actual Cost (AC)</div>
                      <div>- Budget at Completion (BAC)</div>
                    </div>
                  </div>
                  <div>
                    <div className="font-medium mb-2">Performance Indices:</div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>- Schedule Variance (SV = EV - PV)</div>
                      <div>- Cost Variance (CV = EV - AC)</div>
                      <div>- Schedule Performance Index (SPI = EV / PV)</div>
                      <div>- Cost Performance Index (CPI = EV / AC)</div>
                    </div>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  Calculated from budgetAllocations and project progress data.
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forecasting">
          <Card>
            <CardHeader>
              <CardTitle>Financial Forecasting</CardTitle>
              <CardDescription>Predict future costs and budget requirements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Advanced financial forecasting using historical data and trend analysis:
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-medium mb-2">Forecasting Methods:</div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>- Estimate at Completion (EAC)</div>
                      <div>- Estimate to Complete (ETC)</div>
                      <div>- Variance at Completion (VAC)</div>
                      <div>- To-Complete Performance Index (TCPI)</div>
                    </div>
                  </div>
                  <div>
                    <div className="font-medium mb-2">Analysis Features:</div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>- Burn rate analysis</div>
                      <div>- Cash flow projections</div>
                      <div>- Budget vs. actuals trending</div>
                      <div>- Risk-adjusted forecasting</div>
                    </div>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  Uses data from budgetAllocations, invoices, and project schedules.
                </div>
                <Button>Generate Forecast Report</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Implementation Status */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Implementation Status</CardTitle>
          <CardDescription>All financial management schemas created and ready for implementation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-50">✓</Badge>
              <span>budgetAllocations</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-50">✓</Badge>
              <span>purchaseOrders</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-50">✓</Badge>
              <span>invoices</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-50">✓</Badge>
              <span>costCategories</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

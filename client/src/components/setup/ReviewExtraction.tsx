import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, X, Edit, AlertCircle, TrendingUp, Target, Building2, Shield, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface ReviewExtractionProps {
  companyId: string;
  extractionJobId: string;
  onReviewComplete: () => void;
  onBack: () => void;
}

interface ReviewItem {
  id: string;
  itemType: string;
  itemData: any;
  confidenceScore: number;
  requiresHumanReview: boolean;
  sourceTextExcerpt: string;
  sourcePageNumber?: number;
  reviewStatus: string;
}

export function ReviewExtraction({
  companyId,
  extractionJobId,
  onReviewComplete,
  onBack
}: ReviewExtractionProps) {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchReviewQueue();
  }, []);

  const fetchReviewQueue = async () => {
    try {
      const response = await fetch(`/api/company-profile/review-queue/${companyId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch review queue');
      }

      const data = await response.json();
      setItems(data.items);
      setSummary(data.summary);
    } catch (error: any) {
      console.error('Fetch error:', error);
      toast.error(error.message || 'Failed to load review items');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (itemId: string) => {
    try {
      const response = await fetch(`/api/company-profile/review-queue/${itemId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error('Failed to approve item');
      }

      // Remove from list
      setItems(items.filter(item => item.id !== itemId));
      toast.success('Item approved');

      // Check if all items are reviewed
      if (items.length === 1) {
        toast.success('All items reviewed!');
        setTimeout(onReviewComplete, 1000);
      }
    } catch (error: any) {
      console.error('Approve error:', error);
      toast.error(error.message || 'Failed to approve item');
    }
  };

  const handleReject = async (itemId: string, reason: string = 'Incorrect or not relevant') => {
    try {
      const response = await fetch(`/api/company-profile/review-queue/${itemId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });

      if (!response.ok) {
        throw new Error('Failed to reject item');
      }

      setItems(items.filter(item => item.id !== itemId));
      toast.success('Item rejected');

      if (items.length === 1) {
        toast.success('All items reviewed!');
        setTimeout(onReviewComplete, 1000);
      }
    } catch (error: any) {
      console.error('Reject error:', error);
      toast.error(error.message || 'Failed to reject item');
    }
  };

  const handleApproveAllHighConfidence = async () => {
    const highConfidenceItems = items.filter(item => item.confidenceScore >= 0.85);

    for (const item of highConfidenceItems) {
      await handleApprove(item.id);
    }

    toast.success(`Approved ${highConfidenceItems.length} high-confidence items`);
  };

  const getItemIcon = (itemType: string) => {
    switch (itemType) {
      case 'organizational_unit':
        return Building2;
      case 'metric':
      case 'kpi':
        return TrendingUp;
      case 'objective':
        return Target;
      case 'rule':
        return Shield;
      case 'risk':
        return AlertTriangle;
      default:
        return AlertCircle;
    }
  };

  const filteredItems = activeTab === 'all'
    ? items
    : items.filter(item => item.itemType === activeTab);

  if (loading) {
    return (
      <div className="text-center py-12">
        <Spinner className="w-8 h-8 mx-auto mb-4" />
        <p className="text-muted-foreground">Loading review queue...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <Check className="w-12 h-12 mx-auto mb-4 text-primary" />
        <h3 className="font-semibold mb-2">All Items Reviewed!</h3>
        <p className="text-sm text-muted-foreground mb-6">
          All extracted data has been approved. You're ready to continue.
        </p>
        <Button onClick={onReviewComplete}>Continue to Summary</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">Review Extracted Information</h2>
          <p className="text-muted-foreground">
            Review and approve the data we extracted from your annual report
          </p>
        </div>
        <Button variant="outline" onClick={handleApproveAllHighConfidence}>
          <Check className="w-4 h-4" />
          Approve All High Confidence (≥85%)
        </Button>
      </div>

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="border rounded-lg p-3 text-center">
            <div className="text-2xl font-bold">{summary.total}</div>
            <div className="text-xs text-muted-foreground">Total Items</div>
          </div>
          <div className="border rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-amber-600">{summary.requiresReview}</div>
            <div className="text-xs text-muted-foreground">Needs Review</div>
          </div>
          <div className="border rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-primary">
              {summary.total - summary.requiresReview}
            </div>
            <div className="text-xs text-muted-foreground">High Confidence</div>
          </div>
          <div className="border rounded-lg p-3 text-center">
            <div className="text-2xl font-bold">{Object.keys(summary.byType).length}</div>
            <div className="text-xs text-muted-foreground">Categories</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All ({items.length})</TabsTrigger>
          {summary && Object.entries(summary.byType).map(([type, count]: [string, any]) => (
            <TabsTrigger key={type} value={type}>
              {type.replace('_', ' ')} ({count})
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4 mt-6">
          {filteredItems.map((item) => {
            const Icon = getItemIcon(item.itemType);

            return (
              <div
                key={item.id}
                className={`border rounded-lg p-4 ${
                  item.requiresHumanReview ? 'border-amber-500/50 bg-amber-50/30' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Icon className="w-5 h-5 text-muted-foreground" />
                    <span className="font-semibold">
                      {item.itemData.metric_name ||
                       item.itemData.objective_name ||
                       item.itemData.unit_name ||
                       item.itemData.rule_name ||
                       item.itemData.name ||
                       'Unnamed Item'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={item.confidenceScore >= 0.85 ? 'default' : 'secondary'}
                    >
                      {Math.round(item.confidenceScore * 100)}% confidence
                    </Badge>
                    {item.requiresHumanReview && (
                      <Badge variant="outline" className="border-amber-500 text-amber-700">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Review Needed
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Item Details */}
                <div className="text-sm text-muted-foreground mb-3 space-y-1">
                  {item.itemData.description && (
                    <div>{item.itemData.description}</div>
                  )}
                  {item.itemData.target_value && (
                    <div>Target: {item.itemData.target_value} {item.itemData.unit_of_measure}</div>
                  )}
                  {item.itemData.unit_type && (
                    <div>Type: {item.itemData.unit_type}</div>
                  )}
                  {item.itemData.rule_category && (
                    <div>Category: {item.itemData.rule_category}</div>
                  )}
                  {item.itemData.severity && (
                    <div>Severity: {item.itemData.severity}</div>
                  )}
                </div>

                {/* Source Citation */}
                <div className="text-xs text-muted-foreground mb-3 p-2 bg-muted/30 rounded">
                  <span className="font-medium">Source:</span> {item.sourceTextExcerpt}
                  {item.sourcePageNumber && ` (Page ${item.sourcePageNumber})`}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => handleApprove(item.id)}
                  >
                    <Check className="w-4 h-4" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {/* TODO: Edit modal */}}
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleReject(item.id)}
                  >
                    <X className="w-4 h-4" />
                    Reject
                  </Button>
                </div>
              </div>
            );
          })}
        </TabsContent>
      </Tabs>

      {/* Bottom Actions */}
      <div className="flex items-center justify-between pt-4 border-t">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onReviewComplete} disabled={items.length > 0}>
          Continue ({items.length} items remaining)
        </Button>
      </div>
    </div>
  );
}

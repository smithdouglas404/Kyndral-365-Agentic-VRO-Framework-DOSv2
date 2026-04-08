import { useState, useMemo } from 'react';
import {
  Card,
  Text,
  TextInput,
  Badge,
  Button,
  Grid,
  Col,
  Flex,
} from '@tremor/react';
import {
  Search,
  Plus,
  Sparkles,
  Briefcase,
  DollarSign,
  AlertTriangle,
  Shield,
  TrendingUp,
  Brain,
  GitBranch,
  Users,
  Calendar,
  BarChart2,
  PieChart,
  Bot,
  X,
  Check,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button as ShadcnButton } from '@/components/ui/button';
import { Badge as ShadcnBadge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  WidgetDefinition,
  WidgetCategory,
  getAllWidgets,
  searchWidgets,
  getWidgetsByCategory,
  widgetCategories,
} from '@/lib/widgetRegistry';

// ============================================================================
// Types
// ============================================================================

interface WidgetCatalogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visibleWidgets: string[];
  onAddWidget: (widgetId: string) => void;
  onRemoveWidget: (widgetId: string) => void;
  onOpenAIBuilder?: () => void;
}

// ============================================================================
// Category Icons
// ============================================================================

const categoryIcons: Record<string, React.ElementType> = {
  portfolio: Briefcase,
  financial: DollarSign,
  risk: AlertTriangle,
  governance: Shield,
  analytics: TrendingUp,
  'agent-insights': Brain,
  safe: GitBranch,
  ocm: Users,
  planning: Calendar,
  metrics: BarChart2,
  charts: PieChart,
  agents: Bot,
  insights: Brain,
  segments: Briefcase,
  custom: Sparkles,
};

// ============================================================================
// Widget Catalog Card
// ============================================================================

interface WidgetCatalogCardProps {
  widget: WidgetDefinition;
  isAdded: boolean;
  onToggle: () => void;
}

function WidgetCatalogCard({ widget, isAdded, onToggle }: WidgetCatalogCardProps) {
  const categoryInfo = widgetCategories.find(c => c.id === widget.category);
  const IconComponent = categoryIcons[widget.category] || BarChart2;

  return (
    <Card
      className={cn(
        'p-4 cursor-pointer transition-all duration-200 hover:shadow-md',
        isAdded && 'ring-2 ring-tremor-brand bg-tremor-brand-faint'
      )}
      onClick={onToggle}
    >
      <Flex justifyContent="between" alignItems="start" className="mb-3">
        <div className={cn(
          'p-2 rounded-lg',
          isAdded ? 'bg-tremor-brand text-white' : 'bg-tremor-background-subtle'
        )}>
          <IconComponent className="h-5 w-5" />
        </div>
        <div className="flex items-center gap-2">
          {widget.source === 'ai-generated' && (
            <ShadcnBadge variant="secondary" className="text-xs gap-1">
              <Sparkles className="h-3 w-3" />
              AI
            </ShadcnBadge>
          )}
          {isAdded ? (
            <div className="h-6 w-6 rounded-full bg-tremor-brand flex items-center justify-center">
              <Check className="h-4 w-4 text-white" />
            </div>
          ) : (
            <div className="h-6 w-6 rounded-full border-2 border-tremor-border flex items-center justify-center">
              <Plus className="h-4 w-4 text-tremor-content-subtle" />
            </div>
          )}
        </div>
      </Flex>

      <Text className="font-semibold mb-1">{widget.name}</Text>
      <Text className="text-sm text-tremor-content-subtle line-clamp-2 mb-3">
        {widget.description}
      </Text>

      <Flex justifyContent="between" alignItems="center">
        <Badge size="sm" color="gray">
          {categoryInfo?.name || widget.category}
        </Badge>
        {widget.tremorType && (
          <Text className="text-xs text-tremor-content-subtle">
            {widget.tremorType}
          </Text>
        )}
      </Flex>
    </Card>
  );
}

// ============================================================================
// Widget Catalog Component
// ============================================================================

export function WidgetCatalog({
  open,
  onOpenChange,
  visibleWidgets,
  onAddWidget,
  onRemoveWidget,
  onOpenAIBuilder,
}: WidgetCatalogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Get all widgets
  const allWidgets = useMemo(() => getAllWidgets(), []);

  // Filter widgets based on search and category
  const filteredWidgets = useMemo(() => {
    let widgets = searchQuery
      ? searchWidgets(searchQuery)
      : allWidgets;

    if (selectedCategory !== 'all') {
      widgets = widgets.filter(w => w.category === selectedCategory);
    }

    return widgets;
  }, [allWidgets, searchQuery, selectedCategory]);

  // Group widgets by category for display
  const widgetsByCategory = useMemo(() => {
    const groups: Record<string, WidgetDefinition[]> = {};
    filteredWidgets.forEach(widget => {
      const category = widget.category;
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(widget);
    });
    return groups;
  }, [filteredWidgets]);

  const handleToggleWidget = (widgetId: string) => {
    if (visibleWidgets.includes(widgetId)) {
      onRemoveWidget(widgetId);
    } else {
      onAddWidget(widgetId);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart2 className="h-5 w-5" />
            Widget Catalog
          </DialogTitle>
          <DialogDescription>
            Browse and add widgets to your dashboard. Click a widget to add or remove it.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 flex-1 min-h-0">
          {/* Search and AI Builder */}
          <Flex justifyContent="between" alignItems="center" className="gap-4">
            <div className="flex-1">
              <TextInput
                icon={Search}
                placeholder="Search widgets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {onOpenAIBuilder && (
              <Button
                variant="secondary"
                onClick={() => {
                  onOpenChange(false);
                  onOpenAIBuilder();
                }}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Create with AI
              </Button>
            )}
          </Flex>

          {/* Category Tabs */}
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="flex flex-wrap h-auto gap-1 bg-transparent p-0">
              <TabsTrigger
                value="all"
                className="data-[state=active]:bg-tremor-brand data-[state=active]:text-white"
              >
                All ({allWidgets.length})
              </TabsTrigger>
              {widgetCategories.slice(0, 8).map(category => {
                const count = allWidgets.filter(w => w.category === category.id).length;
                if (count === 0) return null;
                const Icon = categoryIcons[category.id] || BarChart2;
                return (
                  <TabsTrigger
                    key={category.id}
                    value={category.id}
                    className="data-[state=active]:bg-tremor-brand data-[state=active]:text-white gap-1"
                  >
                    <Icon className="h-3 w-3" />
                    {category.name} ({count})
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>

          {/* Widget Grid */}
          <ScrollArea className="flex-1">
            <div className="pr-4">
              {filteredWidgets.length === 0 ? (
                <Card className="p-8 text-center">
                  <Search className="h-8 w-8 mx-auto text-tremor-content-subtle mb-3" />
                  <Text className="font-medium mb-1">No widgets found</Text>
                  <Text className="text-tremor-content-subtle">
                    Try adjusting your search or category filter
                  </Text>
                </Card>
              ) : (
                <Grid numItemsSm={1} numItemsMd={2} numItemsLg={3} className="gap-4">
                  {filteredWidgets.map(widget => (
                    <Col key={widget.id}>
                      <WidgetCatalogCard
                        widget={widget}
                        isAdded={visibleWidgets.includes(widget.id)}
                        onToggle={() => handleToggleWidget(widget.id)}
                      />
                    </Col>
                  ))}
                </Grid>
              )}
            </div>
          </ScrollArea>

          {/* Footer with stats */}
          <Flex justifyContent="between" alignItems="center" className="pt-4 border-t">
            <Text className="text-tremor-content-subtle">
              {visibleWidgets.length} widget{visibleWidgets.length !== 1 ? 's' : ''} added to dashboard
            </Text>
            <Flex className="gap-2">
              <ShadcnButton variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </ShadcnButton>
            </Flex>
          </Flex>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default WidgetCatalog;

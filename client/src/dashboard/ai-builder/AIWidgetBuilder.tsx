import { useState, useCallback } from 'react';
import {
  Card,
  Text,
  Textarea,
  Badge,
  Button,
  Flex,
  Callout,
  ProgressBar,
} from '@tremor/react';
import {
  Sparkles,
  Send,
  RefreshCw,
  Save,
  Eye,
  Code,
  Wand2,
  AlertCircle,
  CheckCircle,
  Loader2,
  Copy,
  X,
  Lightbulb,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button as ShadcnButton } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  WidgetDefinition,
  AIGeneratedWidget,
  saveAIWidget,
  WidgetCategory,
  widgetCategories,
} from '@/lib/widgetRegistry';

// ============================================================================
// Types
// ============================================================================

interface AIWidgetBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onWidgetCreated: (widget: AIGeneratedWidget) => void;
}

type BuilderStep = 'describe' | 'generating' | 'preview' | 'customize';

interface GenerationState {
  status: 'idle' | 'generating' | 'success' | 'error';
  progress: number;
  message: string;
  generatedCode?: string;
  error?: string;
}

// ============================================================================
// Example Prompts
// ============================================================================

const examplePrompts = [
  "Create a chart showing budget burn rate by project with alerts when spending exceeds 80%",
  "Build a KPI card displaying active risks with severity breakdown and trend indicator",
  "Show a timeline of upcoming milestones with status colors and dependencies",
  "Create a donut chart of resource allocation by department with drill-down capability",
  "Display real-time agent activity feed with filtering by agent type",
  "Build a comparison chart of planned vs actual value realization by quarter",
];

// ============================================================================
// AI Widget Builder Component
// ============================================================================

export function AIWidgetBuilder({
  open,
  onOpenChange,
  onWidgetCreated,
}: AIWidgetBuilderProps) {
  const [step, setStep] = useState<BuilderStep>('describe');
  const [prompt, setPrompt] = useState('');
  const [widgetName, setWidgetName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<WidgetCategory>('custom');
  const [generation, setGeneration] = useState<GenerationState>({
    status: 'idle',
    progress: 0,
    message: '',
  });
  const [refinementPrompt, setRefinementPrompt] = useState('');
  const [showCode, setShowCode] = useState(false);

  // Simulated AI generation (in production, this would call Claude API)
  const generateWidget = useCallback(async () => {
    setStep('generating');
    setGeneration({ status: 'generating', progress: 0, message: 'Analyzing your request...' });

    // Simulate generation steps
    const steps = [
      { progress: 20, message: 'Understanding widget requirements...' },
      { progress: 40, message: 'Designing component structure...' },
      { progress: 60, message: 'Generating React code...' },
      { progress: 80, message: 'Adding Tremor styling...' },
      { progress: 100, message: 'Finalizing widget...' },
    ];

    for (const s of steps) {
      await new Promise(resolve => setTimeout(resolve, 800));
      setGeneration(prev => ({ ...prev, progress: s.progress, message: s.message }));
    }

    // Generate sample code based on prompt
    const generatedCode = generateSampleCode(prompt);

    setGeneration({
      status: 'success',
      progress: 100,
      message: 'Widget generated successfully!',
      generatedCode,
    });

    // Auto-generate widget name from prompt
    if (!widgetName) {
      const autoName = prompt.split(' ').slice(0, 4).join(' ');
      setWidgetName(autoName.charAt(0).toUpperCase() + autoName.slice(1));
    }

    setStep('preview');
  }, [prompt, widgetName]);

  const handleRefine = useCallback(async () => {
    if (!refinementPrompt) return;

    setGeneration(prev => ({ ...prev, status: 'generating', message: 'Refining widget...' }));

    // Simulate refinement
    await new Promise(resolve => setTimeout(resolve, 1500));

    // In production, this would send the refinement to Claude API
    setGeneration(prev => ({
      ...prev,
      status: 'success',
      message: 'Widget refined successfully!',
      generatedCode: prev.generatedCode + `\n// Refinement: ${refinementPrompt}`,
    }));

    setRefinementPrompt('');
  }, [refinementPrompt]);

  const handleSave = useCallback(() => {
    const widget: AIGeneratedWidget = {
      id: `ai-widget-${Date.now()}`,
      name: widgetName || 'AI Generated Widget',
      description: prompt,
      defaultSize: 'medium',
      allowedSizes: ['small', 'medium', 'large', 'full'],
      category: selectedCategory,
      defaultVisible: true,
      tabs: ['overview', 'custom'],
      tremorType: 'Custom',
      shareable: true,
      source: 'ai-generated',
      aiConfig: {
        prompt,
        generatedCode: generation.generatedCode || '',
        dependencies: ['@tremor/react', 'recharts'],
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
      },
      tags: ['ai-generated', 'custom'],
    };

    saveAIWidget(widget);
    onWidgetCreated(widget);
    handleClose();
  }, [widgetName, prompt, selectedCategory, generation.generatedCode, onWidgetCreated]);

  const handleClose = () => {
    setStep('describe');
    setPrompt('');
    setWidgetName('');
    setGeneration({ status: 'idle', progress: 0, message: '' });
    setRefinementPrompt('');
    setShowCode(false);
    onOpenChange(false);
  };

  const handleExampleClick = (example: string) => {
    setPrompt(example);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            AI Widget Builder
          </DialogTitle>
          <DialogDescription>
            Describe the widget you want to create, and AI will generate it for you.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-hidden">
          {/* Step: Describe */}
          {step === 'describe' && (
            <div className="space-y-6 py-4">
              {/* Prompt Input */}
              <div className="space-y-2">
                <Label htmlFor="prompt" className="flex items-center gap-2">
                  <Wand2 className="h-4 w-4" />
                  Describe your widget
                </Label>
                <Textarea
                  id="prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g., Create a bar chart showing project budget vs actual spending by department..."
                  className="min-h-[120px]"
                />
              </div>

              {/* Example Prompts */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-tremor-content-subtle">
                  <Lightbulb className="h-4 w-4" />
                  Try an example
                </Label>
                <div className="flex flex-wrap gap-2">
                  {examplePrompts.slice(0, 4).map((example, idx) => (
                    <Badge
                      key={idx}
                      color="gray"
                      className="cursor-pointer hover:bg-tremor-background-emphasis transition-colors"
                      onClick={() => handleExampleClick(example)}
                    >
                      {example.slice(0, 40)}...
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Callout */}
              <Callout title="Powered by AI" icon={Sparkles} color="amber">
                The AI will generate a fully functional React widget using Tremor components.
                You can refine it after generation.
              </Callout>
            </div>
          )}

          {/* Step: Generating */}
          {step === 'generating' && (
            <div className="py-12 space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-amber-100 mb-4">
                  <Loader2 className="h-8 w-8 text-amber-600 animate-spin" />
                </div>
                <Text className="text-lg font-medium mb-2">Generating Widget</Text>
                <Text className="text-tremor-content-subtle">{generation.message}</Text>
              </div>

              <ProgressBar value={generation.progress} color="amber" className="max-w-md mx-auto" />

              <Card className="max-w-md mx-auto p-4 bg-tremor-background-subtle">
                <Text className="text-sm font-mono">{prompt}</Text>
              </Card>
            </div>
          )}

          {/* Step: Preview */}
          {step === 'preview' && (
            <div className="space-y-4 py-4">
              <Tabs defaultValue="preview" className="h-full">
                <TabsList>
                  <TabsTrigger value="preview" className="gap-1">
                    <Eye className="h-4 w-4" />
                    Preview
                  </TabsTrigger>
                  <TabsTrigger value="code" className="gap-1">
                    <Code className="h-4 w-4" />
                    Code
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="preview" className="mt-4">
                  <Card className="p-6 min-h-[200px]">
                    {/* Widget Preview - In production, this would render the generated component */}
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <CheckCircle className="h-12 w-12 text-emerald-500 mb-4" />
                      <Text className="text-lg font-medium mb-2">Widget Preview</Text>
                      <Text className="text-tremor-content-subtle max-w-md">
                        Your AI-generated widget would render here. In production,
                        this uses a secure sandbox to execute the generated code.
                      </Text>
                    </div>
                  </Card>
                </TabsContent>

                <TabsContent value="code" className="mt-4">
                  <ScrollArea className="h-[300px]">
                    <pre className="p-4 bg-gray-900 text-gray-100 rounded-lg text-sm overflow-x-auto">
                      <code>{generation.generatedCode}</code>
                    </pre>
                  </ScrollArea>
                  <Flex justifyContent="end" className="mt-2">
                    <Button variant="secondary" size="xs">
                      <Copy className="h-3 w-3 mr-1" />
                      Copy Code
                    </Button>
                  </Flex>
                </TabsContent>
              </Tabs>

              {/* Refinement */}
              <Card className="p-4">
                <Label className="text-sm font-medium mb-2 block">Refine your widget</Label>
                <Flex className="gap-2">
                  <Input
                    value={refinementPrompt}
                    onChange={(e) => setRefinementPrompt(e.target.value)}
                    placeholder="e.g., Make the colors match our brand, add a loading state..."
                    className="flex-1"
                  />
                  <ShadcnButton
                    onClick={handleRefine}
                    disabled={!refinementPrompt || generation.status === 'generating'}
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Refine
                  </ShadcnButton>
                </Flex>
              </Card>

              {/* Widget Config */}
              <Card className="p-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="widget-name">Widget Name</Label>
                  <Input
                    id="widget-name"
                    value={widgetName}
                    onChange={(e) => setWidgetName(e.target.value)}
                    placeholder="My Custom Widget"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Category</Label>
                  <div className="flex flex-wrap gap-2">
                    {widgetCategories.slice(0, 6).map(cat => (
                      <Badge
                        key={cat.id}
                        color={selectedCategory === cat.id ? 'blue' : 'gray'}
                        className="cursor-pointer"
                        onClick={() => setSelectedCategory(cat.id)}
                      >
                        {cat.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div>
            {step === 'preview' && (
              <ShadcnButton variant="ghost" onClick={() => setStep('describe')}>
                Start Over
              </ShadcnButton>
            )}
          </div>
          <Flex className="gap-2">
            <ShadcnButton variant="outline" onClick={handleClose}>
              Cancel
            </ShadcnButton>
            {step === 'describe' && (
              <ShadcnButton
                onClick={generateWidget}
                disabled={!prompt.trim()}
              >
                <Sparkles className="h-4 w-4 mr-1" />
                Generate Widget
              </ShadcnButton>
            )}
            {step === 'preview' && (
              <ShadcnButton onClick={handleSave}>
                <Save className="h-4 w-4 mr-1" />
                Add to Dashboard
              </ShadcnButton>
            )}
          </Flex>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Helper: Generate Sample Code (placeholder for actual AI generation)
// ============================================================================

function generateSampleCode(prompt: string): string {
  return `import { Card, Metric, Text, Flex, ProgressBar, Badge } from '@tremor/react';

// AI-Generated Widget based on prompt:
// "${prompt}"

export function CustomWidget({ data }) {
  return (
    <Card className="p-4">
      <Flex justifyContent="between" alignItems="center" className="mb-4">
        <div>
          <Text className="text-tremor-content-subtle">Custom Metric</Text>
          <Metric>$24,500</Metric>
        </div>
        <Badge color="emerald">+12.5%</Badge>
      </Flex>

      <Text className="text-sm text-tremor-content-subtle mb-2">
        Progress to goal
      </Text>
      <ProgressBar value={75} color="blue" className="mb-2" />
      <Text className="text-xs text-tremor-content-subtle">
        75% of target achieved
      </Text>
    </Card>
  );
}

export default CustomWidget;`;
}

export default AIWidgetBuilder;

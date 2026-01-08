import { motion } from 'framer-motion';
import { 
  BookOpen, Users, Lightbulb, MessageSquare, 
  GraduationCap, Share2, CheckCircle, ArrowRight,
  TrendingUp, Clock, AlertTriangle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface GuidanceItem {
  id: string;
  type: 'best-practice' | 'lesson-learned' | 'collaboration' | 'insight';
  title: string;
  description: string;
  source: string;
  relevance: 'high' | 'medium';
  actionable: boolean;
}

const guidanceItems: GuidanceItem[] = [
  {
    id: 'gd-001',
    type: 'best-practice',
    title: 'Early Stakeholder Alignment',
    description: 'Projects with steering committee alignment in Sprint 0 show 40% faster time-to-value. Consider scheduling alignment sessions before deep implementation.',
    source: 'PRT Intake System lessons',
    relevance: 'high',
    actionable: true
  },
  {
    id: 'gd-002',
    type: 'lesson-learned',
    title: 'Vendor Risk Mitigation',
    description: 'Previous implementations identified single-vendor dependency as a key risk. Always identify backup vendors for critical components.',
    source: 'Private Markets Platform',
    relevance: 'high',
    actionable: true
  },
  {
    id: 'gd-003',
    type: 'collaboration',
    title: 'Cross-BU Knowledge Share',
    description: 'Retail team achieved 92% adoption with a structured playbook. This approach is recommended for other BU rollouts.',
    source: 'Three Lines of Defence project',
    relevance: 'medium',
    actionable: true
  },
  {
    id: 'gd-004',
    type: 'insight',
    title: 'Accessibility Compliance Pattern',
    description: 'WCAG 2.1 compliance gaps are common in digital projects. Engaging accessibility specialists early prevents 2-3 week delays.',
    source: 'Digital Onboarding analysis',
    relevance: 'high',
    actionable: true
  }
];

const learningResources = [
  { title: 'SAFe 6.0 Portfolio Management', type: 'Guide', duration: '15 min' },
  { title: 'Agile Estimation Best Practices', type: 'Video', duration: '8 min' },
  { title: 'Risk-Based PI Planning', type: 'Template', duration: '5 min' },
  { title: 'Cross-Team Dependencies', type: 'Playbook', duration: '12 min' }
];

function getTypeConfig(type: GuidanceItem['type']) {
  switch (type) {
    case 'best-practice':
      return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50 border-green-200' };
    case 'lesson-learned':
      return { icon: Lightbulb, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' };
    case 'collaboration':
      return { icon: Users, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' };
    case 'insight':
      return { icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200' };
  }
}

export function PMOGuidance() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-amber-500" />
                PMO Guidance & Insights
              </h3>
              <p className="text-sm text-gray-500">Knowledge sharing to accelerate project success</p>
            </div>
            <Button variant="outline" size="sm" className="gap-2" data-testid="button-share-insight">
              <Share2 className="h-4 w-4" />
              Share Insight
            </Button>
          </div>
          
          <div className="space-y-3">
            {guidanceItems.map((item, idx) => {
              const config = getTypeConfig(item.type);
              const Icon = config.icon;
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className={cn(
                    "p-4 rounded-lg border",
                    config.bg
                  )}
                  data-testid={`guidance-item-${item.id}`}
                >
                  <div className="flex items-start gap-3">
                    <Icon className={cn("h-5 w-5 mt-0.5", config.color)} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-900">{item.title}</h4>
                        {item.relevance === 'high' && (
                          <Badge variant="secondary" className="text-xs bg-red-100 text-red-700">High Impact</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">Source: {item.source}</span>
                        {item.actionable && (
                          <Button variant="ghost" size="sm" className="text-xs h-7 gap-1" data-testid={`button-apply-${item.id}`}>
                            Apply <ArrowRight className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
              <GraduationCap className="h-5 w-5 text-blue-600" />
              Learning Resources
            </h4>
            <div className="space-y-2">
              {learningResources.map((resource, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center justify-between p-2 bg-white rounded-md border border-gray-100 hover:shadow-sm transition-shadow cursor-pointer"
                  data-testid={`learning-resource-${idx}`}
                >
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-700">{resource.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{resource.type}</Badge>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {resource.duration}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
              <MessageSquare className="h-5 w-5 text-green-600" />
              Collaboration Hub
            </h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-2 bg-white rounded-md border border-gray-100">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-xs font-bold text-blue-600">AK</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Andrew Kail</p>
                  <p className="text-xs text-gray-500">Shared PRT automation insights</p>
                </div>
                <Badge variant="secondary" className="text-xs">New</Badge>
              </div>
              <div className="flex items-center gap-3 p-2 bg-white rounded-md border border-gray-100">
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                  <span className="text-xs font-bold text-purple-600">PL</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Paula Llewellyn</p>
                  <p className="text-xs text-gray-500">Posted accessibility checklist</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="w-full gap-2" data-testid="button-view-collaborators">
                <Users className="h-4 w-4" />
                View All Collaborators
              </Button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              Common Blockers
            </h4>
            <p className="text-sm text-gray-600 mb-3">Based on recent project patterns</p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2 text-gray-700">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Legacy system integration delays
              </li>
              <li className="flex items-center gap-2 text-gray-700">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Resource constraints in Q3
              </li>
              <li className="flex items-center gap-2 text-gray-700">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Third-party data quality issues
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

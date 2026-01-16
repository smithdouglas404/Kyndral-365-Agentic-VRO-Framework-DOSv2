import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen, Users, Lightbulb, MessageSquare, 
  GraduationCap, Share2, CheckCircle, ArrowRight,
  TrendingUp, Clock, AlertTriangle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { DrillDownDrawer } from './DrillDownDrawer';

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
    source: 'Grid Modernization lessons',
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
    title: 'Cross-Group Knowledge Share',
    description: 'Retail team achieved 92% adoption with a structured playbook. This approach is recommended for other Group rollouts.',
    source: 'Enterprise Risk Governance project',
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
  { id: 'lr-0', title: 'SAFe 6.0 Portfolio Management', type: 'Guide', duration: '15 min' },
  { id: 'lr-1', title: 'Agile Estimation Best Practices', type: 'Video', duration: '8 min' },
  { id: 'lr-2', title: 'Risk-Based PI Planning', type: 'Template', duration: '5 min' },
  { id: 'lr-3', title: 'Cross-Team Dependencies', type: 'Playbook', duration: '12 min' }
];

const collaborators = [
  { id: 'collab-ak', name: 'Armando Pimentel', initials: 'AP', color: 'blue', activity: 'Shared grid automation insights', isNew: true },
  { id: 'collab-pl', name: 'Paula Llewellyn', initials: 'PL', color: 'purple', activity: 'Posted accessibility checklist', isNew: false }
];

const blockers = [
  { id: 'blocker-legacy', title: 'Legacy system integration delays' },
  { id: 'blocker-resources', title: 'Resource constraints in Q3' },
  { id: 'blocker-data', title: 'Third-party data quality issues' }
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

interface PMOGuidanceProps {
  onDrillDown?: (type: string, id: string) => void;
}

export function PMOGuidance({ onDrillDown }: PMOGuidanceProps) {
  const [selectedEntity, setSelectedEntity] = useState<{ type: string; id: string } | null>(null);

  const openDrawer = (entityType: string, entityId: string) => {
    if (onDrillDown) {
      onDrillDown(entityType, entityId);
    } else {
      setSelectedEntity({ type: entityType, id: entityId });
    }
  };

  const closeDrawer = () => {
    setSelectedEntity(null);
  };

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
                    "p-4 rounded-lg border cursor-pointer hover:shadow-md transition-shadow",
                    config.bg
                  )}
                  onClick={() => openDrawer('guidance-item', item.id)}
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
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-xs h-7 gap-1" 
                            onClick={(e) => {
                              e.stopPropagation();
                              openDrawer('guidance-item', item.id);
                            }}
                            data-testid={`button-apply-${item.id}`}
                          >
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
              {learningResources.map((resource) => (
                <div 
                  key={resource.id} 
                  className="flex items-center justify-between p-2 bg-white rounded-md border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => openDrawer('learning-resource', resource.id)}
                  data-testid={`learning-resource-${resource.id}`}
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
              {collaborators.map((collab) => (
                <div 
                  key={collab.id}
                  className="flex items-center gap-3 p-2 bg-white rounded-md border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => openDrawer('collaborator', collab.id)}
                  data-testid={`collaborator-${collab.id}`}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center",
                    collab.color === 'blue' ? 'bg-blue-100' : 'bg-purple-100'
                  )}>
                    <span className={cn(
                      "text-xs font-bold",
                      collab.color === 'blue' ? 'text-blue-600' : 'text-purple-600'
                    )}>{collab.initials}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{collab.name}</p>
                    <p className="text-xs text-gray-500">{collab.activity}</p>
                  </div>
                  {collab.isNew && (
                    <Badge variant="secondary" className="text-xs">New</Badge>
                  )}
                </div>
              ))}
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
              {blockers.map((blocker) => (
                <li 
                  key={blocker.id}
                  className="flex items-center gap-2 text-gray-700 cursor-pointer hover:text-amber-700 transition-colors p-1 rounded hover:bg-amber-100"
                  onClick={() => openDrawer('blocker', blocker.id)}
                  data-testid={`blocker-${blocker.id}`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  {blocker.title}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <DrillDownDrawer
        isOpen={!!selectedEntity}
        onClose={closeDrawer}
        entityType={selectedEntity?.type || ''}
        entityId={selectedEntity?.id || ''}
      />
    </div>
  );
}

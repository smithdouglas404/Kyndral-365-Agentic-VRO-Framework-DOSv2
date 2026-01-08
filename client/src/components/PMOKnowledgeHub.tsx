import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen, Search, MessageCircle, ThumbsUp, 
  Bookmark, Clock, User, ChevronRight, 
  FileText, Lightbulb, Award, TrendingUp,
  CheckCircle, Plus, Filter
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface Retrospective {
  id: string;
  projectName: string;
  date: string;
  wentWell: string[];
  improvements: string[];
  actionItems: string[];
  upvotes: number;
  saved: boolean;
}

interface Playbook {
  id: string;
  title: string;
  category: string;
  author: string;
  lastUpdated: string;
  uses: number;
  rating: number;
  description: string;
}

interface QAItem {
  id: string;
  question: string;
  answer: string;
  author: string;
  date: string;
  upvotes: number;
  tags: string[];
}

const retrospectives: Retrospective[] = [
  {
    id: 'retro-001',
    projectName: 'PRT Intake System Upgrade',
    date: 'Dec 2024',
    wentWell: [
      'Strong stakeholder engagement from Sprint 0',
      'Early integration testing prevented 3-week delay',
      'Cross-BU collaboration improved delivery speed'
    ],
    improvements: [
      'Need better vendor communication protocols',
      'Resource planning should start earlier',
      'Technical debt should be tracked in backlog'
    ],
    actionItems: [
      'Create vendor escalation playbook',
      'Add capacity planning to PI planning checklist'
    ],
    upvotes: 24,
    saved: true
  },
  {
    id: 'retro-002',
    projectName: 'Longevity Model Enhancement',
    date: 'Nov 2024',
    wentWell: [
      'Actuarial sign-off achieved ahead of schedule',
      'Model accuracy exceeded targets by 12%',
      'Excellent documentation practices'
    ],
    improvements: [
      'More frequent model validation cycles needed',
      'Better alignment with regulatory requirements early'
    ],
    actionItems: [
      'Create model validation checklist',
      'Engage compliance team in Sprint 0'
    ],
    upvotes: 18,
    saved: false
  },
  {
    id: 'retro-003',
    projectName: 'Digital Onboarding Enhancement',
    date: 'Oct 2024',
    wentWell: [
      'Accessibility compliance achieved from day one',
      'User testing feedback incorporated quickly',
      'Feature toggles enabled safe rollout'
    ],
    improvements: [
      'Third-party data integration took longer than expected',
      'Need clearer ownership of shared components'
    ],
    actionItems: [
      'Standardize data integration patterns',
      'Create component ownership RACI'
    ],
    upvotes: 31,
    saved: true
  }
];

const playbooks: Playbook[] = [
  {
    id: 'pb-001',
    title: 'Stakeholder Alignment in Sprint 0',
    category: 'Project Initiation',
    author: 'Andrew Kail',
    lastUpdated: '2 weeks ago',
    uses: 47,
    rating: 4.8,
    description: 'Step-by-step guide to achieving stakeholder alignment before deep implementation begins. Includes templates and meeting agendas.'
  },
  {
    id: 'pb-002',
    title: 'Vendor Risk Mitigation',
    category: 'Risk Management',
    author: 'Sarah Chen',
    lastUpdated: '1 month ago',
    uses: 32,
    rating: 4.6,
    description: 'Best practices for managing vendor dependencies including backup planning, escalation paths, and contract considerations.'
  },
  {
    id: 'pb-003',
    title: 'SAFe 6.0 PI Planning Facilitation',
    category: 'Agile Practices',
    author: 'Paula Llewellyn',
    lastUpdated: '3 weeks ago',
    uses: 89,
    rating: 4.9,
    description: 'Complete facilitation guide for PI Planning including preparation, execution, and follow-up activities.'
  },
  {
    id: 'pb-004',
    title: 'Legacy System Integration Patterns',
    category: 'Technical',
    author: 'Marcus Webb',
    lastUpdated: '1 week ago',
    uses: 28,
    rating: 4.5,
    description: 'Common patterns and anti-patterns when integrating with L&G legacy systems. Includes API strategies and testing approaches.'
  },
  {
    id: 'pb-005',
    title: 'Accessibility Compliance Checklist',
    category: 'Quality',
    author: 'Paula Llewellyn',
    lastUpdated: '4 days ago',
    uses: 56,
    rating: 4.7,
    description: 'Comprehensive WCAG 2.1 compliance checklist with testing procedures and remediation guidance.'
  }
];

const qaItems: QAItem[] = [
  {
    id: 'qa-001',
    question: 'How do we handle scope changes during PI execution?',
    answer: 'Use the change request process documented in the SAFe playbook. For minor changes (<5% effort impact), team leads can approve. For major changes, escalate to the RTE for PI-level assessment. Always update the backlog and communicate impact to stakeholders within 24 hours.',
    author: 'Andrew Kail',
    date: '3 days ago',
    upvotes: 15,
    tags: ['SAFe', 'Scope Management', 'PI Planning']
  },
  {
    id: 'qa-002',
    question: 'What\'s the process for engaging accessibility specialists?',
    answer: 'Submit a request through the shared services portal at least 2 sprints before you need them. Include: project context, estimated effort, and specific WCAG requirements. Early engagement (Sprint 0-1) is highly recommended to prevent rework.',
    author: 'Paula Llewellyn',
    date: '1 week ago',
    upvotes: 22,
    tags: ['Accessibility', 'Resources', 'Quality']
  },
  {
    id: 'qa-003',
    question: 'How do we track benefits realization after go-live?',
    answer: 'Use the Benefits Realization Tracker template in the playbook library. Schedule monthly reviews for the first 6 months post-launch. Connect metrics to the original business case and report to VRO quarterly. The Co-Pilot can help automate this tracking.',
    author: 'Sarah Chen',
    date: '2 weeks ago',
    upvotes: 28,
    tags: ['Benefits', 'VRO', 'Metrics']
  }
];

export function PMOKnowledgeHub() {
  const [activeTab, setActiveTab] = useState('retrospectives');
  const [searchQuery, setSearchQuery] = useState('');
  const [playbookCategory, setPlaybookCategory] = useState<string>('All');
  const [retroUpvotes, setRetroUpvotes] = useState<Record<string, number>>({});
  const [qaUpvotes, setQaUpvotes] = useState<Record<string, number>>({});
  const [savedRetros, setSavedRetros] = useState<Set<string>>(new Set(
    retrospectives.filter(r => r.saved).map(r => r.id)
  ));

  const handleRetroUpvote = (id: string) => {
    setRetroUpvotes(prev => ({
      ...prev,
      [id]: (prev[id] || 0) + 1
    }));
  };

  const handleQaUpvote = (id: string) => {
    setQaUpvotes(prev => ({
      ...prev,
      [id]: (prev[id] || 0) + 1
    }));
  };

  const toggleSaveRetro = (id: string) => {
    setSavedRetros(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const filteredRetrospectives = retrospectives.filter(r =>
    r.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.wentWell.some(w => w.toLowerCase().includes(searchQuery.toLowerCase())) ||
    r.improvements.some(i => i.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredPlaybooks = playbooks.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = playbookCategory === 'All' || p.category === playbookCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredQA = qaItems.filter(q =>
    q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const playbookCategories = ['All', ...Array.from(new Set(playbooks.map(p => p.category)))];

  return (
    <div className="space-y-6" data-testid="pmo-knowledge-hub">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-[#005EB8]" />
            Knowledge Hub
          </h3>
          <p className="text-sm text-gray-500">Learn from past projects and share your expertise</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search knowledge base..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-md w-64 focus:outline-none focus:ring-2 focus:ring-[#005EB8]"
              data-testid="input-search-knowledge"
            />
          </div>
          <Button variant="outline" size="sm" className="gap-2" data-testid="button-contribute">
            <Plus className="h-4 w-4" />
            Contribute
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 w-fit">
          <TabsTrigger value="retrospectives" className="gap-2" data-testid="tab-retrospectives">
            <Lightbulb className="h-4 w-4" />
            Retrospectives
          </TabsTrigger>
          <TabsTrigger value="playbooks" className="gap-2" data-testid="tab-playbooks">
            <FileText className="h-4 w-4" />
            Playbooks
          </TabsTrigger>
          <TabsTrigger value="qa" className="gap-2" data-testid="tab-qa">
            <MessageCircle className="h-4 w-4" />
            Q&A
          </TabsTrigger>
        </TabsList>

        <TabsContent value="retrospectives" className="mt-4">
          {filteredRetrospectives.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Search className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No retrospectives found matching "{searchQuery}"</p>
            </div>
          ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredRetrospectives.map((retro, idx) => (
              <motion.div
                key={retro.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                data-testid={`retro-card-${retro.id}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900">{retro.projectName}</h4>
                    <p className="text-xs text-gray-500">{retro.date}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className={cn("p-1 h-auto", savedRetros.has(retro.id) && "text-amber-500")}
                      onClick={() => toggleSaveRetro(retro.id)}
                      data-testid={`button-save-${retro.id}`}
                    >
                      <Bookmark className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <ThumbsUp className="h-3 w-3" />
                      {retro.upvotes}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-medium text-green-700 mb-1">What went well</p>
                    <ul className="space-y-1">
                      {retro.wentWell.slice(0, 2).map((item, i) => (
                        <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                          <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-amber-700 mb-1">Improvements</p>
                    <ul className="space-y-1">
                      {retro.improvements.slice(0, 2).map((item, i) => (
                        <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                          <TrendingUp className="h-3 w-3 text-amber-500 mt-0.5 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <Button variant="link" size="sm" className="text-xs p-0 h-auto mt-2 text-[#005EB8]" data-testid={`button-view-retro-${retro.id}`}>
                  View full retrospective →
                </Button>
              </motion.div>
            ))}
          </div>
          )}
        </TabsContent>

        <TabsContent value="playbooks" className="mt-4">
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <Filter className="h-4 w-4 text-gray-400" />
            {playbookCategories.map(cat => (
              <Badge 
                key={cat}
                variant={playbookCategory === cat ? "default" : "outline"} 
                className={cn(
                  "cursor-pointer",
                  playbookCategory === cat ? "bg-[#005EB8]" : "hover:bg-gray-100"
                )}
                onClick={() => setPlaybookCategory(cat)}
                data-testid={`filter-category-${cat.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {cat}
              </Badge>
            ))}
          </div>

          {filteredPlaybooks.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Search className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No playbooks found matching your criteria</p>
            </div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPlaybooks.map((playbook, idx) => (
              <motion.div
                key={playbook.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                data-testid={`playbook-card-${playbook.id}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <Badge variant="outline" className="text-xs">{playbook.category}</Badge>
                  <div className="flex items-center gap-1 text-amber-500">
                    <Award className="h-3 w-3" />
                    <span className="text-xs font-medium">{playbook.rating}</span>
                  </div>
                </div>

                <h4 className="font-semibold text-gray-900 mb-1">{playbook.title}</h4>
                <p className="text-xs text-gray-600 mb-3 line-clamp-2">{playbook.description}</p>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {playbook.author}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {playbook.lastUpdated}
                    </span>
                    <span>{playbook.uses} uses</span>
                  </div>
                </div>

                <Button variant="outline" size="sm" className="w-full mt-3 gap-1" data-testid={`button-use-playbook-${playbook.id}`}>
                  Use Playbook <ChevronRight className="h-3 w-3" />
                </Button>
              </motion.div>
            ))}
          </div>
          )}
        </TabsContent>

        <TabsContent value="qa" className="mt-4">
          <div className="mb-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Have a question?</h4>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ask the community or AI assistant..."
                className="flex-1 px-3 py-2 text-sm border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#005EB8] bg-white"
                data-testid="input-ask-question"
              />
              <Button className="bg-[#005EB8] hover:bg-[#003D7A]" data-testid="button-ask-question">
                Ask
              </Button>
            </div>
          </div>

          {filteredQA.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Search className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No Q&A found matching "{searchQuery}"</p>
            </div>
          ) : (
          <div className="space-y-4">
            {filteredQA.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="border border-gray-200 rounded-lg p-4"
                data-testid={`qa-item-${item.id}`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="p-1 h-auto hover:text-[#005EB8]" 
                      onClick={() => handleQaUpvote(item.id)}
                      data-testid={`button-upvote-${item.id}`}
                    >
                      <ThumbsUp className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium text-gray-600">{item.upvotes + (qaUpvotes[item.id] || 0)}</span>
                  </div>

                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-2">{item.question}</h4>
                    <p className="text-sm text-gray-600 mb-3">{item.answer}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-[10px] font-bold text-blue-600">
                            {item.author.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">{item.author} • {item.date}</span>
                      </div>
                      <div className="flex gap-1">
                        {item.tags.map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

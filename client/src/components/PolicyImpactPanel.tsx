import { useState, useEffect } from 'react';
import { 
  Building2, FolderKanban, Link2, Unlink, AlertTriangle, 
  CheckCircle2, Plus, X, ArrowRight, RefreshCw, Users,
  Briefcase, Target, Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from '@/components/ui/separator';

interface BusinessUnit {
  id: string;
  name: string;
  description: string | null;
  department: string | null;
  owner: string | null;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string | null;
  businessUnitId: string | null;
  impactLevel?: string;
}

interface PolicyImpactPanelProps {
  policyId: string;
  policyName: string;
}

export function PolicyImpactPanel({ policyId, policyName }: PolicyImpactPanelProps) {
  const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([]);
  const [allBusinessUnits, setAllBusinessUnits] = useState<BusinessUnit[]>([]);
  const [linkedProjects, setLinkedProjects] = useState<Project[]>([]);
  const [potentialImpact, setPotentialImpact] = useState<Project[]>([]);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [selectedBU, setSelectedBU] = useState<string>('');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [buRes, allBuRes, projRes, allProjRes] = await Promise.all([
        fetch(`/api/policies/${policyId}/business-units`),
        fetch('/api/business-units'),
        fetch(`/api/policies/${policyId}/projects`),
        fetch('/api/projects'),
      ]);
      
      const linkedBUs = await buRes.json();
      const allBUs = await allBuRes.json();
      const linkedProjs = await projRes.json();
      const allProjs = await allProjRes.json();
      
      setBusinessUnits(linkedBUs);
      setAllBusinessUnits(allBUs);
      setLinkedProjects(linkedProjs);
      setAllProjects(allProjs);
      
      const potentiallyImpacted = allProjs.filter((p: Project) => 
        linkedBUs.some((bu: BusinessUnit) => bu.id === p.businessUnitId) &&
        !linkedProjs.some((lp: Project) => lp.id === p.id)
      );
      setPotentialImpact(potentiallyImpacted);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (policyId) {
      fetchData();
    }
  }, [policyId]);

  const linkBusinessUnit = async () => {
    if (!selectedBU) return;
    try {
      await fetch(`/api/policies/${policyId}/business-units`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessUnitId: selectedBU }),
      });
      setSelectedBU('');
      fetchData();
    } catch (error) {
      console.error('Failed to link business unit:', error);
    }
  };

  const unlinkBusinessUnit = async (buId: string) => {
    try {
      await fetch(`/api/policies/${policyId}/business-units/${buId}`, {
        method: 'DELETE',
      });
      fetchData();
    } catch (error) {
      console.error('Failed to unlink business unit:', error);
    }
  };

  const linkProject = async (projectId: string, impactLevel: string = 'medium') => {
    try {
      await fetch(`/api/policies/${policyId}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, impactLevel }),
      });
      fetchData();
    } catch (error) {
      console.error('Failed to link project:', error);
    }
  };

  const unlinkProject = async (projectId: string) => {
    try {
      await fetch(`/api/policies/${policyId}/projects/${projectId}`, {
        method: 'DELETE',
      });
      fetchData();
    } catch (error) {
      console.error('Failed to unlink project:', error);
    }
  };

  const unlinkedBusinessUnits = allBusinessUnits.filter(
    bu => !businessUnits.some(linked => linked.id === bu.id)
  );

  const unlinkedProjects = allProjects.filter(
    p => !linkedProjects.some(linked => linked.id === p.id)
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <RefreshCw className="mx-auto animate-spin text-gray-400" size={32} />
          <p className="mt-2 text-gray-500">Loading impact analysis...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6" data-testid="policy-impact-panel">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Target size={28} />
          <h2 className="text-2xl font-bold">Policy Impact Analysis</h2>
        </div>
        <p className="text-white/80">
          Link "{policyName}" to business units and see which projects could be affected by changes
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-2 border-indigo-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="text-indigo-600" />
              Linked Business Units
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {businessUnits.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                <Building2 className="mx-auto mb-2 text-gray-300" size={32} />
                <p>No business units linked yet</p>
                <p className="text-sm">Link this policy to relevant business areas</p>
              </div>
            ) : (
              <div className="space-y-2">
                {businessUnits.map(bu => (
                  <div 
                    key={bu.id} 
                    className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg border border-indigo-200"
                    data-testid={`linked-bu-${bu.id}`}
                  >
                    <div>
                      <p className="font-medium text-gray-900">{bu.name}</p>
                      <p className="text-sm text-gray-500">{bu.department}</p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => unlinkBusinessUnit(bu.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      data-testid={`unlink-bu-${bu.id}`}
                    >
                      <X size={16} />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <Separator />

            <div className="flex gap-2">
              <Select value={selectedBU} onValueChange={setSelectedBU}>
                <SelectTrigger className="flex-1" data-testid="select-business-unit">
                  <SelectValue placeholder="Select business unit..." />
                </SelectTrigger>
                <SelectContent>
                  {unlinkedBusinessUnits.map(bu => (
                    <SelectItem key={bu.id} value={bu.id}>
                      {bu.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                onClick={linkBusinessUnit}
                disabled={!selectedBU}
                className="bg-indigo-600 hover:bg-indigo-700"
                data-testid="button-link-bu"
              >
                <Link2 size={16} className="mr-1" />
                Link
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FolderKanban className="text-purple-600" />
              Directly Affected Projects
              {linkedProjects.length > 0 && (
                <Badge className="ml-2 bg-purple-100 text-purple-800">
                  {linkedProjects.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {linkedProjects.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                <FolderKanban className="mx-auto mb-2 text-gray-300" size={32} />
                <p>No projects directly linked</p>
                <p className="text-sm">Link projects that depend on this policy</p>
              </div>
            ) : (
              <div className="space-y-2">
                {linkedProjects.map(proj => (
                  <div 
                    key={proj.id} 
                    className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200"
                    data-testid={`linked-project-${proj.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <ImpactBadge level={proj.impactLevel || 'medium'} />
                      <div>
                        <p className="font-medium text-gray-900">{proj.name}</p>
                        <p className="text-sm text-gray-500">{proj.description}</p>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => unlinkProject(proj.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      data-testid={`unlink-project-${proj.id}`}
                    >
                      <X size={16} />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <Separator />

            <div className="flex gap-2">
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger className="flex-1" data-testid="select-project">
                  <SelectValue placeholder="Select project to link..." />
                </SelectTrigger>
                <SelectContent>
                  {unlinkedProjects.map(proj => (
                    <SelectItem key={proj.id} value={proj.id}>
                      {proj.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                onClick={() => {
                  if (selectedProject) {
                    linkProject(selectedProject, 'high');
                    setSelectedProject('');
                  }
                }}
                disabled={!selectedProject}
                className="bg-purple-600 hover:bg-purple-700"
                data-testid="button-link-project"
              >
                <Link2 size={16} className="mr-1" />
                Link
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {potentialImpact.length > 0 && (
        <Card className="border-2 border-amber-200 bg-amber-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-amber-800">
              <AlertTriangle className="text-amber-600" />
              Potential Project Impact
              <Badge className="ml-2 bg-amber-100 text-amber-800">
                {potentialImpact.length} projects may be affected
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-amber-700 mb-4">
              These projects belong to linked business units and may need to be reviewed if this policy changes:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {potentialImpact.map(proj => {
                const bu = allBusinessUnits.find(b => b.id === proj.businessUnitId);
                return (
                  <div 
                    key={proj.id}
                    className="p-3 bg-white rounded-lg border border-amber-200 hover:border-amber-400 transition-colors"
                    data-testid={`potential-impact-${proj.id}`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{proj.name}</p>
                        <p className="text-xs text-gray-500">{bu?.name}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => linkProject(proj.id, 'medium')}
                        className="text-amber-600 hover:bg-amber-100"
                        data-testid={`add-impact-${proj.id}`}
                      >
                        <Plus size={14} />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {businessUnits.length > 0 && (
        <Card className="bg-gradient-to-r from-gray-50 to-gray-100">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white rounded-xl shadow-sm">
                <Zap className="text-indigo-600" size={28} />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 text-lg">Change Impact Summary</p>
                <p className="text-gray-600">
                  If you modify this policy, {linkedProjects.length} project{linkedProjects.length !== 1 ? 's' : ''} will be 
                  directly affected and {potentialImpact.length} additional project{potentialImpact.length !== 1 ? 's' : ''} in 
                  linked business units should be reviewed.
                </p>
              </div>
              <div className="flex gap-4 text-center">
                <div className="px-4 py-2 bg-white rounded-lg shadow-sm">
                  <p className="text-2xl font-bold text-indigo-600">{businessUnits.length}</p>
                  <p className="text-xs text-gray-500">Business Units</p>
                </div>
                <div className="px-4 py-2 bg-white rounded-lg shadow-sm">
                  <p className="text-2xl font-bold text-purple-600">{linkedProjects.length}</p>
                  <p className="text-xs text-gray-500">Direct Impact</p>
                </div>
                <div className="px-4 py-2 bg-white rounded-lg shadow-sm">
                  <p className="text-2xl font-bold text-amber-600">{potentialImpact.length}</p>
                  <p className="text-xs text-gray-500">Potential Impact</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ImpactBadge({ level }: { level: string }) {
  const colors: Record<string, string> = {
    high: 'bg-red-100 text-red-800 border-red-200',
    medium: 'bg-amber-100 text-amber-800 border-amber-200',
    low: 'bg-green-100 text-green-800 border-green-200',
  };
  return (
    <Badge className={`${colors[level] || colors.medium} border`}>
      {level.toUpperCase()}
    </Badge>
  );
}

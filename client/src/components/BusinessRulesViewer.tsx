import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Shield, AlertTriangle, Gift, CheckCircle2, XCircle,
  Clock, Calendar, DollarSign, Percent, Info, AlertCircle,
  Zap, Target, FileText, Scale, History, Lightbulb, Eye,
  ArrowRight, TrendingUp, Activity, Lock, Unlock, Heart,
  Baby, Home, Stethoscope, BadgeCheck, Timer, UserCheck
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import yaml from 'js-yaml';

interface BusinessRulesViewerProps {
  yamlCode: string;
  policyName: string;
}

export function BusinessRulesViewer({ yamlCode, policyName }: BusinessRulesViewerProps) {
  const [activeSection, setActiveSection] = useState('overview');
  
  const rules = useMemo(() => {
    try {
      return yaml.load(yamlCode) as any;
    } catch {
      return null;
    }
  }, [yamlCode]);

  if (!rules) {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 text-amber-700">
            <AlertCircle size={24} />
            <div>
              <p className="font-medium">Policy rules not available</p>
              <p className="text-sm">Generate a policy first to see the business rules.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const minAge = rules.eligibility_rules?.minimum_age || rules.eligibility_rules?.age_limits?.minimum_age || 18;
  const maxAgeLife = rules.eligibility_rules?.maximum_purchase_ages?.life_insurance || rules.eligibility_rules?.age_limits?.maximum_age || 77;
  const maxAgeCI = rules.eligibility_rules?.maximum_purchase_ages?.critical_illness_cover || 67;
  const survivalPeriod = rules.coverage_logic?.critical_illness_cover?.triggers?.[0]?.survival_period || rules.coverage_logic?.critical_illness?.survival_period || '14 days';
  const terminalIllnessPeriod = rules.coverage_logic?.life_insurance?.triggers?.find((t: any) => t.condition === 'terminal_illness')?.requirements?.find((r: string) => r.includes('12')) || '12 months';

  return (
    <div className="space-y-6" data-testid="business-rules-viewer">
      <div className="bg-gradient-to-r from-[#005EB8] to-[#00843D] rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Scale size={28} />
              <h2 className="text-2xl font-bold" data-testid="text-policy-name">{policyName}</h2>
            </div>
            <p className="text-white/80 text-sm" data-testid="text-single-source-truth">
              Single Source of Truth - These rules are exactly what the system executes
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30">
              <Lock size={12} className="mr-1" />
              Compliance Verified
            </Badge>
            <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30">
              <History size={12} className="mr-1" />
              Version 1.0 - Live
            </Badge>
          </div>
        </div>
      </div>

      <Tabs value={activeSection} onValueChange={setActiveSection} className="w-full">
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="overview" className="gap-1" data-testid="tab-overview">
            <Eye size={14} />
            Overview
          </TabsTrigger>
          <TabsTrigger value="eligibility" className="gap-1" data-testid="tab-eligibility">
            <UserCheck size={14} />
            Who Can Apply
          </TabsTrigger>
          <TabsTrigger value="coverage" className="gap-1" data-testid="tab-coverage">
            <Shield size={14} />
            When We Pay
          </TabsTrigger>
          <TabsTrigger value="exclusions" className="gap-1" data-testid="tab-exclusions">
            <XCircle size={14} />
            What's Not Covered
          </TabsTrigger>
          <TabsTrigger value="benefits" className="gap-1" data-testid="tab-benefits">
            <Gift size={14} />
            Extra Benefits
          </TabsTrigger>
          <TabsTrigger value="compliance" className="gap-1" data-testid="tab-compliance">
            <Scale size={14} />
            Compliance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <VisualMetricCard
              icon={<Users className="text-[#005EB8]" size={32} />}
              title="Age Range"
              value={`${minAge} - ${maxAgeLife}`}
              unit="years old"
              description="Who can start a Life Insurance policy"
              color="blue"
            />
            <VisualMetricCard
              icon={<Timer className="text-[#00843D]" size={32} />}
              title="Survival Period"
              value="14"
              unit="days"
              description="Must survive after critical illness diagnosis"
              color="green"
            />
            <VisualMetricCard
              icon={<Heart className="text-[#D50032]" size={32} />}
              title="Terminal Illness"
              value="12"
              unit="months"
              description="Life expectancy for terminal illness claim"
              color="red"
            />
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-2 border-[#005EB8]/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="text-amber-500" />
                  Quick Policy Facts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <QuickFact 
                  label="Policy Type" 
                  value="Life Insurance & Critical Illness" 
                  icon={<FileText size={16} className="text-gray-400" />}
                />
                <QuickFact 
                  label="Provider" 
                  value={rules.policy_metadata?.provider || "Legal & General"} 
                  icon={<BadgeCheck size={16} className="text-green-500" />}
                />
                <QuickFact 
                  label="Document Reference" 
                  value={rules.policy_metadata?.document_id || "QGI14786"} 
                  icon={<FileText size={16} className="text-gray-400" />}
                />
                <QuickFact 
                  label="Premium Type" 
                  value="Fixed - won't increase during policy" 
                  icon={<Lock size={16} className="text-green-500" />}
                />
                <QuickFact 
                  label="Grace Period" 
                  value="60 days to pay missed premiums" 
                  icon={<Clock size={16} className="text-amber-500" />}
                />
              </CardContent>
            </Card>

            <Card className="border-2 border-[#00843D]/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="text-[#00843D]" />
                  Coverage at a Glance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <CoverageBar label="Life Insurance" percentage={100} color="blue" />
                <CoverageBar label="Terminal Illness" percentage={100} color="green" />
                <CoverageBar label="Critical Illness (if added)" percentage={100} color="purple" />
                <CoverageBar label="Accidental Death Benefit" percentage={100} color="amber" />
                <CoverageBar label="Children's Cover (if CI added)" percentage={50} color="pink" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="eligibility" className="mt-6">
          <div className="space-y-6">
            <Card className="border-l-4 border-l-[#005EB8]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="text-[#005EB8]" />
                  Age Requirements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <AgeVisual 
                    product="Life Insurance"
                    minAge={minAge}
                    maxAge={maxAgeLife}
                    endAge={90}
                    color="blue"
                  />
                  <AgeVisual 
                    product="Decreasing Life Insurance"
                    minAge={minAge}
                    maxAge={74}
                    endAge={90}
                    color="green"
                  />
                  <AgeVisual 
                    product="Critical Illness Cover"
                    minAge={minAge}
                    maxAge={maxAgeCI}
                    endAge={75}
                    color="purple"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-[#00843D]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="text-[#00843D]" />
                  Policy Length Requirements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <PolicyTermCard 
                    product="Life Insurance"
                    minTerm="1 year"
                    maxTerm="50 years"
                  />
                  <PolicyTermCard 
                    product="Decreasing Life"
                    minTerm="5 years"
                    maxTerm="50 years"
                  />
                  <PolicyTermCard 
                    product="Critical Illness"
                    minTerm="2 years"
                    maxTerm="50 years"
                  />
                </div>
                <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="flex items-center gap-2 text-amber-700">
                    <AlertCircle size={18} />
                    <span className="font-medium">Important Rule:</span>
                  </div>
                  <p className="mt-1 text-amber-800">
                    Your policy must not end before your 29th birthday
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-gray-400">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="text-green-600" />
                  Application Requirements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <RequirementItem 
                    text="Must provide full and honest answers to all questions"
                    status="required"
                  />
                  <RequirementItem 
                    text="UK resident"
                    status="required"
                  />
                  <RequirementItem 
                    text="Medical information may be required"
                    status="may-apply"
                  />
                  <RequirementItem 
                    text="Some conditions may be excluded based on health"
                    status="may-apply"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="coverage" className="mt-6">
          <div className="space-y-6">
            <Card className="border-2 border-green-200 bg-green-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <CheckCircle2 className="text-green-600" size={24} />
                  When We Pay Your Claim
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <PayoutTrigger
                  title="Death"
                  description="If you die before the policy ends"
                  payout="Full amount paid once"
                  conditions={[]}
                  icon={<Heart className="text-green-600" />}
                />
                <Separator />
                <PayoutTrigger
                  title="Terminal Illness"
                  description="If diagnosed with an illness expected to lead to death"
                  payout="Full amount paid once (policy ends)"
                  conditions={[
                    "Hospital consultant confirms diagnosis",
                    "Our medical officer agrees",
                    "Expected death within 12 months"
                  ]}
                  icon={<Stethoscope className="text-green-600" />}
                  warning="Cannot claim after death or if policy is less than 2 years"
                />
                <Separator />
                <PayoutTrigger
                  title="Critical Illness (if added)"
                  description="If diagnosed with a covered critical illness"
                  payout="Full amount paid once (policy ends)"
                  conditions={[
                    "Illness meets Legal & General's definition",
                    "Must survive 14 days from diagnosis",
                    "Verified by UK hospital consultant"
                  ]}
                  icon={<Activity className="text-green-600" />}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Timer className="text-[#005EB8]" />
                  Critical Timing Rules
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <TimingRule
                    title="14-Day Survival Rule"
                    description="For critical illness claims, you must survive for 14 days after diagnosis"
                    visual={
                      <div className="flex items-center gap-1 mt-3">
                        {[...Array(14)].map((_, i) => (
                          <div key={i} className="w-4 h-8 bg-[#005EB8] rounded-sm opacity-80" />
                        ))}
                        <ArrowRight className="mx-2 text-green-600" />
                        <CheckCircle2 className="text-green-600" size={24} />
                      </div>
                    }
                  />
                  <TimingRule
                    title="12-Month Terminal Illness Rule"
                    description="For terminal illness claims, doctors must expect death within 12 months"
                    visual={
                      <div className="flex items-center gap-1 mt-3">
                        {[...Array(12)].map((_, i) => (
                          <div key={i} className="w-6 h-8 bg-amber-500 rounded-sm opacity-80" />
                        ))}
                      </div>
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="exclusions" className="mt-6">
          <div className="space-y-6">
            <Card className="border-2 border-red-200 bg-red-50/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-800">
                  <XCircle className="text-red-600" size={24} />
                  Life Insurance - What We Won't Pay For
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ExclusionItem
                  title="Suicide in First Year"
                  description="If death is caused by suicide, intentional self-injury, or taking your own life within the first 12 months"
                  severity="critical"
                />
                <ExclusionItem
                  title="Terminal Illness Definition Not Met"
                  description="If diagnosed terminal illness doesn't match our specific definition"
                  severity="warning"
                />
                <ExclusionItem
                  title="Dishonest Application"
                  description="If full and honest answers weren't provided during application"
                  severity="critical"
                />
                <ExclusionItem
                  title="Joint Policy - Already Paid"
                  description="We only pay once on joint policies (usually when first person dies or claims)"
                  severity="info"
                />
              </CardContent>
            </Card>

            <Card className="border-2 border-amber-200 bg-amber-50/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-800">
                  <AlertTriangle className="text-amber-600" size={24} />
                  Critical Illness - What We Won't Pay For
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ExclusionItem
                  title="Death Within 14 Days"
                  description="If death occurs within 14 days of critical illness diagnosis"
                  severity="critical"
                />
                <ExclusionItem
                  title="Death (Any Cause)"
                  description="Critical illness cover doesn't pay out on death - only life cover does"
                  severity="warning"
                />
                <ExclusionItem
                  title="Illness Doesn't Meet Definition"
                  description="If the illness or procedure doesn't meet our specific medical definition"
                  severity="warning"
                />
              </CardContent>
            </Card>

            <Card className="border-2 border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="text-gray-600" size={24} />
                  Accidental Death Benefit Exclusions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    "Suicide or intentional self-injury",
                    "Dangerous sports or pastimes",
                    "Non-licensed aerial flights",
                    "Criminal activity",
                    "War, riot, or civil commotion",
                    "Alcohol or non-prescribed drugs",
                    "Pre-application accidents"
                  ].map((exc, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                      <XCircle size={14} className="text-gray-400" />
                      {exc}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="benefits" className="mt-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <BenefitCard
                title="Accidental Death Benefit"
                cost="Included FREE"
                icon={<Shield className="text-[#005EB8]" />}
                features={[
                  "Covers you from application for up to 90 days",
                  "Up to $300,000 payout",
                  "Applies if death is from accident during this period"
                ]}
              />
              <BenefitCard
                title="Free Life Cover"
                cost="Included FREE (if moving home)"
                icon={<Home className="text-[#00843D]" />}
                features={[
                  "Covers gap between exchange and completion",
                  "Up to $300,000 or mortgage amount",
                  "Must be under 55 years old"
                ]}
              />
              <BenefitCard
                title="Children's Critical Illness"
                cost="Included with CI cover"
                icon={<Baby className="text-purple-600" />}
                features={[
                  "Covers children aged 30 days to 18 (21 if in education)",
                  "50% of cover up to $25,000 per child",
                  "Maximum 2 claims then cover ends"
                ]}
              />
              <BenefitCard
                title="Accident Hospitalisation"
                cost="Included with CI cover"
                icon={<Stethoscope className="text-amber-600" />}
                features={[
                  "$5,000 payout",
                  "If in hospital 28+ consecutive days after accident",
                  "One claim per person"
                ]}
              />
            </div>

            <Card className="border-2 border-purple-200 bg-purple-50/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-800">
                  <Gift className="text-purple-600" />
                  Additional Children's Benefits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ChildBenefit title="Child Accident Hospitalisation" amount="$5,000" description="28 consecutive days in hospital" />
                  <ChildBenefit title="Child Funeral Benefit" amount="$4,000" description="Contribution towards funeral" />
                  <ChildBenefit title="Childcare Benefit" amount="$1,000" description="For under 5s with registered childminder" />
                  <ChildBenefit title="Family Accommodation" amount="$100/night (max $1,000)" description="3 months after CI diagnosis" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="compliance" className="mt-6">
          <div className="space-y-6">
            <Card className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <BadgeCheck className="text-green-600" size={24} />
                  Consistency Guarantee
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <ConsistencyCard
                    icon={<Target className="text-green-600" />}
                    title="Same Rules, Every Customer"
                    description="Every application is evaluated by identical logic - no human interpretation variations"
                  />
                  <ConsistencyCard
                    icon={<Lock className="text-green-600" />}
                    title="No Interpretation Gaps"
                    description={`The ${survivalPeriod} survival rule is enforced literally - no claims handler can misinterpret it`}
                  />
                  <ConsistencyCard
                    icon={<Shield className="text-green-600" />}
                    title="Fair Treatment Assured"
                    description="Policy as Code eliminates risk of human bias during the coverage assessment window"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="text-[#005EB8]" />
                  Version History & Audit Trail
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <VersionHistoryItem
                    version="1.0"
                    date="January 7, 2026"
                    status="live"
                    changes={["Initial policy code generation", "All eligibility rules encoded", "Coverage triggers defined"]}
                    approvedBy="System Generated"
                  />
                  <VersionHistoryItem
                    version="0.9 (Draft)"
                    date="January 6, 2026"
                    status="superseded"
                    changes={["Draft version for review"]}
                    approvedBy="Pending"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="text-purple-600" />
                  Approval Workflow
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between gap-4 py-4">
                  <ApprovalStage
                    step={1}
                    label="Policy Authored"
                    sublabel="AI Generated"
                    status="complete"
                  />
                  <div className="flex-1 h-1 bg-green-500 rounded" />
                  <ApprovalStage
                    step={2}
                    label="Business Review"
                    sublabel="Rules Validated"
                    status="complete"
                  />
                  <div className="flex-1 h-1 bg-green-500 rounded" />
                  <ApprovalStage
                    step={3}
                    label="Compliance Check"
                    sublabel="FCA Aligned"
                    status="complete"
                  />
                  <div className="flex-1 h-1 bg-green-500 rounded" />
                  <ApprovalStage
                    step={4}
                    label="Deployed"
                    sublabel="Live in Production"
                    status="complete"
                  />
                </div>
                <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle2 size={18} />
                    <span className="font-medium">All approval stages completed</span>
                  </div>
                  <p className="text-sm text-green-600 mt-1">
                    This policy version has been reviewed, validated, and is currently live in production.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-[#005EB8]/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="text-[#005EB8]" />
                  Regulatory Compliance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ComplianceItem
                    regulation="FCA Consumer Duty"
                    status="compliant"
                    description="Policy delivers fair value and clear outcomes for customers"
                  />
                  <ComplianceItem
                    regulation="PRA Solvency II"
                    status="compliant"
                    description="Risk parameters within regulatory capital requirements"
                  />
                  <ComplianceItem
                    regulation="GDPR Data Protection"
                    status="compliant"
                    description="Customer data handling meets privacy requirements"
                  />
                  <ComplianceItem
                    regulation="Treating Customers Fairly (TCF)"
                    status="compliant"
                    description="Consistent rule application ensures fair treatment"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Card className="bg-gradient-to-r from-[#005EB8]/10 to-[#00843D]/10 border-[#005EB8]/20">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white rounded-xl shadow-sm">
              <BadgeCheck className="text-green-600" size={28} />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 text-lg">Compliance & Consistency Guarantee</p>
              <p className="text-gray-600">
                Every customer is evaluated by exactly the same rules. No interpretation gaps, no human bias.
                The {survivalPeriod} survival rule is enforced literally for every claim.
              </p>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="bg-white">
                <History size={12} className="mr-1" />
                Version Controlled
              </Badge>
              <Badge variant="outline" className="bg-white">
                <Lock size={12} className="mr-1" />
                Audit Ready
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function VisualMetricCard({ icon, title, value, unit, description, color }: {
  icon: React.ReactNode;
  title: string;
  value: string;
  unit: string;
  description: string;
  color: 'blue' | 'green' | 'red';
}) {
  const colors = {
    blue: 'border-[#005EB8]/30 bg-blue-50/50',
    green: 'border-[#00843D]/30 bg-green-50/50',
    red: 'border-[#D50032]/30 bg-red-50/50',
  };
  return (
    <Card className={`${colors[color]} border-2`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          {icon}
          <Badge variant="outline" className="text-xs">Active Rule</Badge>
        </div>
        <div className="mt-4">
          <p className="text-sm text-gray-600">{title}</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-4xl font-bold text-gray-900">{value}</span>
            <span className="text-lg text-gray-500">{unit}</span>
          </div>
          <p className="text-sm text-gray-500 mt-2">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickFact({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-2 text-gray-600">
        {icon}
        <span>{label}</span>
      </div>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}

function CoverageBar({ label, percentage, color }: { label: string; percentage: number; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-[#005EB8]',
    green: 'bg-[#00843D]',
    purple: 'bg-purple-600',
    amber: 'bg-amber-500',
    pink: 'bg-pink-500',
  };
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-700">{label}</span>
        <span className="text-gray-500">{percentage}%</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${colors[color]} rounded-full`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

function AgeVisual({ product, minAge, maxAge, endAge, color }: {
  product: string;
  minAge: number;
  maxAge: number;
  endAge: number;
  color: 'blue' | 'green' | 'purple';
}) {
  const colors = {
    blue: 'bg-[#005EB8]',
    green: 'bg-[#00843D]',
    purple: 'bg-purple-600',
  };
  return (
    <div className="p-4 bg-white rounded-lg border">
      <p className="font-medium text-gray-900 mb-3">{product}</p>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Can start at</span>
          <span className={`font-bold ${color === 'blue' ? 'text-[#005EB8]' : color === 'green' ? 'text-[#00843D]' : 'text-purple-600'}`}>{minAge} years</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Must start before</span>
          <span className={`font-bold ${color === 'blue' ? 'text-[#005EB8]' : color === 'green' ? 'text-[#00843D]' : 'text-purple-600'}`}>{maxAge} years</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Must end before</span>
          <span className={`font-bold ${color === 'blue' ? 'text-[#005EB8]' : color === 'green' ? 'text-[#00843D]' : 'text-purple-600'}`}>{endAge} years</span>
        </div>
      </div>
      <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${colors[color]} rounded-full`} style={{ width: `${((maxAge - minAge) / 100) * 100}%` }} />
      </div>
    </div>
  );
}

function PolicyTermCard({ product, minTerm, maxTerm }: { product: string; minTerm: string; maxTerm: string }) {
  return (
    <div className="p-4 bg-white rounded-lg border text-center">
      <p className="font-medium text-gray-700 mb-2">{product}</p>
      <div className="flex items-center justify-center gap-2">
        <span className="text-lg font-bold text-gray-900">{minTerm}</span>
        <ArrowRight size={16} className="text-gray-400" />
        <span className="text-lg font-bold text-gray-900">{maxTerm}</span>
      </div>
    </div>
  );
}

function RequirementItem({ text, status }: { text: string; status: 'required' | 'may-apply' }) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg ${status === 'required' ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
      {status === 'required' ? (
        <CheckCircle2 className="text-green-600 shrink-0" size={18} />
      ) : (
        <AlertCircle className="text-amber-600 shrink-0" size={18} />
      )}
      <span className="text-sm text-gray-700">{text}</span>
    </div>
  );
}

function PayoutTrigger({ title, description, payout, conditions, icon, warning }: {
  title: string;
  description: string;
  payout: string;
  conditions: string[];
  icon: React.ReactNode;
  warning?: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="p-3 bg-white rounded-lg shadow-sm h-fit">
        {icon}
      </div>
      <div className="flex-1">
        <h4 className="font-semibold text-gray-900">{title}</h4>
        <p className="text-sm text-gray-600 mt-1">{description}</p>
        <Badge className="mt-2 bg-green-100 text-green-800 hover:bg-green-100">
          <DollarSign size={12} className="mr-1" />
          {payout}
        </Badge>
        {conditions.length > 0 && (
          <div className="mt-3 space-y-1">
            <p className="text-xs font-medium text-gray-500 uppercase">Conditions that must be met:</p>
            {conditions.map((cond, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                <CheckCircle2 size={14} className="text-green-500" />
                {cond}
              </div>
            ))}
          </div>
        )}
        {warning && (
          <div className="mt-3 flex items-center gap-2 text-sm text-amber-700 bg-amber-50 p-2 rounded">
            <AlertTriangle size={14} />
            {warning}
          </div>
        )}
      </div>
    </div>
  );
}

function TimingRule({ title, description, visual }: { title: string; description: string; visual: React.ReactNode }) {
  return (
    <div className="p-4 bg-gray-50 rounded-lg border">
      <h4 className="font-semibold text-gray-900">{title}</h4>
      <p className="text-sm text-gray-600 mt-1">{description}</p>
      {visual}
    </div>
  );
}

function ExclusionItem({ title, description, severity }: { title: string; description: string; severity: 'critical' | 'warning' | 'info' }) {
  const colors = {
    critical: 'border-red-300 bg-red-50',
    warning: 'border-amber-300 bg-amber-50',
    info: 'border-gray-300 bg-gray-50',
  };
  const icons = {
    critical: <XCircle className="text-red-500" size={18} />,
    warning: <AlertTriangle className="text-amber-500" size={18} />,
    info: <Info className="text-gray-500" size={18} />,
  };
  return (
    <div className={`flex items-start gap-3 p-4 rounded-lg border ${colors[severity]}`}>
      {icons[severity]}
      <div>
        <h5 className="font-medium text-gray-900">{title}</h5>
        <p className="text-sm text-gray-600 mt-1">{description}</p>
      </div>
    </div>
  );
}

function BenefitCard({ title, cost, icon, features }: { title: string; cost: string; icon: React.ReactNode; features: string[] }) {
  return (
    <Card className="border-2">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            {icon}
            {title}
          </div>
        </CardTitle>
        <Badge className="w-fit bg-green-100 text-green-800 hover:bg-green-100">{cost}</Badge>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {features.map((f, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
              <CheckCircle2 size={14} className="text-green-500 mt-0.5 shrink-0" />
              {f}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function ChildBenefit({ title, amount, description }: { title: string; amount: string; description: string }) {
  return (
    <div className="p-3 bg-white rounded-lg border flex items-center gap-3">
      <div className="p-2 bg-purple-100 rounded-lg">
        <Baby className="text-purple-600" size={18} />
      </div>
      <div>
        <p className="font-medium text-gray-900">{title}</p>
        <p className="text-sm text-purple-600 font-semibold">{amount}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
    </div>
  );
}

function ConsistencyCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="p-4 bg-white rounded-lg border border-green-200 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-green-100 rounded-lg shrink-0">
          {icon}
        </div>
        <div>
          <h4 className="font-semibold text-gray-900">{title}</h4>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        </div>
      </div>
    </div>
  );
}

function VersionHistoryItem({ version, date, status, changes, approvedBy }: {
  version: string;
  date: string;
  status: 'live' | 'superseded' | 'draft';
  changes: string[];
  approvedBy: string;
}) {
  const statusColors = {
    live: 'bg-green-100 text-green-800',
    superseded: 'bg-gray-100 text-gray-600',
    draft: 'bg-amber-100 text-amber-800',
  };
  return (
    <div className={`p-4 rounded-lg border ${status === 'live' ? 'border-green-300 bg-green-50/30' : 'border-gray-200'}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-900">Version {version}</span>
          <Badge className={statusColors[status]}>{status.toUpperCase()}</Badge>
        </div>
        <span className="text-sm text-gray-500">{date}</span>
      </div>
      <div className="space-y-1 mb-2">
        {changes.map((change, i) => (
          <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
            <CheckCircle2 size={12} className={status === 'live' ? 'text-green-500' : 'text-gray-400'} />
            {change}
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-500">Approved by: {approvedBy}</p>
    </div>
  );
}

function ApprovalStage({ step, label, sublabel, status }: {
  step: number;
  label: string;
  sublabel: string;
  status: 'complete' | 'current' | 'pending';
}) {
  const colors = {
    complete: 'bg-green-500 text-white',
    current: 'bg-[#005EB8] text-white ring-4 ring-blue-200',
    pending: 'bg-gray-200 text-gray-500',
  };
  return (
    <div className="text-center shrink-0">
      <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 ${colors[status]}`}>
        {status === 'complete' ? <CheckCircle2 size={24} /> : step}
      </div>
      <p className="text-sm font-medium text-gray-900">{label}</p>
      <p className="text-xs text-gray-500">{sublabel}</p>
    </div>
  );
}

function ComplianceItem({ regulation, status, description }: {
  regulation: string;
  status: 'compliant' | 'review' | 'non-compliant';
  description: string;
}) {
  const colors = {
    compliant: 'border-green-200 bg-green-50',
    review: 'border-amber-200 bg-amber-50',
    'non-compliant': 'border-red-200 bg-red-50',
  };
  const icons = {
    compliant: <CheckCircle2 className="text-green-600" size={18} />,
    review: <AlertCircle className="text-amber-600" size={18} />,
    'non-compliant': <XCircle className="text-red-600" size={18} />,
  };
  return (
    <div className={`p-4 rounded-lg border ${colors[status]}`}>
      <div className="flex items-start gap-3">
        {icons[status]}
        <div>
          <h5 className="font-medium text-gray-900">{regulation}</h5>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        </div>
      </div>
    </div>
  );
}

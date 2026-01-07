import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, Shield, AlertTriangle, Gift, CheckCircle2, XCircle,
  Clock, Calendar, DollarSign, Percent, Info, AlertCircle,
  Zap, Target, FileText, Scale, History, Lightbulb
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import yaml from 'js-yaml';

interface PolicyRuleSet {
  policy_metadata?: {
    provider?: string;
    document_id?: string;
    last_updated?: string;
    policy_type?: string;
  };
  eligibility_rules?: {
    age_limits?: {
      minimum_age?: number;
      maximum_age?: number;
      policy_end_before_age?: number;
    };
    minimum_term?: string;
    requirements?: string[];
  };
  coverage_logic?: {
    life_insurance?: {
      triggers?: string[];
      terminal_illness?: {
        definition?: string;
        survival_period?: string;
      };
    };
    critical_illness?: {
      triggers?: string[];
      survival_period?: string;
      conditions_covered?: string[];
    };
  };
  exclusion_logic?: {
    life_insurance?: {
      exclusions?: string[];
    };
    critical_illness?: {
      exclusions?: string[];
    };
    general?: string[];
  };
  benefits?: {
    additional_benefits?: string[];
    premium_terms?: {
      fixed_premiums?: boolean;
      grace_period?: string;
    };
  };
}

interface BusinessRulesViewerProps {
  yamlCode: string;
  policyName: string;
}

export function BusinessRulesViewer({ yamlCode, policyName }: BusinessRulesViewerProps) {
  const [parseError, setParseError] = useState<string | null>(null);
  
  const rules = useMemo(() => {
    try {
      const parsed = yaml.load(yamlCode) as PolicyRuleSet;
      setParseError(null);
      return parsed;
    } catch (e: any) {
      setParseError(e.message);
      return null;
    }
  }, [yamlCode]);

  if (parseError || !rules) {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 text-amber-700">
            <AlertCircle size={24} />
            <div>
              <p className="font-medium">Unable to parse policy rules</p>
              <p className="text-sm">The generated code format couldn't be interpreted. Showing technical view instead.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6" data-testid="business-rules-viewer">
      <div className="bg-gradient-to-r from-[#005EB8]/10 to-[#00843D]/10 rounded-xl p-6 border border-[#005EB8]/20">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2" data-testid="text-policy-name">
              <Scale className="text-[#005EB8]" />
              {policyName}
            </h2>
            <p className="text-sm text-gray-600 mt-1" data-testid="text-single-source-truth">
              Single Source of Truth - These rules are exactly what the system executes
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200" data-testid="badge-policy-status">
              <CheckCircle2 size={12} className="mr-1" />
              Active
            </Badge>
            {rules.policy_metadata?.document_id && (
              <Badge variant="outline" data-testid="badge-document-id">
                <FileText size={12} className="mr-1" />
                {rules.policy_metadata.document_id}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <RuleCard
          icon={<Users className="text-[#005EB8]" />}
          title="Eligibility Rules"
          subtitle="Who can apply for this policy"
          color="blue"
        >
          {rules.eligibility_rules?.age_limits && (
            <div className="space-y-3">
              <RuleItem 
                label="Minimum Age" 
                value={`${rules.eligibility_rules.age_limits.minimum_age || 18} years`}
                icon={<Calendar size={14} />}
                testId="text-rule-eligibility-min-age"
              />
              <RuleItem 
                label="Maximum Age at Start" 
                value={`${rules.eligibility_rules.age_limits.maximum_age || 'N/A'} years`}
                icon={<Calendar size={14} />}
                highlight
                testId="text-rule-eligibility-max-age"
              />
              {rules.eligibility_rules.age_limits.policy_end_before_age && (
                <RuleItem 
                  label="Policy Must End Before Age" 
                  value={`${rules.eligibility_rules.age_limits.policy_end_before_age} years`}
                  icon={<Clock size={14} />}
                  testId="text-rule-eligibility-end-age"
                />
              )}
            </div>
          )}
          {rules.eligibility_rules?.requirements && rules.eligibility_rules.requirements.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-medium text-gray-500 mb-2">REQUIREMENTS</p>
              <ul className="space-y-1" data-testid="list-requirements">
                {rules.eligibility_rules.requirements.map((req, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm" data-testid={`text-requirement-${i}`}>
                    <CheckCircle2 size={14} className="text-green-600 mt-0.5 shrink-0" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </RuleCard>

        <RuleCard
          icon={<Shield className="text-[#00843D]" />}
          title="Coverage Logic"
          subtitle="What triggers a payout"
          color="green"
        >
          {rules.coverage_logic?.life_insurance && (
            <div className="space-y-3">
              <p className="text-xs font-medium text-gray-500">LIFE INSURANCE</p>
              {rules.coverage_logic.life_insurance.triggers?.map((trigger, i) => (
                <div key={i} className="flex items-center gap-2 text-sm bg-green-50 p-2 rounded">
                  <Zap size={14} className="text-green-600" />
                  <span>{trigger}</span>
                </div>
              ))}
              {rules.coverage_logic.life_insurance.terminal_illness && (
                <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 mt-3">
                  <p className="text-xs font-medium text-amber-700 mb-1">TERMINAL ILLNESS RULE</p>
                  <p className="text-sm">{rules.coverage_logic.life_insurance.terminal_illness.definition}</p>
                  {rules.coverage_logic.life_insurance.terminal_illness.survival_period && (
                    <Badge className="mt-2 bg-amber-100 text-amber-800 hover:bg-amber-100">
                      <Clock size={12} className="mr-1" />
                      {rules.coverage_logic.life_insurance.terminal_illness.survival_period}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          )}
          {rules.coverage_logic?.critical_illness && (
            <div className="space-y-3 mt-4">
              <p className="text-xs font-medium text-gray-500">CRITICAL ILLNESS</p>
              {rules.coverage_logic.critical_illness.survival_period && (
                <div className="flex items-center gap-2 bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <Clock size={16} className="text-blue-600" />
                  <div>
                    <p className="text-xs text-blue-600 font-medium">SURVIVAL PERIOD</p>
                    <p className="text-sm font-semibold">{rules.coverage_logic.critical_illness.survival_period}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </RuleCard>

        <RuleCard
          icon={<AlertTriangle className="text-[#D50032]" />}
          title="Exclusions"
          subtitle="What is NOT covered"
          color="red"
        >
          {rules.exclusion_logic?.life_insurance?.exclusions && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-500">LIFE INSURANCE EXCLUSIONS</p>
              {rules.exclusion_logic.life_insurance.exclusions.map((exc, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <XCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
                  <span>{exc}</span>
                </div>
              ))}
            </div>
          )}
          {rules.exclusion_logic?.critical_illness?.exclusions && (
            <div className="space-y-2 mt-4">
              <p className="text-xs font-medium text-gray-500">CRITICAL ILLNESS EXCLUSIONS</p>
              {rules.exclusion_logic.critical_illness.exclusions.map((exc, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <XCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
                  <span>{exc}</span>
                </div>
              ))}
            </div>
          )}
          {rules.exclusion_logic?.general && rules.exclusion_logic.general.length > 0 && (
            <div className="space-y-2 mt-4">
              <p className="text-xs font-medium text-gray-500">GENERAL EXCLUSIONS</p>
              {rules.exclusion_logic.general.map((exc, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <XCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
                  <span>{exc}</span>
                </div>
              ))}
            </div>
          )}
        </RuleCard>

        <RuleCard
          icon={<Gift className="text-purple-600" />}
          title="Benefits"
          subtitle="Additional coverage and terms"
          color="purple"
        >
          {rules.benefits?.additional_benefits && rules.benefits.additional_benefits.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-500">ADDITIONAL BENEFITS</p>
              {rules.benefits.additional_benefits.map((benefit, i) => (
                <div key={i} className="flex items-start gap-2 text-sm bg-purple-50 p-2 rounded">
                  <Gift size={14} className="text-purple-600 mt-0.5 shrink-0" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          )}
          {rules.benefits?.premium_terms && (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-medium text-gray-500">PREMIUM TERMS</p>
              {rules.benefits.premium_terms.fixed_premiums !== undefined && (
                <RuleItem 
                  label="Fixed Premiums" 
                  value={rules.benefits.premium_terms.fixed_premiums ? "Yes" : "No"}
                  icon={<DollarSign size={14} />}
                />
              )}
              {rules.benefits.premium_terms.grace_period && (
                <RuleItem 
                  label="Grace Period" 
                  value={rules.benefits.premium_terms.grace_period}
                  icon={<Clock size={14} />}
                />
              )}
            </div>
          )}
        </RuleCard>
      </div>

      <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <Lightbulb className="text-amber-500" size={20} />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">Compliance Guarantee</p>
              <p className="text-sm text-gray-600">
                Every customer is treated according to the same logic. No interpretation gaps, no human bias.
                These rules are version-controlled for full audit trail.
              </p>
            </div>
            <Badge variant="outline" className="bg-white">
              <History size={12} className="mr-1" />
              Version Tracked
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function RuleCard({ 
  icon, 
  title, 
  subtitle, 
  color, 
  children 
}: { 
  icon: React.ReactNode; 
  title: string; 
  subtitle: string; 
  color: 'blue' | 'green' | 'red' | 'purple';
  children: React.ReactNode;
}) {
  const colorClasses = {
    blue: 'border-blue-200 bg-blue-50/30',
    green: 'border-green-200 bg-green-50/30',
    red: 'border-red-200 bg-red-50/30',
    purple: 'border-purple-200 bg-purple-50/30',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={`h-full ${colorClasses[color]}`}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            {icon}
            <div>
              <span>{title}</span>
              <p className="text-xs font-normal text-gray-500">{subtitle}</p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {children}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function RuleItem({ 
  label, 
  value, 
  icon, 
  highlight,
  testId
}: { 
  label: string; 
  value: string; 
  icon?: React.ReactNode;
  highlight?: boolean;
  testId?: string;
}) {
  return (
    <div 
      className={`flex items-center justify-between p-2 rounded ${highlight ? 'bg-amber-50 border border-amber-200' : 'bg-white'}`}
      data-testid={testId}
    >
      <div className="flex items-center gap-2 text-sm text-gray-600">
        {icon}
        <span>{label}</span>
      </div>
      <span className={`font-semibold ${highlight ? 'text-amber-700' : 'text-gray-900'}`}>{value}</span>
    </div>
  );
}

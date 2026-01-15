import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Beaker, TrendingUp, TrendingDown, Users, AlertCircle, 
  CheckCircle2, ArrowRight, RotateCcw, Sparkles, Calculator,
  Calendar, Percent, Database, BarChart3, PieChart, Clock,
  FileText, History, RefreshCw, Play, Pause, Settings2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import yaml from 'js-yaml';

interface WhatIfPanelProps {
  yamlCode: string;
  policyName: string;
}

interface ScenarioResult {
  eligibilityChange: number;
  riskImpact: 'low' | 'medium' | 'high';
  complianceNotes: string[];
  projectedCustomers: number;
  revenueImpact: string;
  historicalImpact: {
    wouldHaveBeenEligible: number;
    additionalClaims: number;
    claimsValue: string;
  };
}

const HISTORICAL_DATA = {
  totalApplications: 245000,
  approvedPolicies: 189000,
  rejectedAge: 12500,
  rejectedHealth: 28000,
  rejectedOther: 15500,
  claimsSubmitted: 8200,
  claimsPaid: 7100,
  averageClaimValue: 125000,
};

export function WhatIfPanel({ yamlCode, policyName }: WhatIfPanelProps) {
  const [maxAge, setMaxAge] = useState(77);
  const [minAge, setMinAge] = useState(18);
  const [survivalDays, setSurvivalDays] = useState(14);
  const [terminalMonths, setTerminalMonths] = useState(12);
  const [includeTerminalIllness, setIncludeTerminalIllness] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationProgress, setSimulationProgress] = useState(0);

  const originalValues = useMemo(() => {
    try {
      const parsed = yaml.load(yamlCode) as any;
      const maxAgeVal = parsed?.eligibility_rules?.maximum_purchase_ages?.life_insurance || 
                        parsed?.eligibility_rules?.age_limits?.maximum_age || 77;
      const minAgeVal = parsed?.eligibility_rules?.minimum_age || 
                        parsed?.eligibility_rules?.age_limits?.minimum_age || 18;
      const survivalStr = parsed?.coverage_logic?.critical_illness_cover?.triggers?.[0]?.survival_period ||
                          parsed?.coverage_logic?.critical_illness?.survival_period || '14';
      const survivalMatch = survivalStr.toString().match(/\d+/);
      
      return {
        maxAge: maxAgeVal,
        minAge: minAgeVal,
        survivalDays: survivalMatch ? parseInt(survivalMatch[0]) : 14,
        terminalMonths: 12,
      };
    } catch {
      return { maxAge: 77, minAge: 18, survivalDays: 14, terminalMonths: 12 };
    }
  }, [yamlCode]);

  useEffect(() => {
    setMaxAge(originalValues.maxAge);
    setMinAge(originalValues.minAge);
    setSurvivalDays(originalValues.survivalDays);
    setTerminalMonths(originalValues.terminalMonths);
  }, [originalValues]);

  const handleReset = () => {
    setMaxAge(originalValues.maxAge);
    setMinAge(originalValues.minAge);
    setSurvivalDays(originalValues.survivalDays);
    setTerminalMonths(originalValues.terminalMonths);
    setIncludeTerminalIllness(true);
    setHasChanges(false);
    setShowResults(false);
  };

  const handleChange = (setter: (val: number) => void, val: number) => {
    setter(val);
    setHasChanges(true);
    setShowResults(false);
  };

  const runScenario = async () => {
    setIsSimulating(true);
    setSimulationProgress(0);
    
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 80));
      setSimulationProgress(i);
    }
    
    setIsSimulating(false);
    setShowResults(true);
  };

  const scenarioResult = useMemo((): ScenarioResult => {
    const ageDiff = maxAge - originalValues.maxAge;
    const minAgeDiff = originalValues.minAge - minAge;
    const survivalDiff = originalValues.survivalDays - survivalDays;
    const terminalDiff = terminalMonths - originalValues.terminalMonths;
    
    let eligibilityChange = ageDiff * 2.3 + minAgeDiff * 1.5;
    if (!includeTerminalIllness) eligibilityChange -= 5;
    if (survivalDiff > 0) eligibilityChange += survivalDiff * 0.8;
    if (survivalDiff < 0) eligibilityChange += survivalDiff * 0.5;
    if (terminalDiff !== 0) eligibilityChange += terminalDiff * 0.3;
    
    const projectedCustomers = Math.round(HISTORICAL_DATA.approvedPolicies * (1 + eligibilityChange / 100));
    
    const wouldHaveBeenEligible = Math.round(
      (ageDiff > 0 ? HISTORICAL_DATA.rejectedAge * (ageDiff / 10) : 0) +
      (minAgeDiff > 0 ? HISTORICAL_DATA.rejectedAge * (minAgeDiff / 5) * 0.3 : 0)
    );
    
    const additionalClaimsRatio = survivalDiff > 0 ? survivalDiff * 0.02 : 0;
    const additionalClaims = Math.round(HISTORICAL_DATA.claimsPaid * additionalClaimsRatio);
    const claimsValue = additionalClaims * HISTORICAL_DATA.averageClaimValue;
    
    let riskImpact: 'low' | 'medium' | 'high' = 'low';
    if (Math.abs(eligibilityChange) > 10 || additionalClaims > 50) riskImpact = 'medium';
    if (Math.abs(eligibilityChange) > 20 || !includeTerminalIllness || additionalClaims > 200) riskImpact = 'high';
    
    const complianceNotes: string[] = [];
    if (maxAge > 80) complianceNotes.push('Maximum age exceeds industry standard (80). Requires actuarial review.');
    if (minAge < 18) complianceNotes.push('Cannot set minimum age below 18 (FCA regulatory requirement).');
    if (survivalDays < 7) complianceNotes.push('Survival period below 7 days significantly increases fraud risk.');
    if (survivalDays === 0) complianceNotes.push('Zero survival period is unprecedented. Board approval required.');
    if (!includeTerminalIllness) complianceNotes.push('Removing terminal illness cover requires board approval and FCA notification.');
    if (ageDiff > 5) complianceNotes.push('Significant age expansion (+5 years) requires premium recalculation by actuarial team.');
    if (terminalMonths > 12) complianceNotes.push('Extended terminal illness period (>12 months) increases claims exposure.');
    if (wouldHaveBeenEligible > 1000) complianceNotes.push(`Large customer expansion (${wouldHaveBeenEligible.toLocaleString()}) requires capacity review.`);
    
    const revenueImpact = eligibilityChange > 0 
      ? `+$${Math.round(eligibilityChange * 125000).toLocaleString()} annual premium`
      : `${eligibilityChange < 0 ? '-' : ''}$${Math.abs(Math.round(eligibilityChange * 125000)).toLocaleString()} annual premium`;

    return { 
      eligibilityChange, 
      riskImpact, 
      complianceNotes, 
      projectedCustomers, 
      revenueImpact,
      historicalImpact: {
        wouldHaveBeenEligible,
        additionalClaims,
        claimsValue: `$${claimsValue.toLocaleString()}`
      }
    };
  }, [maxAge, minAge, survivalDays, terminalMonths, includeTerminalIllness, originalValues]);

  return (
    <div className="space-y-6" data-testid="whatif-panel">
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Beaker size={28} />
              <h2 className="text-2xl font-bold">What-If Scenario Testing</h2>
            </div>
            <p className="text-white/80">
              Test policy changes against {HISTORICAL_DATA.totalApplications.toLocaleString()} historical applications
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge className="bg-white/20 text-white border-white/30">
              <Database size={12} className="mr-1" />
              Historical Data: 3 Years
            </Badge>
            <Badge className="bg-white/20 text-white border-white/30">
              <BarChart3 size={12} className="mr-1" />
              {HISTORICAL_DATA.claimsSubmitted.toLocaleString()} Claims Analyzed
            </Badge>
          </div>
        </div>
      </div>

      <Tabs defaultValue="parameters" className="w-full">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="parameters" className="gap-1">
            <Settings2 size={14} />
            Adjust Parameters
          </TabsTrigger>
          <TabsTrigger value="historical" className="gap-1">
            <History size={14} />
            Historical Impact
          </TabsTrigger>
          <TabsTrigger value="compliance" className="gap-1">
            <FileText size={14} />
            Compliance Review
          </TabsTrigger>
        </TabsList>

        <TabsContent value="parameters" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="text-purple-600" />
                  Eligibility Parameters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <ParameterSlider
                  label="Maximum Entry Age (Life Insurance)"
                  value={maxAge}
                  originalValue={originalValues.maxAge}
                  min={60}
                  max={90}
                  unit="years"
                  onChange={(val) => handleChange(setMaxAge, val)}
                  testId="slider-max-age"
                />
                
                <ParameterSlider
                  label="Minimum Entry Age"
                  value={minAge}
                  originalValue={originalValues.minAge}
                  min={16}
                  max={25}
                  unit="years"
                  onChange={(val) => handleChange(setMinAge, val)}
                  testId="slider-min-age"
                />

                <ParameterSlider
                  label="Critical Illness Survival Period"
                  value={survivalDays}
                  originalValue={originalValues.survivalDays}
                  min={0}
                  max={30}
                  unit="days"
                  onChange={(val) => handleChange(setSurvivalDays, val)}
                  testId="slider-survival-days"
                  description="Customer must survive this many days after diagnosis to claim"
                />

                <ParameterSlider
                  label="Terminal Illness Life Expectancy"
                  value={terminalMonths}
                  originalValue={originalValues.terminalMonths}
                  min={6}
                  max={24}
                  unit="months"
                  onChange={(val) => handleChange(setTerminalMonths, val)}
                  testId="slider-terminal-months"
                  description="Doctors must expect death within this period"
                />

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                  <div>
                    <Label className="flex items-center gap-2 cursor-pointer font-medium">
                      Include Terminal Illness Cover
                    </Label>
                    <p className="text-sm text-gray-500 mt-1">
                      Allows early payout for terminal diagnosis
                    </p>
                  </div>
                  <Switch
                    checked={includeTerminalIllness}
                    onCheckedChange={(checked) => {
                      setIncludeTerminalIllness(checked);
                      setHasChanges(true);
                      setShowResults(false);
                    }}
                    data-testid="switch-terminal-illness"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="border-2 border-purple-200">
                <CardContent className="p-6">
                  <div className="flex gap-3">
                    <Button 
                      className="flex-1 bg-purple-600 hover:bg-purple-700 h-12 text-lg"
                      onClick={runScenario}
                      disabled={!hasChanges || isSimulating}
                      data-testid="button-run-scenario"
                    >
                      {isSimulating ? (
                        <>
                          <RefreshCw size={18} className="mr-2 animate-spin" />
                          Simulating...
                        </>
                      ) : (
                        <>
                          <Play size={18} className="mr-2" />
                          Run Scenario Against Historical Data
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={handleReset}
                      disabled={!hasChanges}
                      className="h-12"
                      data-testid="button-reset-scenario"
                    >
                      <RotateCcw size={18} />
                    </Button>
                  </div>
                  
                  {isSimulating && (
                    <div className="mt-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Analyzing {HISTORICAL_DATA.totalApplications.toLocaleString()} applications...</span>
                        <span>{simulationProgress}%</span>
                      </div>
                      <Progress value={simulationProgress} className="h-2" />
                    </div>
                  )}
                </CardContent>
              </Card>

              <AnimatePresence>
                {showResults && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-4"
                  >
                    <Card className={`border-2 ${
                      scenarioResult.eligibilityChange > 0 ? 'border-green-300 bg-green-50' : 
                      scenarioResult.eligibilityChange < 0 ? 'border-red-300 bg-red-50' : 
                      'border-gray-300 bg-gray-50'
                    }`}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-sm font-medium text-gray-600">Customer Eligibility Impact</span>
                          <div className="flex items-center gap-2">
                            {scenarioResult.eligibilityChange > 0 ? (
                              <TrendingUp className="text-green-600" size={24} />
                            ) : scenarioResult.eligibilityChange < 0 ? (
                              <TrendingDown className="text-red-600" size={24} />
                            ) : null}
                            <span className={`text-3xl font-bold ${
                              scenarioResult.eligibilityChange > 0 ? 'text-green-600' : 
                              scenarioResult.eligibilityChange < 0 ? 'text-red-600' : 
                              'text-gray-600'
                            }`}>
                              {scenarioResult.eligibilityChange > 0 ? '+' : ''}{scenarioResult.eligibilityChange.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-6">
                          <ResultMetric 
                            label="Projected Customers" 
                            value={scenarioResult.projectedCustomers.toLocaleString()}
                            subtext={`vs ${HISTORICAL_DATA.approvedPolicies.toLocaleString()} current`}
                          />
                          <ResultMetric 
                            label="Revenue Impact" 
                            value={scenarioResult.revenueImpact}
                            subtext="Annual premium change"
                          />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <span className="font-medium text-gray-900">Risk Assessment</span>
                          <Badge variant={
                            scenarioResult.riskImpact === 'low' ? 'secondary' :
                            scenarioResult.riskImpact === 'medium' ? 'default' : 'destructive'
                          } className="text-sm px-3 py-1">
                            {scenarioResult.riskImpact.toUpperCase()} RISK
                          </Badge>
                        </div>
                        
                        {scenarioResult.complianceNotes.length > 0 ? (
                          <div className="space-y-2">
                            {scenarioResult.complianceNotes.slice(0, 3).map((note, i) => (
                              <div key={i} className="flex items-start gap-2 text-sm">
                                <AlertCircle size={16} className="text-amber-500 mt-0.5 shrink-0" />
                                <span className="text-gray-700">{note}</span>
                              </div>
                            ))}
                            {scenarioResult.complianceNotes.length > 3 && (
                              <p className="text-sm text-gray-500 ml-6">
                                +{scenarioResult.complianceNotes.length - 3} more compliance notes
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle2 size={18} />
                            <span className="font-medium">No compliance concerns identified</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>

              {!showResults && !hasChanges && (
                <Card className="border-2 border-dashed border-gray-300">
                  <CardContent className="p-8 text-center">
                    <Beaker size={48} className="mx-auto mb-3 text-gray-300" />
                    <p className="font-medium text-gray-600">Adjust Parameters Above</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Then click "Run Scenario" to see how changes would have affected historical customers
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="historical" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Database className="text-[#005EB8]" />
                  Historical Application Data
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <HistoricalStat label="Total Applications" value={HISTORICAL_DATA.totalApplications} color="blue" />
                <HistoricalStat label="Approved Policies" value={HISTORICAL_DATA.approvedPolicies} color="green" />
                <HistoricalStat label="Rejected - Age" value={HISTORICAL_DATA.rejectedAge} color="amber" />
                <HistoricalStat label="Rejected - Health" value={HISTORICAL_DATA.rejectedHealth} color="red" />
                <HistoricalStat label="Rejected - Other" value={HISTORICAL_DATA.rejectedOther} color="gray" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <PieChart className="text-[#00843D]" />
                  Claims Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <HistoricalStat label="Claims Submitted" value={HISTORICAL_DATA.claimsSubmitted} color="blue" />
                <HistoricalStat label="Claims Paid" value={HISTORICAL_DATA.claimsPaid} color="green" />
                <HistoricalStat label="Average Claim Value" value={`$${HISTORICAL_DATA.averageClaimValue.toLocaleString()}`} color="purple" isText />
                <HistoricalStat label="Total Paid Out" value={`$${(HISTORICAL_DATA.claimsPaid * HISTORICAL_DATA.averageClaimValue).toLocaleString()}`} color="green" isText />
              </CardContent>
            </Card>

            {showResults && (
              <Card className="md:col-span-2 border-2 border-purple-200">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="text-purple-600" />
                    Simulated Impact on Historical Data
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Based on analysis of {HISTORICAL_DATA.totalApplications.toLocaleString()} historical applications over the past 3 years:
                  </p>
                  <div className="grid grid-cols-3 gap-6">
                    <ImpactCard
                      title="Previously Rejected Customers Who Would Now Qualify"
                      value={scenarioResult.historicalImpact.wouldHaveBeenEligible.toLocaleString()}
                      description={`Out of ${HISTORICAL_DATA.rejectedAge.toLocaleString()} age-related rejections, this many would now be eligible`}
                      trend={scenarioResult.historicalImpact.wouldHaveBeenEligible > 0 ? 'up' : 'neutral'}
                    />
                    <ImpactCard
                      title="Additional Claims Expected"
                      value={scenarioResult.historicalImpact.additionalClaims.toLocaleString()}
                      description="Extra claims that would have been paid"
                      trend={scenarioResult.historicalImpact.additionalClaims > 0 ? 'warning' : 'neutral'}
                    />
                    <ImpactCard
                      title="Additional Claims Cost"
                      value={scenarioResult.historicalImpact.claimsValue}
                      description="Total value of additional claims"
                      trend={scenarioResult.historicalImpact.additionalClaims > 0 ? 'warning' : 'neutral'}
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="compliance" className="mt-6">
          <div className="space-y-6">
            <Card className={`border-2 ${
              scenarioResult.riskImpact === 'low' ? 'border-green-200 bg-green-50/30' :
              scenarioResult.riskImpact === 'medium' ? 'border-amber-200 bg-amber-50/30' :
              'border-red-200 bg-red-50/30'
            }`}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className={
                      scenarioResult.riskImpact === 'low' ? 'text-green-600' :
                      scenarioResult.riskImpact === 'medium' ? 'text-amber-600' :
                      'text-red-600'
                    } />
                    Compliance Assessment
                  </div>
                  <Badge variant={
                    scenarioResult.riskImpact === 'low' ? 'secondary' :
                    scenarioResult.riskImpact === 'medium' ? 'default' : 'destructive'
                  } className="text-sm">
                    {scenarioResult.riskImpact.toUpperCase()} RISK
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {scenarioResult.complianceNotes.length > 0 ? (
                  <div className="space-y-3">
                    {scenarioResult.complianceNotes.map((note, i) => (
                      <ComplianceNote key={i} note={note} />
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-3 text-green-700 p-4 bg-green-100 rounded-lg">
                    <CheckCircle2 size={24} />
                    <div>
                      <p className="font-medium">All Clear</p>
                      <p className="text-sm">No compliance concerns with these parameter changes</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="text-gray-600" />
                  Approval Workflow
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <ApprovalStep 
                    step={1} 
                    label="Business Review" 
                    status={hasChanges ? 'current' : 'pending'} 
                  />
                  <ArrowRight className="text-gray-300" />
                  <ApprovalStep 
                    step={2} 
                    label="Actuarial Review" 
                    status={scenarioResult.riskImpact !== 'low' ? 'required' : 'optional'} 
                  />
                  <ArrowRight className="text-gray-300" />
                  <ApprovalStep 
                    step={3} 
                    label="Compliance Sign-off" 
                    status={scenarioResult.complianceNotes.length > 0 ? 'required' : 'optional'} 
                  />
                  <ArrowRight className="text-gray-300" />
                  <ApprovalStep 
                    step={4} 
                    label="Deploy to Production" 
                    status="pending" 
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button className="flex-1 bg-[#005EB8] hover:bg-[#004a93]" disabled={!showResults}>
                <FileText size={16} className="mr-2" />
                Generate Compliance Report
              </Button>
              <Button variant="outline" disabled={!showResults}>
                <Sparkles size={16} className="mr-2" />
                Submit for Review
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ParameterSlider({ label, value, originalValue, min, max, unit, onChange, testId, description }: {
  label: string;
  value: number;
  originalValue: number;
  min: number;
  max: number;
  unit: string;
  onChange: (val: number) => void;
  testId: string;
  description?: string;
}) {
  const hasChanged = value !== originalValue;
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <Label className="font-medium">{label}</Label>
        <Badge variant={hasChanged ? "default" : "secondary"} className={hasChanged ? 'bg-purple-600' : ''}>
          {value} {unit}
        </Badge>
      </div>
      {description && (
        <p className="text-xs text-gray-500 mb-2">{description}</p>
      )}
      <Slider
        value={[value]}
        onValueChange={([val]) => onChange(val)}
        min={min}
        max={max}
        step={1}
        className="w-full"
        data-testid={testId}
      />
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>{min} {unit}</span>
        <span className={hasChanged ? 'text-purple-600 font-medium' : ''}>
          Current: {originalValue} {unit}
        </span>
        <span>{max} {unit}</span>
      </div>
    </div>
  );
}

function ResultMetric({ label, value, subtext }: { label: string; value: string; subtext: string }) {
  return (
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{subtext}</p>
    </div>
  );
}

function HistoricalStat({ label, value, color, isText }: { label: string; value: number | string; color: string; isText?: boolean }) {
  const colors: Record<string, string> = {
    blue: 'text-[#005EB8]',
    green: 'text-green-600',
    amber: 'text-amber-600',
    red: 'text-red-600',
    gray: 'text-gray-600',
    purple: 'text-purple-600',
  };
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
      <span className="text-gray-600">{label}</span>
      <span className={`font-semibold ${colors[color]}`}>
        {isText ? value : (value as number).toLocaleString()}
      </span>
    </div>
  );
}

function ImpactCard({ title, value, description, trend }: { 
  title: string; 
  value: string; 
  description: string; 
  trend: 'up' | 'warning' | 'neutral';
}) {
  const colors = {
    up: 'text-green-600',
    warning: 'text-amber-600',
    neutral: 'text-gray-600',
  };
  return (
    <div className="text-center p-4 bg-white rounded-lg border">
      <p className="text-sm text-gray-500 mb-1">{title}</p>
      <p className={`text-3xl font-bold ${colors[trend]}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-1">{description}</p>
    </div>
  );
}

function ComplianceNote({ note }: { note: string }) {
  const isWarning = note.includes('require') || note.includes('FCA') || note.includes('board');
  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg ${isWarning ? 'bg-amber-50 border border-amber-200' : 'bg-gray-50 border border-gray-200'}`}>
      <AlertCircle size={18} className={isWarning ? 'text-amber-500' : 'text-gray-500'} />
      <span className="text-sm text-gray-700">{note}</span>
    </div>
  );
}

function ApprovalStep({ step, label, status }: { step: number; label: string; status: 'current' | 'required' | 'optional' | 'pending' }) {
  const colors = {
    current: 'bg-purple-600 text-white',
    required: 'bg-amber-500 text-white',
    optional: 'bg-gray-200 text-gray-600',
    pending: 'bg-gray-100 text-gray-400',
  };
  return (
    <div className="text-center">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 ${colors[status]}`}>
        {step}
      </div>
      <p className="text-xs font-medium text-gray-700">{label}</p>
      <p className="text-xs text-gray-500">{status === 'required' ? 'Required' : status === 'optional' ? 'Optional' : ''}</p>
    </div>
  );
}

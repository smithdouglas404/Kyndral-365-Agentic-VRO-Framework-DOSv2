import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Beaker, TrendingUp, TrendingDown, Users, AlertCircle, 
  CheckCircle2, ArrowRight, RotateCcw, Sparkles, Calculator,
  Calendar, Percent
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
}

const MOCK_BASE_CUSTOMERS = 125000;

export function WhatIfPanel({ yamlCode, policyName }: WhatIfPanelProps) {
  const [maxAge, setMaxAge] = useState(77);
  const [minAge, setMinAge] = useState(18);
  const [survivalDays, setSurvivalDays] = useState(14);
  const [includeTerminalIllness, setIncludeTerminalIllness] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const originalValues = useMemo(() => {
    try {
      const parsed = yaml.load(yamlCode) as any;
      return {
        maxAge: parsed?.eligibility_rules?.age_limits?.maximum_age || 77,
        minAge: parsed?.eligibility_rules?.age_limits?.minimum_age || 18,
        survivalDays: parseInt(parsed?.coverage_logic?.critical_illness?.survival_period?.match(/\d+/)?.[0] || '14'),
      };
    } catch {
      return { maxAge: 77, minAge: 18, survivalDays: 14 };
    }
  }, [yamlCode]);

  const handleReset = () => {
    setMaxAge(originalValues.maxAge);
    setMinAge(originalValues.minAge);
    setSurvivalDays(originalValues.survivalDays);
    setIncludeTerminalIllness(true);
    setHasChanges(false);
    setShowResults(false);
  };

  const handleChange = (setter: (val: number) => void, val: number) => {
    setter(val);
    setHasChanges(true);
    setShowResults(false);
  };

  const runScenario = () => {
    setShowResults(true);
  };

  const scenarioResult = useMemo((): ScenarioResult => {
    const ageDiff = maxAge - originalValues.maxAge;
    const minAgeDiff = originalValues.minAge - minAge;
    const survivalDiff = originalValues.survivalDays - survivalDays;
    
    let eligibilityChange = ageDiff * 2.3 + minAgeDiff * 1.5;
    if (!includeTerminalIllness) eligibilityChange -= 5;
    if (survivalDiff > 0) eligibilityChange += survivalDiff * 0.8;
    if (survivalDiff < 0) eligibilityChange += survivalDiff * 0.5;
    
    const projectedCustomers = Math.round(MOCK_BASE_CUSTOMERS * (1 + eligibilityChange / 100));
    
    let riskImpact: 'low' | 'medium' | 'high' = 'low';
    if (Math.abs(eligibilityChange) > 10) riskImpact = 'medium';
    if (Math.abs(eligibilityChange) > 20 || !includeTerminalIllness) riskImpact = 'high';
    
    const complianceNotes: string[] = [];
    if (maxAge > 80) complianceNotes.push('Maximum age exceeds industry standard. Requires actuarial review.');
    if (minAge < 18) complianceNotes.push('Cannot set minimum age below 18 (regulatory requirement).');
    if (survivalDays < 7) complianceNotes.push('Survival period below 7 days may increase fraud risk.');
    if (!includeTerminalIllness) complianceNotes.push('Removing terminal illness cover requires board approval.');
    if (ageDiff > 5) complianceNotes.push('Significant age expansion requires premium recalculation.');
    
    const revenueImpact = eligibilityChange > 0 
      ? `+£${Math.round(eligibilityChange * 125000).toLocaleString()} annual premium`
      : `${eligibilityChange < 0 ? '-' : ''}£${Math.abs(Math.round(eligibilityChange * 125000)).toLocaleString()} annual premium`;

    return { eligibilityChange, riskImpact, complianceNotes, projectedCustomers, revenueImpact };
  }, [maxAge, minAge, survivalDays, includeTerminalIllness, originalValues]);

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Beaker className="text-purple-600" />
            What-If Scenario Testing
          </CardTitle>
          <p className="text-sm text-gray-600">
            Test changes to policy parameters and see projected impact before making any updates
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="flex items-center gap-2">
                    <Calendar size={14} />
                    Maximum Entry Age
                  </Label>
                  <Badge variant={maxAge !== originalValues.maxAge ? "default" : "secondary"}>
                    {maxAge} years
                  </Badge>
                </div>
                <Slider
                  value={[maxAge]}
                  onValueChange={([val]) => handleChange(setMaxAge, val)}
                  min={60}
                  max={90}
                  step={1}
                  className="w-full"
                  data-testid="slider-max-age"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>60</span>
                  <span className="text-purple-600">Current: {originalValues.maxAge}</span>
                  <span>90</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="flex items-center gap-2">
                    <Calendar size={14} />
                    Minimum Entry Age
                  </Label>
                  <Badge variant={minAge !== originalValues.minAge ? "default" : "secondary"}>
                    {minAge} years
                  </Badge>
                </div>
                <Slider
                  value={[minAge]}
                  onValueChange={([val]) => handleChange(setMinAge, val)}
                  min={16}
                  max={25}
                  step={1}
                  className="w-full"
                  data-testid="slider-min-age"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>16</span>
                  <span className="text-purple-600">Current: {originalValues.minAge}</span>
                  <span>25</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="flex items-center gap-2">
                    <Percent size={14} />
                    Critical Illness Survival Period
                  </Label>
                  <Badge variant={survivalDays !== originalValues.survivalDays ? "default" : "secondary"}>
                    {survivalDays} days
                  </Badge>
                </div>
                <Slider
                  value={[survivalDays]}
                  onValueChange={([val]) => handleChange(setSurvivalDays, val)}
                  min={0}
                  max={30}
                  step={1}
                  className="w-full"
                  data-testid="slider-survival-days"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0 days</span>
                  <span className="text-purple-600">Current: {originalValues.survivalDays} days</span>
                  <span>30 days</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                <Label className="flex items-center gap-2 cursor-pointer">
                  <Users size={14} />
                  Include Terminal Illness Cover
                </Label>
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
            </div>

            <div className="space-y-4">
              <div className="flex gap-2">
                <Button 
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                  onClick={runScenario}
                  disabled={!hasChanges}
                  data-testid="button-run-scenario"
                >
                  <Calculator size={16} className="mr-2" />
                  Run Scenario
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleReset}
                  disabled={!hasChanges}
                  data-testid="button-reset-scenario"
                >
                  <RotateCcw size={16} />
                </Button>
              </div>

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
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-gray-600">Eligibility Impact</span>
                          <div className="flex items-center gap-2">
                            {scenarioResult.eligibilityChange > 0 ? (
                              <TrendingUp className="text-green-600" size={20} />
                            ) : scenarioResult.eligibilityChange < 0 ? (
                              <TrendingDown className="text-red-600" size={20} />
                            ) : null}
                            <span className={`text-2xl font-bold ${
                              scenarioResult.eligibilityChange > 0 ? 'text-green-600' : 
                              scenarioResult.eligibilityChange < 0 ? 'text-red-600' : 
                              'text-gray-600'
                            }`}>
                              {scenarioResult.eligibilityChange > 0 ? '+' : ''}{scenarioResult.eligibilityChange.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Projected Customers</p>
                            <p className="font-semibold">{scenarioResult.projectedCustomers.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Revenue Impact</p>
                            <p className="font-semibold">{scenarioResult.revenueImpact}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-gray-600">Risk Assessment</span>
                          <Badge variant={
                            scenarioResult.riskImpact === 'low' ? 'secondary' :
                            scenarioResult.riskImpact === 'medium' ? 'default' : 'destructive'
                          }>
                            {scenarioResult.riskImpact.toUpperCase()} RISK
                          </Badge>
                        </div>
                        {scenarioResult.complianceNotes.length > 0 ? (
                          <div className="space-y-2">
                            {scenarioResult.complianceNotes.map((note, i) => (
                              <div key={i} className="flex items-start gap-2 text-sm">
                                <AlertCircle size={14} className="text-amber-500 mt-0.5 shrink-0" />
                                <span className="text-gray-600">{note}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <CheckCircle2 size={14} />
                            <span>No compliance concerns identified</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Button className="w-full" variant="outline" disabled>
                      <Sparkles size={16} className="mr-2" />
                      Submit for Compliance Review
                      <ArrowRight size={16} className="ml-2" />
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>

              {!showResults && !hasChanges && (
                <div className="text-center p-6 text-gray-500 bg-white rounded-lg border-2 border-dashed">
                  <Beaker size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="font-medium">Adjust parameters above</p>
                  <p className="text-sm">Then click "Run Scenario" to see projected impact</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

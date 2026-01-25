import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, RotateCcw, CheckCircle2, XCircle, AlertTriangle, Lightbulb,
  ArrowRight, Info, Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

interface DmnInput {
  id: string;
  label: string;
  expression: string;
  typeRef?: string;
}

interface RuleEvaluation {
  ruleId: string;
  ruleIndex: number;
  matched: boolean;
  inputEvaluations: Array<{
    inputId: string;
    expression: string;
    actualValue: any;
    expectedValue: string;
    matched: boolean;
    explanation: string;
  }>;
  outputs?: Record<string, any>;
  description?: string;
}

interface SimulationResult {
  success: boolean;
  hitPolicy: string;
  inputs: Record<string, any>;
  matchedRules: RuleEvaluation[];
  finalOutputs: Record<string, any> | null;
  explanation: string;
  evaluations: RuleEvaluation[];
}

interface DMNSimulatorProps {
  decisionKey: string;
  className?: string;
}

export function DMNSimulator({ decisionKey, className }: DMNSimulatorProps) {
  const [inputValues, setInputValues] = useState<Record<string, any>>({});
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);

  // Fetch sample inputs to initialize the form
  const { data: sampleData, isLoading: isLoadingSamples } = useQuery({
    queryKey: ['dmn-sample-inputs', decisionKey],
    queryFn: async () => {
      const response = await fetch(`/api/admin/camunda/dmn/${decisionKey}/sample-inputs`, {
        credentials: 'include',
      });
      return response.json();
    },
  });

  // Mutation for running simulation
  const simulateMutation = useMutation({
    mutationFn: async (inputs: Record<string, any>) => {
      const response = await fetch(`/api/admin/camunda/dmn/${decisionKey}/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ inputs }),
      });

      if (!response.ok) {
        throw new Error('Simulation failed');
      }

      const result = await response.json();
      return result.simulation as SimulationResult;
    },
    onSuccess: (result) => {
      setSimulationResult(result);
    },
  });

  const handleInputChange = (expression: string, value: string, typeRef?: string) => {
    let parsedValue: any = value;

    // Parse based on type
    if (typeRef === 'number' || typeRef === 'integer') {
      parsedValue = value === '' ? 0 : Number(value);
    } else if (typeRef === 'boolean') {
      parsedValue = value === 'true';
    }

    setInputValues((prev) => ({
      ...prev,
      [expression]: parsedValue,
    }));
  };

  const handleLoadSamples = () => {
    if (sampleData?.sampleInputs) {
      setInputValues(sampleData.sampleInputs);
      setSimulationResult(null);
    }
  };

  const handleRunSimulation = () => {
    simulateMutation.mutate(inputValues);
  };

  const handleReset = () => {
    setInputValues({});
    setSimulationResult(null);
  };

  if (isLoadingSamples) {
    return (
      <div className={className}>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const inputDefinitions = sampleData?.inputDefinitions || [];

  return (
    <div className={className}>
      <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play size={20} className="text-emerald-600" />
            DMN Simulator
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            Test your decision table with sample inputs to see which rules match
          </p>
        </CardHeader>
        <CardContent>
          {/* Input Form */}
          <div className="space-y-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Input Values</h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLoadSamples}
                  disabled={!sampleData?.sampleInputs}
                >
                  <RotateCcw size={14} className="mr-1" />
                  Load Samples
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                >
                  Reset
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {inputDefinitions.map((input: DmnInput) => (
                <div key={input.id} className="space-y-2">
                  <Label htmlFor={input.id} className="text-sm font-medium">
                    {input.label}
                    <span className="text-xs text-gray-500 ml-2">({input.typeRef || 'string'})</span>
                  </Label>
                  {input.typeRef === 'boolean' ? (
                    <select
                      id={input.id}
                      value={inputValues[input.expression] === undefined ? '' : String(inputValues[input.expression])}
                      onChange={(e) => handleInputChange(input.expression, e.target.value, input.typeRef)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">Select...</option>
                      <option value="true">True</option>
                      <option value="false">False</option>
                    </select>
                  ) : (
                    <Input
                      id={input.id}
                      type={input.typeRef === 'number' || input.typeRef === 'integer' ? 'number' : 'text'}
                      step={input.typeRef === 'number' ? '0.01' : undefined}
                      value={inputValues[input.expression] === undefined ? '' : inputValues[input.expression]}
                      onChange={(e) => handleInputChange(input.expression, e.target.value, input.typeRef)}
                      placeholder={`Enter ${input.label.toLowerCase()}`}
                      className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                    />
                  )}
                  <p className="text-xs text-gray-500 font-mono">{input.expression}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Run Button */}
          <div className="flex justify-center mb-6">
            <Button
              onClick={handleRunSimulation}
              disabled={simulateMutation.isPending || Object.keys(inputValues).length === 0}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3"
              size="lg"
            >
              {simulateMutation.isPending ? (
                <>Running Simulation...</>
              ) : (
                <>
                  <Zap size={18} className="mr-2" />
                  Run Simulation
                </>
              )}
            </Button>
          </div>

          {/* Simulation Results */}
          <AnimatePresence>
            {simulationResult && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Explanation Banner */}
                <Card className={`border-2 ${
                  simulationResult.finalOutputs
                    ? 'bg-green-50 border-green-300'
                    : 'bg-amber-50 border-amber-300'
                }`}>
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      {simulationResult.finalOutputs ? (
                        <CheckCircle2 size={24} className="text-green-600 shrink-0 mt-1" />
                      ) : (
                        <AlertTriangle size={24} className="text-amber-600 shrink-0 mt-1" />
                      )}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">
                          {simulationResult.finalOutputs ? 'Decision Made' : 'No Decision'}
                        </h4>
                        <p className="text-sm text-gray-700">{simulationResult.explanation}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Final Outputs */}
                {simulationResult.finalOutputs && (
                  <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-green-900">
                        <ArrowRight size={20} />
                        Decision Outputs
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {Object.entries(simulationResult.finalOutputs).map(([key, value]) => (
                          <div key={key} className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200">
                            <span className="font-medium text-gray-700">{key}</span>
                            <Badge variant="default" className="bg-green-600 text-white font-mono">
                              {Array.isArray(value) ? `[${value.join(', ')}]` : String(value)}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Rule Evaluations */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb size={20} className="text-amber-500" />
                      Rule Evaluations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {simulationResult.evaluations.map((evaluation) => (
                        <Card
                          key={evaluation.ruleId}
                          className={`${
                            evaluation.matched
                              ? 'bg-green-50 border-green-300'
                              : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <CardContent className="pt-4">
                            <div className="flex items-start gap-3 mb-3">
                              {evaluation.matched ? (
                                <CheckCircle2 size={20} className="text-green-600 shrink-0 mt-0.5" />
                              ) : (
                                <XCircle size={20} className="text-gray-400 shrink-0 mt-0.5" />
                              )}
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="outline">Rule #{evaluation.ruleIndex + 1}</Badge>
                                  {evaluation.matched && (
                                    <Badge variant="default" className="bg-green-600 text-white">
                                      MATCHED
                                    </Badge>
                                  )}
                                </div>
                                {evaluation.description && (
                                  <p className="text-sm text-gray-700 mb-3">{evaluation.description}</p>
                                )}

                                {/* Input Evaluations */}
                                <div className="space-y-2">
                                  {evaluation.inputEvaluations.map((inputEval, idx) => (
                                    <div
                                      key={idx}
                                      className={`flex items-center gap-2 p-2 rounded text-sm ${
                                        inputEval.matched
                                          ? 'bg-green-100 text-green-900'
                                          : 'bg-red-100 text-red-900'
                                      }`}
                                    >
                                      {inputEval.matched ? (
                                        <CheckCircle2 size={14} className="shrink-0" />
                                      ) : (
                                        <XCircle size={14} className="shrink-0" />
                                      )}
                                      <span className="font-mono text-xs flex-1">
                                        {inputEval.explanation}
                                      </span>
                                    </div>
                                  ))}
                                </div>

                                {/* Outputs (if matched) */}
                                {evaluation.outputs && (
                                  <div className="mt-3 p-3 bg-white rounded border border-green-200">
                                    <p className="text-xs text-gray-600 mb-2 flex items-center gap-1">
                                      <ArrowRight size={12} />
                                      Outputs:
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                      {Object.entries(evaluation.outputs).map(([key, value]) => (
                                        <Badge key={key} variant="outline" className="font-mono text-xs">
                                          {key}: {String(value)}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="pt-4">
                      <div className="text-center">
                        <p className="text-sm text-gray-600 mb-1">Rules Evaluated</p>
                        <p className="text-3xl font-bold text-blue-900">
                          {simulationResult.evaluations.length}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-green-50 border-green-200">
                    <CardContent className="pt-4">
                      <div className="text-center">
                        <p className="text-sm text-gray-600 mb-1">Rules Matched</p>
                        <p className="text-3xl font-bold text-green-900">
                          {simulationResult.matchedRules.length}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-purple-50 border-purple-200">
                    <CardContent className="pt-4">
                      <div className="text-center">
                        <p className="text-sm text-gray-600 mb-1">Hit Policy</p>
                        <p className="text-xl font-bold text-purple-900">
                          {simulationResult.hitPolicy}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Info Box */}
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <Info size={20} className="text-blue-600 shrink-0 mt-0.5" />
                      <div className="text-sm text-gray-700">
                        <p className="font-medium mb-1">How to interpret results:</p>
                        <ul className="list-disc list-inside space-y-1 text-xs">
                          <li>Green checkmarks indicate conditions that matched</li>
                          <li>Red X marks show conditions that did not match</li>
                          <li>Only rules where ALL conditions match will produce outputs</li>
                          <li>The hit policy determines which matched rule(s) are used for the final decision</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error State */}
          {simulateMutation.isError && (
            <Card className="border-red-200 bg-red-50 mt-6">
              <CardContent className="pt-4">
                <div className="flex items-center gap-3 text-red-700">
                  <AlertTriangle size={24} />
                  <div>
                    <p className="font-medium">Simulation failed</p>
                    <p className="text-sm">
                      {simulateMutation.error instanceof Error
                        ? simulateMutation.error.message
                        : 'Unknown error'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

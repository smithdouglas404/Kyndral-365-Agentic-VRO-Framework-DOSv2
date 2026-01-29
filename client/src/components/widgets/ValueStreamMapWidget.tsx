import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { GitBranch } from 'lucide-react';
import { AttributeStatusBadge } from '@/components/AttributeStatusBadge';
import { useAgentAttributes, getAttributeMap, parseAttributeNumber } from '@/hooks/useAgentAttributes';

export function ValueStreamMapWidget() {
  const { data: pmoAttributes } = useAgentAttributes('pmo');
  const attrMap = getAttributeMap(pmoAttributes?.attributes || []);

  // Value stream steps from PMO agent
  const ideationTime = parseAttributeNumber(attrMap.ideation_time?.value) ?? 12;
  const designTime = parseAttributeNumber(attrMap.design_time?.value) ?? 11;
  const buildTime = parseAttributeNumber(attrMap.build_time?.value) ?? 21;
  const testTime = parseAttributeNumber(attrMap.test_time?.value) ?? 14;
  const releaseTime = parseAttributeNumber(attrMap.release_time?.value) ?? 5;

  const steps = [
    {
      name: 'Ideation',
      processTime: Math.round(ideationTime * 0.33),
      waitTime: Math.round(ideationTime * 0.67),
      availability: attrMap.ideation_time?.availability,
    },
    {
      name: 'Design',
      processTime: Math.round(designTime * 0.55),
      waitTime: Math.round(designTime * 0.45),
      availability: attrMap.design_time?.availability,
    },
    {
      name: 'Build',
      processTime: Math.round(buildTime * 0.67),
      waitTime: Math.round(buildTime * 0.33),
      availability: attrMap.build_time?.availability,
    },
    {
      name: 'Test',
      processTime: Math.round(testTime * 0.57),
      waitTime: Math.round(testTime * 0.43),
      availability: attrMap.test_time?.availability,
    },
    {
      name: 'Release',
      processTime: Math.round(releaseTime * 0.6),
      waitTime: Math.round(releaseTime * 0.4),
      availability: attrMap.release_time?.availability,
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <GitBranch className="h-5 w-5 text-indigo-600" />
          Value Stream Map
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {steps.map((step, index) => (
          <div key={index} className="rounded-lg border p-3">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-semibold text-slate-900">{step.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-slate-500">{step.processTime + step.waitTime} days</span>
                {step.availability && <AttributeStatusBadge availability={step.availability} />}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs text-slate-500 mb-2">
              <div>Process: {step.processTime} days</div>
              <div>Wait: {step.waitTime} days</div>
            </div>
            <Progress
              value={Math.min(100, (step.processTime / (step.processTime + step.waitTime)) * 100)}
              className="h-2"
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

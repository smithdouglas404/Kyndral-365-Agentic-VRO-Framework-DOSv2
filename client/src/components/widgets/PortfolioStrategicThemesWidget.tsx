import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Target } from 'lucide-react';
import { AttributeStatusBadge } from '@/components/AttributeStatusBadge';
import { useAgentAttributes, getAttributeMap, parseAttributeNumber } from '@/hooks/useAgentAttributes';

export function PortfolioStrategicThemesWidget() {
  const { data: planningAttributes } = useAgentAttributes('planning');
  const attrMap = getAttributeMap(planningAttributes?.attributes || []);

  // Strategic themes from planning agent
  const theme1Progress = parseAttributeNumber(attrMap.strategic_theme_1_progress?.value);
  const theme2Progress = parseAttributeNumber(attrMap.strategic_theme_2_progress?.value);
  const theme3Progress = parseAttributeNumber(attrMap.strategic_theme_3_progress?.value);
  const theme4Progress = parseAttributeNumber(attrMap.strategic_theme_4_progress?.value);

  const themes = [
    {
      name: attrMap.strategic_theme_1_name?.value || 'Customer Experience',
      progress: theme1Progress,
      status: theme1Progress && theme1Progress >= 70 ? 'On Track' : theme1Progress && theme1Progress < 50 ? 'At Risk' : 'On Track',
      availability: attrMap.strategic_theme_1_progress?.availability,
    },
    {
      name: attrMap.strategic_theme_2_name?.value || 'Platform Modernization',
      progress: theme2Progress,
      status: theme2Progress && theme2Progress >= 70 ? 'On Track' : theme2Progress && theme2Progress < 50 ? 'At Risk' : 'On Track',
      availability: attrMap.strategic_theme_2_progress?.availability,
    },
    {
      name: attrMap.strategic_theme_3_name?.value || 'Growth Expansion',
      progress: theme3Progress,
      status: theme3Progress && theme3Progress >= 70 ? 'Ahead' : theme3Progress && theme3Progress < 50 ? 'At Risk' : 'On Track',
      availability: attrMap.strategic_theme_3_progress?.availability,
    },
    {
      name: attrMap.strategic_theme_4_name?.value || 'Operational Excellence',
      progress: theme4Progress,
      status: theme4Progress && theme4Progress >= 70 ? 'On Track' : theme4Progress && theme4Progress < 50 ? 'At Risk' : 'On Track',
      availability: attrMap.strategic_theme_4_progress?.availability,
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="h-5 w-5 text-blue-600" />
          Strategic Themes
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {themes.map((theme, index) => (
          <div key={index} className="rounded-lg border p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-sm">{theme.name}</span>
              {theme.availability && <AttributeStatusBadge availability={theme.availability} />}
            </div>
            <div className="flex items-center justify-between mb-1">
              <Badge variant="outline" className="text-xs">{theme.status}</Badge>
              <span className="text-2xl font-semibold text-slate-900">{theme.progress ?? '--'}%</span>
            </div>
            <Progress value={theme.progress ?? 0} className="mt-2" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

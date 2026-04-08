/**
 * UIBlock Renderer — MUI Edition
 *
 * Maps each agent-specified UIBlock to polished MUI components.
 * Every agent canvas, every packet, every screen inherits this polish automatically.
 */

import React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import LinearProgress from '@mui/material/LinearProgress';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import { useTheme, alpha } from '@mui/material/styles';
import { SparkLineChart } from '@mui/x-charts/SparkLineChart';
import { BarChart } from '@mui/x-charts/BarChart';
import { LineChart } from '@mui/x-charts/LineChart';
import { PieChart } from '@mui/x-charts/PieChart';
import { areaElementClasses } from '@mui/x-charts/LineChart';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import RemoveIcon from '@mui/icons-material/Remove';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import ShieldIcon from '@mui/icons-material/Shield';

import type {
  UIBlock,
  KPIBlock,
  KPIRowBlock,
  BarChartBlock,
  AreaChartBlock,
  DonutChartBlock,
  TableBlock,
  InsightBlock,
  RecommendationBlock,
  ProgressBlock,
  MarkdownBlock,
  StatusListBlock,
  A2ATraceBlock,
  AlertBlock,
  HandoffBlock,
  MemoryCoreBlock,
  MemoryFactsBlock,
  MemoryTimelineBlock,
  MemoryStatsBlock,
  GanttChartBlock,
  ResourceHeatmapBlock,
  BudgetWaterfallBlock,
  DependencyGraphBlock,
  Severity,
} from '@shared/agentUIPacket';

import {
  MemoryCoreRenderer,
  MemoryFactsRenderer,
  MemoryTimelineRenderer,
  MemoryStatsRenderer,
} from './MemoryBlockRenderers';

// ============================================================================
// Main Renderer
// ============================================================================

interface UIBlockRendererProps {
  block: UIBlock;
  className?: string;
}

export function UIBlockRenderer({ block, className }: UIBlockRendererProps) {
  switch (block.type) {
    case 'kpi':         return <KPIRenderer block={block} />;
    case 'kpi-row':     return <KPIRowRenderer block={block} />;
    case 'bar-chart':   return <BarChartRenderer block={block} />;
    case 'area-chart':  return <AreaChartRenderer block={block} />;
    case 'donut-chart': return <DonutChartRenderer block={block} />;
    case 'table':       return <TableRenderer block={block} />;
    case 'insight':     return <InsightRenderer block={block} />;
    case 'recommendation': return <RecommendationRenderer block={block} />;
    case 'progress':    return <ProgressRenderer block={block} />;
    case 'markdown':    return <MarkdownRenderer block={block} />;
    case 'status-list': return <StatusListRenderer block={block} />;
    case 'a2a-trace':   return <A2ATraceRenderer block={block} />;
    case 'alert':       return <AlertBlockRenderer block={block} />;
    case 'handoff':     return <HandoffRenderer block={block} />;
    case 'memory-core':     return <MemoryCoreRenderer block={block} />;
    case 'memory-facts':    return <MemoryFactsRenderer block={block} />;
    case 'memory-timeline': return <MemoryTimelineRenderer block={block} />;
    case 'memory-stats':    return <MemoryStatsRenderer block={block} />;
    case 'gantt-chart':     return <GanttChartRenderer block={block} />;
    case 'resource-heatmap': return <ResourceHeatmapRenderer block={block} />;
    case 'budget-waterfall': return <BudgetWaterfallRenderer block={block} />;
    case 'dependency-graph': return <DependencyGraphRenderer block={block} />;
    default: return null;
  }
}

// ============================================================================
// KPI — StatCard with sparkline (MUI dashboard pattern)
// ============================================================================

function AreaGradient({ color, id }: { color: string; id: string }) {
  return (
    <defs>
      <linearGradient id={id} x1="50%" y1="0%" x2="50%" y2="100%">
        <stop offset="0%" stopColor={color} stopOpacity={0.3} />
        <stop offset="100%" stopColor={color} stopOpacity={0} />
      </linearGradient>
    </defs>
  );
}

function KPIRenderer({ block }: { block: KPIBlock }) {
  const theme = useTheme();

  const trendConfig = {
    up: { icon: <TrendingUpIcon fontSize="small" />, color: 'success' as const },
    down: { icon: <TrendingDownIcon fontSize="small" />, color: 'error' as const },
    flat: { icon: <RemoveIcon fontSize="small" />, color: 'default' as const },
  };

  const severityColor = {
    info: theme.palette.info.main,
    warning: theme.palette.warning.main,
    critical: theme.palette.error.main,
    success: theme.palette.success.main,
  };

  const trend = block.trend ? trendConfig[block.trend] : null;
  const accentColor = block.severity ? severityColor[block.severity] : theme.palette.primary.main;

  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Typography component="h2" variant="subtitle2" gutterBottom>
          {block.label}
        </Typography>
        <Stack sx={{ justifyContent: 'space-between', gap: 1 }}>
          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h4" component="p">
              {block.value}{block.unit ? ` ${block.unit}` : ''}
            </Typography>
            {block.delta !== undefined && trend && (
              <Chip
                size="small"
                color={trend.color}
                icon={trend.icon}
                label={`${block.delta > 0 ? '+' : ''}${block.delta}%`}
              />
            )}
          </Stack>
          {block.deltaLabel && (
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {block.deltaLabel}
            </Typography>
          )}
          <Box sx={{ width: '100%', height: 50 }}>
            <SparkLineChart
              color={accentColor}
              data={[20, 30, 25, 40, 35, 50, 45, 60, 55, 70]}
              area
              showHighlight
              showTooltip
              sx={{
                [`& .${areaElementClasses.root}`]: {
                  fill: `url(#kpi-gradient-${block.label})`,
                },
              }}
            >
              <AreaGradient color={accentColor} id={`kpi-gradient-${block.label}`} />
            </SparkLineChart>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

function KPIRowRenderer({ block }: { block: KPIRowBlock }) {
  return (
    <Stack direction="row" spacing={2} sx={{ width: '100%' }}>
      {block.kpis.map((kpi, i) => (
        <Box key={i} sx={{ flex: 1 }}>
          <KPIRenderer block={kpi} />
        </Box>
      ))}
    </Stack>
  );
}

// ============================================================================
// Charts — MUI X Charts with gradient fills
// ============================================================================

function BarChartRenderer({ block }: { block: BarChartBlock }) {
  const theme = useTheme();
  const colors = block.colors || [
    theme.palette.primary.main,
    theme.palette.secondary?.main || theme.palette.error.main,
    theme.palette.warning.main,
  ];

  return (
    <Card variant="outlined">
      <CardContent>
        {block.title && (
          <Typography component="h2" variant="subtitle2" gutterBottom>
            {block.title}
          </Typography>
        )}
        <BarChart
          dataset={block.data}
          xAxis={[{ scaleType: 'band', dataKey: block.index }]}
          series={block.categories.map((cat, i) => ({
            dataKey: cat,
            label: cat,
            color: colors[i % colors.length],
            stack: block.stacked ? 'total' : undefined,
          }))}
          height={250}
          margin={{ left: 60, right: 20, top: 20, bottom: 30 }}
          grid={{ horizontal: true }}
          hideLegend={block.categories.length <= 1}
        />
      </CardContent>
    </Card>
  );
}

function AreaChartRenderer({ block }: { block: AreaChartBlock }) {
  const theme = useTheme();
  const colors = block.colors || [
    theme.palette.primary.light,
    theme.palette.primary.main,
    theme.palette.primary.dark,
  ];

  return (
    <Card variant="outlined">
      <CardContent>
        {block.title && (
          <Typography component="h2" variant="subtitle2" gutterBottom>
            {block.title}
          </Typography>
        )}
        <LineChart
          dataset={block.data}
          xAxis={[{ scaleType: 'point', dataKey: block.index }]}
          series={block.categories.map((cat, i) => ({
            dataKey: cat,
            label: cat,
            color: colors[i % colors.length],
            area: true,
            showMark: false,
            curve: (block.curveType as any) || 'monotone',
            stack: block.stacked ? 'total' : undefined,
          }))}
          height={250}
          margin={{ left: 60, right: 20, top: 20, bottom: 30 }}
          grid={{ horizontal: true }}
        />
      </CardContent>
    </Card>
  );
}

function DonutChartRenderer({ block }: { block: DonutChartBlock }) {
  const theme = useTheme();

  return (
    <Card variant="outlined">
      <CardContent>
        {block.title && (
          <Typography component="h2" variant="subtitle2" gutterBottom sx={{ textAlign: 'center' }}>
            {block.title}
          </Typography>
        )}
        <PieChart
          series={[{
            data: block.data.map((d, i) => ({ id: i, value: d.value, label: d.name })),
            innerRadius: block.variant === 'pie' ? 0 : 60,
            paddingAngle: 2,
            cornerRadius: 4,
            highlightScope: { fade: 'global', highlight: 'item' },
          }]}
          height={250}
          margin={{ left: 0, right: 100, top: 0, bottom: 0 }}
        />
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Table — MUI Table with polished styling
// ============================================================================

function TableRenderer({ block }: { block: TableBlock }) {
  const displayRows = block.maxRows ? block.rows.slice(0, block.maxRows) : block.rows;

  return (
    <Card variant="outlined">
      <CardContent>
        {block.title && (
          <Typography component="h2" variant="subtitle2" gutterBottom>
            {block.title}
          </Typography>
        )}
        <TableContainer sx={{ maxHeight: 400 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                {block.columns.map((col) => (
                  <TableCell
                    key={col.key}
                    align={col.align as any || 'left'}
                    sx={{ fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', color: 'text.secondary' }}
                  >
                    {col.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {displayRows.map((row, rowIdx) => (
                <TableRow key={rowIdx} hover>
                  {block.columns.map((col) => (
                    <TableCell key={col.key} align={col.align as any || 'left'}>
                      {formatCell(row[col.key], col.format, col.badgeColorMap)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        {block.maxRows && block.rows.length > block.maxRows && (
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', textAlign: 'center', mt: 1 }}>
            Showing {block.maxRows} of {block.rows.length} rows
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Insight — MUI Alert with severity
// ============================================================================

function InsightRenderer({ block }: { block: InsightBlock }) {
  const severityMap: Record<Severity, 'info' | 'warning' | 'error' | 'success'> = {
    info: 'info',
    warning: 'warning',
    critical: 'error',
    success: 'success',
  };

  return (
    <Alert
      severity={severityMap[block.severity]}
      variant="outlined"
      sx={{ borderRadius: 2 }}
    >
      <AlertTitle sx={{ fontWeight: 600 }}>{block.title}</AlertTitle>
      <Typography variant="body2">{block.body}</Typography>
      {(block.source || block.confidence !== undefined) && (
        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
          {block.source && (
            <Chip label={block.source} size="small" variant="outlined" />
          )}
          {block.confidence !== undefined && (
            <Chip
              label={`${Math.round(block.confidence * 100)}% confidence`}
              size="small"
              color={block.confidence >= 0.8 ? 'success' : block.confidence >= 0.5 ? 'warning' : 'default'}
            />
          )}
        </Stack>
      )}
    </Alert>
  );
}

// ============================================================================
// Recommendation — Card with impact/effort badges
// ============================================================================

function RecommendationRenderer({ block }: { block: RecommendationBlock }) {
  const impactColor: Record<string, 'success' | 'warning' | 'error'> = {
    low: 'success', medium: 'warning', high: 'error',
  };

  return (
    <Card sx={{ bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04), border: 1, borderColor: 'primary.200' }}>
      <CardContent>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
          <LightbulbIcon sx={{ color: 'primary.main', mt: 0.25 }} fontSize="small" />
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {block.title}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
              {block.body}
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 1.5, alignItems: 'center' }}>
              <Chip size="small" label={`Impact: ${block.impact}`} color={impactColor[block.impact]} />
              <Chip size="small" label={`Effort: ${block.effort}`} variant="outlined" />
              {block.actionLabel && (
                <Button
                  size="small"
                  endIcon={<ArrowForwardIcon />}
                  sx={{ ml: 'auto', textTransform: 'none' }}
                >
                  {block.actionLabel}
                </Button>
              )}
            </Stack>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Progress — MUI LinearProgress bars
// ============================================================================

function ProgressRenderer({ block }: { block: ProgressBlock }) {
  return (
    <Card variant="outlined">
      <CardContent>
        {block.title && (
          <Typography component="h2" variant="subtitle2" gutterBottom>
            {block.title}
          </Typography>
        )}
        <Stack spacing={2}>
          {block.items.map((item, i) => {
            const color = item.value >= (item.target || 100) ? 'success'
              : item.value >= 60 ? 'warning' : 'error';
            return (
              <Box key={i}>
                <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2">{item.label}</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {item.value}%{item.target ? ` / ${item.target}%` : ''}
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(item.value, 100)}
                  color={color as any}
                  sx={{ height: 8, borderRadius: 4 }}
                />
                {item.status && (
                  <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.25 }}>
                    {item.status}
                  </Typography>
                )}
              </Box>
            );
          })}
        </Stack>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Status List
// ============================================================================

const statusIcons: Record<string, React.ReactElement> = {
  ok: <CheckCircleIcon fontSize="small" color="success" />,
  warning: <WarningIcon fontSize="small" color="warning" />,
  critical: <ErrorIcon fontSize="small" color="error" />,
  pending: <InfoIcon fontSize="small" color="disabled" />,
  blocked: <ShieldIcon fontSize="small" color="error" />,
};

function StatusListRenderer({ block }: { block: StatusListBlock }) {
  return (
    <Card variant="outlined">
      <CardContent>
        {block.title && (
          <Typography component="h2" variant="subtitle2" gutterBottom>
            {block.title}
          </Typography>
        )}
        <Stack spacing={0.5}>
          {block.items.map((item, i) => (
            <Stack
              key={i}
              direction="row"
              spacing={1.5}
              sx={{
                alignItems: 'center',
                py: 1,
                px: 1,
                borderRadius: 1,
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              {statusIcons[item.status] || statusIcons.pending}
              <Typography variant="body2" sx={{ flex: 1 }}>{item.label}</Typography>
              {item.detail && (
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>{item.detail}</Typography>
              )}
              {item.timestamp && (
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>{item.timestamp}</Typography>
              )}
            </Stack>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Markdown
// ============================================================================

function MarkdownRenderer({ block }: { block: MarkdownBlock }) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
          {block.content}
        </Typography>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// A2A Trace — Agent conversation display
// ============================================================================

function A2ATraceRenderer({ block }: { block: A2ATraceBlock }) {
  const typeColor: Record<string, 'primary' | 'success' | 'secondary' | 'error' | 'warning'> = {
    question: 'primary',
    response: 'success',
    delegation: 'secondary',
    escalation: 'error',
    'fact-share': 'warning',
  };

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 2 }}>
          <SwapHorizIcon fontSize="small" color="primary" />
          {block.title && <Typography variant="subtitle2">{block.title}</Typography>}
          {block.isLive && <Chip label="Live" size="small" color="success" />}
        </Stack>
        <Stack spacing={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
          {block.messages.map((msg, i) => (
            <Stack
              key={i}
              direction="row"
              spacing={1.5}
              sx={{
                px: 2, py: 1.5,
                alignItems: 'flex-start',
                borderBottom: i < block.messages.length - 1 ? 1 : 0,
                borderColor: 'divider',
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              <Chip label={msg.fromAgentName} size="small" color={typeColor[msg.messageType] || 'default'} />
              <ArrowForwardIcon sx={{ fontSize: 14, color: 'text.secondary', mt: 0.5 }} />
              <Chip label={msg.toAgentName} size="small" variant="outlined" />
              <Typography variant="body2" sx={{ flex: 1 }}>{msg.content}</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>
                {new Date(msg.timestamp).toLocaleTimeString()}
              </Typography>
            </Stack>
          ))}
        </Stack>
        {block.outcome && (
          <Alert severity="success" sx={{ mt: 1.5, borderRadius: 1 }}>
            <Typography variant="body2"><strong>Outcome:</strong> {block.outcome}</Typography>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Alert Block
// ============================================================================

function AlertBlockRenderer({ block }: { block: AlertBlock }) {
  const levelMap: Record<string, 'info' | 'warning' | 'error'> = {
    notification: 'info', warning: 'warning', alarm: 'error', critical: 'error',
  };

  return (
    <Alert
      severity={levelMap[block.alertLevel] || 'info'}
      icon={<NotificationsIcon />}
      variant="filled"
      sx={{ borderRadius: 2 }}
    >
      <AlertTitle>{block.title}</AlertTitle>
      <Typography variant="body2">{block.body}</Typography>
      {block.trigger && (
        <Typography variant="caption" sx={{ mt: 1, display: 'block', opacity: 0.8 }}>
          Trigger: {block.trigger}
        </Typography>
      )}
    </Alert>
  );
}

// ============================================================================
// Handoff Block
// ============================================================================

function HandoffRenderer({ block }: { block: HandoffBlock }) {
  const statusColor: Record<string, 'primary' | 'success' | 'warning' | 'error'> = {
    initiated: 'primary', accepted: 'success', 'in-progress': 'warning', completed: 'success', rejected: 'error',
  };

  return (
    <Card sx={{ bgcolor: (theme) => alpha(theme.palette.info.main, 0.04), border: 1, borderColor: 'info.200' }}>
      <CardContent>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1.5 }}>
          <SwapHorizIcon fontSize="small" color="info" />
          <Typography variant="subtitle2">Agent Handoff</Typography>
          <Chip label={block.status} size="small" color={statusColor[block.status] || 'default'} />
        </Stack>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
          <Chip label={block.fromAgentName} color="primary" size="small" />
          <ArrowForwardIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
          <Chip label={block.toAgentName} color="secondary" size="small" />
        </Stack>
        <Typography variant="body2" sx={{ fontWeight: 500 }}>{block.subject}</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>{block.reason}</Typography>
        {block.context && (
          <Box sx={{ mt: 1, p: 1, borderRadius: 1, bgcolor: 'action.hover' }}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Context: {block.context}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Gantt Chart — Timeline visualization from OpenProject schedule data
// ============================================================================

function GanttChartRenderer({ block }: { block: GanttChartBlock }) {
  const theme = useTheme();

  // Calculate date range
  const allDates = block.items
    .flatMap(item => [item.startDate, item.endDate])
    .filter(Boolean)
    .map(d => new Date(d).getTime());

  const minDate = block.startDate ? new Date(block.startDate).getTime() : Math.min(...allDates);
  const maxDate = block.endDate ? new Date(block.endDate).getTime() : Math.max(...allDates);
  const totalDays = Math.max(1, (maxDate - minDate) / (1000 * 60 * 60 * 24));

  const typeColors: Record<string, string> = {
    Epic: theme.palette.primary.main,
    Feature: theme.palette.info.main,
    'User Story': theme.palette.success.main,
    Task: theme.palette.grey[500],
    Milestone: theme.palette.warning.main,
    Risk: theme.palette.error.main,
  };

  return (
    <Card variant="outlined">
      <CardContent>
        {block.title && (
          <Typography component="h2" variant="subtitle2" gutterBottom>
            {block.title}
          </Typography>
        )}
        <Box sx={{ overflow: 'auto' }}>
          <Stack spacing={0.5} sx={{ minWidth: 600 }}>
            {block.items.map((item) => {
              const start = new Date(item.startDate).getTime();
              const end = new Date(item.endDate).getTime();
              const leftPct = Math.max(0, ((start - minDate) / (maxDate - minDate)) * 100);
              const widthPct = Math.max(2, ((end - start) / (maxDate - minDate)) * 100);
              const color = item.color || typeColors[item.type || ''] || theme.palette.primary.main;

              return (
                <Stack key={item.id} direction="row" sx={{ alignItems: 'center', height: 32 }}>
                  {/* Label */}
                  <Box sx={{ width: 180, flexShrink: 0, pr: 1 }}>
                    <Typography variant="caption" noWrap sx={{ fontWeight: 500 }}>
                      {item.label}
                    </Typography>
                  </Box>
                  {/* Bar */}
                  <Box sx={{ flex: 1, position: 'relative', height: 20, bgcolor: 'action.hover', borderRadius: 0.5 }}>
                    {/* Background bar */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: `${leftPct}%`,
                        width: `${widthPct}%`,
                        height: '100%',
                        bgcolor: alpha(color, 0.2),
                        borderRadius: 0.5,
                        border: `1px solid ${alpha(color, 0.4)}`,
                      }}
                    />
                    {/* Progress fill */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: `${leftPct}%`,
                        width: `${widthPct * (item.progress / 100)}%`,
                        height: '100%',
                        bgcolor: color,
                        borderRadius: 0.5,
                        opacity: 0.8,
                      }}
                    />
                    {/* Progress label */}
                    <Typography
                      variant="caption"
                      sx={{
                        position: 'absolute',
                        top: '50%',
                        left: `${leftPct + widthPct / 2}%`,
                        transform: 'translate(-50%, -50%)',
                        fontSize: '0.625rem',
                        fontWeight: 600,
                        color: item.progress > 40 ? 'white' : 'text.primary',
                        zIndex: 1,
                      }}
                    >
                      {item.progress}%
                    </Typography>
                  </Box>
                  {/* Status chip */}
                  <Box sx={{ width: 80, flexShrink: 0, pl: 1 }}>
                    <Chip
                      label={item.status || item.type || ''}
                      size="small"
                      sx={{ fontSize: '0.625rem', height: 18 }}
                    />
                  </Box>
                </Stack>
              );
            })}
          </Stack>
        </Box>
        {block.relations && block.relations.length > 0 && (
          <Typography variant="caption" sx={{ color: 'text.secondary', mt: 1, display: 'block' }}>
            {block.relations.length} dependencies
            {block.showCriticalPath && ' (critical path highlighted)'}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Resource Heatmap — Capacity vs demand from OpenProject
// ============================================================================

function ResourceHeatmapRenderer({ block }: { block: ResourceHeatmapBlock }) {
  const theme = useTheme();

  function getHeatColor(utilization: number): string {
    if (utilization > 100) return theme.palette.error.main;
    if (utilization > 85) return theme.palette.warning.main;
    if (utilization > 60) return theme.palette.success.main;
    if (utilization > 30) return theme.palette.success.light;
    return theme.palette.grey[200];
  }

  return (
    <Card variant="outlined">
      <CardContent>
        {block.title && (
          <Typography component="h2" variant="subtitle2" gutterBottom>
            {block.title}
          </Typography>
        )}
        <TableContainer sx={{ maxHeight: 400 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', minWidth: 140 }}>Resource</TableCell>
                {block.resources[0]?.periods.map((p, i) => (
                  <TableCell key={i} align="center" sx={{ fontWeight: 600, fontSize: '0.65rem', px: 0.5, minWidth: 50 }}>
                    {p.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {block.resources.map((resource, ri) => (
                <TableRow key={ri} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{resource.name}</Typography>
                    {resource.role && (
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>{resource.role}</Typography>
                    )}
                  </TableCell>
                  {resource.periods.map((period, pi) => (
                    <TableCell
                      key={pi}
                      align="center"
                      sx={{
                        bgcolor: alpha(getHeatColor(period.utilization), 0.2),
                        fontWeight: period.utilization > 100 ? 700 : 500,
                        fontSize: '0.75rem',
                        color: period.utilization > 100 ? 'error.main' : 'text.primary',
                        px: 0.5,
                      }}
                    >
                      {period.utilization}%
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        {/* Legend */}
        <Stack direction="row" spacing={2} sx={{ mt: 1.5, justifyContent: 'center' }}>
          {[
            { label: 'Under', color: theme.palette.grey[200] },
            { label: 'Normal', color: theme.palette.success.light },
            { label: 'Busy', color: theme.palette.success.main },
            { label: 'High', color: theme.palette.warning.main },
            { label: 'Over', color: theme.palette.error.main },
          ].map(item => (
            <Stack key={item.label} direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
              <Box sx={{ width: 12, height: 12, borderRadius: 0.5, bgcolor: alpha(item.color, 0.4) }} />
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>{item.label}</Typography>
            </Stack>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Budget Waterfall — Planned vs actual by category from OpenProject budgets
// ============================================================================

function BudgetWaterfallRenderer({ block }: { block: BudgetWaterfallBlock }) {
  const theme = useTheme();
  const currency = block.currency || 'USD';

  const fmt = (n: number) => new Intl.NumberFormat('en-US', {
    style: 'currency', currency, maximumFractionDigits: 0,
  }).format(n);

  const totalVariance = block.totalActual - block.totalPlanned;
  const variancePct = block.totalPlanned > 0
    ? ((totalVariance / block.totalPlanned) * 100).toFixed(1)
    : '0';

  return (
    <Card variant="outlined">
      <CardContent>
        {block.title && (
          <Typography component="h2" variant="subtitle2" gutterBottom>
            {block.title}
          </Typography>
        )}

        {/* Summary KPIs */}
        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <Box sx={{ flex: 1, p: 1.5, borderRadius: 1, bgcolor: 'action.hover' }}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>Planned</Typography>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>{fmt(block.totalPlanned)}</Typography>
          </Box>
          <Box sx={{ flex: 1, p: 1.5, borderRadius: 1, bgcolor: 'action.hover' }}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>Actual</Typography>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>{fmt(block.totalActual)}</Typography>
          </Box>
          <Box sx={{ flex: 1, p: 1.5, borderRadius: 1, bgcolor: totalVariance > 0 ? alpha(theme.palette.error.main, 0.05) : alpha(theme.palette.success.main, 0.05) }}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>Variance</Typography>
            <Typography variant="h6" sx={{ fontWeight: 600, color: totalVariance > 0 ? 'error.main' : 'success.main' }}>
              {totalVariance > 0 ? '+' : ''}{fmt(totalVariance)} ({variancePct}%)
            </Typography>
          </Box>
        </Stack>

        {/* Stacked bar chart: planned vs actual per category */}
        <BarChart
          dataset={block.categories.map(c => ({
            category: c.name,
            Planned: c.planned,
            Actual: c.actual,
          }))}
          xAxis={[{ scaleType: 'band', dataKey: 'category' }]}
          series={[
            { dataKey: 'Planned', label: 'Planned', color: theme.palette.primary.light },
            { dataKey: 'Actual', label: 'Actual', color: theme.palette.primary.main },
          ]}
          height={220}
          margin={{ left: 70, right: 20, top: 20, bottom: 30 }}
          grid={{ horizontal: true }}
        />

        {/* Category detail table */}
        <Table size="small" sx={{ mt: 1 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem' }}>Category</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>Planned</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>Actual</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>Variance</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {block.categories.map((cat, i) => {
              const variance = cat.actual - cat.planned;
              return (
                <TableRow key={i} hover>
                  <TableCell>{cat.name}</TableCell>
                  <TableCell align="right">{fmt(cat.planned)}</TableCell>
                  <TableCell align="right">{fmt(cat.actual)}</TableCell>
                  <TableCell
                    align="right"
                    sx={{ color: variance > 0 ? 'error.main' : 'success.main', fontWeight: 600 }}
                  >
                    {variance > 0 ? '+' : ''}{fmt(variance)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Dependency Graph — Work package network from OpenProject relations
// ============================================================================

function DependencyGraphRenderer({ block }: { block: DependencyGraphBlock }) {
  const theme = useTheme();

  const statusColors: Record<string, string> = {
    New: theme.palette.grey[400],
    'In Progress': theme.palette.primary.main,
    'In Review': theme.palette.info.main,
    Closed: theme.palette.success.main,
    Blocked: theme.palette.error.main,
  };

  return (
    <Card variant="outlined">
      <CardContent>
        {block.title && (
          <Typography component="h2" variant="subtitle2" gutterBottom>
            {block.title}
          </Typography>
        )}

        {/* Node list with connections */}
        <Stack spacing={1}>
          {block.nodes.map((node) => {
            const outgoing = block.edges.filter(e => e.from === node.id);
            const incoming = block.edges.filter(e => e.to === node.id);
            const color = node.color || statusColors[node.status || ''] || theme.palette.grey[400];

            return (
              <Box
                key={node.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  p: 1,
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: node.critical ? 'error.main' : 'divider',
                  bgcolor: node.critical ? alpha(theme.palette.error.main, 0.04) : 'transparent',
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                {/* Status dot */}
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: color, flexShrink: 0 }} />

                {/* Label */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>{node.label}</Typography>
                  <Stack direction="row" spacing={0.5}>
                    {node.type && <Chip label={node.type} size="small" sx={{ fontSize: '0.6rem', height: 16 }} />}
                    {node.status && <Chip label={node.status} size="small" sx={{ fontSize: '0.6rem', height: 16 }} />}
                    {node.critical && <Chip label="Critical Path" size="small" color="error" sx={{ fontSize: '0.6rem', height: 16 }} />}
                  </Stack>
                </Box>

                {/* Connections */}
                <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
                  {incoming.length > 0 && (
                    <Chip
                      label={`${incoming.length} in`}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: '0.6rem', height: 18 }}
                    />
                  )}
                  {outgoing.length > 0 && (
                    <Chip
                      label={`${outgoing.length} out`}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: '0.6rem', height: 18 }}
                    />
                  )}
                </Stack>
              </Box>
            );
          })}
        </Stack>

        {/* Summary */}
        <Stack direction="row" spacing={2} sx={{ mt: 1.5 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {block.nodes.length} items
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {block.edges.length} dependencies
          </Typography>
          {block.nodes.some(n => n.critical) && (
            <Typography variant="caption" sx={{ color: 'error.main', fontWeight: 600 }}>
              {block.nodes.filter(n => n.critical).length} on critical path
            </Typography>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Helpers
// ============================================================================

function formatCell(value: any, format?: string, badgeColorMap?: Record<string, string>): React.ReactNode {
  if (value === null || value === undefined) return '—';
  switch (format) {
    case 'currency':
      return typeof value === 'number'
        ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
        : value;
    case 'percentage':
      return typeof value === 'number' ? `${value}%` : value;
    case 'number':
      return typeof value === 'number' ? new Intl.NumberFormat('en-US').format(value) : value;
    case 'date':
      return typeof value === 'string' ? new Date(value).toLocaleDateString() : value;
    case 'badge': {
      const colorMap: Record<string, 'success' | 'error' | 'warning' | 'default'> = {};
      if (badgeColorMap) {
        Object.entries(badgeColorMap).forEach(([k, v]) => {
          colorMap[k] = v === 'emerald' || v === 'green' ? 'success'
            : v === 'rose' || v === 'red' ? 'error'
            : v === 'amber' || v === 'orange' ? 'warning'
            : 'default';
        });
      }
      return <Chip label={String(value)} size="small" color={colorMap[String(value)] || 'default'} />;
    }
    default:
      return String(value);
  }
}

export default UIBlockRenderer;

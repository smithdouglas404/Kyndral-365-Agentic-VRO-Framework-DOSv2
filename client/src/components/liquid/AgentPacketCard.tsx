/**
 * AgentPacketCard — MUI Edition
 *
 * Renders a full AgentUIPacket as a polished MUI Card with:
 * - Agent color accent bar
 * - Header with agent badge, entity name, timestamp
 * - UIBlocks rendered in order
 * - Collapsible reasoning panel
 * - Engage (chat), Refresh, Drilldown actions
 */

import { useState } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Collapse from '@mui/material/Collapse';
import Tooltip from '@mui/material/Tooltip';
import { alpha, useTheme } from '@mui/material/styles';

import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import ExpandLessRoundedIcon from '@mui/icons-material/ExpandLessRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import AccountTreeRoundedIcon from '@mui/icons-material/AccountTreeRounded';

import { UIBlockRenderer } from './UIBlockRenderer';
import type { AgentUIPacket } from '@shared/agentUIPacket';

// ============================================================================
// Agent color mapping
// ============================================================================

const agentColorMap: Record<string, string> = {
  'pmo-agent': '#7c3aed',
  'finops-agent': '#059669',
  'risk-agent': '#e11d48',
  'ocm-agent': '#0891b2',
  'tmo-agent': '#2563eb',
  'vro-agent': '#d97706',
  'governance-agent': '#4f46e5',
  'planning-agent': '#0d9488',
};

function getAgentColor(agentId: string, agentColor?: string): string {
  return agentColorMap[agentId] || agentColor || '#7c3aed';
}

function getTimeAgo(timestamp: string): string {
  const diffSec = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
  if (diffSec < 60) return 'just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
}

// ============================================================================
// Component
// ============================================================================

interface AgentPacketCardProps {
  packet: AgentUIPacket;
  onRefresh?: (packetId: string) => void;
  onDrillDown?: (entityType: string, entityId: string) => void;
  onConverse?: (packet: AgentUIPacket) => void;
  compact?: boolean;
  className?: string;
}

export function AgentPacketCard({
  packet,
  onRefresh,
  onDrillDown,
  onConverse,
  compact = false,
}: AgentPacketCardProps) {
  const [showReasoning, setShowReasoning] = useState(false);
  const theme = useTheme();
  const accentColor = getAgentColor(packet.agentId, packet.agentColor);
  const timeAgo = getTimeAgo(packet.timestamp);

  return (
    <Card
      variant="outlined"
      sx={{
        position: 'relative',
        overflow: 'visible',
        transition: 'box-shadow 0.2s, transform 0.2s',
        '&:hover': {
          boxShadow: `0 4px 20px ${alpha(accentColor, 0.15)}`,
          transform: 'translateY(-1px)',
        },
      }}
    >
      {/* Agent accent bar */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          bgcolor: accentColor,
          borderRadius: '8px 8px 0 0',
        }}
      />

      <CardContent sx={{ pt: 2.5 }}>
        {/* Header */}
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
              {packet.title}
            </Typography>
            <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
              <Chip
                label={packet.agentName}
                size="small"
                sx={{
                  bgcolor: alpha(accentColor, 0.1),
                  color: accentColor,
                  fontWeight: 600,
                  borderColor: alpha(accentColor, 0.3),
                  border: '1px solid',
                }}
              />
              {packet.revision && packet.revision > 0 && (
                <Chip
                  icon={<AccountTreeRoundedIcon />}
                  label={`v${packet.revision}`}
                  size="small"
                  color="success"
                />
              )}
              {packet.entityName && (
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {packet.entityName}
                </Typography>
              )}
            </Stack>
          </Box>

          {/* Actions */}
          <Stack direction="row" spacing={0.25} sx={{ alignItems: 'center', ml: 1 }}>
            <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', mr: 0.5 }}>
              <AccessTimeRoundedIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {timeAgo}
              </Typography>
            </Stack>
            {onConverse && (
              <Tooltip title="Engage — reshape this visualization">
                <IconButton size="small" onClick={() => onConverse(packet)}>
                  <ChatBubbleOutlineRoundedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {packet.refreshable && onRefresh && (
              <Tooltip title="Refresh">
                <IconButton size="small" onClick={() => onRefresh(packet.id)}>
                  <RefreshRoundedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {packet.drilldownEntityType && packet.drilldownEntityId && onDrillDown && (
              <Tooltip title="Drill down">
                <IconButton size="small" onClick={() => onDrillDown(packet.drilldownEntityType!, packet.drilldownEntityId!)}>
                  <OpenInNewRoundedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        </Stack>

        {/* UI Blocks */}
        <Stack spacing={2}>
          {packet.blocks.map((block, index) => (
            <UIBlockRenderer key={index} block={block} />
          ))}
        </Stack>

        {/* Reasoning panel */}
        {packet.reasoning && (
          <Box sx={{ mt: 2, borderTop: 1, borderColor: 'divider', pt: 1 }}>
            <Box
              component="button"
              onClick={() => setShowReasoning(!showReasoning)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                bgcolor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'text.secondary',
                fontSize: '0.75rem',
                p: 0,
                '&:hover': { color: 'text.primary' },
              }}
            >
              {showReasoning ? <ExpandLessRoundedIcon sx={{ fontSize: 16 }} /> : <ExpandMoreRoundedIcon sx={{ fontSize: 16 }} />}
              <AutoAwesomeRoundedIcon sx={{ fontSize: 12 }} />
              Agent Reasoning
            </Box>
            <Collapse in={showReasoning}>
              <Box sx={{ mt: 1, p: 1.5, borderRadius: 1, bgcolor: 'action.hover' }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', whiteSpace: 'pre-wrap' }}>
                  {packet.reasoning}
                </Typography>
              </Box>
            </Collapse>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

export default AgentPacketCard;

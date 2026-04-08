/**
 * AppShell — MUI Dashboard Edition
 *
 * Professional sidebar (MUI Drawer) + header (AppBar) + content area.
 * Uses MUI's List/ListItemButton for polished navigation with proper
 * selected states, icons, section headers, and collapsible groups.
 */

import { useState, useMemo, ReactNode } from 'react';
import { useLocation } from 'wouter';
import { styled, alpha } from '@mui/material/styles';
import MuiDrawer, { drawerClasses } from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import InputBase from '@mui/material/InputBase';
import Badge from '@mui/material/Badge';
import Chip from '@mui/material/Chip';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import Collapse from '@mui/material/Collapse';
import Tooltip from '@mui/material/Tooltip';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';

// MUI Icons
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';

// Lucide icons for nav items (keeping consistency with existing icon usage)
import {
  Brain, DollarSign, Shield, Users, ArrowRightLeft, Target, Scale, Map,
  FileText, FolderKanban, AlertTriangle, GitBranch, Activity, Zap, Store,
  Database, DatabaseBackup, Bot, Code, Plug, Cloud, Cpu, Layers, Radio,
  Workflow, Mic, Sliders, BarChart3, Settings, LayoutDashboard, Sparkles,
  type LucideIcon,
} from 'lucide-react';

import {
  workspaces,
  dashboards,
  getWorkspaceFromPath,
  getDashboardFromPath,
  getAllNavigationItems,
  type Workspace,
} from '@/lib/navigationRegistry';

// ============================================================================
// Drawer Styling
// ============================================================================

const DRAWER_WIDTH = 260;

const Drawer = styled(MuiDrawer)({
  width: DRAWER_WIDTH,
  flexShrink: 0,
  boxSizing: 'border-box',
  [`& .${drawerClasses.paper}`]: {
    width: DRAWER_WIDTH,
    boxSizing: 'border-box',
  },
});

// ============================================================================
// Nav Item Data
// ============================================================================

interface NavSection {
  id: string;
  label: string;
  defaultOpen: boolean;
  items: { id: string; label: string; icon: LucideIcon; path: string; isAI?: boolean }[];
}

const navSections: NavSection[] = [
  {
    id: 'workspaces',
    label: 'Workspaces',
    defaultOpen: true,
    items: workspaces.map(w => ({ id: w.id, label: w.shortLabel, icon: w.icon as any, path: w.path })),
  },
  {
    id: 'dashboards',
    label: 'Dashboards',
    defaultOpen: false,
    items: dashboards.map(d => ({ id: d.id, label: d.label, icon: d.icon as any, path: d.path, isAI: d.isAI })),
  },
  {
    id: 'canvases',
    label: 'Agent Canvases',
    defaultOpen: false,
    items: [
      { id: 'canvas-exec', label: 'Executive Canvas', icon: LayoutDashboard, path: '/canvas', isAI: true },
      { id: 'canvas-pmo', label: 'PMO Canvas', icon: Brain, path: '/canvas/pmo-agent', isAI: true },
      { id: 'canvas-finops', label: 'FinOps Canvas', icon: DollarSign, path: '/canvas/finops-agent', isAI: true },
      { id: 'canvas-risk', label: 'Risk Canvas', icon: Shield, path: '/canvas/risk-agent', isAI: true },
      { id: 'canvas-ocm', label: 'OCM Canvas', icon: Users, path: '/canvas/ocm-agent', isAI: true },
      { id: 'canvas-tmo', label: 'TMO Canvas', icon: ArrowRightLeft, path: '/canvas/tmo-agent', isAI: true },
      { id: 'canvas-vro', label: 'VRO Canvas', icon: Target, path: '/canvas/vro-agent', isAI: true },
      { id: 'canvas-gov', label: 'Governance Canvas', icon: Scale, path: '/canvas/governance-agent', isAI: true },
      { id: 'canvas-plan', label: 'Planning Canvas', icon: Map, path: '/canvas/planning-agent', isAI: true },
    ],
  },
  {
    id: 'operations',
    label: 'Operations',
    defaultOpen: false,
    items: [
      { id: 'op-programs', label: 'Programs', icon: FolderKanban, path: '/programs' },
      { id: 'op-issues', label: 'Issues', icon: AlertTriangle, path: '/issues' },
      { id: 'op-cr', label: 'Change Requests', icon: GitBranch, path: '/change-requests' },
      { id: 'op-risks', label: 'Risk Management', icon: Shield, path: '/risks' },
      { id: 'op-resources', label: 'Resources', icon: Users, path: '/resources' },
      { id: 'op-financial', label: 'Financial', icon: DollarSign, path: '/financial' },
      { id: 'op-docs', label: 'Documents', icon: FileText, path: '/documents' },
      { id: 'op-reports', label: 'Reports', icon: BarChart3, path: '/reports' },
      { id: 'op-collab', label: 'Collaboration', icon: Activity, path: '/collaboration' },
      { id: 'op-cmd', label: 'Agent Command', icon: Bot, path: '/command-center' },
      { id: 'op-orch', label: 'Orchestration', icon: Activity, path: '/monitoring' },
      { id: 'op-deep', label: 'Deep Agents', icon: Brain, path: '/deep-agent-monitoring' },
      { id: 'op-analytics', label: 'Analytics', icon: BarChart3, path: '/analytics' },
      { id: 'op-settings', label: 'Settings', icon: Settings, path: '/settings' },
    ],
  },
  {
    id: 'admin',
    label: 'Administration',
    defaultOpen: false,
    items: [
      { id: 'a-dash', label: 'Admin Dashboard', icon: LayoutDashboard, path: '/admin' },
      { id: 'a-hitl', label: 'HITL Approvals', icon: Shield, path: '/admin/hitl' },
      { id: 'a-users', label: 'Users', icon: Users, path: '/admin/users' },
      { id: 'a-perms', label: 'Permissions', icon: Shield, path: '/admin/permissions' },
      { id: 'a-int', label: 'Integrations', icon: Database, path: '/admin/integrations' },
      { id: 'a-mcp', label: 'MCP Marketplace', icon: Store, path: '/admin/mcp-marketplace' },
      { id: 'a-aint', label: 'Active Integrations', icon: Plug, path: '/admin/active-integrations' },
      { id: 'a-db', label: 'Database Mgmt', icon: DatabaseBackup, path: '/admin/database-management' },
      { id: 'a-policy', label: 'Policy as Code', icon: Code, path: '/admin/policies' },
      { id: 'a-rules', label: 'Rules Engine', icon: Zap, path: '/admin/rules-engine' },
      { id: 'a-prules', label: 'Palantir Rules', icon: Code, path: '/admin/palantir-rules' },
      { id: 'a-agents', label: 'Agent Config', icon: Activity, path: '/admin/agents' },
      { id: 'a-areg', label: 'Agent Registry', icon: Bot, path: '/admin/agent-management' },
      { id: 'a-dyn', label: 'Dynamic Agents', icon: Cpu, path: '/admin/dynamic-agents' },
      { id: 'a-arules', label: 'Agent Rules', icon: Zap, path: '/admin/rules' },
      { id: 'a-amcp', label: 'Agent MCP', icon: Plug, path: '/admin/agent-mcp' },
      { id: 'a-amem', label: 'Agent Memory', icon: Brain, path: '/admin/agent-memory' },
      { id: 'a-aattr', label: 'Agent Attributes', icon: Sliders, path: '/admin/agent-attributes' },
      { id: 'a-matrix', label: 'Collaboration Matrix', icon: GitBranch, path: '/admin/agent-collaboration-matrix' },
      { id: 'a-palantir', label: 'Palantir Ontology', icon: Cloud, path: '/admin/palantir-sync' },
      { id: 'a-onto', label: 'Ontology Explorer', icon: Layers, path: '/admin/ontology-explorer' },
      { id: 'a-subs', label: 'Subscriptions', icon: Radio, path: '/admin/subscriptions' },
      { id: 'a-wf', label: 'Workflows', icon: Workflow, path: '/admin/workflows' },
      { id: 'a-wfa', label: 'Workflow Automation', icon: Workflow, path: '/admin/workflow-automation' },
      { id: 'a-cf', label: 'Custom Fields', icon: Sliders, path: '/admin/custom-fields' },
      { id: 'a-ca', label: 'Custom Attributes', icon: Sliders, path: '/admin/custom-attributes' },
      { id: 'a-kb', label: 'Knowledge Base', icon: Database, path: '/admin/knowledge-base' },
      { id: 'a-okr', label: 'OKR Management', icon: Target, path: '/admin/okrs' },
      { id: 'a-voice', label: 'Voice Briefings', icon: Mic, path: '/admin/voice-briefings' },
      { id: 'a-company', label: 'Company Profile', icon: Users, path: '/admin/company-profile' },
      { id: 'a-rhist', label: 'Rule History', icon: Activity, path: '/admin/rule-execution-history' },
      { id: 'a-settings', label: 'System Settings', icon: Settings, path: '/admin/settings' },
    ],
  },
];

// ============================================================================
// Collapsible Nav Section
// ============================================================================

function NavSectionComponent({
  section,
  currentPath,
  onNavigate,
}: {
  section: NavSection;
  currentPath: string;
  onNavigate: (path: string) => void;
}) {
  const [open, setOpen] = useState(section.defaultOpen);

  return (
    <>
      <ListItemButton onClick={() => setOpen(!open)} sx={{ py: 0.5, px: 1 }}>
        <ListItemText
          primary={section.label}
          slotProps={{
            primary: {
              sx: {
                fontSize: '0.7rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'text.secondary',
              },
            },
          }}
        />
        {open ? <ExpandLessIcon sx={{ fontSize: 16 }} /> : <ExpandMoreIcon sx={{ fontSize: 16 }} />}
      </ListItemButton>
      <Collapse in={open} timeout="auto" unmountOnExit>
        <List dense disablePadding>
          {section.items.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path ||
              (item.path !== '/' && item.path !== '/admin' && currentPath.startsWith(item.path + '/'));

            return (
              <ListItem key={item.id} disablePadding sx={{ display: 'block' }}>
                <ListItemButton
                  selected={isActive}
                  onClick={() => onNavigate(item.path)}
                  sx={{ py: 0.5, minHeight: 36 }}
                >
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <Icon size={16} />
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    slotProps={{ primary: { sx: { fontSize: '0.8125rem' } } }}
                  />
                  {item.isAI && (
                    <AutoAwesomeRoundedIcon sx={{ fontSize: 14, color: 'warning.main', ml: 0.5 }} />
                  )}
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Collapse>
    </>
  );
}

// ============================================================================
// Sidebar
// ============================================================================

function SideMenu({ currentPath, onNavigate }: { currentPath: string; onNavigate: (path: string) => void }) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  return (
    <Drawer
      variant="permanent"
      sx={{
        display: { xs: 'none', md: 'block' },
        [`& .${drawerClasses.paper}`]: {
          backgroundColor: 'background.paper',
        },
      }}
    >
      {/* Logo / Brand */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          p: 2,
          mt: 'calc(var(--template-frame-height, 0px) + 4px)',
        }}
      >
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: 1,
            bgcolor: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <DashboardRoundedIcon sx={{ color: 'white', fontSize: 20 }} />
        </Box>
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: '16px' }}>
            Clarity ETO
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Transformation Office
          </Typography>
        </Box>
      </Box>

      <Divider />

      {/* Navigation */}
      <Box sx={{ overflow: 'auto', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <List sx={{ flex: 1, pt: 0.5 }}>
          {navSections.map((section) => (
            <NavSectionComponent
              key={section.id}
              section={section}
              currentPath={currentPath}
              onNavigate={onNavigate}
            />
          ))}
        </List>
      </Box>

      {/* User Footer */}
      <Divider />
      <Stack
        direction="row"
        sx={{
          p: 2,
          gap: 1,
          alignItems: 'center',
        }}
      >
        <Avatar
          sizes="small"
          alt="User"
          sx={{ width: 36, height: 36, bgcolor: 'primary.main' }}
        >
          U
        </Avatar>
        <Box sx={{ mr: 'auto' }}>
          <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: '16px' }}>
            Admin User
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            admin@company.com
          </Typography>
        </Box>
        <Tooltip title="Options">
          <IconButton size="small" onClick={(e) => setAnchorEl(e.currentTarget)}>
            <MoreVertRoundedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
        >
          <MenuItem onClick={() => { setAnchorEl(null); onNavigate('/settings'); }}>
            <ListItemIcon><SettingsRoundedIcon fontSize="small" /></ListItemIcon>
            Settings
          </MenuItem>
          <MenuItem onClick={() => { setAnchorEl(null); onNavigate('/admin/company-profile'); }}>
            <ListItemIcon><PersonRoundedIcon fontSize="small" /></ListItemIcon>
            Profile
          </MenuItem>
          <Divider />
          <MenuItem onClick={() => setAnchorEl(null)} sx={{ color: 'error.main' }}>
            <ListItemIcon><LogoutRoundedIcon fontSize="small" color="error" /></ListItemIcon>
            Logout
          </MenuItem>
        </Menu>
      </Stack>
    </Drawer>
  );
}

// ============================================================================
// Header
// ============================================================================

function Header({ currentPath, onNavigate }: { currentPath: string; onNavigate: (path: string) => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  const currentWorkspace = getWorkspaceFromPath(currentPath);
  const currentDashboard = getDashboardFromPath(currentPath);
  const pageTitle = currentWorkspace?.label || currentDashboard?.label || 'Dashboard';

  const searchResults = useMemo(() => {
    if (!searchQuery) return [];
    const allItems = getAllNavigationItems();
    return allItems.filter(item =>
      item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 6);
  }, [searchQuery]);

  return (
    <Box sx={{ position: 'sticky', top: 0, zIndex: 1100 }}>
      <Toolbar
        variant="dense"
        sx={{
          bgcolor: (theme) => alpha(theme.palette.background.default, 0.95),
          backdropFilter: 'blur(8px)',
          borderBottom: 1,
          borderColor: 'divider',
          justifyContent: 'space-between',
          gap: 2,
          minHeight: 56,
        }}
      >
        {/* Title */}
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
            {pageTitle}
          </Typography>
          {currentWorkspace?.description && (
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {currentWorkspace.description}
            </Typography>
          )}
        </Box>

        {/* Search */}
        <Box sx={{ flex: 1, maxWidth: 480, display: { xs: 'none', md: 'block' }, position: 'relative' }}>
          <Paper
            variant="outlined"
            sx={{
              display: 'flex',
              alignItems: 'center',
              px: 1.5,
              py: 0.5,
              borderRadius: 2,
            }}
          >
            <SearchRoundedIcon sx={{ fontSize: 20, color: 'text.secondary', mr: 1 }} />
            <InputBase
              placeholder="Search dashboards, agents, settings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ flex: 1, fontSize: '0.875rem' }}
            />
            <Typography variant="caption" sx={{ color: 'text.disabled', ml: 1 }}>
              /
            </Typography>
          </Paper>

          {/* Search Results Dropdown */}
          {searchResults.length > 0 && (
            <Paper
              elevation={4}
              sx={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                mt: 0.5,
                p: 0.5,
                borderRadius: 2,
                zIndex: 1200,
              }}
            >
              <List dense disablePadding>
                {searchResults.map(item => (
                  <ListItemButton
                    key={item.id}
                    onClick={() => { onNavigate(item.path); setSearchQuery(''); }}
                    sx={{ borderRadius: 1 }}
                  >
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <item.icon size={16} />
                    </ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      secondary={item.description}
                      slotProps={{
                        primary: { sx: { fontSize: '0.8125rem' } },
                        secondary: { sx: { fontSize: '0.7rem' } },
                      }}
                    />
                    {item.isAI && (
                      <AutoAwesomeRoundedIcon sx={{ fontSize: 14, color: 'warning.main' }} />
                    )}
                  </ListItemButton>
                ))}
              </List>
            </Paper>
          )}
        </Box>

        {/* Actions */}
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Chip
            icon={<AutoAwesomeRoundedIcon />}
            label="AI Widget"
            size="small"
            color="warning"
            variant="outlined"
            onClick={() => {}}
            sx={{ display: { xs: 'none', sm: 'flex' } }}
          />
          <Tooltip title="Notifications">
            <IconButton size="small">
              <Badge badgeContent={3} color="error" variant="dot">
                <NotificationsRoundedIcon fontSize="small" />
              </Badge>
            </IconButton>
          </Tooltip>
        </Stack>
      </Toolbar>
    </Box>
  );
}

// ============================================================================
// WorkspaceTabs (exported for page use)
// ============================================================================

interface WorkspaceTabsProps {
  workspace: Workspace;
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export function WorkspaceTabs({ workspace, activeTab, onTabChange }: WorkspaceTabsProps) {
  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: (t) => alpha(t.palette.background.paper, 0.5) }}>
      <Stack direction="row" spacing={0.5} sx={{ px: 2, overflow: 'auto' }}>
        {workspace.tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <Box
              key={tab.id}
              component="button"
              onClick={() => onTabChange(tab.id)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 2,
                py: 1.5,
                fontSize: '0.8125rem',
                fontWeight: 500,
                whiteSpace: 'nowrap',
                borderBottom: 2,
                borderColor: isActive ? 'primary.main' : 'transparent',
                color: isActive ? 'primary.main' : 'text.secondary',
                bgcolor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s',
                '&:hover': {
                  color: 'text.primary',
                  borderColor: isActive ? 'primary.main' : 'divider',
                },
              }}
            >
              <tab.icon size={16} />
              {tab.label}
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
}

// ============================================================================
// Main AppShell
// ============================================================================

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [location, setLocation] = useLocation();

  const handleNavigate = (path: string) => {
    setLocation(path);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <SideMenu currentPath={location} onNavigate={handleNavigate} />

      {/* Main Content */}
      <Box
        component="main"
        sx={(theme) => ({
          flexGrow: 1,
          backgroundColor: theme.vars
            ? `rgba(${theme.vars.palette.background.defaultChannel} / 1)`
            : alpha(theme.palette.background.default, 1),
          overflow: 'auto',
        })}
      >
        <Header currentPath={location} onNavigate={handleNavigate} />
        <Box sx={{ px: { xs: 2, md: 3 }, py: 2 }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}

export default AppShell;

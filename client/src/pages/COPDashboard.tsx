import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { CommonOperationalPicture } from "@/components/CommonOperationalPicture";
import { usePageContext } from "@/contexts/PageContext";
import { Button } from "@/components/ui/button";
import { User, Search, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { NotificationsDropdown } from "@/components/NotificationsDropdown";
import { HelpMenu } from "@/components/HelpMenu";
import { DrillDownDrawer } from "@/components/DrillDownDrawer";
import { useCompanyName, useCompanyProfile } from "@/contexts/CompanyProfileContext";

function NavBar() {
  const companyName = useCompanyName();
  const { isDemoMode } = useCompanyProfile();

  return (
    <header className="h-16 border-b border-border bg-white flex items-center px-8 justify-between sticky top-0 z-50">
      <div className="flex items-center gap-8">
        <Link href="/">
          <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity" data-testid="link-home">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-gray-900 leading-tight">{companyName}</span>
              {isDemoMode && (
                <span className="text-xs text-orange-600 font-medium ml-2">Demo</span>
              )}
            </div>
          </div>
        </Link>
      </div>
      <div className="flex items-center gap-2">
        <div className="relative w-64 hidden md:block">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search COP..."
            className="pl-9 h-9 bg-background border-border rounded-[4px]"
            data-testid="input-search"
          />
        </div>
        <NotificationsDropdown />
        <HelpMenu />
        <Button size="icon" variant="ghost" className="rounded-full" data-testid="button-user" onClick={() => alert('User Profile\n\nAccount settings, preferences, and logout options would appear here.')}>
          <User className="h-5 w-5 text-muted-foreground" />
        </Button>
      </div>
    </header>
  );
}

export default function COPDashboard() {
  const [, navigate] = useLocation();
  const { setPageContext } = usePageContext();
  const [drillDownOpen, setDrillDownOpen] = useState(false);
  const [drillDownEntity, setDrillDownEntity] = useState<{type: string; id: string} | null>(null);

  useEffect(() => {
    setPageContext({
      pageType: 'cop',
      entityId: 'common-operational-picture',
      entityName: 'Common Operational Picture',
      breadcrumb: ['COP', 'Dashboard']
    });
  }, [setPageContext]);

  const handleDrillDown = (type: string, id: string) => {
    // Handle navigation to specific dashboards
    if (type === 'strategic' && id === 'vro-dashboard') {
      navigate('/dashboard');
      return;
    }
    if (type === 'operational' && id === 'tmo-dashboard') {
      navigate('/dashboard-tmo');
      return;
    }
    if (type === 'tactical' && id === 'pmo-dashboard') {
      navigate('/dashboard');
      return;
    }
    if (type === 'project') {
      // Navigate to project detail page if it exists
      navigate(`/project/${id}`);
      return;
    }

    // Otherwise open drill-down drawer
    setDrillDownEntity({ type, id });
    setDrillDownOpen(true);
  };

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <NavBar />

      <main className="px-8 py-8 max-w-[1600px] mx-auto">
        <CommonOperationalPicture onDrillDown={handleDrillDown} />
      </main>

      <footer className="mt-12 py-8 border-t border-border bg-white px-8">
        <div className="container mx-auto">
          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <p>© 2026 Enterprise. Internal Use Only.</p>
            <p className="text-xs">
              COP updates in real-time from Battle Rhythm events
            </p>
          </div>
        </div>
      </footer>

      <DrillDownDrawer
        isOpen={drillDownOpen}
        onClose={() => setDrillDownOpen(false)}
        entityType={drillDownEntity?.type || ""}
        entityId={drillDownEntity?.id || ""}
        dataMode="VRO"
        onNavigate={(type, id) => {
          setDrillDownEntity({ type, id });
        }}
      />
    </div>
  );
}

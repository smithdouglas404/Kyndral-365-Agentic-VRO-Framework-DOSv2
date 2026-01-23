import { useEffect } from 'react';
import { Link } from 'wouter';
import { usePageContext } from "@/contexts/PageContext";
import { ArrowLeft, Database, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DataQualityDashboard } from '@/components/DataQualityDashboard';

function NavBar() {
  return (
    <header className="h-16 border-b border-border bg-white flex items-center px-8 justify-between sticky top-0 z-50">
      <div className="flex items-center gap-8">
        <Link href="/">
          <div className="font-bold text-2xl text-[#005EB8] tracking-tight cursor-pointer whitespace-nowrap">
            NextEra Energy
          </div>
        </Link>
        <nav className="hidden md:flex gap-6">
          <Link href="/dashboard" className="text-sm font-medium text-[#005EB8]">
            Dashboard
          </Link>
        </nav>
      </div>
    </header>
  );
}

export default function DataQualityPage() {
  const { setPageContext } = usePageContext();

  useEffect(() => {
    setPageContext({
      pageType: 'settings',
      entityId: 'data-quality',
      entityName: 'Data Quality & Completeness',
      breadcrumb: ['Dashboard', 'Data Quality']
    });
  }, [setPageContext]);

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      <main className="container mx-auto px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>

          <div className="flex items-start gap-4">
            <div className="p-3 bg-purple-100 rounded-xl">
              <Database className="h-8 w-8 text-purple-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Data Quality & Completeness</h1>
              <p className="text-gray-500 mt-1">
                Monitor project data completeness and identify gaps requiring attention
              </p>
            </div>
          </div>
        </div>

        {/* Info Card */}
        <Card className="mb-8 border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50 to-white">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-900">How Data Quality Works</h3>
                <p className="text-sm text-gray-700">
                  The <strong>OKR Inference Agent</strong> continuously assesses data completeness across all projects.
                  It evaluates 8 critical fields: Portfolio, Theme, Budget, Expected ROI, Division, OKR Linkage, SAFe
                  Metrics, and Performance Data.
                </p>
                <p className="text-sm text-gray-700">
                  High-value projects (&gt;$10M budget) with low data completeness are automatically flagged as
                  <strong className="text-red-600"> CRITICAL PRIORITY</strong> for immediate attention.
                </p>
                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-blue-200">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                    <span className="text-xs text-gray-600">Agents prioritize scanning projects with complete data</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                    <span className="text-xs text-gray-600">Missing OKR linkage triggers inference workflow</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dashboard */}
        <DataQualityDashboard />

        {/* Agent Info */}
        <Card className="mt-8 bg-gradient-to-r from-purple-50 to-blue-50">
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-900 mb-3">Related Agents</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4 border">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                  <span className="font-medium text-gray-900">OKR Inference Agent</span>
                </div>
                <p className="text-sm text-gray-600">
                  Assesses data quality, infers OKR linkages for projects with incomplete strategic alignment,
                  and provides confidence-scored recommendations.
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Runs: Every 2 hours • Autonomy: Supervised
                </p>
              </div>
              <div className="bg-white rounded-lg p-4 border">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="font-medium text-gray-900">VRO Agent</span>
                </div>
                <p className="text-sm text-gray-600">
                  Uses data quality assessments to prioritize value realization tracking and validate
                  business case assumptions against available project data.
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Runs: Every 60 minutes • Autonomy: Supervised
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

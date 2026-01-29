/**
 * PUBLIC LANDING PAGE
 * Marketing page for Nexus PPM - Kyndryl Clarity
 */

import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  TrendingUp,
  Shield,
  Users,
  Zap,
  Brain,
  BarChart3,
  GitBranch,
  Clock,
  CheckCircle2,
  ArrowRight,
  DollarSign,
  AlertTriangle,
  Target,
} from 'lucide-react';

export default function LandingPage() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Nexus PPM</h1>
              <p className="text-xs text-gray-600">Kyndryl Clarity</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/login')}>
              Login
            </Button>
            <Button onClick={() => navigate('/demo')} className="bg-blue-600 hover:bg-blue-700">
              Try Demo
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center space-y-6">
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200">
            <Sparkles className="w-3 h-3 mr-1" />
            10 Specialized AI Agents Working 24/7
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
            Kyndryl Clarity
            <br />
            <span className="text-blue-600">Portfolio Intelligence</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Detect, predict, and recommend—monitor your portfolio to resolve risks before they escalate.
          </p>
          <div className="flex items-center justify-center gap-4 pt-4">
            <Button
              size="lg"
              onClick={() => navigate('/demo')}
              className="bg-blue-600 hover:bg-blue-700 text-lg px-8"
            >
              Try Demo
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => {
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Learn More
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mt-16">
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-blue-600">24/7</div>
              <p className="text-sm text-gray-600 mt-1">Automated Monitoring</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-blue-600">2-3 Weeks</div>
              <p className="text-sm text-gray-600 mt-1">Earlier Risk Detection</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-blue-600">10 Agents</div>
              <p className="text-sm text-gray-600 mt-1">Specialized AI Experts</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-blue-600">40%</div>
              <p className="text-sm text-gray-600 mt-1">Time Savings</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Problem Statement */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              The Portfolio Management Challenge
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Traditional PMOs struggle with information overload, functional silos, and reactive management
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-red-200">
              <CardHeader>
                <AlertTriangle className="w-12 h-12 text-red-600 mb-4" />
                <CardTitle>Information Overload</CardTitle>
                <CardDescription>
                  100 projects × 10 reports/month = 1,000 reports to review manually
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• PMO spends 40% of time reading status updates</li>
                  <li>• Critical issues buried in documentation</li>
                  <li>• No predictive analytics</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-orange-200">
              <CardHeader>
                <GitBranch className="w-12 h-12 text-orange-600 mb-4" />
                <CardTitle>Functional Silos</CardTitle>
                <CardDescription>
                  FinOps, Risk, and Change Management don't share insights
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Teams operate independently</li>
                  <li>• No cross-functional intelligence</li>
                  <li>• Decisions made with incomplete data</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-yellow-200">
              <CardHeader>
                <Clock className="w-12 h-12 text-yellow-600 mb-4" />
                <CardTitle>Reactive Management</CardTitle>
                <CardDescription>
                  Issues detected after they become expensive problems
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• 15% of projects delayed due to late detection</li>
                  <li>• 10% budget overruns from missed risks</li>
                  <li>• $3.5-5.5M annual cost for 100-project portfolio</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              10 Specialized AI Agents
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Each agent is an expert in its domain, working together to provide comprehensive portfolio intelligence
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Agent Cards */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <DollarSign className="w-10 h-10 text-green-600 mb-2" />
                <CardTitle>DeepFinOps</CardTitle>
                <CardDescription>Financial Operations & Budget Management</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-gray-600">
                Monitors burn rates, forecasts overruns, and optimizes capital allocation across portfolios
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Clock className="w-10 h-10 text-blue-600 mb-2" />
                <CardTitle>DeepTMO</CardTitle>
                <CardDescription>Timeline & Milestone Orchestration</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-gray-600">
                Predicts schedule delays, identifies critical path risks, and recommends mitigation strategies
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Shield className="w-10 h-10 text-red-600 mb-2" />
                <CardTitle>DeepRisk</CardTitle>
                <CardDescription>Risk Identification & Mitigation</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-gray-600">
                Continuously scans for emerging risks, assesses impact, and proposes mitigation actions
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Users className="w-10 h-10 text-purple-600 mb-2" />
                <CardTitle>DeepOCM</CardTitle>
                <CardDescription>Organizational Change Management</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-gray-600">
                Tracks adoption, measures change readiness, and identifies training gaps
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <BarChart3 className="w-10 h-10 text-teal-600 mb-2" />
                <CardTitle>DeepVRO</CardTitle>
                <CardDescription>Value Realization Office</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-gray-600">
                Measures ROI, tracks benefits realization, and ensures strategic alignment
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Target className="w-10 h-10 text-orange-600 mb-2" />
                <CardTitle>DeepGovernance</CardTitle>
                <CardDescription>Policy & Compliance Enforcement</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-gray-600">
                Enforces stage gates, validates compliance, and automates approval workflows
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-gradient-to-b from-blue-50 to-white py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Proactive Intelligence, Not Reactive Dashboards
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto">
                <Brain className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold">Continuous Monitoring</h3>
              <p className="text-gray-600">
                AI agents scan projects 24/7, analyzing status reports, metrics, and cross-project dependencies
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto">
                <Zap className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold">Predictive Alerts</h3>
              <p className="text-gray-600">
                Identify issues 2-3 weeks before they escalate, with confidence scores and recommended actions
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto">
                <TrendingUp className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold">Collaborative Intelligence</h3>
              <p className="text-gray-600">
                Agents share insights automatically—what FinOps discovers, Risk can act on immediately
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 text-white py-20">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-6">
          <h2 className="text-4xl font-bold">Ready to Transform Your PMO?</h2>
          <p className="text-xl text-blue-100">
            See how 10 specialized AI agents can save your team 40% of their time
            while detecting risks 2-3 weeks earlier
          </p>
          <div className="flex items-center justify-center gap-4 pt-4">
            <Button
              size="lg"
              onClick={() => navigate('/demo')}
              className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8"
            >
              Try Demo Now
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-blue-700"
              onClick={() => navigate('/login')}
            >
              Login
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="text-white font-bold">Nexus PPM</span>
              </div>
              <p className="text-sm">
                Kyndryl Clarity - Portfolio Intelligence for enterprise PMOs
              </p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white">Features</a></li>
                <li><a href="/demo" className="hover:text-white">Try Demo</a></li>
                <li><a href="#" className="hover:text-white">Pricing</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
                <li><a href="#" className="hover:text-white">Privacy</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Documentation</a></li>
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="/login" className="hover:text-white">Login</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-sm text-center">
            © 2026 Nexus PPM. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

/**
 * PUBLIC LANDING PAGE
 * Marketing page for Smith Clarity
 */

import { useLocation } from 'wouter';
import { useEffect, useState } from 'react';
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
  LayoutDashboard,
  Bell,
  Compass,
  Layers,
  LineChart,
  Play,
  Quote,
  Building2,
} from 'lucide-react';

// Animated counter component for stats
function AnimatedCounter({ end, suffix = '', duration = 2000 }: { end: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration]);

  return <>{count}{suffix}</>;
}

// All 11 agents
const AGENTS = [
  { name: 'DeepFinOps', icon: DollarSign, color: 'text-green-600', description: 'Financial Operations & Budget Management', detail: 'Monitors burn rates, forecasts overruns, and optimizes capital allocation' },
  { name: 'DeepTMO', icon: Clock, color: 'text-blue-600', description: 'Timeline & Milestone Orchestration', detail: 'Predicts schedule delays, identifies critical path risks' },
  { name: 'DeepRisk', icon: Shield, color: 'text-red-600', description: 'Risk Identification & Mitigation', detail: 'Continuously scans for emerging risks, assesses impact' },
  { name: 'DeepOCM', icon: Users, color: 'text-purple-600', description: 'Organizational Change Management', detail: 'Tracks adoption, measures change readiness' },
  { name: 'DeepVRO', icon: BarChart3, color: 'text-teal-600', description: 'Value Realization Office', detail: 'Measures ROI, tracks benefits realization' },
  { name: 'DeepGovernance', icon: Target, color: 'text-orange-600', description: 'Policy & Compliance', detail: 'Enforces stage gates, validates compliance' },
  { name: 'DeepPMO', icon: LayoutDashboard, color: 'text-indigo-600', description: 'Portfolio Management Office', detail: 'Orchestrates portfolio health and resource allocation' },
  { name: 'DeepPlanning', icon: Compass, color: 'text-cyan-600', description: 'Strategic Planning', detail: 'Aligns initiatives with strategic objectives' },
  { name: 'DeepIntegrated', icon: Layers, color: 'text-pink-600', description: 'Integrated Management', detail: 'Coordinates cross-functional dependencies' },
  { name: 'DeepOKR', icon: LineChart, color: 'text-amber-600', description: 'OKR Intelligence', detail: 'Tracks objectives and key results alignment' },
  { name: 'DeepNotification', icon: Bell, color: 'text-rose-600', description: 'Alert & Communication', detail: 'Intelligent notifications and escalations' },
];

// Testimonials
const TESTIMONIALS = [
  {
    quote: "Smith Clarity transformed how we manage our portfolio. The AI agents caught issues we would have missed, saving us millions in potential overruns.",
    author: "VP of Technology",
    company: "Fortune 500 Energy Company",
  },
  {
    quote: "We went from reactive firefighting to proactive risk management. The ROI was evident within the first quarter.",
    author: "Chief Transformation Officer",
    company: "Global Financial Services Firm",
  },
  {
    quote: "The specialized agents work 24/7 analyzing our 200+ projects. What used to take our PMO team weeks now happens automatically.",
    author: "Director of Enterprise PMO",
    company: "Healthcare Technology Leader",
  },
];

export default function LandingPage() {
  const [, navigate] = useLocation();
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

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
              <h1 className="text-xl font-bold text-gray-900">Smith Clarity</h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/login')}>
              Login
            </Button>
            <Button variant="outline" onClick={() => navigate('/signup')}>
              Sign Up
            </Button>
            <Button onClick={() => navigate('/demo')} className="bg-blue-600 hover:bg-blue-700">
              Try Demo
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section with Dashboard Preview */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Hero Text */}
          <div className="space-y-6">
            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200">
              <Sparkles className="w-3 h-3 mr-1" />
              11 Specialized AI Agents Working 24/7
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
              Portfolio Intelligence
              <br />
              <span className="text-blue-600">Powered by AI Agents</span>
            </h1>
            <p className="text-xl text-gray-600">
              Detect risks 2-3 weeks earlier. Save 40% of PMO time. Let specialized AI agents monitor your portfolio around the clock.
            </p>
            <div className="flex items-center gap-4 pt-4">
              <Button
                size="lg"
                onClick={() => navigate('/signup')}
                className="bg-blue-600 hover:bg-blue-700 text-lg px-8"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/demo')}
                className="gap-2"
              >
                <Play className="w-4 h-4" />
                Watch Demo
              </Button>
            </div>
            <p className="text-sm text-gray-500">
              14-day free trial. No credit card required.
            </p>
          </div>

          {/* Right: Dashboard Preview Mockup */}
          <div className="relative">
            <div className="bg-white rounded-xl shadow-2xl border overflow-hidden">
              {/* Mock Browser Bar */}
              <div className="bg-gray-100 px-4 py-2 flex items-center gap-2 border-b">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="bg-white rounded px-3 py-1 text-xs text-gray-500 text-center">
                    app.smith-clarity.com/dashboard
                  </div>
                </div>
              </div>
              {/* Dashboard Preview Content */}
              <div className="p-4 bg-gray-50">
                {/* Mini Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-semibold text-sm">Portfolio Dashboard</span>
                  </div>
                  <Badge variant="outline" className="text-xs">Live</Badge>
                </div>
                {/* Mini Stats Row */}
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {[
                    { label: 'Projects', value: '127', trend: '+12%', color: 'text-blue-600' },
                    { label: 'At Risk', value: '8', trend: '-3', color: 'text-red-600' },
                    { label: 'On Track', value: '94%', trend: '+2%', color: 'text-green-600' },
                    { label: 'ROI', value: '2.4x', trend: '+0.3', color: 'text-purple-600' },
                  ].map((stat, i) => (
                    <div key={i} className="bg-white rounded-lg p-2 border">
                      <div className={`text-lg font-bold ${stat.color}`}>{stat.value}</div>
                      <div className="text-[10px] text-gray-500">{stat.label}</div>
                      <div className="text-[10px] text-green-600">{stat.trend}</div>
                    </div>
                  ))}
                </div>
                {/* Mini Agent Activity */}
                <div className="bg-white rounded-lg p-3 border">
                  <div className="text-xs font-medium mb-2 flex items-center gap-1">
                    <Brain className="w-3 h-3 text-blue-600" />
                    Live Agent Activity
                  </div>
                  <div className="space-y-2">
                    {[
                      { agent: 'DeepRisk', message: 'Identified dependency risk in Project Alpha', time: '2m ago', color: 'bg-red-100 text-red-700' },
                      { agent: 'DeepFinOps', message: 'Budget variance alert: Q2 forecast updated', time: '5m ago', color: 'bg-green-100 text-green-700' },
                      { agent: 'DeepTMO', message: 'Timeline optimization suggested for Sprint 12', time: '8m ago', color: 'bg-blue-100 text-blue-700' },
                    ].map((activity, i) => (
                      <div key={i} className="flex items-start gap-2 text-[10px]">
                        <Badge className={`${activity.color} text-[9px] px-1.5 py-0`}>{activity.agent}</Badge>
                        <span className="text-gray-600 flex-1">{activity.message}</span>
                        <span className="text-gray-400">{activity.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            {/* Floating Badge */}
            <div className="absolute -bottom-4 -right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
              <Zap className="w-4 h-4" />
              <span className="text-sm font-medium">Real-time AI Insights</span>
            </div>
          </div>
        </div>

        {/* Stats with Animation */}
        <div className="grid md:grid-cols-4 gap-6 mt-20">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="text-4xl font-bold text-blue-600">
                <AnimatedCounter end={24} />/7
              </div>
              <p className="text-sm text-gray-600 mt-2">Automated Monitoring</p>
              <p className="text-xs text-gray-400 mt-1">AI agents never sleep</p>
            </CardContent>
          </Card>
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="text-4xl font-bold text-blue-600">
                <AnimatedCounter end={2} />-<AnimatedCounter end={3} /> Weeks
              </div>
              <p className="text-sm text-gray-600 mt-2">Earlier Risk Detection</p>
              <p className="text-xs text-gray-400 mt-1">vs. traditional PMO</p>
            </CardContent>
          </Card>
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="text-4xl font-bold text-blue-600">
                <AnimatedCounter end={11} /> Agents
              </div>
              <p className="text-sm text-gray-600 mt-2">Specialized AI Experts</p>
              <p className="text-xs text-gray-400 mt-1">Each domain covered</p>
            </CardContent>
          </Card>
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="text-4xl font-bold text-blue-600">
                <AnimatedCounter end={40} />%
              </div>
              <p className="text-sm text-gray-600 mt-2">PMO Time Savings</p>
              <p className="text-xs text-gray-400 mt-1">Focus on strategy, not reports</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Trusted By Section */}
      <section className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-sm text-gray-500 mb-8">Trusted by enterprise PMOs at leading organizations</p>
          <div className="flex flex-wrap items-center justify-center gap-12 opacity-60">
            {['Fortune 500 Energy', 'Global Banking', 'Healthcare Systems', 'Tech Enterprise', 'Manufacturing Leader'].map((company, i) => (
              <div key={i} className="flex items-center gap-2 text-gray-400">
                <Building2 className="w-5 h-5" />
                <span className="font-medium">{company}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem Statement */}
      <section className="py-20">
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
            <Card className="border-red-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <AlertTriangle className="w-12 h-12 text-red-600 mb-4" />
                <CardTitle>Information Overload</CardTitle>
                <CardDescription>
                  100 projects × 10 reports/month = 1,000 reports to review manually
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="text-red-500">•</span>
                    PMO spends 40% of time reading status updates
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500">•</span>
                    Critical issues buried in documentation
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500">•</span>
                    No predictive analytics
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-orange-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <GitBranch className="w-12 h-12 text-orange-600 mb-4" />
                <CardTitle>Functional Silos</CardTitle>
                <CardDescription>
                  FinOps, Risk, and Change Management don't share insights
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500">•</span>
                    Teams operate independently
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500">•</span>
                    No cross-functional intelligence
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500">•</span>
                    Decisions made with incomplete data
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-yellow-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <Clock className="w-12 h-12 text-yellow-600 mb-4" />
                <CardTitle>Reactive Management</CardTitle>
                <CardDescription>
                  Issues detected after they become expensive problems
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-600">•</span>
                    15% of projects delayed due to late detection
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-600">•</span>
                    10% budget overruns from missed risks
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-600">•</span>
                    $3.5-5.5M annual cost for 100-project portfolio
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* AI Agents - All 11 */}
      <section id="features" className="bg-gradient-to-b from-white to-blue-50 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center space-y-4 mb-12">
            <Badge className="bg-blue-100 text-blue-700">
              <Brain className="w-3 h-3 mr-1" />
              Specialized AI Agents
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              11 Domain Experts Working Together
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Each agent is an expert in its domain, sharing insights and collaborating to provide comprehensive portfolio intelligence
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {AGENTS.map((agent, i) => (
              <Card key={i} className="hover:shadow-lg transition-all hover:-translate-y-1">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <agent.icon className={`w-8 h-8 ${agent.color}`} />
                    <div>
                      <CardTitle className="text-base">{agent.name}</CardTitle>
                      <CardDescription className="text-xs">{agent.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">{agent.detail}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
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

      {/* Testimonials */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl font-bold text-gray-900">What Leaders Are Saying</h2>
          </div>

          <Card className="border-none shadow-xl">
            <CardContent className="pt-8 pb-8 px-8">
              <Quote className="w-10 h-10 text-blue-200 mb-4" />
              <p className="text-xl text-gray-700 italic mb-6">
                "{TESTIMONIALS[activeTestimonial].quote}"
              </p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{TESTIMONIALS[activeTestimonial].author}</p>
                  <p className="text-sm text-gray-500">{TESTIMONIALS[activeTestimonial].company}</p>
                </div>
                <div className="flex gap-2">
                  {TESTIMONIALS.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveTestimonial(i)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        i === activeTestimonial ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 text-white py-20">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-6">
          <h2 className="text-4xl font-bold">Ready to Transform Your PMO?</h2>
          <p className="text-xl text-blue-100">
            Start your 14-day free trial. See how AI agents can save time and detect risks earlier.
          </p>
          <div className="flex items-center justify-center gap-4 pt-4">
            <Button
              size="lg"
              onClick={() => navigate('/signup')}
              className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8"
            >
              Start Free Trial
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-blue-700"
              onClick={() => navigate('/demo')}
            >
              Try Demo First
            </Button>
          </div>
          <p className="text-sm text-blue-200">No credit card required</p>
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
                <span className="text-white font-bold">Smith Clarity</span>
              </div>
              <p className="text-sm">
                AI-powered portfolio intelligence for enterprise PMOs. Detect risks earlier, save time, and drive better outcomes.
              </p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><button onClick={() => navigate('/demo')} className="hover:text-white transition-colors">Try Demo</button></li>
                <li><button onClick={() => navigate('/signup')} className="hover:text-white transition-colors">Start Free Trial</button></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><button onClick={() => navigate('/about')} className="hover:text-white transition-colors">About Us</button></li>
                <li><button onClick={() => navigate('/contact')} className="hover:text-white transition-colors">Contact</button></li>
                <li><button onClick={() => navigate('/privacy')} className="hover:text-white transition-colors">Privacy Policy</button></li>
                <li><button onClick={() => navigate('/terms')} className="hover:text-white transition-colors">Terms of Service</button></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><button onClick={() => navigate('/docs')} className="hover:text-white transition-colors">Documentation</button></li>
                <li><button onClick={() => navigate('/help')} className="hover:text-white transition-colors">Help Center</button></li>
                <li><button onClick={() => navigate('/login')} className="hover:text-white transition-colors">Login</button></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-sm text-center">
            © 2026 Smith Clarity. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

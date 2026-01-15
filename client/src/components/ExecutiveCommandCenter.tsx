import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Brain, Zap, Rocket, Sparkles, ChevronRight, Gauge, Network } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';

const pulseKeyframes = {
  scale: [1, 1.15, 1],
  opacity: [0.7, 1, 0.7]
};

function AIHeartbeatPulse() {
  const [bpm, setBpm] = useState(72);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setBpm(Math.floor(Math.random() * 15) + 68);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative flex items-center justify-center">
      <motion.div
        className="absolute w-32 h-32 rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20"
        animate={pulseKeyframes}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute w-24 h-24 rounded-full bg-gradient-to-r from-purple-500/30 to-blue-500/30"
        animate={pulseKeyframes}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
      />
      <motion.div
        className="absolute w-16 h-16 rounded-full bg-gradient-to-r from-purple-600/50 to-blue-600/50"
        animate={pulseKeyframes}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
      />
      <motion.div 
        className="relative z-10 w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center text-white shadow-lg"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 0.8, repeat: Infinity }}
      >
        <Brain size={24} />
      </motion.div>
      <div className="absolute -bottom-6 text-center">
        <span className="text-xs font-bold text-purple-600">{bpm} insights/min</span>
      </div>
    </div>
  );
}

function ProbabilityRibbon({ label, value, confidence, trend }: { label: string; value: string; confidence: number; trend: 'up' | 'down' | 'stable' }) {
  const ribbonColors = trend === 'up' 
    ? 'from-green-400 via-emerald-500 to-teal-600'
    : trend === 'down' 
    ? 'from-red-400 via-rose-500 to-pink-600'
    : 'from-blue-400 via-indigo-500 to-purple-600';

  return (
    <div className="relative overflow-hidden rounded-lg bg-gray-50 p-3">
      <motion.div 
        className={`absolute inset-0 bg-gradient-to-r ${ribbonColors} opacity-10`}
        animate={{ x: ['-100%', '100%'] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
      />
      <div className="relative z-10 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500">{label}</p>
          <p className="text-lg font-bold">{value}</p>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1">
            <motion.div
              className={`w-2 h-2 rounded-full ${trend === 'up' ? 'bg-green-500' : trend === 'down' ? 'bg-red-500' : 'bg-blue-500'}`}
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
            <span className="text-xs font-medium">{confidence}% confident</span>
          </div>
          <motion.div 
            className="h-1 w-16 rounded-full bg-gray-200 overflow-hidden mt-1"
          >
            <motion.div 
              className={`h-full bg-gradient-to-r ${ribbonColors}`}
              initial={{ width: 0 }}
              animate={{ width: `${confidence}%` }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function TradeoffSlider({ 
  label, 
  leftLabel, 
  rightLabel, 
  value, 
  onChange 
}: { 
  label: string; 
  leftLabel: string; 
  rightLabel: string; 
  value: number; 
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-600">{leftLabel}</span>
        <span className="font-medium text-purple-600">{label}</span>
        <span className="text-gray-600">{rightLabel}</span>
      </div>
      <Slider
        value={[value]}
        onValueChange={(v) => onChange(v[0])}
        max={100}
        step={1}
        className="w-full"
      />
    </div>
  );
}

function MonteCarloVisualization() {
  const [scenarios, setScenarios] = useState<number[]>([]);
  
  useEffect(() => {
    const generateScenarios = () => {
      const newScenarios = Array.from({ length: 50 }, () => Math.random() * 100);
      setScenarios(newScenarios);
    };
    generateScenarios();
    const interval = setInterval(generateScenarios, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative h-24 overflow-hidden rounded-lg bg-gradient-to-b from-purple-50 to-blue-50">
      <svg className="absolute inset-0 w-full h-full">
        <defs>
          <linearGradient id="coneGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#9333ea" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.3" />
          </linearGradient>
        </defs>
        <motion.path
          d="M0,60 Q100,20 200,40 T400,35 T600,45"
          fill="none"
          stroke="url(#coneGradient)"
          strokeWidth="40"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, ease: "easeInOut" }}
        />
        <motion.path
          d="M0,60 Q100,50 200,55 T400,50 T600,48"
          fill="none"
          stroke="#9333ea"
          strokeWidth="2"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        />
      </svg>
      {scenarios.slice(0, 20).map((s, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-purple-500"
          initial={{ opacity: 0, x: 0 }}
          animate={{ 
            opacity: [0, 1, 0],
            x: [0, 300],
            y: [60 - s * 0.4, 60 - s * 0.5 + Math.random() * 20]
          }}
          transition={{ 
            duration: 3,
            delay: i * 0.15,
            repeat: Infinity,
            repeatDelay: 1
          }}
        />
      ))}
      <div className="absolute bottom-1 right-2 text-[10px] text-purple-600 font-medium">
        1,000 simulated futures
      </div>
    </div>
  );
}

export function ExecutiveCommandCenter() {
  const [riskAppetite, setRiskAppetite] = useState(50);
  const [speedVsQuality, setSpeedVsQuality] = useState(60);
  const [automationLevel, setAutomationLevel] = useState(70);
  const [isOrchestrating, setIsOrchestrating] = useState(false);

  const handleOrchestrate = () => {
    setIsOrchestrating(true);
    setTimeout(() => setIsOrchestrating(false), 3000);
  };

  return (
    <Card className="overflow-hidden border-2 border-purple-200 bg-gradient-to-br from-white via-purple-50/30 to-blue-50/30">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <motion.div
              className="p-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              <Sparkles size={20} />
            </motion.div>
            <div>
              <h3 className="font-bold text-lg bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Executive Decision Theatre
              </h3>
              <p className="text-xs text-gray-500">AI-Powered Strategic Command Center</p>
            </div>
          </div>
          <AIHeartbeatPulse />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <ProbabilityRibbon 
            label="Value Realization" 
            value="$847M" 
            confidence={92} 
            trend="up" 
          />
          <ProbabilityRibbon 
            label="Risk Exposure" 
            value="12.3%" 
            confidence={87} 
            trend="down" 
          />
          <ProbabilityRibbon 
            label="Delivery Velocity" 
            value="+18%" 
            confidence={94} 
            trend="up" 
          />
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Network size={16} className="text-purple-600" />
            <span className="text-sm font-semibold text-purple-900">Monte Carlo Trajectory Forecast</span>
          </div>
          <MonteCarloVisualization />
        </div>

        <div className="bg-white rounded-lg p-4 border border-purple-100 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Gauge size={16} className="text-purple-600" />
            <span className="text-sm font-semibold text-purple-900">Strategic Trade-off Optimization</span>
          </div>
          <div className="space-y-4">
            <TradeoffSlider
              label={`${riskAppetite}%`}
              leftLabel="Conservative"
              rightLabel="Aggressive"
              value={riskAppetite}
              onChange={setRiskAppetite}
            />
            <TradeoffSlider
              label={`${speedVsQuality}%`}
              leftLabel="Quality First"
              rightLabel="Speed First"
              value={speedVsQuality}
              onChange={setSpeedVsQuality}
            />
            <TradeoffSlider
              label={`${automationLevel}%`}
              leftLabel="Human-Led"
              rightLabel="AI-Driven"
              value={automationLevel}
              onChange={setAutomationLevel}
            />
          </div>
        </div>

        <AnimatePresence>
          {isOrchestrating ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-4 text-white"
            >
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Zap size={24} />
                </motion.div>
                <div>
                  <p className="font-semibold">Orchestrating Strategic Plan...</p>
                  <p className="text-xs text-white/80">AI is coordinating 12 workstreams across 4 business units</p>
                </div>
              </div>
              <div className="mt-3">
                <Progress value={66} className="h-2 bg-white/20" />
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Button 
                onClick={handleOrchestrate}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-6 text-lg font-semibold"
              >
                <Rocket className="mr-2" size={20} />
                Execute Optimized Strategy
                <ChevronRight className="ml-2" size={20} />
              </Button>
              <p className="text-center text-xs text-gray-500 mt-2">
                One-click orchestration across all portfolios and programs
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Users, Target, GitBranch, TrendingUp, Flag, ChevronLeft, ChevronRight, Radio, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface BattleRhythmEvent {
  id: string;
  day: number; // 0 = Sunday, 1 = Monday, etc.
  name: string;
  shortName: string;
  time: string;
  duration: string;
  color: string;
  icon: any;
  purpose: string;
  attendees: string[];
  artifacts: string[];
  status: "pending" | "in-progress" | "completed";
}

interface BattleRhythmCalendarProps {
  weekOf?: Date;
  onEventClick?: (eventId: string) => void;
  onViewAgenda?: (eventId: string) => void;
}

export function BattleRhythmCalendar({
  weekOf = new Date(),
  onEventClick,
  onViewAgenda
}: BattleRhythmCalendarProps) {
  const [selectedWeek, setSelectedWeek] = useState(weekOf);

  // Get Monday of the current week
  const getMondayOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };

  const monday = getMondayOfWeek(selectedWeek);

  const events: BattleRhythmEvent[] = [
    {
      id: "scrum-of-scrums",
      day: 1,
      name: "Scrum of Scrums",
      shortName: "SoS",
      time: "09:00",
      duration: "60min",
      color: "bg-blue-500",
      icon: Users,
      purpose: "PMO tactical coordination - Sprint status, blockers, team coordination",
      attendees: ["PMO Leads", "Scrum Masters", "Team Leads"],
      artifacts: ["Sprint status", "Blocker list", "Team capacity"],
      status: "completed"
    },
    {
      id: "cross-functional-opt",
      day: 2,
      name: "Cross-Functional OPT",
      shortName: "OPT",
      time: "10:00",
      duration: "90min",
      color: "bg-purple-500",
      icon: GitBranch,
      purpose: "TMO + PMO operational coordination - Dependencies, resource conflicts, architecture",
      attendees: ["TMO", "PMO", "Architecture", "FinOps"],
      artifacts: ["Dependency matrix", "Resource plan", "Architecture decisions"],
      status: "completed"
    },
    {
      id: "decision-node",
      day: 3,
      name: "Decision Node",
      shortName: "DN",
      time: "14:00",
      duration: "120min",
      color: "bg-amber-500",
      icon: Target,
      purpose: "Kill/Continue/Pivot decisions - VRO, TMO, PMO alignment on project fate",
      attendees: ["VRO", "TMO", "PMO", "FinOps", "Risk"],
      artifacts: ["Decision matrix", "Business case updates", "Pivot proposals"],
      status: "in-progress"
    },
    {
      id: "value-pulse",
      day: 4,
      name: "Value Pulse",
      shortName: "VP",
      time: "11:00",
      duration: "60min",
      color: "bg-green-500",
      icon: TrendingUp,
      purpose: "VRO value realization review - Benefits tracking, ROI validation, strategic alignment",
      attendees: ["VRO", "Business Owners", "Finance"],
      artifacts: ["Value realization report", "Benefits tracker", "ROI dashboard"],
      status: "pending"
    },
    {
      id: "weekly-orders",
      day: 5,
      name: "Weekly Orders",
      shortName: "WO",
      time: "15:00",
      duration: "30min",
      color: "bg-red-500",
      icon: Flag,
      purpose: "Leadership broadcast - Top 3 priorities, risks, intent updates for next week",
      attendees: ["All Teams", "Leadership", "Stakeholders"],
      artifacts: ["Weekly orders", "Priority list", "Risk briefing"],
      status: "pending"
    },
  ];

  const today = new Date().getDay();
  const currentWeek = getMondayOfWeek(new Date()).getTime() === monday.getTime();

  const goToPreviousWeek = () => {
    const prevWeek = new Date(monday);
    prevWeek.setDate(prevWeek.getDate() - 7);
    setSelectedWeek(prevWeek);
  };

  const goToNextWeek = () => {
    const nextWeek = new Date(monday);
    nextWeek.setDate(nextWeek.getDate() + 7);
    setSelectedWeek(nextWeek);
  };

  const goToCurrentWeek = () => {
    setSelectedWeek(new Date());
  };

  return (
    <div className="space-y-6">
      {/* Header with Week Navigation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Radio className="h-6 w-6 text-blue-600 animate-pulse" />
                Battle Rhythm Calendar
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Weekly decision-making cadence replacing ad-hoc status meetings
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={goToPreviousWeek}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Badge variant="outline" className="px-4 py-2">
                <Calendar className="h-4 w-4 mr-2" />
                Week of {monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </Badge>
              <Button size="sm" variant="outline" onClick={goToNextWeek}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              {!currentWeek && (
                <Button size="sm" onClick={goToCurrentWeek}>
                  Today
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Sunday Recon Card */}
      <Card className="border-l-4 border-l-slate-700 bg-slate-50/50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-slate-700 rounded-lg text-white">
              <Clock className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-900">Sunday Night Recon</h3>
              <p className="text-sm text-gray-600">
                23:00 - Automated • Agents compile weekly findings and generate Monday agenda
              </p>
            </div>
            <Badge variant="outline" className="bg-slate-100 text-slate-700">
              Automated
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Events - Monday through Friday */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {events.map((event, index) => {
          const Icon = event.icon;
          const isToday = currentWeek && today === event.day;
          const isPast = currentWeek ? today > event.day : false;
          const eventDate = new Date(monday);
          eventDate.setDate(eventDate.getDate() + (event.day - 1));

          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
            >
              <Card
                className={cn(
                  "cursor-pointer transition-all border-l-4",
                  event.color.replace('bg-', 'border-l-'),
                  isToday && "ring-2 ring-blue-400 ring-opacity-50 shadow-lg"
                )}
                onClick={() => onEventClick?.(event.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs",
                        event.status === "completed" && "bg-green-100 text-green-700 border-green-300",
                        event.status === "in-progress" && "bg-blue-100 text-blue-700 border-blue-300",
                        event.status === "pending" && "bg-gray-100 text-gray-700 border-gray-300"
                      )}
                    >
                      {event.status === "completed" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                      {event.status === "in-progress" && <Radio className="h-3 w-3 mr-1 animate-pulse" />}
                      {event.status === "pending" && <Clock className="h-3 w-3 mr-1" />}
                      {event.status}
                    </Badge>
                    {isToday && (
                      <Badge className="bg-blue-500 text-white text-xs">TODAY</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={cn("p-2 rounded-lg text-white", event.color)}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm">{event.name}</h3>
                      <p className="text-xs text-gray-500">
                        {eventDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Clock className="h-3 w-3" />
                    <span>{event.time} ({event.duration})</span>
                  </div>
                  <p className="text-xs text-gray-700 leading-relaxed">{event.purpose}</p>

                  <div className="pt-3 border-t">
                    <p className="text-xs font-medium text-gray-700 mb-1">Attendees:</p>
                    <div className="flex flex-wrap gap-1">
                      {event.attendees.map((attendee, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {attendee}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2">
                    <p className="text-xs font-medium text-gray-700 mb-1">Artifacts:</p>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {event.artifacts.map((artifact, i) => (
                        <li key={i} className="flex items-start gap-1">
                          <span className="text-gray-400 mt-0.5">•</span>
                          <span>{artifact}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-xs mt-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewAgenda?.(event.id);
                    }}
                  >
                    View Agenda
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Legend */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Battle Rhythm Flow</h4>
              <p className="text-xs text-gray-600">
                Sunday Recon → Mon (Tactical) → Tue (Operational) → Wed (Decision) → Thu (Value) → Fri (Orders)
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-xs text-gray-600">Completed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-xs text-gray-600">In Progress</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-400" />
                <span className="text-xs text-gray-600">Pending</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Events This Week</p>
                <p className="text-2xl font-bold">5</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {events.filter(e => e.status === "completed").length}
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">
                  {events.filter(e => e.status === "in-progress").length}
                </p>
              </div>
              <Radio className="h-8 w-8 text-blue-500 animate-pulse" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Decisions Made</p>
                <p className="text-2xl font-bold text-purple-600">12</p>
              </div>
              <Target className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

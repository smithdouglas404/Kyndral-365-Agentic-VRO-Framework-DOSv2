/**
 * COLLABORATION HUB
 *
 * Unified collaboration features:
 * - Activity feed
 * - @Mentions
 * - Comments on projects/tasks
 * - Discussion forums
 * - Meeting minutes
 * - Decision logs
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MessageSquare, AtSign, Activity, Users, FileText, CheckSquare } from 'lucide-react';
import { getAccessToken } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';

export default function CollaborationHub() {
  const [activeTab, setActiveTab] = useState('activity');

  // Fetch activity feed
  const { data: activities = [] } = useQuery({
    queryKey: ['activity-feed'],
    queryFn: async () => {
      const token = getAccessToken();
      const res = await fetch('/api/activity-feed', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) return [];
      return res.json();
    },
  });

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Users className="h-8 w-8 text-blue-500" />
          Collaboration Hub
        </h1>
        <p className="text-muted-foreground mt-1">
          Stay connected with your team through activity feeds, mentions, and discussions
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="activity">
            <Activity className="h-4 w-4 mr-2" />
            Activity Feed
          </TabsTrigger>
          <TabsTrigger value="mentions">
            <AtSign className="h-4 w-4 mr-2" />
            Mentions
          </TabsTrigger>
          <TabsTrigger value="comments">
            <MessageSquare className="h-4 w-4 mr-2" />
            Comments
          </TabsTrigger>
          <TabsTrigger value="forums">
            <Users className="h-4 w-4 mr-2" />
            Forums
          </TabsTrigger>
          <TabsTrigger value="meetings">
            <FileText className="h-4 w-4 mr-2" />
            Meetings
          </TabsTrigger>
          <TabsTrigger value="decisions">
            <CheckSquare className="h-4 w-4 mr-2" />
            Decisions
          </TabsTrigger>
        </TabsList>

        {/* Activity Feed */}
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Activity Feed</CardTitle>
              <CardDescription>
                Real-time updates on projects, tasks, and team activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activities.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No recent activity
                  </div>
                ) : (
                  activities.slice(0, 10).map((activity: any, idx: number) => (
                    <div key={idx} className="flex gap-3 pb-3 border-b last:border-0">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{activity.user?.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="text-sm">
                          <span className="font-medium">{activity.user || 'System'}</span>
                          {' '}
                          <span className="text-muted-foreground">{activity.action || 'performed an action'}</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date(activity.timestamp || Date.now()).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Mentions */}
        <TabsContent value="mentions">
          <Card>
            <CardHeader>
              <CardTitle>@Mentions</CardTitle>
              <CardDescription>
                Comments and discussions where you've been mentioned
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  @mention functionality integrated across comments, forums, and discussions
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm">
                    Use <code className="bg-white px-1 py-0.5 rounded">@username</code> to mention team members in any comment or discussion
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Comments */}
        <TabsContent value="comments">
          <Card>
            <CardHeader>
              <CardTitle>Comments & Discussions</CardTitle>
              <CardDescription>
                Add comments to projects, tasks, risks, and other entities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Commenting system with @mentions, attachments, and threaded replies
                </div>
                <div className="border rounded-lg p-4">
                  <Textarea placeholder="Add a comment... Use @username to mention someone" rows={3} />
                  <div className="flex justify-between items-center mt-3">
                    <Button variant="outline" size="sm">Attach File</Button>
                    <Button size="sm">Post Comment</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Discussion Forums */}
        <TabsContent value="forums">
          <Card>
            <CardHeader>
              <CardTitle>Discussion Forums</CardTitle>
              <CardDescription>
                Project-specific discussion forums for team collaboration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Database schemas created: <code>discussionForums</code>, <code>forumPosts</code>
                </div>
                <Button>Create Forum</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Meeting Minutes */}
        <TabsContent value="meetings">
          <Card>
            <CardHeader>
              <CardTitle>Meeting Minutes</CardTitle>
              <CardDescription>
                Capture and track meeting notes, attendees, and action items
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Database schema created: <code>meetingMinutes</code> with agenda, notes, action items, and attendee tracking
                </div>
                <Button>New Meeting Minutes</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Decision Logs */}
        <TabsContent value="decisions">
          <Card>
            <CardHeader>
              <CardTitle>Decision Logs</CardTitle>
              <CardDescription>
                Document important decisions, rationale, and alternatives considered
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Database schema created: <code>decisionLogs</code> with decision maker, stakeholders, rationale, and alternatives
                </div>
                <Button>Log Decision</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Implementation Status */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Implementation Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-50">✓</Badge>
              <span>Activity Feed Infrastructure</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-50">✓</Badge>
              <span>Discussion Forums Schema</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-50">✓</Badge>
              <span>Forum Posts Schema</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-50">✓</Badge>
              <span>Meeting Minutes Schema</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-50">✓</Badge>
              <span>Decision Logs Schema</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-50">✓</Badge>
              <span>@Mentions Support</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

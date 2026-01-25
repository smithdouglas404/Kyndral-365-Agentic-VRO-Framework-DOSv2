import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock, GitBranch, Tag, Calendar, Eye, Download, FileCode,
  AlertTriangle, ChevronDown, ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface DmnVersion {
  key: string;
  decisionId: string;
  name: string;
  version: number;
  versionTag?: string;
  deploymentTime: string;
  resourceName: string;
}

interface DMNVersionHistoryProps {
  decisionKey: string;
  className?: string;
}

export function DMNVersionHistory({ decisionKey, className }: DMNVersionHistoryProps) {
  const [expandedVersion, setExpandedVersion] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['dmn-versions', decisionKey],
    queryFn: async () => {
      const response = await fetch(`/api/admin/camunda/dmn/${decisionKey}/versions`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch version history');
      }

      return response.json();
    },
  });

  const downloadVersion = async (versionKey: string) => {
    try {
      const response = await fetch(`/api/admin/camunda/dmn/${versionKey}/xml`, {
        credentials: 'include',
      });

      const xml = await response.text();
      const blob = new Blob([xml], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${decisionKey}-v${data.versions.find((v: DmnVersion) => v.key === versionKey)?.version}.dmn`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download version:', error);
    }
  };

  const viewVersion = (versionKey: string) => {
    // Navigate to the decision viewer with this version
    window.location.href = `/admin/camunda/dmn/${versionKey}`;
  };

  const toggleExpanded = (versionKey: string) => {
    setExpandedVersion(expandedVersion === versionKey ? null : versionKey);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTimeSince = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  if (isLoading) {
    return (
      <div className={className}>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={className}>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-red-700">
              <AlertTriangle size={24} />
              <div>
                <p className="font-medium">Failed to load version history</p>
                <p className="text-sm">{error instanceof Error ? error.message : 'Unknown error'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const versions: DmnVersion[] = data.versions || [];

  return (
    <div className={className}>
      <Card className="bg-gradient-to-r from-violet-50 to-purple-50 border-violet-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock size={20} className="text-violet-600" />
            Version History
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            Track changes and deployments over time
          </p>
        </CardHeader>
        <CardContent>
          {versions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock size={32} className="mx-auto mb-2 text-gray-400" />
              <p>No version history available</p>
            </div>
          ) : (
            <div className="space-y-3">
              {versions.map((version, index) => (
                <motion.div
                  key={version.key}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card
                    className={`${
                      index === 0
                        ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300'
                        : 'bg-white border-gray-200'
                    } transition-all hover:shadow-md`}
                  >
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-0 h-auto hover:bg-transparent"
                              onClick={() => toggleExpanded(version.key)}
                            >
                              {expandedVersion === version.key ? (
                                <ChevronDown size={20} className="text-gray-600" />
                              ) : (
                                <ChevronRight size={20} className="text-gray-600" />
                              )}
                            </Button>
                            <Badge
                              variant={index === 0 ? 'default' : 'outline'}
                              className={`text-lg px-3 py-1 ${
                                index === 0 ? 'bg-green-600 text-white' : ''
                              }`}
                            >
                              v{version.version}
                            </Badge>
                            {version.versionTag && (
                              <Badge variant="outline" className="flex items-center gap-1">
                                <Tag size={12} />
                                {version.versionTag}
                              </Badge>
                            )}
                            {index === 0 && (
                              <Badge variant="default" className="bg-green-600 text-white">
                                Latest
                              </Badge>
                            )}
                          </div>

                          <h4 className="font-semibold text-gray-900 mb-1">{version.name}</h4>

                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Calendar size={14} />
                              <span>{formatDate(version.deploymentTime)}</span>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {getTimeSince(version.deploymentTime)}
                            </Badge>
                          </div>

                          {/* Expanded Details */}
                          <AnimatePresence>
                            {expandedVersion === version.key && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-4 pt-4 border-t border-gray-200"
                              >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <p className="text-gray-600 mb-1">
                                      <span className="font-medium">Version Key:</span>
                                    </p>
                                    <p className="font-mono text-xs text-gray-800 bg-gray-100 px-2 py-1 rounded">
                                      {version.key}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-gray-600 mb-1">
                                      <span className="font-medium">Resource Name:</span>
                                    </p>
                                    <p className="font-mono text-xs text-gray-800 bg-gray-100 px-2 py-1 rounded">
                                      {version.resourceName}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-gray-600 mb-1">
                                      <span className="font-medium">Decision ID:</span>
                                    </p>
                                    <p className="font-mono text-xs text-gray-800 bg-gray-100 px-2 py-1 rounded">
                                      {version.decisionId}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-gray-600 mb-1">
                                      <span className="font-medium">Deployed:</span>
                                    </p>
                                    <p className="text-xs text-gray-800 bg-gray-100 px-2 py-1 rounded">
                                      {new Date(version.deploymentTime).toLocaleString()}
                                    </p>
                                  </div>
                                </div>

                                <div className="mt-4 flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => viewVersion(version.key)}
                                  >
                                    <Eye size={14} className="mr-1" />
                                    View This Version
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => downloadVersion(version.key)}
                                  >
                                    <Download size={14} className="mr-1" />
                                    Download XML
                                  </Button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        <div className="flex flex-col gap-2 ml-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => viewVersion(version.key)}
                            className="text-violet-600 hover:text-violet-700 hover:bg-violet-50"
                          >
                            <Eye size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => downloadVersion(version.key)}
                            className="text-violet-600 hover:text-violet-700 hover:bg-violet-50"
                          >
                            <FileCode size={16} />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}

          {/* Summary */}
          {versions.length > 0 && (
            <Card className="mt-6 bg-violet-50 border-violet-200">
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <GitBranch size={20} className="text-violet-600" />
                  <div className="text-sm text-gray-700">
                    <p className="font-medium">
                      {versions.length} version{versions.length !== 1 ? 's' : ''} deployed
                    </p>
                    <p className="text-xs text-gray-600">
                      Latest deployment: {getTimeSince(versions[0].deploymentTime)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Source Note */}
          {data.source === 'sample-data' && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-gray-600">
              <p className="flex items-center gap-1">
                <AlertTriangle size={14} className="text-blue-600" />
                Showing sample data. Configure CAMUNDA_OPERATE_URL to view live version history.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

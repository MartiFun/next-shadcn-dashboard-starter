'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardAction, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  IconDeviceTv, 
  IconDownload, 
  IconDatabase, 
  IconDeviceFloppy,
  IconAlertTriangle,
  IconCheck,
  IconClock,
  IconStar,
  IconTrendingUp,
  IconTrendingDown
} from '@tabler/icons-react';
import { sonarrAPI, SonarrSystemStatus, SonarrDiskSpace, SonarrHealth, SonarrSeries } from '@/lib/sonarr-api';

export function SonarrOverview() {
  const [systemStatus, setSystemStatus] = useState<SonarrSystemStatus | null>(null);
  const [diskSpace, setDiskSpace] = useState<SonarrDiskSpace[]>([]);
  const [health, setHealth] = useState<SonarrHealth[]>([]);
  const [series, setSeries] = useState<SonarrSeries[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [statusData, diskData, healthData, seriesData] = await Promise.all([
          sonarrAPI.getSystemStatus(),
          sonarrAPI.getDiskSpace(),
          sonarrAPI.getHealth(),
          sonarrAPI.getSeries()
        ]);

        setSystemStatus(statusData);
        setDiskSpace(diskData);
        setHealth(healthData);
        setSeries(seriesData);
      } catch (err) {
        console.error('Error loading Sonarr data:', err);
        setError(err instanceof Error ? err.message : 'Error loading data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1000;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getDiskUsage = () => {
    // Utiliser le disque /Data comme pour Radarr
    const dataDisk = diskSpace.find(disk => disk.path === '/Data');
    if (!dataDisk) return { used: 0, total: 0, percentage: 0 };
    
    const used = dataDisk.totalSpace - dataDisk.freeSpace;
    const percentage = (used / dataDisk.totalSpace) * 100;
    
    return {
      used,
      total: dataDisk.totalSpace,
      percentage: Math.round(percentage)
    };
  };

  const getSeriesStats = () => {
    if (!series.length) return { total: 0, monitored: 0, downloaded: 0, totalEpisodes: 0, downloadedEpisodes: 0 };
    
    const monitored = series.filter(s => s.monitored).length;
    const downloaded = series.filter(s => s.statistics.episodeFileCount > 0).length;
    const totalEpisodes = series.reduce((acc, s) => acc + s.statistics.totalEpisodeCount, 0);
    const downloadedEpisodes = series.reduce((acc, s) => acc + s.statistics.episodeFileCount, 0);
    
    return {
      total: series.length,
      monitored,
      downloaded,
      totalEpisodes,
      downloadedEpisodes
    };
  };

  const getHealthStatus = () => {
    const errors = health.filter(h => h.type === 'error').length;
    const warnings = health.filter(h => h.type === 'warning').length;
    
    if (errors > 0) return { status: 'error', count: errors, text: 'Errors' };
    if (warnings > 0) return { status: 'warning', count: warnings, text: 'Warnings' };
    return { status: 'healthy', count: 0, text: 'Healthy' };
  };

  const diskUsage = getDiskUsage();
  const seriesStats = getSeriesStats();
  const healthStatus = getHealthStatus();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <IconDeviceTv className="h-6 w-6" />
            Sonarr Overview 📺
          </h2>
          <Badge variant="outline" className="text-sm">
            TV Series Manager
          </Badge>
        </div>

        <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="@container/card">
              <CardHeader>
                <Skeleton className="h-4 w-1/3" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-1/2 mb-2" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <IconAlertTriangle className="h-5 w-5" />
            Loading Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Message de bienvenue */}
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <IconDeviceTv className="h-6 w-6" />
          Sonarr Overview 📺
        </h2>
        <Badge variant="outline" className="text-sm">
          TV Series Manager
        </Badge>
      </div>

      {/* Statistiques principales */}
      <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs md:grid-cols-2 lg:grid-cols-4">
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Total Series</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {seriesStats.total}
            </CardTitle>
            <CardAction>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                <IconDeviceTv className="h-3 w-3 mr-1" />
                TV Shows
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium text-blue-600">
              {seriesStats.monitored} monitored <IconDeviceTv className="size-4" />
            </div>
            <div className="text-muted-foreground">
              {seriesStats.downloaded} with episodes
            </div>
          </CardFooter>
        </Card>

        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Total Episodes</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {seriesStats.totalEpisodes}
            </CardTitle>
            <CardAction>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <IconDownload className="h-3 w-3 mr-1" />
                {seriesStats.downloadedEpisodes} Downloaded
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium text-green-600">
              {seriesStats.downloadedEpisodes > 0 ? Math.round((seriesStats.downloadedEpisodes / seriesStats.totalEpisodes) * 100) : 0}% complete <IconDownload className="size-4" />
            </div>
            <div className="text-muted-foreground">
              Across all series
            </div>
          </CardFooter>
        </Card>

        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Disk Usage</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {diskUsage.percentage}%
            </CardTitle>
            <CardAction>
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                <IconDeviceFloppy className="h-3 w-3 mr-1" />
                {formatFileSize(diskUsage.used)}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium text-purple-600">
              {formatFileSize(diskUsage.total)} total <IconDeviceFloppy className="size-4" />
            </div>
            <div className="text-muted-foreground">
              /Data disk space
            </div>
          </CardFooter>
        </Card>

        <Card className="@container/card">
          <CardHeader>
            <CardDescription>System Health</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {healthStatus.status === 'healthy' ? 'OK' : healthStatus.count}
            </CardTitle>
            <CardAction>
              <Badge 
                variant="outline" 
                className={
                  healthStatus.status === 'healthy' 
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : healthStatus.status === 'warning'
                    ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                    : 'bg-red-50 text-red-700 border-red-200'
                }
              >
                {healthStatus.status === 'healthy' ? (
                  <IconCheck className="h-3 w-3 mr-1" />
                ) : (
                  <IconAlertTriangle className="h-3 w-3 mr-1" />
                )}
                {healthStatus.text}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className={`line-clamp-1 flex gap-2 font-medium ${
              healthStatus.status === 'healthy' ? 'text-green-600' : 
              healthStatus.status === 'warning' ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {healthStatus.status === 'healthy' ? 'All systems operational' : `${healthStatus.count} issues found`}
              {healthStatus.status === 'healthy' ? <IconCheck className="size-4" /> : <IconAlertTriangle className="size-4" />}
            </div>
            <div className="text-muted-foreground">
              Version {systemStatus?.version || 'Unknown'}
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* Informations système */}
      {systemStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconDatabase className="h-5 w-5" />
              System Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Version</p>
                <p className="font-medium">{systemStatus.version}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Runtime</p>
                <p className="font-medium">{systemStatus.runtimeName} {systemStatus.runtimeVersion}</p>
              </div>
              <div>
                <p className="text-muted-foreground">OS</p>
                <p className="font-medium">{systemStatus.osName} {systemStatus.osVersion}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Start Time</p>
                <p className="font-medium">{new Date(systemStatus.startTime).toLocaleDateString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Problèmes de santé */}
      {health.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconAlertTriangle className="h-5 w-5" />
              Health Issues ({health.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {health.map((issue, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                  <IconAlertTriangle className={`h-5 w-5 mt-0.5 ${
                    issue.type === 'error' ? 'text-red-500' : 'text-yellow-500'
                  }`} />
                  <div className="flex-1">
                    <p className="font-medium">{issue.message}</p>
                    <p className="text-sm text-muted-foreground">{issue.source}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 
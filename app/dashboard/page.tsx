"use client";

import React from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  Server,
  Database,
  Cloud,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Clock,
  Package,
  Plus,
  Download,
  RefreshCw,
} from "lucide-react";

const stats = [
  {
    title: "Active Deployments",
    value: "24",
    change: "+12%",
    trend: "up",
    icon: Server,
    color: "text-green-600",
    bgColor: "bg-green-100 dark:bg-green-900/20",
  },
  {
    title: "Total Resources",
    value: "142",
    change: "+8%",
    trend: "up",
    icon: Database,
    color: "text-blue-600",
    bgColor: "bg-blue-100 dark:bg-blue-900/20",
  },
  {
    title: "Cloud Usage",
    value: "76%",
    change: "-3%",
    trend: "down",
    icon: Cloud,
    color: "text-purple-600",
    bgColor: "bg-purple-100 dark:bg-purple-900/20",
  },
  {
    title: "Active Workflows",
    value: "18",
    change: "+24%",
    trend: "up",
    icon: Activity,
    color: "text-orange-600",
    bgColor: "bg-orange-100 dark:bg-orange-900/20",
  },
];

const recentDeployments = [
  {
    id: 1,
    name: "Frontend Application",
    status: "running",
    environment: "production",
    lastUpdated: "2 minutes ago",
    version: "v2.3.1",
  },
  {
    id: 2,
    name: "API Gateway",
    status: "pending",
    environment: "staging",
    lastUpdated: "15 minutes ago",
    version: "v1.8.0",
  },
  {
    id: 3,
    name: "Database Cluster",
    status: "running",
    environment: "production",
    lastUpdated: "1 hour ago",
    version: "v3.0.0",
  },
  {
    id: 4,
    name: "Message Queue",
    status: "warning",
    environment: "development",
    lastUpdated: "3 hours ago",
    version: "v1.2.5",
  },
  {
    id: 5,
    name: "Cache Service",
    status: "running",
    environment: "production",
    lastUpdated: "5 hours ago",
    version: "v2.1.0",
  },
];

const statusConfig = {
  running: {
    color: "bg-green-500",
    text: "Running",
    icon: CheckCircle,
    variant: "default" as const,
  },
  pending: {
    color: "bg-yellow-500",
    text: "Pending",
    icon: Clock,
    variant: "secondary" as const,
  },
  warning: {
    color: "bg-orange-500",
    text: "Warning",
    icon: AlertCircle,
    variant: "destructive" as const,
  },
};

export default function DashboardPage() {
  const breadcrumbs = [{ label: "Dashboard" }];

  const pageActions = (
    <>
      <Button variant="outline" size="sm">
        <RefreshCw className="mr-2 h-4 w-4" />
        Refresh
      </Button>
      <Button variant="outline" size="sm">
        <Download className="mr-2 h-4 w-4" />
        Export
      </Button>
      <Button size="sm">
        <Plus className="mr-2 h-4 w-4" />
        New Deployment
      </Button>
    </>
  );

  return (
    <AppLayout>
      <PageContainer
        title="Dashboard"
        description="Monitor your Kubernetes deployments and resources"
        breadcrumbs={breadcrumbs}
        actions={pageActions}
      >
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map(stat => {
              const Icon = stat.icon;
              const TrendIcon = stat.trend === "up" ? TrendingUp : TrendingDown;

              return (
                <Card key={stat.title}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {stat.title}
                    </CardTitle>
                    <div className={`rounded-lg p-2 ${stat.bgColor}`}>
                      <Icon className={`h-4 w-4 ${stat.color}`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <TrendIcon className="h-3 w-3" />
                      <span
                        className={
                          stat.trend === "up"
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        {stat.change}
                      </span>
                      <span>from last month</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Recent Deployments</CardTitle>
                    <CardDescription>
                      Your latest deployment activities across all environments
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentDeployments.map(deployment => {
                    const status =
                      statusConfig[
                        deployment.status as keyof typeof statusConfig
                      ] ?? statusConfig.warning;
                    const StatusIcon = status.icon;

                    return (
                      <div
                        key={deployment.id}
                        className="flex items-center justify-between rounded-lg border border-border p-4"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`h-2 w-2 rounded-full ${status.color}`}
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {deployment.name}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {deployment.version}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Package className="h-3 w-3" />
                                {deployment.environment}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {deployment.lastUpdated}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={status.variant} className="gap-1">
                            <StatusIcon className="h-3 w-3" />
                            {status.text}
                          </Badge>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common tasks and operations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Workflow
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Server className="mr-2 h-4 w-4" />
                  Deploy Application
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Database className="mr-2 h-4 w-4" />
                  Manage Resources
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Activity className="mr-2 h-4 w-4" />
                  View Monitoring
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
                <CardDescription>Overall cluster status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">API Server</span>
                    <Badge variant="default" className="gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Healthy
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Scheduler</span>
                    <Badge variant="default" className="gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Healthy
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Controller</span>
                    <Badge variant="default" className="gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Healthy
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">etcd</span>
                    <Badge variant="secondary" className="gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Warning
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resource Usage</CardTitle>
                <CardDescription>Current cluster utilization</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-sm">
                      <span>CPU Usage</span>
                      <span className="font-medium">68%</span>
                    </div>
                    <div className="mt-1 h-2 w-full rounded-full bg-muted">
                      <div className="h-2 w-[68%] rounded-full bg-primary" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Memory</span>
                      <span className="font-medium">45%</span>
                    </div>
                    <div className="mt-1 h-2 w-full rounded-full bg-muted">
                      <div className="h-2 w-[45%] rounded-full bg-primary" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Storage</span>
                      <span className="font-medium">82%</span>
                    </div>
                    <div className="mt-1 h-2 w-full rounded-full bg-muted">
                      <div className="h-2 w-[82%] rounded-full bg-orange-500" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </PageContainer>
    </AppLayout>
  );
}

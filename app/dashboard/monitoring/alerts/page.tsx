"use client";

import { AppLayout } from "@/components/layout/AppLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCircle, Construction } from "lucide-react";

export default function AlertsPage() {
  const breadcrumbs = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Monitoring", href: "/dashboard/monitoring" },
    { label: "Alerts" },
  ];

  return (
    <AppLayout>
      <PageContainer
        title="Alerts"
        description="Configure and manage alerting rules and notifications"
        breadcrumbs={breadcrumbs}
      >
        <div className="space-y-6">
          <div className="flex items-center gap-2 rounded-lg border border-dashed border-muted-foreground/25 bg-muted/50 p-4 text-sm text-muted-foreground">
            <Construction className="h-4 w-4" />
            <span>
              Alerting is coming soon. This page will let you configure alert
              rules and notification channels.
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Alerts
                </CardTitle>
                <Bell className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-muted-foreground/40">
                  --
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Alert Rules
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-muted-foreground/40">
                  --
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Status</CardTitle>
                <Badge variant="secondary">Not configured</Badge>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  Set up alert rules to get started
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Alert History</CardTitle>
              <CardDescription>Recent alerts and notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex h-64 items-center justify-center text-muted-foreground">
                No alerts to display. Configure alert rules to start receiving
                notifications.
              </div>
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </AppLayout>
  );
}

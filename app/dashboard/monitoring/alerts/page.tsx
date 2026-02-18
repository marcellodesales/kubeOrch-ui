"use client";

import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertOverviewTab } from "@/components/monitoring/AlertOverviewTab";
import { AlertRulesTab } from "@/components/monitoring/AlertRulesTab";
import { AlertHistoryTab } from "@/components/monitoring/AlertHistoryTab";

export default function AlertsPage() {
  const [activeTab, setActiveTab] = useState("overview");

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
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="rules">Rules</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <AlertOverviewTab />
          </TabsContent>

          <TabsContent value="rules" className="mt-6">
            <AlertRulesTab />
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <AlertHistoryTab />
          </TabsContent>
        </Tabs>
      </PageContainer>
    </AppLayout>
  );
}

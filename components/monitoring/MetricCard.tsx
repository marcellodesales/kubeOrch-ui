"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Bell } from "lucide-react";
import type { LucideIcon } from "lucide-react";

function getColorClass(percentage: number): string {
  if (percentage >= 90) return "text-red-600 dark:text-red-400";
  if (percentage >= 75) return "text-amber-600 dark:text-amber-400";
  return "text-green-600 dark:text-green-400";
}

function getProgressColor(percentage: number): string {
  if (percentage >= 90) return "[&>div]:bg-red-500";
  if (percentage >= 75) return "[&>div]:bg-amber-500";
  return "[&>div]:bg-green-500";
}

interface MetricCardProps {
  title: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  percentage: number;
  used: string;
  capacity: string;
  onCreateAlert?: () => void;
}

export function MetricCard({
  title,
  icon: Icon,
  iconBg,
  iconColor,
  percentage,
  used,
  capacity,
  onCreateAlert,
}: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="flex items-center gap-1">
          {onCreateAlert && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              title={`Create alert for ${title}`}
              onClick={onCreateAlert}
            >
              <Bell className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          )}
          <div className={`rounded-lg p-2 ${iconBg}`}>
            <Icon className={`h-4 w-4 ${iconColor}`} />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${getColorClass(percentage)}`}>
          {percentage.toFixed(1)}%
        </div>
        <Progress
          value={percentage}
          className={`mt-2 h-2 ${getProgressColor(percentage)}`}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          {used} / {capacity}
        </p>
      </CardContent>
    </Card>
  );
}

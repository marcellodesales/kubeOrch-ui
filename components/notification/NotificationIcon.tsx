"use client";

import Image from "next/image";
import { Webhook } from "lucide-react";
import type { NotificationChannelType } from "@/lib/types/notification";
import { cn } from "@/lib/utils";

export const notificationConfig: Record<
  NotificationChannelType,
  {
    icon?: React.ComponentType<{ className?: string }>;
    image?: string;
    fullBleed?: boolean;
    bgColor: string;
    iconColor: string;
    label: string;
  }
> = {
  slack: {
    image: "/icons/notifications/slack.svg",
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
    iconColor: "text-purple-600 dark:text-purple-400",
    label: "Slack",
  },
  discord: {
    image: "/icons/notifications/discord.svg",
    bgColor: "bg-indigo-100 dark:bg-indigo-900/30",
    iconColor: "text-indigo-600 dark:text-indigo-400",
    label: "Discord",
  },
  telegram: {
    image: "/icons/notifications/telegram.svg",
    fullBleed: true,
    bgColor: "bg-[#2AABEE]",
    iconColor: "text-blue-600 dark:text-blue-400",
    label: "Telegram",
  },
  pagerduty: {
    image: "/icons/notifications/pagerduty.svg",
    bgColor: "bg-green-100 dark:bg-green-900/30",
    iconColor: "text-green-600 dark:text-green-400",
    label: "PagerDuty",
  },
  teams: {
    image: "/icons/notifications/teams.svg",
    bgColor: "bg-sky-100 dark:bg-sky-900/30",
    iconColor: "text-sky-600 dark:text-sky-400",
    label: "Teams",
  },
  webhook: {
    icon: Webhook,
    bgColor: "bg-violet-100 dark:bg-violet-900/30",
    iconColor: "text-violet-600 dark:text-violet-400",
    label: "Webhook",
  },
};

interface NotificationIconProps {
  type: NotificationChannelType;
  size?: "sm" | "md" | "lg";
  /** When true, the image fills the entire container (for fullBleed icons) */
  fillContainer?: boolean;
}

export function NotificationIcon({
  type,
  size = "md",
  fillContainer,
}: NotificationIconProps) {
  const config = notificationConfig[type] || notificationConfig.webhook;

  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-7 w-7",
  };
  const imageSizes = {
    sm: 16,
    md: 20,
    lg: 28,
  };

  const shouldFill = fillContainer && config.fullBleed;

  if (config.image) {
    return (
      <Image
        src={config.image}
        alt={config.label}
        width={shouldFill ? 64 : imageSizes[size]}
        height={shouldFill ? 64 : imageSizes[size]}
        className={
          shouldFill ? "h-full w-full object-cover" : sizeClasses[size]
        }
      />
    );
  }

  if (config.icon) {
    const Icon = config.icon;
    return <Icon className={cn(sizeClasses[size], config.iconColor)} />;
  }

  return null;
}

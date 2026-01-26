"use client";

import Image from "next/image";
import { Server } from "lucide-react";
import { RegistryType } from "@/lib/types/registry";
import { cn } from "@/lib/utils";

// Registry icons configuration
export const registryConfig: Record<
  RegistryType,
  {
    icon?: React.ComponentType<{ className?: string }>;
    image?: string;
    bgColor: string;
    iconColor: string;
  }
> = {
  dockerhub: {
    image: "/icons/registries/docker.png",
    bgColor: "bg-blue-100 dark:bg-blue-900/50",
    iconColor: "text-blue-600",
  },
  ghcr: {
    image: "/icons/registries/github.png",
    bgColor: "bg-purple-100 dark:bg-purple-900/50",
    iconColor: "text-purple-600",
  },
  ecr: {
    image: "/icons/registries/aws.png",
    bgColor: "bg-orange-100 dark:bg-orange-900/50",
    iconColor: "text-orange-600",
  },
  gcr: {
    image: "/icons/registries/google-cloud.png",
    bgColor: "bg-red-100 dark:bg-red-900/50",
    iconColor: "text-red-600",
  },
  acr: {
    image: "/icons/registries/azure.png",
    bgColor: "bg-sky-100 dark:bg-sky-900/50",
    iconColor: "text-sky-600",
  },
  custom: {
    icon: Server,
    bgColor: "bg-slate-100 dark:bg-slate-800",
    iconColor: "text-slate-600 dark:text-slate-400",
  },
};

interface RegistryIconProps {
  type: RegistryType;
  size?: "sm" | "md" | "lg";
}

export function RegistryIcon({ type, size = "md" }: RegistryIconProps) {
  const config = registryConfig[type];
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };
  const imageSizes = {
    sm: 16,
    md: 20,
    lg: 24,
  };

  if (config.image) {
    return (
      <Image
        src={config.image}
        alt={type}
        width={imageSizes[size]}
        height={imageSizes[size]}
        className={sizeClasses[size]}
      />
    );
  }

  if (config.icon) {
    const Icon = config.icon;
    return <Icon className={cn(sizeClasses[size], config.iconColor)} />;
  }

  return null;
}

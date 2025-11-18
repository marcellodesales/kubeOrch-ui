"use client";

import { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/stores/AuthStore";
import { Copy, Shield, Users, Link as LinkIcon, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { InlineLoader } from "@/components/ui/loader";
import { getInviteLink } from "@/lib/constants";

import { Switch } from "@/components/ui/switch";

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [inviteCode, setInviteCode] = useState<string>("");
  const [regenerateAfterSignup, setRegenerateAfterSignup] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const isAdmin = user?.role === "admin";

  const breadcrumbs = [{ label: "Settings" }];

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/settings/regenerate-setting");
      setInviteCode(response.data.inviteCode);
      setRegenerateAfterSignup(response.data.regenerateAfterSignup || false);
    } catch (error) {
      toast.error("Failed to fetch settings");
      console.error("Error fetching settings:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchSettings();
    }
  }, [isAdmin, fetchSettings]);

  const generateNewInviteCode = async () => {
    setIsLoading(true);
    try {
      const response = await api.post("/settings/generate-invite-code");
      setInviteCode(response.data.inviteCode);
      toast.success("New invite code generated successfully");
    } catch {
      toast.error("Failed to generate invite code");
    } finally {
      setIsLoading(false);
    }
  };

  const updateRegenerateSetting = async (value: boolean) => {
    try {
      await api.put("/settings/regenerate-setting", {
        regenerateAfterSignup: value,
      });
      setRegenerateAfterSignup(value);
      toast.success(
        `Regenerate after signup ${value ? "enabled" : "disabled"}`
      );
    } catch (error) {
      toast.error("Failed to update setting");
      console.error(
        "Failed to update 'regenerate after signup' setting:",
        error
      );
      // Revert the state on failure
      setRegenerateAfterSignup(!value);
    }
  };

  const copyInviteLink = () => {
    const inviteLink = getInviteLink(inviteCode);
    navigator.clipboard.writeText(inviteLink);
    toast.success("Invite link copied to clipboard!");
  };

  return (
    <AppLayout>
      <PageContainer
        title="Settings"
        description="Manage your organization settings and preferences"
        breadcrumbs={breadcrumbs}
      >
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <CardTitle>Organization Invite</CardTitle>
                </div>
                <CardDescription>
                  {isAdmin
                    ? "Share this invite link with users to allow them to join your organization"
                    : "Only organization admins can manage invite links"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isAdmin ? (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Invite Link</label>
                      <div className="p-3 bg-muted rounded-lg">
                        <code className="text-xs break-all">
                          {getInviteLink(inviteCode || "XXXXXX")}
                        </code>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="space-y-0.5">
                        <label className="text-sm font-medium flex items-center gap-2">
                          <RefreshCw className="h-4 w-4" />
                          Regenerate code after signup
                        </label>
                        <p className="text-xs text-muted-foreground">
                          Automatically generate a new invite code after each
                          user signs up
                        </p>
                      </div>
                      <Switch
                        checked={regenerateAfterSignup}
                        onCheckedChange={updateRegenerateSetting}
                        disabled={isLoading}
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="default"
                        onClick={copyInviteLink}
                        disabled={!inviteCode || isLoading}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Copy Link
                      </Button>
                      <Button
                        variant="outline"
                        onClick={generateNewInviteCode}
                        disabled={isLoading}
                        className="flex-1"
                      >
                        {isLoading ? (
                          <InlineLoader className="mr-2" />
                        ) : (
                          <LinkIcon className="mr-2 h-4 w-4" />
                        )}
                        Generate New Code
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="relative">
                      <Input
                        value="••••••"
                        readOnly
                        className="font-mono blur-sm"
                        disabled
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-background/80 backdrop-blur-sm px-4 py-2 rounded-lg border">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Shield className="h-4 w-4" />
                            <span>Admin access required</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Contact your organization admin to get an invite link for
                      new users.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                  <CardTitle>Access Control</CardTitle>
                </div>
                <CardDescription>
                  Manage user roles and permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="font-medium">Your Role</p>
                      <p className="text-sm text-muted-foreground">
                        {isAdmin ? "Organization Admin" : "User"}
                      </p>
                    </div>
                    <div
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        isAdmin
                          ? "bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400"
                          : "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                      }`}
                    >
                      {isAdmin ? "Admin" : "User"}
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    {isAdmin ? (
                      <ul className="space-y-1">
                        <li>• Create and manage invite codes</li>
                        <li>• Access all organization resources</li>
                        <li>• Manage user permissions</li>
                        <li>• View system settings</li>
                      </ul>
                    ) : (
                      <ul className="space-y-1">
                        <li>• View and manage assigned resources</li>
                        <li>• Create and deploy workflows</li>
                        <li>• Access monitoring dashboards</li>
                      </ul>
                    )}
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

"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useAuthStore } from "@/stores/AuthStore";
import { toast } from "sonner";
import api from "@/lib/api";
import {
  User,
  Mail,
  Shield,
  Calendar,
  Edit2,
  Save,
  X,
  Eye,
  EyeOff,
} from "lucide-react";
import axios from "axios";

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

export default function ProfilePage() {
  const { user, token, setAuthDetails } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordForm = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const breadcrumbs = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Profile" },
  ];

  // Initialize form data from store, no need to fetch on every page load
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
      });
    }
  }, [user]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await api.put("/profile", {
        name: formData.name,
      });

      const updatedUser = response.data.user;

      // Update auth store
      if (token) {
        setAuthDetails(token, updatedUser);
      }

      toast.success("Profile updated successfully");
      setEditMode(false);
    } catch (error) {
      toast.error("Failed to update profile");
      console.error("Failed to update profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || "",
      email: user?.email || "",
    });
    setEditMode(false);
  };

  const handlePasswordChange = async (values: ChangePasswordValues) => {
    setPasswordLoading(true);
    try {
      await api.put("/profile/password", {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      toast.success("Password updated successfully");
      setPasswordDialogOpen(false);
      passwordForm.reset();
    } catch (error) {
      const message =
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : "Failed to update password";
      toast.error(message);
    } finally {
      setPasswordLoading(false);
    }
  };

  const handlePasswordDialogChange = (open: boolean) => {
    setPasswordDialogOpen(open);
    if (!open) {
      passwordForm.reset();
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    }
  };

  const getRoleBadgeVariant = (role?: string) => {
    switch (role) {
      case "admin":
        return "default";
      case "owner":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const pageActions = (
    <>
      {!editMode ? (
        <Button variant="outline" size="sm" onClick={() => setEditMode(true)}>
          <Edit2 className="mr-2 h-4 w-4" />
          Edit Profile
        </Button>
      ) : (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancel}
            disabled={loading}
          >
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={loading}>
            <Save className="mr-2 h-4 w-4" />
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      )}
    </>
  );

  return (
    <AppLayout>
      <PageContainer
        title="Profile"
        description="Manage your account information and preferences"
        breadcrumbs={breadcrumbs}
        actions={pageActions}
      >
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Update your personal details and contact information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Profile Image</Label>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16 border-2 border-border">
                      <AvatarImage
                        src={user?.avatarUrl}
                        alt={user?.name || "Profile"}
                      />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                        {user?.name
                          ?.split(" ")
                          .map(n => n[0])
                          .join("")
                          .toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-sm text-muted-foreground">
                      <p>Your profile image is provided by Gravatar</p>
                      <p className="text-xs mt-1">
                        To change it, update your avatar at{" "}
                        <a
                          href="https://gravatar.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          gravatar.com
                        </a>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  {editMode ? (
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={e =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Enter your full name"
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-2 rounded-md bg-muted">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{formData.name || "Not set"}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="flex items-center gap-2 p-2 rounded-md bg-muted">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{formData.email}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Email cannot be changed for security reasons
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Security</CardTitle>
                <CardDescription>
                  Manage your account security settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Password</p>
                    <p className="text-sm text-muted-foreground">
                      {user?.authProvider
                        ? "Password login is not available for OAuth accounts"
                        : "Click to update your account password"}
                    </p>
                  </div>
                  {!user?.authProvider && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPasswordDialogOpen(true)}
                    >
                      Change Password
                    </Button>
                  )}
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      Two-Factor Authentication
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Enable
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Details</CardTitle>
                <CardDescription>
                  Your account information and status
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Role</span>
                  <Badge variant={getRoleBadgeVariant(user?.role)}>
                    <Shield className="mr-1 h-3 w-3" />
                    {user?.role || "user"}
                  </Badge>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">User ID</span>
                  <code className="text-xs">{user?.id?.slice(0, 8)}...</code>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Member Since
                  </span>
                  <div className="flex items-center gap-1 text-sm">
                    <Calendar className="h-3 w-3" />
                    {user?.createdAt
                      ? new Date(user.createdAt).toLocaleDateString()
                      : "N/A"}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
                <CardDescription>Your activity overview</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Clusters
                  </span>
                  <span className="text-sm font-medium">0</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Deployments
                  </span>
                  <span className="text-sm font-medium">0</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Workflows
                  </span>
                  <span className="text-sm font-medium">0</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                <CardDescription>
                  Irreversible and destructive actions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="destructive" size="sm" className="w-full">
                  Delete Account
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        <Dialog
          open={passwordDialogOpen}
          onOpenChange={handlePasswordDialogChange}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Change Password</DialogTitle>
              <DialogDescription>
                Enter your current password and choose a new one.
              </DialogDescription>
            </DialogHeader>
            <Form {...passwordForm}>
              <form
                onSubmit={passwordForm.handleSubmit(handlePasswordChange)}
                className="space-y-4"
              >
                <FormField
                  control={passwordForm.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type={showCurrentPassword ? "text" : "password"}
                            placeholder="Enter current password"
                            disabled={passwordLoading}
                            className="pr-10"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowCurrentPassword(!showCurrentPassword)
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            disabled={passwordLoading}
                          >
                            {showCurrentPassword ? (
                              <Eye className="h-4 w-4" />
                            ) : (
                              <EyeOff className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={passwordForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type={showNewPassword ? "text" : "password"}
                            placeholder="Enter new password"
                            disabled={passwordLoading}
                            className="pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            disabled={passwordLoading}
                          >
                            {showNewPassword ? (
                              <Eye className="h-4 w-4" />
                            ) : (
                              <EyeOff className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={passwordForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm New Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm new password"
                            disabled={passwordLoading}
                            className="pr-10"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowConfirmPassword(!showConfirmPassword)
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            disabled={passwordLoading}
                          >
                            {showConfirmPassword ? (
                              <Eye className="h-4 w-4" />
                            ) : (
                              <EyeOff className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handlePasswordDialogChange(false)}
                    disabled={passwordLoading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={passwordLoading}>
                    {passwordLoading ? "Updating..." : "Update Password"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </PageContainer>
    </AppLayout>
  );
}

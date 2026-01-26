"use client";

import { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { useRegistryStore } from "@/stores/RegistryStore";
import {
  RegistryType,
  RegistryCredentials,
  getRegistryTypeInfo,
} from "@/lib/types/registry";
import { cn } from "@/lib/utils";
import {
  RegistryIcon,
  registryConfig,
} from "@/components/registry/RegistryIcon";

export default function EditRegistryPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const { registries, fetchRegistries, updateRegistry } = useRegistryStore();

  const [isLoading, setIsLoading] = useState(true);
  const [name, setName] = useState("");
  const [registryUrl, setRegistryUrl] = useState("");
  const [credentials, setCredentials] = useState<RegistryCredentials>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registryType, setRegistryType] = useState<RegistryType | null>(null);

  const breadcrumbs = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Plugins", href: "/dashboard/plugins" },
    { label: "Edit Registry" },
  ];

  useEffect(() => {
    const loadRegistry = async () => {
      if (registries.length === 0) {
        await fetchRegistries();
      }
      const registry = registries.find(r => r.id === id);
      if (registry) {
        setName(registry.name);
        setRegistryUrl(registry.registryUrl || "");
        setRegistryType(registry.registryType);
        // Note: We don't populate credentials for security reasons
        // User needs to re-enter them if they want to change
      }
      setIsLoading(false);
    };
    loadRegistry();
  }, [id, registries, fetchRegistries]);

  const registry = registries.find(r => r.id === id);
  const typeInfo = registryType ? getRegistryTypeInfo(registryType) : null;

  const handleCredentialChange = (
    key: keyof RegistryCredentials,
    value: string
  ) => {
    setCredentials(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registryType || !name) return;

    setIsSubmitting(true);
    try {
      // Only include credentials if they were changed
      const hasCredentials = Object.values(credentials).some(v => v);
      await updateRegistry(id, {
        name,
        registryUrl: registryUrl || undefined,
        ...(hasCredentials ? { credentials } : {}),
      });
      toast.success("Registry updated successfully");
      router.push("/dashboard/plugins");
    } catch (error: unknown) {
      console.error("Failed to update registry:", error);
      const message =
        error instanceof Error ? error.message : "Failed to update registry";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <PageContainer
          title="Edit Registry"
          description="Update registry credentials"
          breadcrumbs={breadcrumbs}
        >
          <div className="space-y-6">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-96 w-full rounded-xl" />
          </div>
        </PageContainer>
      </AppLayout>
    );
  }

  if (!registry || !registryType) {
    return (
      <AppLayout>
        <PageContainer
          title="Edit Registry"
          description="Update registry credentials"
          breadcrumbs={breadcrumbs}
        >
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <h3 className="mb-2 text-lg font-semibold">Registry not found</h3>
            <p className="mb-6 text-sm text-muted-foreground">
              The registry you&apos;re looking for doesn&apos;t exist.
            </p>
            <Button onClick={() => router.push("/dashboard/plugins")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Plugins
            </Button>
          </div>
        </PageContainer>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageContainer
        title="Edit Registry"
        description="Update registry credentials"
        breadcrumbs={breadcrumbs}
      >
        <div className="space-y-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard/plugins")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Plugins
          </Button>

          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "rounded-lg p-2.5",
                      registryConfig[registryType].bgColor
                    )}
                  >
                    <RegistryIcon type={registryType} size="lg" />
                  </div>
                  <div>
                    <CardTitle>{typeInfo?.name} Configuration</CardTitle>
                    <CardDescription>{typeInfo?.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Name field */}
                <div className="space-y-2">
                  <Label htmlFor="name">Registry Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g., Production Docker Hub"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    A friendly name to identify this registry
                  </p>
                </div>

                {/* URL field (if required) */}
                {typeInfo?.urlRequired && (
                  <div className="space-y-2">
                    <Label htmlFor="url">Registry URL *</Label>
                    <Input
                      id="url"
                      value={registryUrl}
                      onChange={e => setRegistryUrl(e.target.value)}
                      placeholder={typeInfo.urlPlaceholder}
                      required
                    />
                  </div>
                )}

                {/* Credential fields */}
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium">Credentials</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Leave blank to keep existing credentials unchanged
                    </p>
                  </div>
                  {typeInfo?.fields.map(field => (
                    <div key={field.key} className="space-y-2">
                      <Label htmlFor={field.key}>
                        {field.label} {field.required && "*"}
                      </Label>
                      {field.type === "textarea" ? (
                        <Textarea
                          id={field.key}
                          value={(credentials[field.key] as string) || ""}
                          onChange={e =>
                            handleCredentialChange(field.key, e.target.value)
                          }
                          placeholder={field.placeholder}
                          rows={6}
                          className="font-mono text-sm"
                        />
                      ) : (
                        <Input
                          id={field.key}
                          type={field.type}
                          value={(credentials[field.key] as string) || ""}
                          onChange={e =>
                            handleCredentialChange(field.key, e.target.value)
                          }
                          placeholder={field.placeholder}
                        />
                      )}
                      {field.helpLink ? (
                        <p className="text-xs text-muted-foreground">
                          {field.helpLink.prefix}{" "}
                          <a
                            href={field.helpLink.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-600"
                          >
                            {field.helpLink.linkText}
                          </a>
                        </p>
                      ) : field.helpText ? (
                        <p className="text-xs text-muted-foreground">
                          {field.helpText}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>

                {/* Submit buttons */}
                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/dashboard/plugins")}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </div>
      </PageContainer>
    </AppLayout>
  );
}

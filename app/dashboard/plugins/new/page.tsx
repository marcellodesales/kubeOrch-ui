"use client";

import { useState } from "react";
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
import { ArrowLeft, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useRegistryStore } from "@/stores/RegistryStore";
import {
  RegistryType,
  RegistryCredentials,
  REGISTRY_TYPES,
  getRegistryTypeInfo,
} from "@/lib/types/registry";
import { cn } from "@/lib/utils";
import {
  RegistryIcon,
  registryConfig,
} from "@/components/registry/RegistryIcon";

export default function NewRegistryPage() {
  const router = useRouter();
  const { createRegistry } = useRegistryStore();

  const [step, setStep] = useState<"select" | "configure">("select");
  const [selectedType, setSelectedType] = useState<RegistryType | null>(null);
  const [name, setName] = useState("");
  const [registryUrl, setRegistryUrl] = useState("");
  const [credentials, setCredentials] = useState<RegistryCredentials>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const breadcrumbs = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Plugins", href: "/dashboard/plugins" },
    { label: "Add Registry" },
  ];

  const handleSelectType = (type: RegistryType) => {
    setSelectedType(type);
    setCredentials({});
    setRegistryUrl("");
    setStep("configure");
  };

  const handleCredentialChange = (
    key: keyof RegistryCredentials,
    value: string
  ) => {
    setCredentials(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType || !name) return;

    setIsSubmitting(true);
    try {
      await createRegistry({
        name,
        registryType: selectedType,
        registryUrl: registryUrl || undefined,
        credentials,
      });
      toast.success("Registry created successfully");
      router.push("/dashboard/plugins");
    } catch (error: unknown) {
      console.error("Failed to create registry:", error);
      const message =
        error instanceof Error ? error.message : "Failed to create registry";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const typeInfo = selectedType ? getRegistryTypeInfo(selectedType) : null;

  return (
    <AppLayout>
      <PageContainer
        title="Add Container Registry"
        description="Configure credentials for a private container registry"
        breadcrumbs={breadcrumbs}
      >
        {step === "select" ? (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Select Registry Type</CardTitle>
                <CardDescription>
                  Choose the type of container registry you want to connect
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {REGISTRY_TYPES.map(rt => {
                    const config = registryConfig[rt.type];
                    return (
                      <Card
                        key={rt.type}
                        className={cn(
                          "cursor-pointer transition-all hover:border-primary hover:shadow-md",
                          selectedType === rt.type &&
                            "border-primary ring-2 ring-primary"
                        )}
                        onClick={() => handleSelectType(rt.type)}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-center gap-3">
                            <div
                              className={cn("rounded-lg p-2.5", config.bgColor)}
                            >
                              <RegistryIcon type={rt.type} size="lg" />
                            </div>
                            <CardTitle className="text-base">
                              {rt.name}
                            </CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">
                            {rt.description}
                          </p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStep("select");
                setSelectedType(null);
              }}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Registry Selection
            </Button>

            <form onSubmit={handleSubmit}>
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    {selectedType && (
                      <div
                        className={cn(
                          "rounded-lg p-2.5",
                          registryConfig[selectedType].bgColor
                        )}
                      >
                        <RegistryIcon type={selectedType} size="lg" />
                      </div>
                    )}
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
                    <h4 className="text-sm font-medium">Credentials</h4>
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
                            required={field.required}
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
                            required={field.required}
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
                      Create Registry
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </form>
          </div>
        )}
      </PageContainer>
    </AppLayout>
  );
}

import api from "@/lib/api";

export interface TemplateParameter {
  name: string;
  label: string;
  description: string;
  type: string; // string, number, boolean, select, object, array
  required: boolean;
  default?: any;
  options?: Array<{ value: string; label: string }>;
  min?: number;
  max?: number;
}

export interface TemplateMetadata {
  id: string;
  name: string;
  displayName: string;
  category: string;
  description: string;
  icon: string;
  version: string;
  tags: string[];
  usageFrequency: string;
  difficulty: string;
  dependencies: string[];
  parameters: TemplateParameter[];
  // Plugin-specific fields
  isPlugin?: boolean;
  pluginId?: string;
}

export interface GetTemplatesResponse {
  templates: TemplateMetadata[];
}

// Get all available component templates
export async function getAvailableTemplates(): Promise<TemplateMetadata[]> {
  const response = await api.get<GetTemplatesResponse>("/templates");
  return response.data.templates || [];
}

// Get a specific template by ID
export async function getTemplate(
  id: string
): Promise<TemplateMetadata | null> {
  const templates = await getAvailableTemplates();
  return templates.find(t => t.id === id) || null;
}

// Get templates by category
export async function getTemplatesByCategory(
  category: string
): Promise<TemplateMetadata[]> {
  const templates = await getAvailableTemplates();
  return templates.filter(t => t.category === category);
}

// Get templates by tag
export async function getTemplatesByTag(
  tag: string
): Promise<TemplateMetadata[]> {
  const templates = await getAvailableTemplates();
  return templates.filter(t => t.tags.includes(tag));
}

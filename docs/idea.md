# KubeOrchestra UI - Project Overview

## Project Vision
KubeOrchestra UI is the visual interface layer that provides an intuitive drag-and-drop experience for Kubernetes deployments. The UI focuses on simplicity - users design workflows visually, and the system handles all complexity through JSON communication with the backend, which generates and applies the actual Kubernetes YAML.

## Core Architecture Principles
- **Zero-Configuration Philosophy**: Everything works with smart defaults, no config required
- **One-Click Everything**: Add complete stacks (monitoring, logging, security) with single click
- **Auto-Wiring Magic**: Services automatically discover and connect to each other
- **No YAML in Frontend**: UI works only with JSON and visual components
- **Template-Based Components**: Drag-and-drop predefined service templates
- **Simple Data Model**: Send only component IDs, connections, and parameters
- **Backend Handles Complexity**: All Kubernetes knowledge lives in the backend
- **Visual-First Design**: Focus on workflow visualization, not configuration files
- **Progressive Disclosure**: Show complexity only when user explicitly asks

## Core Value Propositions
- **Intuitive Visual Design**: Drag-and-drop templates without YAML knowledge
- **JSON-Only Communication**: Simple data exchange with backend
- **Template Library**: Pre-built components for common services
- **Real-time Monitoring**: Live deployment status and logs
- **Developer Friendly**: No Kubernetes expertise required in frontend

## Current State

### What Exists
The frontend (ui) repository currently has:
- **Next.js 15 Setup**: Modern React framework with TypeScript
- **Component Library**: Initial shadcn/ui components integrated
- **Styling System**: Tailwind CSS v4 configured
- **Basic Pages**: Landing page with hero section
- **Authentication Forms**: Login and signup forms (UI only, not connected)
- **Development Tools**: ESLint, Prettier, and TypeScript configured
- **State Management**: Zustand store setup

### Technology Stack
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Components**: shadcn/ui (Radix UI based)
- **State Management**: Zustand
- **Forms**: React Hook Form with Zod validation
- **HTTP Client**: Axios
- **Build Tool**: Turbopack

### Current Limitations
- No backend integration yet
- No actual Kubernetes visualization components
- No workflow builder interface
- No real-time features (WebSocket)
- No data visualization/charts
- No dark mode support
- No internationalization
- Limited responsive design

## New Core Features

### Visual Connection System
- **Drag-and-Drop Connections**: Draw lines between component connection points
- **Connection Points**: Visual dots on left/right sides of components for connections
- **Auto Port Management**: Automatic port detection and configuration
- **Connection Validation**: Real-time validation of compatible connections
- **Visual Feedback**: Color-coded connections showing status and data flow

### Image Source Flexibility
- **GitHub Integration**: Direct repository connection with branch selection
- **Nixpacks Auto-Build**: Automatic build configuration detection
- **Docker Hub Search**: Browse and select from Docker Hub
- **Custom Image Input**: Direct Docker image URL input
- **Build Status**: Real-time build progress and logs

### Configuration Simplicity
- **Default Mode**: One-click deployment with smart defaults
- **Advanced Mode**: Toggle to reveal all configuration options
- **Configuration Presets**: Save and reuse common configurations
- **Visual Indicators**: Clear marking of default vs custom settings
- **Progressive Disclosure**: Show complexity only when needed

### Enhanced Log Streaming
- **Multi-Container View**: See logs from all containers simultaneously
- **Real-time Streaming**: Live log updates via WebSocket
- **Advanced Filtering**: Search, filter by level, container, time
- **Log Analytics**: Pattern detection and error rate visualization
- **Export Capabilities**: Download logs for offline analysis

### Deploy Button Integration
- **One-Click Deploy**: Single button to transform and apply configuration
- **Deployment Preview**: Review generated configuration before applying
- **Progress Tracking**: Real-time deployment status updates
- **Rollback Option**: Quick rollback to previous version
- **Dry-Run Mode**: Test deployment without actual changes

### One-Click Plugin System
- **Plugin Marketplace**: Browse and install complete stacks instantly
- **Monitoring Stack**: Prometheus + Grafana with pre-configured dashboards
- **Logging Stack**: ELK/Loki with automatic log collection
- **Security Stack**: Cert-manager + Falco + Network policies
- **Storage Stack**: MinIO/Rook with automatic provisioning
- **CI/CD Stack**: Tekton/ArgoCD with GitOps setup
- **Auto-Integration**: Plugins automatically wire into existing services
- **Zero Configuration**: All plugins work out-of-the-box

### Intelligent Auto-Configuration
- **Service Auto-Discovery**: Automatically detect service types and requirements
- **Port Auto-Assignment**: Intelligent port allocation without conflicts
- **Connection Auto-Wiring**: Services find and connect to dependencies automatically
- **Resource Auto-Sizing**: Smart resource limits based on workload analysis
- **Security Auto-Hardening**: Apply security best practices by default
- **Environment Auto-Setup**: Detect dev/staging/prod and configure accordingly

## Architecture Direction

### UI Components Needed
1. **Template Component Library**: Visual representations of Kubernetes resources
   - Deployment blocks (web apps, APIs, workers)
   - Database blocks (PostgreSQL, MySQL, MongoDB)
   - Cache blocks (Redis, Memcached)
   - Message queue blocks (RabbitMQ, Kafka)
   - Load balancer and ingress blocks

2. **Workflow Canvas**: Drag-and-drop designer
   - Component palette with categorized templates
   - Visual connection lines between components
   - Component property panels for parameters
   - Workflow validation indicators
   - JSON preview of workflow structure

3. **Deployment Dashboard**: Monitor and manage
   - Deployment status cards
   - Real-time progress indicators
   - Log viewer (received from backend)
   - Resource usage displays
   - Quick actions (scale, restart, rollback)

### Key Features to Build
1. **Visual Workflow Designer**
   - Drag components from palette to canvas
   - Connect components to define dependencies
   - Configure component parameters via forms
   - Generate JSON workflow description
   - NO YAML editing or generation

2. **Template Management**
   - Browse template catalog
   - Search and filter templates
   - Template preview with descriptions
   - Parameter documentation
   - Usage examples

3. **Simple Configuration Forms**
   - Dynamic forms based on template parameters
   - Validation for required fields
   - Environment variable management
   - Resource limit sliders
   - Secret reference selectors

4. **Deployment Management**
   - One-click deployment from JSON
   - Deployment history and versions
   - Status monitoring
   - Rollback capabilities
   - No direct Kubernetes interaction

## Design System Requirements

### Visual Design Principles
- **Clean and Minimal**: Focus on content, reduce visual noise
- **Data Dense**: Display maximum information without clutter
- **Consistent**: Unified design language across all features
- **Accessible**: WCAG 2.1 AA compliance
- **Performant**: Smooth interactions even with large datasets

### Component Architecture
- Atomic design methodology
- Composable components
- Strict TypeScript typing
- Storybook documentation
- Comprehensive testing

## Next Phase Goals
1. Build visual connection system with drag-and-drop lines between components
2. Create flexible image source selector (GitHub/Docker/Custom)
3. Implement default/advanced configuration toggle for simplicity
4. Build enhanced multi-container log viewer with real-time streaming
5. Create comprehensive template gallery with Load Balancers and Service Mesh
6. Implement automatic connection validation and port management
7. Build intelligent auto-layout system for connected components

## Enhanced JSON Output from UI
```json
{
  "workflow": {
    "name": "My Application",
    "namespace": "production",
    "components": [
      {
        "id": "load-balancer",
        "templateId": "nginx-load-balancer",
        "position": { "x": 50, "y": 200 },
        "config": {
          "type": "LoadBalancer",
          "algorithm": "round-robin",
          "healthCheck": {
            "enabled": true,
            "path": "/health"
          }
        }
      },
      {
        "id": "web-frontend",
        "templateId": "nginx-webapp",
        "position": { "x": 200, "y": 200 },
        "config": {
          "imageSource": {
            "type": "github",
            "repository": "myorg/frontend",
            "branch": "main",
            "buildType": "nixpacks"
          },
          "replicas": 3,
          "configMode": "default"
        }
      },
      {
        "id": "api-backend",
        "templateId": "nodejs-api",
        "position": { "x": 400, "y": 200 },
        "config": {
          "imageSource": {
            "type": "docker",
            "image": "myapp/api:latest"
          },
          "replicas": 2,
          "configMode": "advanced",
          "advancedConfig": {
            "resources": {
              "cpu": "500m",
              "memory": "1Gi"
            },
            "autoscaling": {
              "enabled": true,
              "minReplicas": 2,
              "maxReplicas": 10
            }
          }
        }
      },
      {
        "id": "postgres-db",
        "templateId": "postgres-statefulset",
        "position": { "x": 600, "y": 200 },
        "config": {
          "version": "14",
          "storage": "20Gi",
          "configMode": "default"
        }
      },
      {
        "id": "istio-gateway",
        "templateId": "istio-service-mesh",
        "position": { "x": 350, "y": 50 },
        "config": {
          "trafficManagement": true,
          "mtls": true,
          "observability": true
        }
      }
    ],
    "connections": [
      {
        "from": "load-balancer",
        "to": "web-frontend",
        "type": "http",
        "port": "auto",
        "visualPath": "bezier"
      },
      {
        "from": "web-frontend",
        "to": "api-backend",
        "type": "http",
        "port": "auto",
        "visualPath": "bezier"
      },
      {
        "from": "api-backend",
        "to": "postgres-db",
        "type": "database",
        "protocol": "postgresql",
        "port": 5432,
        "visualPath": "bezier"
      },
      {
        "from": "istio-gateway",
        "to": "api-backend",
        "type": "service-mesh",
        "visualPath": "straight"
      }
    ],
    "deploymentOptions": {
      "dryRun": false,
      "autoApply": true,
      "logStreaming": true
    },
    "plugins": [
      {
        "id": "monitoring-stack",
        "type": "prometheus-grafana",
        "autoConfig": true,
        "config": {}
      },
      {
        "id": "logging-stack", 
        "type": "loki-promtail",
        "autoConfig": true,
        "config": {}
      }
    ],
    "autoConfiguration": {
      "enabled": true,
      "serviceDiscovery": true,
      "portManagement": "auto",
      "resourceSizing": "auto",
      "securityPolicies": "auto"
    }
  }
}
```

## Technical Improvements Needed
- Add React Query for server state management
- Implement proper error boundaries
- Add loading states and skeletons
- Create reusable layout components
- Add analytics and monitoring
- Implement performance optimizations
- Set up E2E testing with Playwright
- Add Storybook for component documentation

## Integration Requirements

### Backend API Integration
- **JSON-only communication**: No YAML in requests/responses
- **Template endpoints**: Fetch available templates and their schemas
- **Workflow submission**: POST JSON workflows for deployment
- **Status polling**: GET deployment status and progress
- **WebSocket**: Real-time logs and events streaming

### Third-party Libraries
- **React Flow**: For visual workflow canvas
- **React DnD**: For drag-and-drop functionality
- **Recharts**: For metrics visualization
- **React Hook Form**: For dynamic parameter forms
- **React Query**: For API state management
- **Socket.io Client**: For real-time updates
- **Zod**: For JSON schema validation

### Simplified Integration Points
- No direct Kubernetes API calls
- No YAML parsing or generation
- No kubectl commands
- Backend handles all cluster interactions
- Frontend focuses only on visual representation

## Performance Targets
- Initial load: < 3 seconds
- Time to Interactive: < 5 seconds
- Lighthouse score: > 90
- Bundle size: < 500KB initial
- Runtime performance: 60 FPS interactions

## Accessibility Requirements
- Keyboard navigation throughout
- Screen reader support
- High contrast mode
- Reduced motion support
- Focus management
- ARIA labels and landmarks

## Browser Support
- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- No IE11 support

## Mobile Strategy
- Responsive design for tablets
- Limited mobile phone support
- Focus on dashboard and monitoring features
- Native app consideration for future
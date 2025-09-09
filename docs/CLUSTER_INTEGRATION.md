# Cluster API Integration Guide

This document explains how to use the integrated Kubernetes cluster management APIs in your Next.js application.

## Architecture Overview

The cluster management system consists of:
1. **API Service** (`/lib/services/cluster.ts`) - Handles all API calls
2. **State Store** (`/stores/ClusterStore.ts`) - Manages cluster state with Zustand
3. **Custom Hook** (`/hooks/useCluster.ts`) - Provides easy access to cluster functionality
4. **UI Components** - Pre-built pages for cluster management

## Configuration

The API endpoint is configured in `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://your-api-host:3000/v1/api
```

## Available Features

### 1. API Service Methods

```typescript
import { clusterService } from '@/lib/services/cluster';

// Add a new cluster
await clusterService.addCluster({
  name: "production",
  displayName: "Production Cluster",
  server: "https://k8s.example.com:6443",
  authType: "token",
  credentials: {
    token: "your-bearer-token",
    caData: "ca-certificate-data"
  }
});

// List all clusters
const { clusters, default } = await clusterService.listClusters();

// Test connection
await clusterService.testConnection("production");

// Get cluster status
const status = await clusterService.getClusterStatus("production");

// Remove cluster
await clusterService.removeCluster("production");
```

### 2. Using the ClusterStore

```typescript
import { useClusterStore } from '@/stores/ClusterStore';

function MyComponent() {
  const clusterStore = useClusterStore();
  
  // Access state
  const clusters = clusterStore.clusters;
  const selectedCluster = clusterStore.selectedCluster;
  
  // Perform actions
  await clusterStore.fetchClusters();
  await clusterStore.addCluster(clusterData);
  await clusterStore.testClusterConnection("production");
}
```

### 3. Using the useCluster Hook (Recommended)

```typescript
import { useCluster } from '@/hooks/useCluster';

function ClusterDashboard() {
  const {
    clusters,
    selectedCluster,
    isLoading,
    fetchClusters,
    addCluster,
    testConnection,
    getConnectedClusters
  } = useCluster();

  // The hook automatically:
  // - Fetches clusters on mount
  // - Refreshes cluster statuses every 60 seconds
  // - Provides helper methods

  const connectedClusters = getConnectedClusters();
  
  return (
    <div>
      {isLoading ? (
        <p>Loading clusters...</p>
      ) : (
        <ul>
          {clusters.map(cluster => (
            <li key={cluster.id}>
              {cluster.displayName} - {cluster.status}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

## Authentication Types

The system supports multiple authentication methods:

### Token Authentication
```typescript
{
  authType: "token",
  credentials: {
    token: "bearer-token",
    caData: "ca-certificate" // optional
  }
}
```

### Certificate Authentication
```typescript
{
  authType: "certificate",
  credentials: {
    clientCertData: "client-cert",
    clientKeyData: "client-key",
    caData: "ca-certificate" // optional
  }
}
```

### KubeConfig File
```typescript
{
  authType: "kubeconfig",
  credentials: {
    kubeconfig: "full-kubeconfig-content"
  }
}
```

### Service Account
```typescript
{
  authType: "serviceaccount",
  credentials: {
    token: "service-account-token",
    caData: "ca-certificate" // optional
  }
}
```

### OIDC
```typescript
{
  authType: "oidc",
  credentials: {
    oidcIssuerUrl: "https://accounts.google.com",
    oidcClientId: "client-id",
    oidcClientSecret: "client-secret",
    oidcRefreshToken: "refresh-token",
    oidcScopes: ["openid", "email"]
  }
}
```

## UI Pages

The application includes pre-built pages for cluster management:

- `/dashboard/clusters` - List all clusters
- `/dashboard/clusters/new` - Add a new cluster
- `/dashboard/clusters/[name]/edit` - Edit cluster configuration (to be implemented)
- `/dashboard/clusters/[name]/share` - Share cluster access (to be implemented)

## Error Handling

All API calls include automatic error handling with toast notifications:

```typescript
try {
  await clusterStore.addCluster(clusterData);
  // Success is automatically toasted
} catch (error) {
  // Error is automatically toasted
  console.error('Failed to add cluster:', error);
}
```

## Status Monitoring

The system automatically monitors cluster health:
- Polling interval: Every 60 seconds
- Status values: `connected`, `disconnected`, `error`, `unknown`
- Stale detection: Status marked as stale if not checked in 2+ minutes

## Example: Complete Cluster Management Flow

```typescript
import { useCluster } from '@/hooks/useCluster';
import { useState } from 'react';

function ClusterManager() {
  const {
    clusters,
    isLoading,
    addCluster,
    removeCluster,
    testConnection,
    setDefaultCluster
  } = useCluster();
  
  const [newCluster, setNewCluster] = useState({
    name: '',
    server: '',
    token: ''
  });

  const handleAddCluster = async () => {
    try {
      await addCluster({
        name: newCluster.name,
        displayName: newCluster.name,
        server: newCluster.server,
        authType: 'token',
        credentials: {
          token: newCluster.token
        }
      });
      
      // Test the connection
      await testConnection(newCluster.name);
      
      // Set as default if it's the first cluster
      if (clusters.length === 0) {
        await setDefaultCluster(newCluster.name);
      }
      
      // Clear form
      setNewCluster({ name: '', server: '', token: '' });
    } catch (error) {
      console.error('Failed to add cluster:', error);
    }
  };

  return (
    <div>
      {/* Add cluster form */}
      <form onSubmit={e => { e.preventDefault(); handleAddCluster(); }}>
        <input
          value={newCluster.name}
          onChange={e => setNewCluster({...newCluster, name: e.target.value})}
          placeholder="Cluster name"
        />
        <input
          value={newCluster.server}
          onChange={e => setNewCluster({...newCluster, server: e.target.value})}
          placeholder="API server URL"
        />
        <textarea
          value={newCluster.token}
          onChange={e => setNewCluster({...newCluster, token: e.target.value})}
          placeholder="Bearer token"
        />
        <button type="submit">Add Cluster</button>
      </form>

      {/* Cluster list */}
      <div>
        {clusters.map(cluster => (
          <div key={cluster.id}>
            <h3>{cluster.displayName}</h3>
            <p>Status: {cluster.status}</p>
            <button onClick={() => testConnection(cluster.name)}>
              Test Connection
            </button>
            <button onClick={() => removeCluster(cluster.name)}>
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Security Notes

1. All credentials are sent over HTTPS to the backend
2. Credentials are encrypted at rest in the backend using AES-256 GCM
3. JWT tokens are required for all API calls
4. Sensitive data is never stored in localStorage (only non-sensitive selections)

## Troubleshooting

### Connection Issues
- Check the API server URL is correct and reachable
- Verify credentials are valid and not expired
- Check CA certificate if using self-signed certificates

### Authentication Errors
- Ensure JWT token in AuthStore is valid
- Check token expiration with `useAuthStore.getState().isTokenExpired()`
- Verify user has permissions to manage clusters

### Status Not Updating
- Check browser console for errors
- Verify API endpoint is accessible
- Check network tab for failed requests
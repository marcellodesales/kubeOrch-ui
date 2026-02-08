export interface AuthMethodsResponse {
  builtin: {
    enabled: boolean;
    signupEnabled: boolean;
  };
  providers: OAuthProviderInfo[];
}

export interface OAuthProviderInfo {
  name: string;
  displayName: string;
  icon: string;
}

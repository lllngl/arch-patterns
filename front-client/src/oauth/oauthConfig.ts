export function getOAuthAuthorizationEndpoint(): string | undefined {
  const v = import.meta.env.VITE_OAUTH_AUTHORIZATION_ENDPOINT as string | undefined;
  return v && v.length > 0 ? v : undefined;
}

export function getOAuthClientId(): string | undefined {
  const v = import.meta.env.VITE_OAUTH_CLIENT_ID as string | undefined;
  return v && v.length > 0 ? v : undefined;
}

export function getOAuthRedirectUri(): string {
  const v = import.meta.env.VITE_OAUTH_REDIRECT_URI as string | undefined;
  if (v && v.length > 0) {
    return v;
  }
  return `${window.location.origin}/auth/callback`;
}

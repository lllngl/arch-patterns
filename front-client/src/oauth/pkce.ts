function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sha256(plain: string): Promise<ArrayBuffer> {
  const data = new TextEncoder().encode(plain);
  return crypto.subtle.digest("SHA-256", data);
}

const VERIFIER_KEY = "oauth_pkce_verifier";
const STATE_KEY = "oauth_state";

export async function createPkceRequest(): Promise<{ codeVerifier: string; codeChallenge: string; state: string }> {
  const codeVerifier = base64UrlEncode(crypto.getRandomValues(new Uint8Array(32)).buffer);
  const codeChallenge = base64UrlEncode(await sha256(codeVerifier));
  const state = base64UrlEncode(crypto.getRandomValues(new Uint8Array(16)).buffer);
  sessionStorage.setItem(VERIFIER_KEY, codeVerifier);
  sessionStorage.setItem(STATE_KEY, state);
  return { codeVerifier, codeChallenge, state };
}

export function consumePkceVerifier(): string | null {
  const v = sessionStorage.getItem(VERIFIER_KEY);
  sessionStorage.removeItem(VERIFIER_KEY);
  return v;
}

export function peekOAuthState(): string | null {
  return sessionStorage.getItem(STATE_KEY);
}

export function consumeOAuthState(): void {
  sessionStorage.removeItem(STATE_KEY);
}

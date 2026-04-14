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
const REQUESTS_KEY = "oauth_pkce_requests";

type PkceRequestMap = Record<string, { verifier: string; createdAt: number }>;

function readPkceRequestMap(): PkceRequestMap {
  const raw = sessionStorage.getItem(REQUESTS_KEY);
  if (!raw) {
    return {};
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") {
      return {};
    }
    const result: PkceRequestMap = {};
    for (const [state, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (!value || typeof value !== "object") {
        continue;
      }
      const verifier = (value as { verifier?: unknown }).verifier;
      const createdAt = (value as { createdAt?: unknown }).createdAt;
      if (typeof verifier === "string") {
        result[state] = {
          verifier,
          createdAt: typeof createdAt === "number" ? createdAt : Date.now(),
        };
      }
    }
    return result;
  } catch {
    return {};
  }
}

function writePkceRequestMap(map: PkceRequestMap): void {
  sessionStorage.setItem(REQUESTS_KEY, JSON.stringify(map));
}

export async function createPkceRequest(): Promise<{ codeVerifier: string; codeChallenge: string; state: string }> {
  const codeVerifier = base64UrlEncode(crypto.getRandomValues(new Uint8Array(32)).buffer);
  const codeChallenge = base64UrlEncode(await sha256(codeVerifier));
  const state = base64UrlEncode(crypto.getRandomValues(new Uint8Array(16)).buffer);
  const requests = readPkceRequestMap();
  requests[state] = { verifier: codeVerifier, createdAt: Date.now() };
  writePkceRequestMap(requests);
  sessionStorage.setItem(VERIFIER_KEY, codeVerifier);
  sessionStorage.setItem(STATE_KEY, state);
  return { codeVerifier, codeChallenge, state };
}

export function hasOAuthState(state: string): boolean {
  const requests = readPkceRequestMap();
  if (requests[state]) {
    return true;
  }
  return sessionStorage.getItem(STATE_KEY) === state;
}

export function peekPkceVerifierByState(state: string): string | null {
  const requests = readPkceRequestMap();
  const request = requests[state];
  if (request?.verifier) {
    return request.verifier;
  }
  // Legacy fallback for old sessions.
  if (sessionStorage.getItem(STATE_KEY) === state) {
    return sessionStorage.getItem(VERIFIER_KEY);
  }
  return null;
}

/** Read verifier without removing (use before token exchange; remove in `consumePkceVerifier` after). */
export function peekPkceVerifier(): string | null {
  return sessionStorage.getItem(VERIFIER_KEY);
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

export function consumePkceState(state: string): void {
  const requests = readPkceRequestMap();
  if (requests[state]) {
    delete requests[state];
    writePkceRequestMap(requests);
  }
  if (sessionStorage.getItem(STATE_KEY) === state) {
    sessionStorage.removeItem(STATE_KEY);
    sessionStorage.removeItem(VERIFIER_KEY);
  }
}

import type { UserProfile } from "../../contracts/auth";
import { completeOAuthLoginFromCallback, type OAuthCallbackParams } from "./oauthLoginUseCase";

let inflight: Promise<UserProfile> | null = null;
let inflightKey: string | null = null;
let cached: { key: string; profile: UserProfile } | null = null;

function callbackKey(params: OAuthCallbackParams): string | null {
  const { code, state } = params;
  if (!code || !state) {
    return null;
  }
  return `${code}:${state}`;
}

export function completeOAuthLoginFromCallbackDeduped(params: OAuthCallbackParams): Promise<UserProfile> {
  const key = callbackKey(params);
  if (!key) {
    return completeOAuthLoginFromCallback(params);
  }

  if (cached?.key === key) {
    return Promise.resolve(cached.profile);
  }

  if (inflightKey === key && inflight) {
    return inflight;
  }

  inflightKey = key;
  inflight = completeOAuthLoginFromCallback(params)
    .then((profile) => {
      cached = { key, profile };
      return profile;
    })
    .finally(() => {
      inflight = null;
      inflightKey = null;
    });

  return inflight;
}

export function clearOAuthCallbackCache(): void {
  cached = null;
}

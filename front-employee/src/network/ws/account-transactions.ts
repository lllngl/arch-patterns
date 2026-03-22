import { Client } from "@stomp/stompjs";
import { appEnv } from "@/config/env";
import { getAccessToken } from "@/stores/auth";

export type LiveConnectionState =
  | "idle"
  | "connecting"
  | "connected"
  | "disabled"
  | "error";

interface TransactionInvalidationEvent {
  eventType: "TRANSACTIONS_INVALIDATED";
  accountId: string;
  operationRequestId: string;
  changedAt: string;
}

type TransactionEvent = TransactionInvalidationEvent;

function resolveBrokerUrl() {
  const source = appEnv.transactionsWsUrl;
  if (!source) {
    return null;
  }

  if (source.startsWith("ws://") || source.startsWith("wss://")) {
    return source;
  }

  if (source.startsWith("http://") || source.startsWith("https://")) {
    const httpUrl = new URL(source);
    httpUrl.protocol = httpUrl.protocol === "https:" ? "wss:" : "ws:";
    return httpUrl.toString();
  }

  const browserUrl = new URL(source, window.location.origin);
  browserUrl.protocol = browserUrl.protocol === "https:" ? "wss:" : "ws:";
  return browserUrl.toString();
}

export function subscribeToAccountTransactions(
  accountId: string,
  handlers: {
    onInvalidated: () => void;
    onStateChange?: (state: LiveConnectionState) => void;
    onError?: (error: Event) => void;
  }
) {
  const brokerURL = resolveBrokerUrl();
  const accessToken = getAccessToken();

  if (!brokerURL || !accessToken) {
    handlers.onStateChange?.("disabled");
    return () => undefined;
  }

  handlers.onStateChange?.("connecting");
  const client = new Client({
    brokerURL,
    reconnectDelay: 5000,
    connectHeaders: {
      Authorization: `Bearer ${accessToken}`,
    },
    onConnect: () => {
      client.subscribe(`/topic/accounts/${accountId}/transactions`, (frame) => {
        try {
          const payload = JSON.parse(frame.body) as TransactionEvent;
          if (
            payload.eventType === "TRANSACTIONS_INVALIDATED" &&
            payload.accountId === accountId
          ) {
            handlers.onInvalidated();
          }
        } catch {
          // Ignore malformed messages from an incompatible backend.
        }
      });

      handlers.onStateChange?.("connected");
    },
    onStompError: () => {
      handlers.onStateChange?.("error");
    },
    onWebSocketError: (event) => {
      handlers.onStateChange?.("error");
      handlers.onError?.(event);
    },
    onWebSocketClose: () => {
      handlers.onStateChange?.("idle");
    },
  });

  client.activate();

  return () => {
    void client.deactivate();
  };
}

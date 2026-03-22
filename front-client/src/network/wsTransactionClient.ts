import { Client } from "@stomp/stompjs";

export interface AccountTransactionsWsOptions {
  accountId: string;
  accessToken: string | null;
  onTransactionsInvalidated: (accountId: string) => void;
  onError?: (err: Error) => void;
}

function brokerWsUrl(): string | undefined {
  const fromEnv = import.meta.env.VITE_ACCOUNT_WS_BROKER_URL as string | undefined;
  if (fromEnv && fromEnv.length > 0) {
    return fromEnv;
  }
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${window.location.host}/ws`;
}

export class WsTransactionClient {
  private client: Client | null = null;

  constructor(private readonly options: AccountTransactionsWsOptions) {}

  connect(): void {
    const url = brokerWsUrl();
    if (!url || !this.options.accessToken) {
      return;
    }

    const client = new Client({
      brokerURL: url,
      connectHeaders: {
        Authorization: `Bearer ${this.options.accessToken}`,
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        client.subscribe(`/topic/accounts/${this.options.accountId}/transactions`, (message) => {
          try {
            const raw: unknown = JSON.parse(message.body);
            if (typeof raw !== "object" || raw === null) {
              return;
            }
            const rec = raw as Record<string, unknown>;
            if (rec.eventType === "TRANSACTIONS_INVALIDATED" && typeof rec.accountId === "string") {
              this.options.onTransactionsInvalidated(rec.accountId);
            }
          } catch (err) {
            this.options.onError?.(err instanceof Error ? err : new Error("WS message parse"));
          }
        });
      },
      onStompError: (frame) => {
        this.options.onError?.(new Error(frame.headers.message ?? "STOMP error"));
      },
      onWebSocketError: () => {
        this.options.onError?.(new Error("WebSocket error"));
      },
    });

    this.client = client;
    client.activate();
  }

  disconnect(): void {
    this.client?.deactivate();
    this.client = null;
  }
}

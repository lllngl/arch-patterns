import type { AccountTransactionDTO } from "../contracts/banking";

export type TransactionPushMessage =
  | { type: "FULL_SYNC"; transactions: AccountTransactionDTO[] }
  | { type: "INVALIDATE"; accountId: string };

export interface WsTransactionClientOptions {
  accountId: string;
  accessToken: string | null;
  onMessage: (msg: TransactionPushMessage) => void;
  onError?: (err: Error) => void;
}

/**
 * WebSocket-клиент для потока операций по счёту.
 * Заглушка: если VITE_WS_URL не задан — не подключается, используется только REST + polling.
 */
export class WsTransactionClient {
  private socket: WebSocket | null = null;

  constructor(private readonly options: WsTransactionClientOptions) {}

  connect(): void {
    const base = import.meta.env.VITE_WS_TRANSACTIONS_URL as string | undefined;
    if (!base) {
      return;
    }

    const url = new URL(base, window.location.origin);
    url.searchParams.set("accountId", this.options.accountId);
    if (this.options.accessToken) {
      url.searchParams.set("token", this.options.accessToken);
    }

    this.socket = new WebSocket(url.toString());

    this.socket.onmessage = (event) => {
      try {
        const raw: unknown = JSON.parse(event.data as string);
        if (typeof raw !== "object" || raw === null) {
          return;
        }
        const rec = raw as Record<string, unknown>;
        if (rec.type === "FULL_SYNC" && Array.isArray(rec.transactions)) {
          this.options.onMessage({ type: "FULL_SYNC", transactions: rec.transactions as AccountTransactionDTO[] });
        } else if (rec.type === "INVALIDATE" && typeof rec.accountId === "string") {
          this.options.onMessage({ type: "INVALIDATE", accountId: rec.accountId });
        }
      } catch (err) {
        this.options.onError?.(err instanceof Error ? err : new Error("WS parse error"));
      }
    };

    this.socket.onerror = () => {
      this.options.onError?.(new Error("WebSocket error"));
    };
  }

  disconnect(): void {
    this.socket?.close();
    this.socket = null;
  }
}

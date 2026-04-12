import { Client } from "@stomp/stompjs";
import { appEnv } from "@/config/env";
import { getAccessToken } from "@/stores/auth";
import { enqueueTelemetry } from "../telemetry";

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

interface EmployeeOperationEvent {
  eventType: "ACCOUNT_OPERATION_CREATED";
  operationRequestId: string;
  operationType: string;
  initiatedByUserId: string | null;
  accountIds: string[];
  customerIds: string[];
  changedAt: string;
}

type TransactionEvent = TransactionInvalidationEvent;
export const EMPLOYEE_OPERATION_EVENT_NAME = "front-employee:employee-operation";

function createRealtimeContext(service: string) {
  const brokerURL = resolveBrokerUrl();
  const accessToken = getAccessToken();

  return {
    brokerURL,
    accessToken,
    updateState(
      handlers: {
        onStateChange?: (state: LiveConnectionState) => void;
      },
      messageState: LiveConnectionState,
      message?: string,
      details?: Record<string, unknown>
    ) {
      handlers.onStateChange?.(messageState);
      enqueueTelemetry({
        type: "realtime",
        service,
        state: messageState,
        message,
        details,
      });
    },
  };
}

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
  const service = "account-service-realtime";
  const { brokerURL, accessToken, updateState } = createRealtimeContext(service);

  if (!brokerURL || !accessToken) {
    updateState(
      handlers,
      "disabled",
      "Realtime disabled because websocket URL or access token is missing.",
      {
        accountId,
      }
    );
    return () => undefined;
  }

  updateState(handlers, "connecting", undefined, {
    accountId,
  });
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
            enqueueTelemetry({
              type: "realtime",
              service,
              state: "connected",
              message: "Received transaction invalidation event.",
              details: {
                accountId,
                operationRequestId: payload.operationRequestId,
              },
            });
            handlers.onInvalidated();
          }
        } catch {
          // 
        }
      });

      updateState(handlers, "connected", undefined, {
        accountId,
      });
    },
    onStompError: () => {
      updateState(handlers, "error", "STOMP protocol error.", {
        accountId,
      });
    },
    onWebSocketError: (event) => {
      updateState(handlers, "error", "WebSocket transport error.", {
        accountId,
      });
      handlers.onError?.(event);
    },
    onWebSocketClose: () => {
      updateState(handlers, "idle", "WebSocket connection closed.", {
        accountId,
      });
    },
  });

  client.activate();

  return () => {
    void client.deactivate();
  };
}

export function subscribeToEmployeeOperations(handlers: {
  onOperation: (event: EmployeeOperationEvent) => void;
  onStateChange?: (state: LiveConnectionState) => void;
  onError?: (error: Event) => void;
}) {
  const service = "account-service-employee-realtime";
  const { brokerURL, accessToken, updateState } = createRealtimeContext(service);

  if (!brokerURL || !accessToken) {
    updateState(
      handlers,
      "disabled",
      "Employee realtime disabled because websocket URL or access token is missing."
    );
    return () => undefined;
  }

  updateState(handlers, "connecting");
  const client = new Client({
    brokerURL,
    reconnectDelay: 5000,
    connectHeaders: {
      Authorization: `Bearer ${accessToken}`,
    },
    onConnect: () => {
      client.subscribe("/topic/employee/operations", (frame) => {
        try {
          const payload = JSON.parse(frame.body) as EmployeeOperationEvent;
          if (payload.eventType !== "ACCOUNT_OPERATION_CREATED") {
            return;
          }

          enqueueTelemetry({
            type: "realtime",
            service,
            state: "connected",
            message: "Received employee operation event.",
            details: {
              accountIds: payload.accountIds,
              customerIds: payload.customerIds,
              operationRequestId: payload.operationRequestId,
            },
          });
          handlers.onOperation(payload);
        } catch {
          //
        }
      });

      updateState(handlers, "connected");
    },
    onStompError: () => {
      updateState(handlers, "error", "Employee STOMP protocol error.");
    },
    onWebSocketError: (event) => {
      updateState(handlers, "error", "Employee WebSocket transport error.");
      handlers.onError?.(event);
    },
    onWebSocketClose: () => {
      updateState(handlers, "idle", "Employee WebSocket connection closed.");
    },
  });

  client.activate();

  return () => {
    void client.deactivate();
  };
}

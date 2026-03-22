import { create } from "zustand";
import type { AccountDTO, AccountTransactionDTO } from "../contracts/banking";
import { normalizeError } from "../errors/normalizeError";
import { useNotificationStore } from "./notificationStore";
import {
  closeUserAccount,
  depositToAccount,
  fetchTransactions,
  fetchUserAccounts,
  openAccount,
  withdrawFromAccount,
} from "../use-cases/banking/accountsUseCases";
import { bankingApi } from "../api/bankingApi";
import type { TransferRequest } from "../contracts/banking";
import { WsTransactionClient } from "../network/wsTransactionClient";
import { tokenStorage } from "../auth/tokenStorage";

interface AccountsState {
  accounts: AccountDTO[];
  selectedAccountId: string;
  transactions: AccountTransactionDTO[];
  isLoading: boolean;
  isSubmitting: boolean;
  lastError: string | null;
  wsClient: WsTransactionClient | null;

  loadAccounts: (userId: string) => Promise<void>;
  selectAccount: (accountId: string) => void;
  loadTransactions: (accountId: string) => Promise<void>;
  subscribeTransactionsChannel: (accountId: string) => void;
  unsubscribeTransactionsChannel: () => void;
  createAccount: (userId: string, name: string) => Promise<void>;
  closeAccount: (userId: string, accountId: string) => Promise<void>;
  deposit: (userId: string, accountId: string, amount: number) => Promise<void>;
  withdraw: (userId: string, accountId: string, amount: number) => Promise<void>;
  transfer: (userId: string, payload: TransferRequest) => Promise<void>;
  clearError: () => void;
}

export const useAccountsStore = create<AccountsState>((set, get) => ({
  accounts: [],
  selectedAccountId: "",
  transactions: [],
  isLoading: false,
  isSubmitting: false,
  lastError: null,
  wsClient: null,

  clearError: () => set({ lastError: null }),

  loadAccounts: async (userId: string) => {
    set({ isLoading: true, lastError: null });
    try {
      const page = await fetchUserAccounts(userId, { size: 100, sortBy: "createdAt", sortDir: "DESC" });
      const loaded = page.content;
      set({ accounts: loaded });
      const { selectedAccountId } = get();
      if (loaded.length === 0) {
        set({ selectedAccountId: "" });
        return;
      }
      if (!loaded.some((a) => a.id === selectedAccountId)) {
        set({ selectedAccountId: loaded[0].id });
      }
    } catch (err) {
      const appErr = normalizeError(err, "Не удалось загрузить счета.");
      set({ lastError: appErr.message });
      useNotificationStore.getState().pushToast("error", appErr.message);
    } finally {
      set({ isLoading: false });
    }
  },

  selectAccount: (accountId: string) => {
    set({ selectedAccountId: accountId });
  },

  loadTransactions: async (accountId: string) => {
    if (!accountId) {
      set({ transactions: [] });
      return;
    }
    set({ isLoading: true, lastError: null });
    try {
      const page = await fetchTransactions(accountId, { size: 200, sortBy: "createdAt", sortDir: "DESC" });
      set({ transactions: page.content });
    } catch (err) {
      const appErr = normalizeError(err, "Не удалось загрузить операции.");
      set({ lastError: appErr.message });
      useNotificationStore.getState().pushToast("error", appErr.message);
    } finally {
      set({ isLoading: false });
    }
  },

  subscribeTransactionsChannel: (accountId: string) => {
    get().unsubscribeTransactionsChannel();
    const accessToken = tokenStorage.getAccessToken();
    const client = new WsTransactionClient({
      accountId,
      accessToken,
      onMessage: (msg) => {
        if (msg.type === "FULL_SYNC") {
          set({ transactions: msg.transactions });
        }
        if (msg.type === "INVALIDATE") {
          void get().loadTransactions(msg.accountId);
        }
      },
      onError: () => {
        useNotificationStore.getState().pushToast("info", "Поток операций недоступен, используется обновление по запросу.");
      },
    });
    client.connect();
    set({ wsClient: client });
  },

  unsubscribeTransactionsChannel: () => {
    const { wsClient } = get();
    wsClient?.disconnect();
    set({ wsClient: null });
  },

  createAccount: async (userId: string, name: string) => {
    set({ isSubmitting: true, lastError: null });
    try {
      const account = await openAccount(userId, name.trim() || "Мой счет");
      useNotificationStore.getState().pushToast("success", "Счёт открыт.");
      await get().loadAccounts(userId);
      set({ selectedAccountId: account.id });
    } catch (err) {
      const appErr = normalizeError(err, "Не удалось открыть счёт.");
      set({ lastError: appErr.message });
      useNotificationStore.getState().pushToast("error", appErr.message);
    } finally {
      set({ isSubmitting: false });
    }
  },

  closeAccount: async (userId: string, accountId: string) => {
    set({ isSubmitting: true, lastError: null });
    try {
      await closeUserAccount(accountId);
      useNotificationStore.getState().pushToast("success", "Счёт закрыт.");
      await get().loadAccounts(userId);
    } catch (err) {
      const appErr = normalizeError(err, "Не удалось закрыть счёт.");
      set({ lastError: appErr.message });
      useNotificationStore.getState().pushToast("error", appErr.message);
    } finally {
      set({ isSubmitting: false });
    }
  },

  deposit: async (userId: string, accountId: string, amount: number) => {
    set({ isSubmitting: true, lastError: null });
    try {
      await depositToAccount(accountId, amount);
      useNotificationStore.getState().pushToast("success", "Средства зачислены.");
      await Promise.all([get().loadAccounts(userId), get().loadTransactions(accountId)]);
    } catch (err) {
      const appErr = normalizeError(err, "Не удалось выполнить пополнение.");
      set({ lastError: appErr.message });
      useNotificationStore.getState().pushToast("error", appErr.message);
    } finally {
      set({ isSubmitting: false });
    }
  },

  withdraw: async (userId: string, accountId: string, amount: number) => {
    set({ isSubmitting: true, lastError: null });
    try {
      await withdrawFromAccount(accountId, amount);
      useNotificationStore.getState().pushToast("success", "Средства сняты.");
      await Promise.all([get().loadAccounts(userId), get().loadTransactions(accountId)]);
    } catch (err) {
      const appErr = normalizeError(err, "Не удалось снять средства.");
      set({ lastError: appErr.message });
      useNotificationStore.getState().pushToast("error", appErr.message);
    } finally {
      set({ isSubmitting: false });
    }
  },

  transfer: async (_userId: string, payload: TransferRequest) => {
    set({ isSubmitting: true, lastError: null });
    try {
      await bankingApi.transfer(payload);
      useNotificationStore.getState().pushToast("success", "Перевод выполнен (или принят в обработку).");
      await Promise.all([get().loadAccounts(_userId), get().loadTransactions(payload.fromAccountId)]);
    } catch (err) {
      const appErr = normalizeError(err, "Перевод недоступен.");
      set({ lastError: appErr.message });
      useNotificationStore.getState().pushToast("error", appErr.message);
    } finally {
      set({ isSubmitting: false });
    }
  },
}));

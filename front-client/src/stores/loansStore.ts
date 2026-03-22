import { create } from "zustand";
import type { AccountDTO, LoanResponse, LoanStatus, Page, TariffResponse } from "../contracts/banking";
import { normalizeError } from "../errors/normalizeError";
import { useNotificationStore } from "./notificationStore";
import {
  createLoanRequest,
  fetchMyLoansPage,
  fetchTariffsPage,
  repayLoanRequest,
} from "../use-cases/banking/loansUseCases";
import { fetchUserAccounts } from "../use-cases/banking/accountsUseCases";

interface LoansState {
  openAccounts: AccountDTO[];
  tariffs: TariffResponse[];
  tariffPage: number;
  hasMoreTariffs: boolean;
  isTariffsLoading: boolean;

  activeLoanOptions: LoanResponse[];
  activeLoanPage: number;
  hasMoreActiveLoans: boolean;
  isActiveLoansLoading: boolean;

  loanListPage: Page<LoanResponse> | null;
  loanTablePageIndex: number;
  loanStatusFilter: "" | LoanStatus;

  isLoading: boolean;
  isSubmitting: boolean;
  lastError: string | null;

  bootstrap: (userId: string) => Promise<void>;
  loadTariffsPage: (pageIndex: number, append: boolean) => Promise<void>;
  loadActiveLoansPage: (pageIndex: number, append: boolean) => Promise<void>;
  loadLoanTablePage: (pageIndex: number, status: "" | LoanStatus) => Promise<void>;
  setLoanStatusFilter: (status: "" | LoanStatus) => Promise<void>;
  changeLoanTablePage: (nextPage: number) => Promise<void>;
  createLoan: (userId: string, payload: {
    accountId: string;
    tariffId: string;
    amount: number;
    termMonths: number;
  }) => Promise<void>;
  repayLoan: (userId: string, payload: { loanId: string; accountId: string; amount: number }) => Promise<void>;
  clearError: () => void;
}

export const useLoansStore = create<LoansState>((set, get) => ({
  openAccounts: [],
  tariffs: [],
  tariffPage: 0,
  hasMoreTariffs: true,
  isTariffsLoading: false,
  activeLoanOptions: [],
  activeLoanPage: 0,
  hasMoreActiveLoans: true,
  isActiveLoansLoading: false,
  loanListPage: null,
  loanTablePageIndex: 0,
  loanStatusFilter: "",
  isLoading: false,
  isSubmitting: false,
  lastError: null,

  clearError: () => set({ lastError: null }),

  bootstrap: async (userId: string) => {
    set({ isLoading: true, lastError: null });
    try {
      const accountsPage = await fetchUserAccounts(userId, { size: 100, sortBy: "createdAt", sortDir: "DESC" });
      const openAccounts = accountsPage.content.filter((a) => a.status === "OPEN");
      set({ openAccounts });

      await get().loadTariffsPage(0, false);
      await get().loadActiveLoansPage(0, false);
      await get().loadLoanTablePage(0, "");
    } catch (err) {
      const appErr = normalizeError(err, "Не удалось загрузить данные по кредитам.");
      set({ lastError: appErr.message });
      useNotificationStore.getState().pushToast("error", appErr.message);
    } finally {
      set({ isLoading: false });
    }
  },

  loadTariffsPage: async (pageIndex: number, append: boolean) => {
    set({ isTariffsLoading: true });
    try {
      const page = await fetchTariffsPage({ page: pageIndex, size: 20, sortBy: "name", sortDir: "ASC" });
      set((state) => ({
        tariffs: append ? [...state.tariffs, ...page.content] : page.content,
        tariffPage: page.number,
        hasMoreTariffs: page.number + 1 < page.totalPages,
      }));
    } catch (err) {
      const appErr = normalizeError(err, "Не удалось загрузить тарифы.");
      set({ lastError: appErr.message });
      useNotificationStore.getState().pushToast("error", appErr.message);
    } finally {
      set({ isTariffsLoading: false });
    }
  },

  loadActiveLoansPage: async (pageIndex: number, append: boolean) => {
    set({ isActiveLoansLoading: true });
    try {
      const page = await fetchMyLoansPage(
        { page: pageIndex, size: 20, sortBy: "createdAt", sortDir: "DESC" },
        "ACTIVE"
      );
      set((state) => ({
        activeLoanOptions: append ? [...state.activeLoanOptions, ...page.content] : page.content,
        activeLoanPage: page.number,
        hasMoreActiveLoans: page.number + 1 < page.totalPages,
      }));
    } catch (err) {
      const appErr = normalizeError(err, "Не удалось загрузить активные кредиты.");
      set({ lastError: appErr.message });
      useNotificationStore.getState().pushToast("error", appErr.message);
    } finally {
      set({ isActiveLoansLoading: false });
    }
  },

  loadLoanTablePage: async (pageIndex: number, status: "" | LoanStatus) => {
    const page = await fetchMyLoansPage(
      { page: pageIndex, size: 10, sortBy: "createdAt", sortDir: "DESC" },
      status || undefined
    );
    set({ loanListPage: page, loanTablePageIndex: page.number });
  },

  setLoanStatusFilter: async (status: "" | LoanStatus) => {
    set({ loanStatusFilter: status, isLoading: true, lastError: null });
    try {
      await get().loadLoanTablePage(0, status);
    } catch (err) {
      const appErr = normalizeError(err, "Не удалось применить фильтр.");
      set({ lastError: appErr.message });
      useNotificationStore.getState().pushToast("error", appErr.message);
    } finally {
      set({ isLoading: false });
    }
  },

  changeLoanTablePage: async (nextPage: number) => {
    const { loanListPage, loanStatusFilter } = get();
    if (!loanListPage || nextPage < 0 || nextPage >= loanListPage.totalPages) {
      return;
    }
    set({ isLoading: true, lastError: null });
    try {
      await get().loadLoanTablePage(nextPage, loanStatusFilter);
    } catch (err) {
      const appErr = normalizeError(err, "Не удалось переключить страницу.");
      set({ lastError: appErr.message });
      useNotificationStore.getState().pushToast("error", appErr.message);
    } finally {
      set({ isLoading: false });
    }
  },

  createLoan: async (userId, payload) => {
    set({ isSubmitting: true, lastError: null });
    try {
      await createLoanRequest({
        userId,
        accountId: payload.accountId,
        amount: payload.amount,
        termMonths: payload.termMonths,
        tariffId: payload.tariffId,
        paymentType: "ANNUITY",
      });
      useNotificationStore.getState().pushToast("success", "Заявка на кредит создана.");
      const { loanStatusFilter } = get();
      await Promise.all([get().loadLoanTablePage(0, loanStatusFilter), get().loadActiveLoansPage(0, false)]);
    } catch (err) {
      const appErr = normalizeError(err, "Не удалось оформить кредит.");
      set({ lastError: appErr.message });
      useNotificationStore.getState().pushToast("error", appErr.message);
    } finally {
      set({ isSubmitting: false });
    }
  },

  repayLoan: async (userId, payload) => {
    set({ isSubmitting: true, lastError: null });
    try {
      await repayLoanRequest(payload.loanId, {
        userId,
        accountId: payload.accountId,
        amount: payload.amount,
      });
      useNotificationStore.getState().pushToast("success", "Погашение выполнено.");
      const { loanStatusFilter } = get();
      await Promise.all([
        get().loadLoanTablePage(0, loanStatusFilter),
        get().loadActiveLoansPage(0, false),
        (async () => {
          const accountsPage = await fetchUserAccounts(userId, { size: 100, sortBy: "createdAt", sortDir: "DESC" });
          set({ openAccounts: accountsPage.content.filter((a) => a.status === "OPEN") });
        })(),
      ]);
    } catch (err) {
      const appErr = normalizeError(err, "Не удалось погасить кредит.");
      set({ lastError: appErr.message });
      useNotificationStore.getState().pushToast("error", appErr.message);
    } finally {
      set({ isSubmitting: false });
    }
  },
}));

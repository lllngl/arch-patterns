import type { CreditRatingDTO, OverduePaymentDTO } from "../contracts/credit";
import { httpClient } from "../network/httpClientSingleton";

export const creditApi = {
  async getOverduePayments(_userId: string): Promise<OverduePaymentDTO[]> {
    const endpoint = import.meta.env.VITE_CREDIT_OVERDUE_ENDPOINT as string | undefined;
    if (!endpoint) {
      return [];
    }
    return httpClient.requestJson<OverduePaymentDTO[]>(endpoint);
  },

  async getCreditRating(_userId: string): Promise<CreditRatingDTO | null> {
    const endpoint = import.meta.env.VITE_CREDIT_RATING_ENDPOINT as string | undefined;
    if (!endpoint) {
      return null;
    }
    return httpClient.requestJson<CreditRatingDTO>(endpoint);
  },
};

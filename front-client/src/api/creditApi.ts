import type { CreditRatingDTO, PaymentHistoryDTO } from "../contracts/credit";
import { creditRatingResponseSchema, pagePaymentHistorySchema } from "../contracts/schemas/creditSchemas";
import { httpClient } from "../network/httpClientSingleton";

export const creditApi = {
  async getOverduePayments(userId: string): Promise<PaymentHistoryDTO[]> {
    const raw = await httpClient.requestJson(
      `/api/v1/loan/payments/overdue/user/${userId}?page=0&size=100&sortBy=expectedPaymentDate&sortDir=DESC`,
      {
        parse: (r) => pagePaymentHistorySchema.parse(r),
      }
    );
    return (raw as { content: PaymentHistoryDTO[] }).content;
  },

  async getCreditRating(): Promise<CreditRatingDTO> {
    return httpClient.requestJson<CreditRatingDTO>("/api/v1/loan/credit-rating/my", {
      parse: (raw) => creditRatingResponseSchema.parse(raw) as CreditRatingDTO,
    });
  },
};

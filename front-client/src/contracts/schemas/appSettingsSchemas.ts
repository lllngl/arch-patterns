import { z } from "zod";

export const clientAppSettingsSchema = z.object({
  theme: z.enum(["light", "dark"]),
  hiddenAccountIds: z.array(z.string()),
});

export const userPreferencesResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  deviceId: z.string(),
  theme: z.string(),
  hiddenAccountsIds: z.array(z.string()),
});

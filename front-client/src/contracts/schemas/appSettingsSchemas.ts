import { z } from "zod";

export const clientAppSettingsSchema = z.object({
  theme: z.enum(["light", "dark"]),
  hiddenAccountIds: z.array(z.string()),
  version: z.number(),
});

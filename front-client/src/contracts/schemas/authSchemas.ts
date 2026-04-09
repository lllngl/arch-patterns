import { z } from "zod";

export const authResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});

export const userProfileSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  patronymic: z.string().nullable(),
  email: z.string(),
  phone: z.number().nullable(),
  gender: z.string().nullable(),
  roles: z.array(z.enum(["CLIENT", "EMPLOYEE"])),
  isBlocked: z.boolean(),
  birthDate: z.string().nullable(),
});

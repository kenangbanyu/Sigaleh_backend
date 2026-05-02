import { z } from "zod";

export const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/, "ID harus berupa angka"),
});
import { z } from "zod";

export const runPredictionSchema = z.object({
  komoditas: z.string().min(1),
  wilayah: z.string().min(1),
});
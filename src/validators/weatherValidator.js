import { z } from "zod";

// POST & PUT (full data)
export const weatherSchema = z.object({
  wilayah: z.string().min(1),
  tanggal: z.string().date(),
  suhu: z.number(),
  curah_hujan: z.number(),
  radiasi: z.number(),
  angin: z.number(),
});

// PATCH (partial)
export const weatherPatchSchema = z.object({
  wilayah: z.string().min(1).optional(),
  tanggal: z.string().date().optional(),
  suhu: z.number().optional(),
  curah_hujan: z.number().optional(),
  radiasi: z.number().optional(),
  angin: z.number().optional(),
});
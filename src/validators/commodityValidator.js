import { z } from "zod";

// POST & PUT (full data)
export const commoditySchema = z.object({
  komoditas: z.string().min(1),
  tanggal: z.string().date(),
  harga: z.number().positive(),
  wilayah: z.string().min(1),
});

// PATCH (partial)
export const commodityPatchSchema = z.object({
  komoditas: z.string().min(1).optional(),
  tanggal: z.string().date().optional(),
  harga: z.number().positive().optional(),
  wilayah: z.string().min(1).optional(),
});
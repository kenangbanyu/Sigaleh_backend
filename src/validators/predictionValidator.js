import { z } from "zod";

export const predictionSchema = z.array(
  z.object({
    tanggal: z.string().date(),
    komoditas: z.string().min(1),
    harga: z.coerce.number().positive(),
    wilayah: z.string().min(1),
  })
);
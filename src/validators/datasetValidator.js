import { z } from "zod";

export const datasetSchema = z.object({
  komoditas: z.string().min(1),
  tanggal: z.string().date(),
  harga: z.coerce.number(),

  wilayah: z.string().min(1),

  bulan: z.coerce.number(),
  tahun: z.coerce.number(),
  hari_dalam_minggu: z.coerce.number(),
  musim_hujan: z.coerce.number(),

  suhu: z.coerce.number(),
  curah_hujan: z.coerce.number(),
  radiasi: z.coerce.number(),
  angin: z.coerce.number(),

  hujan_lag30: z.coerce.number(),
  hujan_lag60: z.coerce.number(),

  suhu_lag30: z.coerce.number(),
  suhu_lag60: z.coerce.number(),

  rata_hujan_30hari: z.coerce.number(),
  rata_suhu_30hari: z.coerce.number(),

  harga_kemarin: z.coerce.number(),
  harga_minggu_lalu: z.coerce.number(),
});

export const datasetPatchSchema = datasetSchema.partial();
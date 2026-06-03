import sql from "../config/db.js";

const HARGA_REFERENSI = {
  "Beras Kualitas Medium I": 14500,
  "Bawang Merah": 40000,
  "Bawang Putih": 40000,
  "Cabai Merah": 55000,
  "Cabai Merah Keriting": 55000,
  "Cabai Rawit": 70000,
  "Daging Sapi Kualitas 1": 150000,
  "Daging Ayam Ras Segar": 36000,
  "Telur Ayam Ras Segar": 28000,
  "Gula Pasir Lokal": 18000,
  "Minyak Goreng Curah": 15000,
};

export const getDashboard = async (req, res) => {
  const { komoditas, wilayah } = req.query;

  if (!komoditas || !wilayah) {
    return res.status(400).json({
      message: "Query komoditas dan wilayah wajib diisi",
    });
  }

  try {

    // =========================
    // AMBIL PREDIKSI
    // =========================

    const predictions = await sql`
      SELECT *
      FROM "Prediksi"
      WHERE "Komoditas" = ${komoditas}
      AND "Wilayah" = ${wilayah}
      ORDER BY "Tanggal" ASC
    `;

    if (predictions.length === 0) {
      return res.status(404).json({
        message: "Data prediksi tidak ditemukan",
      });
    }

    // =========================
    // AMBIL EVALUASI TERBARU
    // =========================

    const evaluation = await sql`
      SELECT *
      FROM "Evaluasi"
      WHERE "Komoditas" = ${komoditas}
      AND "Wilayah" = ${wilayah}
      ORDER BY created_at DESC
      LIMIT 1
    `;

    // =========================
    // SPLIT HISTORICAL & FUTURE
    // =========================

    const historical = predictions.filter(
      (p) => p.Harga_Aktual !== null
    );

    const future = predictions.filter(
      (p) => p.Harga_Aktual === null
    );

    // =========================
    // METRIC CARDS
    // =========================

    const historicalPrices = historical.map((p) =>
      Number(p.Harga_Aktual)
    );

    const lastPrice =
      historicalPrices[historicalPrices.length - 1];

    const prevPrice =
      historicalPrices.length >= 2
        ? historicalPrices[historicalPrices.length - 2]
        : lastPrice;

    const weekPrice =
      historicalPrices.length >= 7
        ? historicalPrices[historicalPrices.length - 7]
        : lastPrice;

    const monthData =
      historicalPrices.slice(-30);

    const avg30 =
      monthData.reduce((a, b) => a + b, 0) /
      monthData.length;

    const currentYear = new Date().getFullYear();

    const ytdData = historical.filter((p) => {
      const year =
        new Date(p.Tanggal).getFullYear();

      return year === currentYear;
    });

    const ytdAvg =
      ytdData.reduce(
        (sum, item) =>
          sum + Number(item.Harga_Aktual),
        0
      ) / ytdData.length;

    const deltaHarian =
      ((lastPrice - prevPrice) / prevPrice) * 100;

    const deltaMingguan =
      ((lastPrice - weekPrice) / weekPrice) * 100;

    // =========================
    // EARLY WARNING
    // =========================

    const baseline =
      historicalPrices.length >= 30
        ? median(historicalPrices.slice(-30))
        : median(historicalPrices);

    const ref =
      HARGA_REFERENSI[komoditas] || baseline;

    const thresholdWaspada =
      Math.max(
        baseline * 1.10,
        ref * 1.05
      );

    const thresholdKritis =
      Math.max(
        baseline * 1.20,
        ref * 1.15
      );

    const signals = future.map((item, index) => {

      const pred =
        Number(item.Harga_Prediksi);

      let level = "AMAN";

      if (pred >= thresholdKritis) {
        level = "KRITIS";
      } else if (pred >= thresholdWaspada) {
        level = "WASPADA";
      }

      return {
        hari_ke: index + 1,
        tanggal: item.Tanggal,
        harga_prediksi: pred,
        baseline,
        pct_change:
          ((pred - baseline) / baseline) * 100,
        level,
      };
    });

    // =========================
    // SUMMARY STATUS
    // =========================

    let status = "AMAN";

    if (signals.some((s) => s.level === "KRITIS")) {
      status = "KRITIS";
    } else if (
      signals.some((s) => s.level === "WASPADA")
    ) {
      status = "WASPADA";
    }

    // =========================
    // RESPONSE
    // =========================

    res.json({
      komoditas,
      wilayah,

      metrics: {
        harga_terakhir: lastPrice,
        delta_harian_pct: deltaHarian,
        delta_mingguan_pct: deltaMingguan,
        rata_rata_30_hari: avg30,
        rata_rata_ytd: ytdAvg,
      },

      evaluation:
        evaluation.length > 0
          ? {
              mae: evaluation[0].MAE,
              rmse: evaluation[0].RMSE,
              mape: evaluation[0].MAPE,
              da: evaluation[0].DA,
            }
          : null,

      early_warning: {
        status,
        baseline,
        threshold_waspada: thresholdWaspada,
        threshold_kritis: thresholdKritis,
        signals,
      },

      charts: {
        historical: historical.map((item) => ({
          tanggal: item.Tanggal,
          harga_actual: item.Harga_Aktual,
          harga_prediksi:
            item.Harga_Prediksi,
        })),

        future: future.map((item) => ({
          tanggal: item.Tanggal,
          harga_prediksi:
            item.Harga_Prediksi,
        })),
      },
    });

  } catch (err) {

    res.status(500).json({
      error: err.message,
    });

  }
};

// helper median
function median(arr) {

  const sorted =
    [...arr].sort((a, b) => a - b);

  const mid =
    Math.floor(sorted.length / 2);

  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}
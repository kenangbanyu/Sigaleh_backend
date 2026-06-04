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
    // GET PREDICTIONS
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
    // GET EVALUATION
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
    // BASIC ARRAYS
    // =========================

    const actuals = historical.map((p) =>
      Number(p.Harga_Aktual)
    );

    const preds = historical.map((p) =>
      Number(p.Harga_Prediksi)
    );

    // =========================
    // METRIC CARDS
    // =========================

    const lastPrice =
      actuals[actuals.length - 1];

    const prevPrice =
      actuals.length >= 2
        ? actuals[actuals.length - 2]
        : lastPrice;

    const weekPrice =
      actuals.length >= 7
        ? actuals[actuals.length - 7]
        : lastPrice;

    const avg30 =
      average(actuals.slice(-30));

    const currentYear = new Date().getFullYear();

    const ytdData = historical.filter((p) => {
      return (
        new Date(p.Tanggal).getFullYear()
        === currentYear
      );
    });

    const ytdAvg = average(
      ytdData.map((p) =>
        Number(p.Harga_Aktual)
      )
    );

    const deltaHarian =
      ((lastPrice - prevPrice) / prevPrice) * 100;

    const deltaMingguan =
      ((lastPrice - weekPrice) / weekPrice) * 100;

    // =========================
    // EARLY WARNING
    // =========================

    const baseline =
      actuals.length >= 30
        ? median(actuals.slice(-30))
        : median(actuals);

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

    let status = "AMAN";

    if (signals.some((s) => s.level === "KRITIS")) {
      status = "KRITIS";
    } else if (
      signals.some((s) => s.level === "WASPADA")
    ) {
      status = "WASPADA";
    }

    // =========================
    // ANALYTICS
    // =========================

    const residuals = historical.map((item) => {

      const actual =
        Number(item.Harga_Aktual);

      const pred =
        Number(item.Harga_Prediksi);

      return {
        tanggal: item.Tanggal,
        actual,
        predicted: pred,
        residual: actual - pred,
      };
    });

    const errors = historical.map((item) => {

      const actual =
        Number(item.Harga_Aktual);

      const pred =
        Number(item.Harga_Prediksi);

      return pred - actual;
    });

    const scatter = historical.map((item) => ({
      actual:
        Number(item.Harga_Aktual),

      predicted:
        Number(item.Harga_Prediksi),
    }));

    // =========================
    // MONTHLY BREAKDOWN
    // =========================

    const monthlyMap = {};

    historical.forEach((item) => {

      const actual =
        Number(item.Harga_Aktual);

      const pred =
        Number(item.Harga_Prediksi);

      const date =
        new Date(item.Tanggal);

      const month =
        `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}`;

      const errorAbs =
        Math.abs(pred - actual);

      const mape =
        (errorAbs / actual) * 100;

      if (!monthlyMap[month]) {
        monthlyMap[month] = {
          bulan: month,
          errors: [],
          mapes: [],
          prices: [],
          n: 0,
        };
      }

      monthlyMap[month].errors.push(errorAbs);
      monthlyMap[month].mapes.push(mape);
      monthlyMap[month].prices.push(actual);
      monthlyMap[month].n += 1;
    });

    const monthlyBreakdown =
      Object.values(monthlyMap).map((m) => ({
        bulan: m.bulan,

        mae:
          average(m.errors),

        mape:
          average(m.mapes),

        n:
          m.n,

        harga_rata2:
          average(m.prices),
      }));

    // =========================
    // RQ2 INTERPRETATION
    // =========================

    let evaluationInterpretation = null;

    if (evaluation.length > 0) {

    const evalData = evaluation[0];

    let mapeStatus = "Perlu Peningkatan";
    let mapeColor = "#ef4444";

    if (evalData.MAPE < 5) {
    mapeStatus = "Sangat Baik";
    mapeColor = "#10b981";
    } else if (evalData.MAPE < 10) {
    mapeStatus = "Baik";
    mapeColor = "#10b981";
    } else if (evalData.MAPE < 20) {
    mapeStatus = "Cukup";
    mapeColor = "#f59e0b";
    }

    let daStatus = "Rendah";

    if (evalData.DA > 65) {
    daStatus = "Baik";
    } else if (evalData.DA > 50) {
    daStatus = "Cukup";
    }

    let interpretationText = "";

    if (evalData.MAPE < 10) {

    interpretationText =
      `Model LSTM akurat dengan MAPE ${Number(
        evalData.MAPE
      ).toFixed(2)}% dan cocok untuk early warning distribusi.`;

    } else if (evalData.MAPE < 20) {

    interpretationText =
      `Akurasi model cukup baik dengan MAPE ${Number(
        evalData.MAPE
      ).toFixed(2)}%. Gunakan prediksi bersama validasi pasar.`;

    } else {

    interpretationText =
      `Akurasi model masih rendah dengan MAPE ${Number(
        evalData.MAPE
      ).toFixed(2)}%. Pertimbangkan retraining model.`;

    }

    evaluationInterpretation = {
    mape_status: mapeStatus,
    mape_color: mapeColor,
    da_status: daStatus,
    interpretation: interpretationText,
    };
    }

    // =========================
    // LEAD TIME ANALYSIS
    // =========================

    const firstWarning =
    signals.find((s) => s.level !== "AMAN");

    let leadTimeAnalysis = null;

    if (firstWarning) {

    const days = firstWarning.hari_ke;

    let category = "";
    let assessment = "";

    if (days <= 2) {

    category = "TERLAMBAT";

    assessment =
      "Sinyal terlambat — tindakan darurat diperlukan segera.";

    } else if (days <= 5) {

    category = "CUKUP";

    assessment =
      "Sinyal cukup — masih ada waktu koordinasi distribusi.";

    } else {

    category = "MEMADAI";

    assessment =
      "Sinyal memadai — cukup waktu untuk persiapan distribusi.";

    }

    leadTimeAnalysis = {
    hari_ke: days,
    category,
    assessment,
    };
    }

    // =========================
    // MOVING AVERAGE
    // =========================

    const movingAverage7 = historical.map((item, idx) => {

    const slice =
    actuals.slice(
    Math.max(0, idx - 6),
    idx + 1
    );

    return {
    tanggal: item.Tanggal,
    value: average(slice),
    };
    });

    const movingAverage30 = historical.map((item, idx) => {

    const slice =
    actuals.slice(
    Math.max(0, idx - 29),
    idx + 1
    );

    return {
    tanggal: item.Tanggal,
    value: average(slice),
    };
    });

    // =========================
    // DISTRIBUTION DATA
    // =========================

    const distribution = {
    min: Math.min(...actuals),
    max: Math.max(...actuals),
    avg: average(actuals),
    };

    // =========================
    // ALL COMMODITIES REGION
    // =========================

    const allCommodityQuery = await sql`
    WITH ranked AS (
      SELECT
        "Komoditas",
        "Harga_Aktual",
        "Tanggal",
        ROW_NUMBER() OVER (
          PARTITION BY "Komoditas"
          ORDER BY "Tanggal" DESC
        ) as rn
      FROM "Prediksi"
      WHERE "Wilayah" = ${wilayah}
      AND "Harga_Aktual" IS NOT NULL
    )

    SELECT
      current."Komoditas",
      current."Harga_Aktual"
        AS harga_sekarang,
      previous."Harga_Aktual"
        AS harga_sebelumnya,
      current."Tanggal"
    FROM ranked current
    LEFT JOIN ranked previous
    ON current."Komoditas" = previous."Komoditas"
    AND previous.rn = 2
    WHERE current.rn = 1
    `;

    const allCommodities =
      allCommodityQuery.map((item) => {

        const currentPrice =
          Number(item.harga_sekarang);

        const previousPrice =
          Number(
            item.harga_sebelumnya
            || currentPrice
          );

        const perubahanPct =
          previousPrice > 0
            ? (
                (
                  (currentPrice - previousPrice)
                  / previousPrice
                ) * 100
              )
            : 0;

        return {
          komoditas:
            item.Komoditas,
          harga:
            currentPrice,
          harga_sebelumnya:
            previousPrice,
          perubahan_pct:
            Number(
              perubahanPct.toFixed(2)
            ),
          tanggal:
            item.Tanggal,
        };
      });

    // =========================
    // RESPONSE
    // =========================

    res.json({

      komoditas,
      wilayah,

      // =========================
      // HEADER / METRICS
      // =========================

      metrics: {

      harga_terakhir:
        lastPrice,

      delta_harian_pct:
        deltaHarian,

      delta_mingguan_pct:
        deltaMingguan,

      rata_rata_30_hari:
        avg30,

      rata_rata_ytd:
        ytdAvg,

      },

      // =========================
      // MODEL EVALUATION
      // =========================

      evaluation:
      evaluation.length > 0
      ? {
      mae:
      evaluation[0].MAE,

            rmse:
              evaluation[0].RMSE,

            mape:
              evaluation[0].MAPE,

            da:
              evaluation[0].DA,
          }
        : null,

      // =========================
      // RQ2 INTERPRETATION
      // =========================

      evaluation_interpretation:
      evaluationInterpretation,

      // =========================
      // EARLY WARNING
      // =========================

      early_warning: {

      status,

      baseline,

      threshold_waspada:
        thresholdWaspada,

      threshold_kritis:
        thresholdKritis,

      signals,

      },

      // =========================
      // LEAD TIME ANALYSIS
      // =========================

      lead_time_analysis:
      leadTimeAnalysis,

      // =========================
      // CHART DATA
      // =========================

      charts: {

      historical:
        historical.map((item) => ({
          tanggal:
            item.Tanggal,

          harga_actual:
            Number(item.Harga_Aktual),

          harga_prediksi:
            Number(item.Harga_Prediksi),
        })),

      future:
        future.map((item) => ({
          tanggal:
            item.Tanggal,

          harga_prediksi:
            Number(item.Harga_Prediksi),
        })),

      },

      // =========================
      // MOVING AVERAGE
      // =========================

      moving_average: {

      ma7:
        movingAverage7,

      ma30:
        movingAverage30,

      },

      // =========================
      // ANALYTICS
      // =========================

      analytics: {

      residuals,

      errors,

      scatter,

      monthly_breakdown:
        monthlyBreakdown,

      },

      // =========================
      // DISTRIBUTION
      // =========================

      distribution,

      // =========================
      // ALL COMMODITIES
      // =========================

      all_commodities:
      allCommodities,
      });

  } catch (err) {

    res.status(500).json({
      error: err.message,
    });

  }
};

// =========================
// HELPERS
// =========================

function average(arr) {

  if (!arr.length) return 0;

  return (
    arr.reduce((a, b) => a + b, 0)
    / arr.length
  );
}

function median(arr) {

  if (!arr.length) return 0;

  const sorted =
    [...arr].sort((a, b) => a - b);

  const mid =
    Math.floor(sorted.length / 2);

  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}
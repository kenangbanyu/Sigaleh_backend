import sql from "../config/db.js";
import axios from "axios";
import { clearCacheByPrefix } from "../utils/cacheInvalidation.js";

// GET /predictions
export const getPredictions = async (req, res) => {

  const {
    wilayah,
    komoditas,
    start,
    end,
  } = req.query;

  try {

    let query = sql`
      SELECT *
      FROM "Prediksi"
    `;

    let hasWhere = false;


    // filter wilayah
    if (wilayah) {

      query = sql`
        ${query}
        WHERE "Wilayah" = ${wilayah}
      `;

      hasWhere = true;
    }


    // filter komoditas
    if (komoditas) {

      query = hasWhere
        ? sql`
            ${query}
            AND "Komoditas" = ${komoditas}
          `
        : sql`
            ${query}
            WHERE "Komoditas" = ${komoditas}
          `;

      hasWhere = true;
    }


    // filter tanggal
    if (start && end) {

      query = hasWhere
        ? sql`
            ${query}
            AND "Tanggal"
            BETWEEN ${start} AND ${end}
          `
        : sql`
            ${query}
            WHERE "Tanggal"
            BETWEEN ${start} AND ${end}
          `;
    }


    // sorting
    query = sql`
      ${query}
      ORDER BY "Tanggal" ASC
    `;


    const result = await query;

    res.json(result);

  } catch (err) {

    res.status(500).json({
      error: err.message,
    });

  }
};

// POST /predictions/run
export const runPrediction = async (req, res) => {

  const {
    komoditas,
    wilayah,
  } = req.body;

  try {

    // ambil dataset sesuai filter
    const dataset = await sql`
      SELECT *
      FROM "Dataset"
      WHERE "Komoditas (Rp)" = ${komoditas}
      AND "Wilayah" = ${wilayah}
      ORDER BY "Tanggal" ASC
    `;


    // validasi dataset kosong
    if (dataset.length === 0) {
      return res.status(404).json({
        message: "Dataset tidak ditemukan",
      });
    }

    // hapus prediksi lama
    await sql`
      DELETE FROM "Prediksi"
      WHERE "Komoditas" = ${komoditas}
      AND "Wilayah" = ${wilayah}
    `;

    // hapus evaluasi lama
    await sql`
      DELETE FROM "Evaluasi"
      WHERE "Komoditas" = ${komoditas}
      AND "Wilayah" = ${wilayah}
    `;

    // kirim ke ML service
    const mlResponse = await axios.post(
      process.env.ML_SERVICE_URL,
      {
        komoditas,
        wilayah,
        dataset,
      }
    );


    const result = mlResponse.data;


    // =========================
    // HISTORICAL PREDICTIONS
    // =========================

    for (const item of result.historical_predictions) {

      await sql`
        INSERT INTO "Prediksi"
        (
          "Tanggal",
          "Komoditas",
          "Wilayah",
          "Harga_Aktual",
          "Harga_Prediksi"
        )

        VALUES
        (
          ${item.tanggal},
          ${result.komoditas},
          ${result.wilayah},
          ${item.harga_actual},
          ${item.harga_prediksi}
        )
      `;
    }



    // =========================
    // FUTURE PREDICTIONS
    // =========================

    for (const item of result.future_predictions) {

      await sql`
        INSERT INTO "Prediksi"
        (
          "Tanggal",
          "Komoditas",
          "Wilayah",
          "Harga_Aktual",
          "Harga_Prediksi"
        )

        VALUES
        (
          ${item.tanggal},
          ${result.komoditas},
          ${result.wilayah},
          NULL,
          ${item.harga_prediksi}
        )
      `;
    }



    // =========================
    // SAVE EVALUATION
    // =========================

    await sql`
      INSERT INTO "Evaluasi"
      (
        "Komoditas",
        "Wilayah",
        "MAE",
        "RMSE",
        "MAPE",
        "DA"
      )

      VALUES
      (
        ${result.komoditas},
        ${result.wilayah},
        ${result.metrics.MAE},
        ${result.metrics.RMSE},
        ${result.metrics.MAPE},
        ${result.metrics.DA}
      )
    `;

    // invalidate predictions cache
    await clearCacheByPrefix("/predictions");

    // invalidate evaluations cache
    await clearCacheByPrefix("/evaluations");

    res.json({
      message: "Prediksi berhasil dijalankan",

      komoditas: result.komoditas,
      wilayah: result.wilayah,

      historical_prediction_count:
        result.historical_predictions.length,

      future_prediction_count:
        result.future_predictions.length,

      metrics: result.metrics,
    });

  } catch (err) {

    res.status(500).json({
      error: err.message,
    });

  }
};
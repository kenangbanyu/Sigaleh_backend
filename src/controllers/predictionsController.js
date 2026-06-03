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

    // =========================
    // DELETE OLD PREDICTIONS
    // =========================

    await sql`
      DELETE FROM "Prediksi"
      WHERE "Komoditas" = ${komoditas}
      AND "Wilayah" = ${wilayah}
    `;


    // =========================
    // DELETE OLD EVALUATIONS
    // =========================

    await sql`
      DELETE FROM "Evaluasi"
      WHERE "Komoditas" = ${komoditas}
      AND "Wilayah" = ${wilayah}
    `;


    // =========================
    // CALL ML SERVICE
    // =========================

    const mlResponse = await axios.post(
      process.env.ML_SERVICE_URL,
      {
        commodity: komoditas,
        city: wilayah,
      }
    );


    const result = mlResponse.data;


    // =========================
    // HANDLE ML ERROR
    // =========================

    if (result.error) {

      return res.status(400).json({
        message: "Prediksi gagal",
        error: result.error,
      });
    }


    // =========================
    // SAVE HISTORICAL PREDICTIONS
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
    // SAVE FUTURE PREDICTIONS
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


    // =========================
    // INVALIDATE CACHE
    // =========================

    await clearCacheByPrefix("/predictions");
    await clearCacheByPrefix("/evaluations");
    await clearCacheByPrefix("/dashboard");


    // =========================
    // SUCCESS RESPONSE
    // =========================

    res.json({

      message:
        "Prediksi berhasil dijalankan",

      komoditas:
        result.komoditas,

      wilayah:
        result.wilayah,

      historical_prediction_count:
        result.historical_predictions.length,

      future_prediction_count:
        result.future_predictions.length,

      metrics:
        result.metrics,
    });

  } catch (err) {

    res.status(500).json({
      error: err.message,
    });

  }
};
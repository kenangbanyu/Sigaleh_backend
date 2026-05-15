import sql from "../config/db.js";

// POST /predictions
export const createPredictions = async (req, res) => {
  const predictions = req.body;

  // validasi basic
  if (!Array.isArray(predictions) || predictions.length === 0) {
    return res.status(400).json({
      message: "Body harus berupa array predictions",
    });
  }

  try {
    for (const item of predictions) {
      const {
        tanggal,
        komoditas,
        harga,
        wilayah,
      } = item;

      await sql`
        INSERT INTO "Prediksi"
        (
          "Tanggal",
          "Komoditas",
          "Harga",
          "Wilayah"
        )
        VALUES
        (
          ${tanggal},
          ${komoditas},
          ${harga},
          ${wilayah}
        )
      `;
    }

    res.status(201).json({
      message: "Prediksi berhasil disimpan",
    });

  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
};
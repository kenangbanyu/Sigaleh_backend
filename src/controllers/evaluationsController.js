import sql from "../config/db.js";

// GET /evaluations
export const getEvaluations = async (req, res) => {

  const {
    wilayah,
    komoditas,
  } = req.query;

  try {

    let query = sql`
      SELECT *
      FROM "Evaluasi"
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
    }


    // latest evaluation first
    query = sql`
      ${query}
      ORDER BY created_at DESC
    `;


    const result = await query;

    res.json(result);

  } catch (err) {

    res.status(500).json({
      error: err.message,
    });

  }
};
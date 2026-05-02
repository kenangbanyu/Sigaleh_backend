import sql from "../config/db.js";

// GET /commodities (with filter)
export const getCommodities = async (req, res) => {
  const { wilayah, komoditas, start, end } = req.query;

  try {
    let query = sql`SELECT * FROM "Komoditas"`;
    let hasWhere = false;

    if (wilayah) {
      query = sql`${query} WHERE "Wilayah" = ${wilayah}`;
      hasWhere = true;
    }

    if (komoditas) {
      query = hasWhere
        ? sql`${query} AND "Komoditas (Rp)" = ${komoditas}`
        : sql`${query} WHERE "Komoditas (Rp)" = ${komoditas}`;
      hasWhere = true;
    }

    if (start && end) {
      query = hasWhere
        ? sql`${query} AND "Tanggal" BETWEEN ${start} AND ${end}`
        : sql`${query} WHERE "Tanggal" BETWEEN ${start} AND ${end}`;
    }

    query = sql`${query} ORDER BY "Tanggal" ASC`;

    const result = await query;

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /commodities/:id
export const getCommodityById = async (req, res) => {
  try {
    const result = await sql`
      SELECT * FROM "Komoditas" WHERE id = ${req.params.id}
    `;

    if (result.length === 0) {
      return res.status(404).json({ message: "Data tidak ditemukan" });
    }

    res.json(result[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST
export const createCommodity = async (req, res) => {
  const { komoditas, tanggal, harga, wilayah } = req.body;

  try {
    await sql`
      INSERT INTO "Komoditas" ("Komoditas (Rp)", "Tanggal", "Harga", "Wilayah")
      VALUES (${komoditas}, ${tanggal}, ${harga}, ${wilayah})
    `;

    res.status(201).json({ message: "Data berhasil ditambahkan" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT (replace all fields)
export const updateCommodity = async (req, res) => {
  const { id } = req.params;
  const { komoditas, tanggal, harga, wilayah } = req.body;

  try {
    const result = await sql`
      UPDATE "Komoditas"
      SET "Komoditas (Rp)" = ${komoditas},
          "Tanggal" = ${tanggal},
          "Harga" = ${harga},
          "Wilayah" = ${wilayah}
      WHERE id = ${id}
      RETURNING id
    `;

    if (result.length === 0) {
      return res.status(404).json({ message: "Data tidak ditemukan" });
    }

    res.json({ message: "Data berhasil diperbarui" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PATCH (partial update)
export const patchCommodity = async (req, res) => {
  const { id } = req.params;
  const fields = req.body;

  if (Object.keys(fields).length === 0) {
    return res.status(400).json({ message: "Tidak ada field untuk diupdate" });
  }

  const columnMap = {
    komoditas: "Komoditas (Rp)",
    tanggal: "Tanggal",
    harga: "Harga",
    wilayah: "Wilayah",
  };

  try {
    const updates = [];

    for (const [key, value] of Object.entries(fields)) {
      if (!columnMap[key]) continue; // skip field tidak valid

      updates.push(sql`${sql(columnMap[key])} = ${value}`);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: "Field tidak valid" });
    }

    let query = sql`UPDATE "Komoditas" SET `;

    updates.forEach((u, index) => {
      query = index === 0
        ? sql`${query} ${u}`
        : sql`${query}, ${u}`;
    });

    query = sql`${query} WHERE id = ${id} RETURNING id`;

    const result = await query;

    if (result.length === 0) {
      return res.status(404).json({ message: "Data tidak ditemukan" });
    }

    res.json({ message: "Data berhasil diupdate" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE
export const deleteCommodity = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await sql`
      DELETE FROM "Komoditas" WHERE id = ${id}
      RETURNING id
    `;

    if (result.length === 0) {
      return res.status(404).json({ message: "Data tidak ditemukan" });
    }

    res.json({ message: "Data berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
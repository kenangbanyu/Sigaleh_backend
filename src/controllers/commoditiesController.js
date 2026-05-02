import sql from "../config/db.js";

// GET /commodities (with filter)
export const getCommodities = async (req, res) => {
  const { wilayah, komoditas, start, end } = req.query;

  try {
    const conditions = [];

    if (wilayah) {
      conditions.push(sql`"Wilayah" = ${wilayah}`);
    }

    if (komoditas) {
      conditions.push(sql`"Komoditas (Rp)" = ${komoditas}`);
    }

    if (start && end) {
      conditions.push(sql`"Tanggal" BETWEEN ${start} AND ${end}`);
    }

    const result = await sql`
      SELECT * FROM "Komoditas"
      ${conditions.length ? sql`WHERE ${sql.join(conditions, sql` AND `)}` : sql``}
      ORDER BY "Tanggal" ASC
    `;

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

  const updates = Object.entries(fields).map(([key, value]) =>
    sql`${sql(columnMap[key])} = ${value}`
  );

  try {
    const result = await sql`
      UPDATE "Komoditas"
      SET ${sql.join(updates, sql`, `)}
      WHERE id = ${id}
      RETURNING id
    `;

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
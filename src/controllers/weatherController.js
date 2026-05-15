import sql from "../config/db.js";

// GET /weather (with filter)
export const getWeather = async (req, res) => {
  const { wilayah, start, end } = req.query;

  try {
    let query = sql`SELECT * FROM "Cuaca"`;
    let hasWhere = false;

    if (wilayah) {
      query = sql`${query} WHERE "Wilayah" = ${wilayah}`;
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

// POST
export const createWeather = async (req, res) => {
  const {
    wilayah,
    tanggal,
    suhu,
    curah_hujan,
    radiasi,
    angin,
  } = req.body;

  try {
    await sql`
      INSERT INTO "Cuaca"
      ("Wilayah","Tanggal","Suhu_Rata2_C","Curah_Hujan_mm","Radiasi_Matahari_MJm2","Kecepatan_Angin_Max_kmh")
      VALUES (${wilayah}, ${tanggal}, ${suhu}, ${curah_hujan}, ${radiasi}, ${angin})
    `;

    res.status(201).json({ message: "Data cuaca berhasil ditambahkan" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT (replace all fields)
export const updateWeather = async (req, res) => {
  const { id } = req.params;
  const {
    wilayah,
    tanggal,
    suhu,
    curah_hujan,
    radiasi,
    angin,
  } = req.body;

  try {
    const result = await sql`
      UPDATE "Cuaca"
      SET "Wilayah" = ${wilayah},
          "Tanggal" = ${tanggal},
          "Suhu_Rata2_C" = ${suhu},
          "Curah_Hujan_mm" = ${curah_hujan},
          "Radiasi_Matahari_MJm2" = ${radiasi},
          "Kecepatan_Angin_Max_kmh" = ${angin}
      WHERE id = ${id}
      RETURNING id
    `;

    if (result.length === 0) {
      return res.status(404).json({ message: "Data tidak ditemukan" });
    }

    res.json({ message: "Data cuaca berhasil diperbarui" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PATCH (partial update)
export const patchWeather = async (req, res) => {
  const { id } = req.params;
  const fields = req.body;

  if (Object.keys(fields).length === 0) {
    return res.status(400).json({ message: "Tidak ada field untuk diupdate" });
  }

  const columnMap = {
    wilayah: "Wilayah",
    tanggal: "Tanggal",
    suhu: "Suhu_Rata2_C",
    curah_hujan: "Curah_Hujan_mm",
    radiasi: "Radiasi_Matahari_MJm2",
    angin: "Kecepatan_Angin_Max_kmh",
  };

  try {
    const updates = [];

    for (const [key, value] of Object.entries(fields)) {
      if (!columnMap[key]) continue;

      updates.push(sql`${sql(columnMap[key])} = ${value}`);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: "Field tidak valid" });
    }

    let query = sql`UPDATE "Cuaca" SET `;

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

    res.json({ message: "Data cuaca berhasil diupdate" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE
export const deleteWeather = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await sql`
      DELETE FROM "Cuaca" WHERE id = ${id}
      RETURNING id
    `;

    if (result.length === 0) {
      return res.status(404).json({ message: "Data tidak ditemukan" });
    }

    res.json({ message: "Data cuaca berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
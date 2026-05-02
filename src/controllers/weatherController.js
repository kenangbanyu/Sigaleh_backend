import sql from "../config/db.js";

// GET /weather (with filter)
export const getWeather = async (req, res) => {
  const { wilayah, start, end } = req.query;

  try {
    const conditions = [];

    if (wilayah) {
      conditions.push(sql`"Wilayah" = ${wilayah}`);
    }

    if (start && end) {
      conditions.push(sql`"Tanggal" BETWEEN ${start} AND ${end}`);
    }

    const result = await sql`
      SELECT * FROM "Cuaca"
      ${conditions.length ? sql`WHERE ${sql.join(conditions, sql` AND `)}` : sql``}
      ORDER BY "Tanggal" ASC
    `;

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

  const updates = Object.entries(fields).map(([key, value]) =>
    sql`${sql(columnMap[key])} = ${value}`
  );

  try {
    const result = await sql`
      UPDATE "Cuaca"
      SET ${sql.join(updates, sql`, `)}
      WHERE id = ${id}
      RETURNING id
    `;

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
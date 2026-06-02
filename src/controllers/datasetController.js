import sql from "../config/db.js";

// GET /dataset
export const getDataset = async (req, res) => {
  const {
    wilayah,
    komoditas,
    start,
    end,
  } = req.query;

  try {
    let query = sql`SELECT * FROM "Dataset"`;
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
    res.status(500).json({
      error: err.message,
    });
  }
};

// POST /dataset
export const createDataset = async (req, res) => {
  const data = req.body;

  try {
    await sql`
      INSERT INTO "Dataset"
      (
        "Komoditas (Rp)",
        "Tanggal",
        "Harga",
        "Wilayah",

        "Bulan",
        "Tahun",
        "Hari_Dalam_Minggu",
        "Musim_Hujan",

        "Suhu_Rata2_C",
        "Curah_Hujan_mm",
        "Radiasi_Matahari_MJm2",
        "Kecepatan_Angin_Max_kmh",

        "Hujan_Lag30",
        "Hujan_Lag60",

        "Suhu_Lag30",
        "Suhu_Lag60",

        "Rata_Hujan_30Hari",
        "Rata_Suhu_30Hari",

        "Harga_Kemarin",
        "Harga_Minggu_Lalu"
      )

      VALUES
      (
        ${data.komoditas},
        ${data.tanggal},
        ${data.harga},
        ${data.wilayah},

        ${data.bulan},
        ${data.tahun},
        ${data.hari_dalam_minggu},
        ${data.musim_hujan},

        ${data.suhu},
        ${data.curah_hujan},
        ${data.radiasi},
        ${data.angin},

        ${data.hujan_lag30},
        ${data.hujan_lag60},

        ${data.suhu_lag30},
        ${data.suhu_lag60},

        ${data.rata_hujan_30hari},
        ${data.rata_suhu_30hari},

        ${data.harga_kemarin},
        ${data.harga_minggu_lalu}
      )
    `;

    res.status(201).json({
      message: "Dataset berhasil ditambahkan",
    });

  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
};

// PUT /dataset/:id
export const updateDataset = async (req, res) => {
  const { id } = req.params;
  const data = req.body;

  try {
    const result = await sql`
      UPDATE "Dataset"
      SET
        "Komoditas (Rp)" = ${data.komoditas},
        "Tanggal" = ${data.tanggal},
        "Harga" = ${data.harga},
        "Wilayah" = ${data.wilayah},

        "Bulan" = ${data.bulan},
        "Tahun" = ${data.tahun},
        "Hari_Dalam_Minggu" = ${data.hari_dalam_minggu},
        "Musim_Hujan" = ${data.musim_hujan},

        "Suhu_Rata2_C" = ${data.suhu},
        "Curah_Hujan_mm" = ${data.curah_hujan},
        "Radiasi_Matahari_MJm2" = ${data.radiasi},
        "Kecepatan_Angin_Max_kmh" = ${data.angin},

        "Hujan_Lag30" = ${data.hujan_lag30},
        "Hujan_Lag60" = ${data.hujan_lag60},

        "Suhu_Lag30" = ${data.suhu_lag30},
        "Suhu_Lag60" = ${data.suhu_lag60},

        "Rata_Hujan_30Hari" = ${data.rata_hujan_30hari},
        "Rata_Suhu_30Hari" = ${data.rata_suhu_30hari},

        "Harga_Kemarin" = ${data.harga_kemarin},
        "Harga_Minggu_Lalu" = ${data.harga_minggu_lalu}

      WHERE id = ${id}
      RETURNING id
    `;

    if (result.length === 0) {
      return res.status(404).json({
        message: "Data tidak ditemukan",
      });
    }

    res.json({
      message: "Dataset berhasil diperbarui",
    });

  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
};

// PATCH /dataset/:id
export const patchDataset = async (req, res) => {
  const { id } = req.params;
  const fields = req.body;

  if (Object.keys(fields).length === 0) {
    return res.status(400).json({
      message: "Tidak ada field untuk diupdate",
    });
  }

  const columnMap = {
    komoditas: "Komoditas (Rp)",
    tanggal: "Tanggal",
    harga: "Harga",
    wilayah: "Wilayah",

    bulan: "Bulan",
    tahun: "Tahun",
    hari_dalam_minggu: "Hari_Dalam_Minggu",
    musim_hujan: "Musim_Hujan",

    suhu: "Suhu_Rata2_C",
    curah_hujan: "Curah_Hujan_mm",
    radiasi: "Radiasi_Matahari_MJm2",
    angin: "Kecepatan_Angin_Max_kmh",

    hujan_lag30: "Hujan_Lag30",
    hujan_lag60: "Hujan_Lag60",

    suhu_lag30: "Suhu_Lag30",
    suhu_lag60: "Suhu_Lag60",

    rata_hujan_30hari: "Rata_Hujan_30Hari",
    rata_suhu_30hari: "Rata_Suhu_30Hari",

    harga_kemarin: "Harga_Kemarin",
    harga_minggu_lalu: "Harga_Minggu_Lalu",
  };

  try {
    const updates = [];

    for (const [key, value] of Object.entries(fields)) {
      if (!columnMap[key]) continue;

      updates.push(
        sql`${sql(columnMap[key])} = ${value}`
      );
    }

    if (updates.length === 0) {
      return res.status(400).json({
        message: "Field tidak valid",
      });
    }

    let query = sql`UPDATE "Dataset" SET `;

    updates.forEach((u, index) => {
      query = index === 0
        ? sql`${query} ${u}`
        : sql`${query}, ${u}`;
    });

    query = sql`${query} WHERE id = ${id} RETURNING id`;

    const result = await query;

    if (result.length === 0) {
      return res.status(404).json({
        message: "Data tidak ditemukan",
      });
    }

    res.json({
      message: "Dataset berhasil diupdate",
    });

  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
};

// DELETE /dataset/:id
export const deleteDataset = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await sql`
      DELETE FROM "Dataset"
      WHERE id = ${id}
      RETURNING id
    `;

    if (result.length === 0) {
      return res.status(404).json({
        message: "Data tidak ditemukan",
      });
    }

    res.json({
      message: "Dataset berhasil dihapus",
    });

  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
};
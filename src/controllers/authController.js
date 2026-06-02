import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import sql from "../config/db.js";

export const login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await sql`
      SELECT *
      FROM "Admin"
      WHERE username = ${username}
    `;

    if (result.length === 0) {
      return res.status(401).json({
        message: "Username atau password salah",
      });
    }

    const admin = result[0];

    const isMatch = await bcrypt.compare(
      password,
      admin.password
    );

    if (!isMatch) {
      return res.status(401).json({
        message: "Username atau password salah",
      });
    }

    const token = jwt.sign(
      {
        id: admin.id,
        username: admin.username,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN,
      }
    );

    res.json({
      message: "Login berhasil",
      token,
    });

  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
};
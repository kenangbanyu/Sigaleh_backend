import express from "express";
import { login } from "../controllers/authController.js";
import { validate } from "../middlewares/validate.js";
import { loginSchema } from "../validators/authValidator.js";

const router = express.Router();

router.post(
  "/login",
  validate(loginSchema),
  login
);

export default router;
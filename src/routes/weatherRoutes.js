import express from "express";
import { validate, validateParams } from "../middlewares/validate.js";
import { idParamSchema } from "../validators/commonValidator.js";
import {
  weatherSchema,
  weatherPatchSchema,
} from "../validators/weatherValidator.js";
import {
  getWeather,
  createWeather,
  updateWeather,
  patchWeather,
  deleteWeather,
} from "../controllers/weatherController.js";
import { authenticate } from "../middlewares/auth.js";

const router = express.Router();

router.get("/", getWeather);
router.post("/", authenticate, validate(weatherSchema), createWeather);
router.put("/:id", authenticate, validate(weatherSchema), validateParams(idParamSchema), updateWeather);
router.patch("/:id", authenticate, validate(weatherPatchSchema), validateParams(idParamSchema), patchWeather);
router.delete("/:id", authenticate, validateParams(idParamSchema), deleteWeather);

export default router;
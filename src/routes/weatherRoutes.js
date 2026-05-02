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

const router = express.Router();

router.get("/", getWeather);
router.post("/", validate(weatherSchema), createWeather);
router.put("/:id", validate(weatherSchema), updateWeather);
router.patch("/:id", validate(weatherPatchSchema), patchWeather);
router.delete("/:id", validateParams(idParamSchema), deleteWeather);

export default router;
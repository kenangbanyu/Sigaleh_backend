import express from "express";
import { authenticate }
from "../middlewares/auth.js";
import { validate }
from "../middlewares/validate.js";
import { runPredictionSchema }
from "../validators/predictionValidator.js";
import { runPrediction, getPredictions }
from "../controllers/predictionsController.js";
import { cache } from "../middlewares/cache.js";

const router = express.Router();

router.get(
  "/",
  cache(3600),
  getPredictions
);

router.post(
  "/run",
  authenticate,
  validate(runPredictionSchema),
  runPrediction
);

export default router;
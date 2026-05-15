import express from "express";
import { validate } from "../middlewares/validate.js";
import { createPredictions } from "../controllers/predictionsController.js";
import { predictionSchema } from "../validators/predictionValidator.js";

const router = express.Router();

router.post("/", validate(predictionSchema), createPredictions);

export default router;
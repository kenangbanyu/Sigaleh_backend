import express from "express";

import { getEvaluations }
from "../controllers/evaluationsController.js";

import { cache }
from "../middlewares/cache.js";

const router = express.Router();

router.get(
  "/",
  cache(21600),
  getEvaluations
);

export default router;
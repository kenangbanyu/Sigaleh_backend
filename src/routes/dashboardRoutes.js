import express from "express";
import { getDashboard }
from "../controllers/dashboardController.js";
import { cache } from "../middlewares/cache.js";

const router = express.Router();

router.get("/", cache(900), getDashboard);

export default router;
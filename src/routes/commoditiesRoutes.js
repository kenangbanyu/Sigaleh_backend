import express from "express";
import { validate, validateParams } from "../middlewares/validate.js";
import { idParamSchema } from "../validators/commonValidator.js";
import {
  commoditySchema,
  commodityPatchSchema,
} from "../validators/commodityValidator.js";
import {
  getCommodities,
  getCommodityById,
  createCommodity,
  updateCommodity,
  patchCommodity,
  deleteCommodity,
} from "../controllers/commoditiesController.js";
import { authenticate } from "../middlewares/auth.js";

const router = express.Router();

router.get("/", getCommodities);
router.get("/:id", getCommodityById);
router.post("/", authenticate, validate(commoditySchema), createCommodity);
router.put("/:id", authenticate, validate(commoditySchema), validateParams(idParamSchema), updateCommodity);
router.patch("/:id", authenticate, validate(commodityPatchSchema), validateParams(idParamSchema), patchCommodity);
router.delete("/:id", authenticate, validateParams(idParamSchema), deleteCommodity);

export default router;
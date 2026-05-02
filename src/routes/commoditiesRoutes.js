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

const router = express.Router();

router.get("/", getCommodities);
router.get("/:id", getCommodityById);
router.post("/", validate(commoditySchema), createCommodity);
router.put("/:id", validate(commoditySchema), updateCommodity);
router.patch("/:id", validate(commodityPatchSchema), patchCommodity);
router.delete("/:id", validateParams(idParamSchema), deleteCommodity);

export default router;
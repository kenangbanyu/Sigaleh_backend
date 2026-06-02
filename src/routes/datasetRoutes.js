import express from "express";
import {
  getDataset,
  createDataset,
  updateDataset,
  patchDataset,
  deleteDataset,
} from "../controllers/datasetController.js";
import {
  datasetSchema,
  datasetPatchSchema,
} from "../validators/datasetValidator.js";
import {
  validate,
  validateParams,
} from "../middlewares/validate.js";
import { idParamSchema } from "../validators/commonValidator.js";
import { authenticate } from "../middlewares/auth.js";

const router = express.Router();

router.get("/", getDataset);
router.post(
  "/",
  authenticate,
  validate(datasetSchema),
  createDataset
);
router.put(
  "/:id",
  authenticate,
  validate(datasetSchema),
  validateParams(idParamSchema),
  updateDataset
);
router.patch(
  "/:id",
  authenticate,
  validate(datasetPatchSchema),
  validateParams(idParamSchema),
  patchDataset
);
router.delete(
  "/:id",
  authenticate,
  validateParams(idParamSchema),
  deleteDataset
);

export default router;
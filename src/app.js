import express from "express";
import "dotenv/config";
import authRoutes from "./routes/authRoutes.js";
import commoditiesRoutes from "./routes/commoditiesRoutes.js";
import weatherRoutes from "./routes/weatherRoutes.js";
import datasetRoutes from "./routes/datasetRoutes.js";
import predictionsRoutes from "./routes/predictionsRoutes.js";
import evaluationRoutes from "./routes/evaluationsRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";

const app = express();
const port = process.env.PORT || 3000;
const host = process.env.NODE_ENV !== 'production' ? 'localhost' : '0.0.0.0';

app.use(express.json());
app.use("/auth", authRoutes);
app.use("/commodities", commoditiesRoutes);
app.use("/weather", weatherRoutes);
app.use("/dataset", datasetRoutes);
app.use("/predictions", predictionsRoutes);
app.use("/evaluations", evaluationRoutes);
app.use("/dashboard", dashboardRoutes);

app.listen(port, () => {
  console.log(`Server running at http://${host}:${port}`);
});
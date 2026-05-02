import express from "express";
import "dotenv/config";
import commoditiesRoutes from "./routes/commoditiesRoutes.js";
import weatherRoutes from "./routes/weatherRoutes.js";

const app = express();
const port = process.env.PORT || 3000;
const host = process.env.NODE_ENV !== 'production' ? 'localhost' : '0.0.0.0';

app.use(express.json());
app.use("/commodities", commoditiesRoutes);
app.use("/weather", weatherRoutes);

app.listen(port, () => {
  console.log(`Server running at http://${host}:${port}`);
});
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "./src/routes/auth.js";
import userRoutes from "./src/routes/user.js";
import serviceRoutes from "./src/routes/services.js";

dotenv.config();

const app = express();

app.use(cors({
  origin: "*",
  credentials: true
}));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/services", serviceRoutes);

app.get("/", (req,res)=> res.send("Backend running"));

app.listen(process.env.PORT || 5000, ()=>{
  console.log("Server started");

});
import depositRoutes from "./src/routes/deposit.js";

app.use("/api/deposit", depositRoutes);

import resultRoutes from "./src/routes/results.js";
app.use("/api/results", resultRoutes);
app.use("/uploads", express.static("uploads"));

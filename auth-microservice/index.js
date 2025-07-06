import express from "express";
import dotEnv from "dotenv";
import bodyParser from "body-parser";
import connectDb from "./config/db.js";
import cors from "cors";
import authRoutes from "./routers/authRouter.js";
dotEnv.config(); // allow .env file to load

const app = express(); // initializing express app

const corsOptions = {
  // cors configuration options
  origin: "*",
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions)); // enable cors

app.use(bodyParser.urlencoded({ extended: false })); // enable body parsing

connectDb(); // connect to database

app.use(express.json()); // enable JSON serialization

// The Auth Route
app.use("/api", authRoutes);

// Demo Route for testing
app.get("/", (req, res) => {
  res.send("Auth Microservice is running...");
});

const Port = process.env.PORT || 8080;
// listening to the port
app.listen(Port, console.log("Listening to port ", Port));
